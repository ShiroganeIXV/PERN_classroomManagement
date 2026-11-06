import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";

import cors from "cors";
import express from "express";

import { createCorsOptions, normalizeFrontendOrigin } from "../src/lib/frontend-origin.js";

const productionOrigin = "https://pernclassroommanagement-frontend.vercel.app";

async function assertCorsHeaders(
  configuredOrigin: string | undefined,
  requestOrigin: string,
  expectedAllowedOrigin: string | null
) {
  const app = express();
  app.use(cors(createCorsOptions(normalizeFrontendOrigin(configuredOrigin))));
  app.all("/api/subjects", (_req, res) => res.status(204).end());

  const server = app.listen(0);
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;

  try {
    const preflight = await fetch(`http://localhost:${port}/api/subjects`, {
      method: "OPTIONS",
      headers: {
        Origin: requestOrigin,
        "Access-Control-Request-Method": "GET",
      },
    });

    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("access-control-allow-origin"), expectedAllowedOrigin);

    if (expectedAllowedOrigin) {
      assert.equal(preflight.headers.get("access-control-allow-credentials"), "true");
      assert.equal(preflight.headers.get("access-control-allow-methods"), "GET,POST,PUT,DELETE");
    }

    const response = await fetch(`http://localhost:${port}/api/subjects`, {
      headers: { Origin: requestOrigin },
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), expectedAllowedOrigin);
  } finally {
    server.close();
    await once(server, "close");
  }
}

test("allows the production frontend when FRONTEND_URL has a trailing slash", async () => {
  await assertCorsHeaders(`${productionOrigin}/`, productionOrigin, productionOrigin);
});

test("allows the production frontend when FRONTEND_URL has no trailing slash", async () => {
  await assertCorsHeaders(productionOrigin, productionOrigin, productionOrigin);
});

test("does not allow unrelated origins", async () => {
  await assertCorsHeaders(productionOrigin, "https://unrelated.example", null);
});

test("allows local development origins after trimming configuration whitespace", async () => {
  await assertCorsHeaders(" http://localhost:5173/ ", "http://localhost:5173", "http://localhost:5173");
});

test("does not allow origins when FRONTEND_URL is missing", async () => {
  await assertCorsHeaders(undefined, productionOrigin, null);
});