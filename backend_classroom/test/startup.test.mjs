import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const entryPoint = fileURLToPath(new URL("../dist/index.js", import.meta.url));

async function getAvailablePort() {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

test("compiled backend starts and serves requests on PORT", async (context) => {
  const port = await getAvailablePort();
  const server = spawn(process.execPath, [entryPoint], {
    env: {
      ...process.env,
      ARCJET_KEY: "ajkey_test_placeholder",
      ARCJET_ENV: "production",
      BETTER_AUTH_SECRET: "test-only-secret-that-is-long-enough-for-auth",
      BETTER_AUTH_URL: `http://127.0.0.1:${port}`,
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      FRONTEND_URL: "http://localhost:3000",
      NODE_ENV: "test",
      PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  context.after(() => server.kill());

  let output = "";
  server.stdout.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
  server.stderr.setEncoding("utf8").on("data", (chunk) => { output += chunk; });

  let response;
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      assert.fail(`Backend exited before becoming ready:\n${output}`);
    }

    try {
      response = await fetch(`http://127.0.0.1:${port}/`);
      break;
    } catch {
      await delay(100);
    }
  }

  assert.ok(response, `Backend did not become ready:\n${output}`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "WELCOME TO THE CLASSROOM API");
  await delay(100);
  assert.doesNotMatch(output, /Base URL is not set/);
  assert.doesNotMatch(output, /Arcjet will use 127\.0\.0\.1/);
});

test("Better Auth base URL resolution prefers explicit and Railway URLs", async () => {
  const keys = ["BETTER_AUTH_URL", "BETTER_AUTH_SECRET", "DATABASE_URL", "FRONTEND_URL", "NODE_ENV"];
  const originalEnvironment = new Map(keys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, {
    BETTER_AUTH_URL: "http://localhost:8000",
    BETTER_AUTH_SECRET: "test-only-secret-that-is-long-enough-for-auth",
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    FRONTEND_URL: "http://localhost:3000",
    NODE_ENV: "test",
  });

  try {
    const { resolveAuthBaseURL } = await import("../dist/lib/auth.js");
    assert.equal(resolveAuthBaseURL({
      BETTER_AUTH_URL: "https://auth.example.com",
      RAILWAY_PUBLIC_DOMAIN: "other.up.railway.app",
      NODE_ENV: "production",
    }), "https://auth.example.com");
    assert.equal(resolveAuthBaseURL({
      RAILWAY_PUBLIC_DOMAIN: "classroom.up.railway.app",
      NODE_ENV: "production",
    }), "https://classroom.up.railway.app");
    assert.equal(resolveAuthBaseURL({ PORT: "38123", NODE_ENV: "test" }), "http://localhost:38123");
    assert.throws(
      () => resolveAuthBaseURL({ NODE_ENV: "production" }),
      /Set BETTER_AUTH_URL or expose RAILWAY_PUBLIC_DOMAIN/,
    );
    assert.throws(
      () => resolveAuthBaseURL({ RAILWAY_ENVIRONMENT: "production" }),
      /Set BETTER_AUTH_URL or expose RAILWAY_PUBLIC_DOMAIN/,
    );
  } finally {
    for (const [key, value] of originalEnvironment) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});