import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const entryPoint = fileURLToPath(new URL("../dist/index.js", import.meta.url));

function inspectArcjetClient(environment) {
  const arcjetModule = new URL("../dist/config/arcjet.js", import.meta.url).href;
  const script = `const { default: aj } = await import(${JSON.stringify(arcjetModule)}); const details = aj.clientIpDetails({ headers: {}, method: "GET", url: "/", socket: { remoteAddress: "127.0.0.1" } }); console.log("RESULT " + JSON.stringify({ NODE_ENV: process.env.NODE_ENV, ARCJET_ENV: process.env.ARCJET_ENV, MODE: process.env.MODE, testModeBypass: process.env.NODE_ENV === "test", ip: details.ip, provenance: details.provenance }));`;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    encoding: "utf8",
    env: {
      ...process.env,
      ARCJET_KEY: "ajkey_test_placeholder",
      ...environment,
    },
  });

  const output = `${result.stdout}\n${result.stderr}`;
  assert.equal(result.status, 0, output);
  const resultLine = output.split(/\r?\n/).find((line) => line.startsWith("RESULT "));
  assert.ok(resultLine, `Arcjet inspection did not return a result:\n${output}`);

  return { state: JSON.parse(resultLine.slice("RESULT ".length)), output };
}

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
      RAILWAY_ENVIRONMENT: "",
      RAILWAY_PROJECT_ID: "",
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

test("Railway runtime forces production mode before Arcjet initializes", () => {
  const { state, output } = inspectArcjetClient({
    ARCJET_ENV: "development",
    MODE: "development",
    NODE_ENV: "test",
    RAILWAY_ENVIRONMENT: "production",
    RAILWAY_PROJECT_ID: "test-project",
  });

  assert.deepEqual({
    NODE_ENV: state.NODE_ENV,
    ARCJET_ENV: state.ARCJET_ENV,
    MODE: state.MODE,
    testModeBypass: state.testModeBypass,
  }, {
    NODE_ENV: "production",
    ARCJET_ENV: "production",
    MODE: "production",
    testModeBypass: false,
  });
  assert.notEqual(state.ip, "127.0.0.1");
  assert.notEqual(state.provenance, "development");
  assert.doesNotMatch(output, /Arcjet will use 127\.0\.0\.1/);
});

test("local development mode is preserved", () => {
  const { state, output } = inspectArcjetClient({
    ARCJET_ENV: "development",
    MODE: "development",
    NODE_ENV: "development",
    RAILWAY_ENVIRONMENT: "",
    RAILWAY_PROJECT_ID: "",
  });

  assert.deepEqual({
    NODE_ENV: state.NODE_ENV,
    ARCJET_ENV: state.ARCJET_ENV,
    MODE: state.MODE,
    testModeBypass: state.testModeBypass,
  }, {
    NODE_ENV: "development",
    ARCJET_ENV: "development",
    MODE: "development",
    testModeBypass: false,
  });
  assert.equal(state.ip, "127.0.0.1");
  assert.match(output, /Arcjet will use 127\.0\.0\.1/);
});