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
      BETTER_AUTH_SECRET: "test-only-secret-that-is-long-enough-for-auth",
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
});