import assert from "node:assert/strict";
import { test } from "node:test";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { authOptions } from "../src/lib/auth-options.js";

function setup() {
  const auth = betterAuth({
    ...authOptions,
    secret: "test-only-auth-secret-at-least-32-characters",
    baseURL: "http://localhost:8000",
    trustedOrigins: ["http://localhost:5173"],
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    rateLimit: { enabled: false },
  });
  return async (path: string, body?: object, cookie?: string) => auth.handler(
    new Request(`http://localhost:8000/api/auth${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        origin: "http://localhost:5173",
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  );
}

const credentials = { name: " Test User ", email: "signup@example.com", password: "classroom-test-password" };
function cookies(response: Response) {
  return response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
}

for (const role of ["student", "teacher"]) {
  test(`${role} signup, session, logout, and login with saved password`, async () => {
    const request = setup();
    const signup = await request("/sign-up/email", { ...credentials, role });
    assert.equal(signup.status, 200);
    const created = await signup.json();
    assert.equal(created.user.role, role);
    assert.equal(created.user.name, "Test User");
    assert.equal(created.user.password, undefined);
    const signupCookie = cookies(signup);
    assert.ok(signupCookie);
    const session = await request("/get-session", undefined, signupCookie);
    assert.equal((await session.json()).user.id, created.user.id);

    const logout = await request("/sign-out", {}, signupCookie);
    assert.equal(logout.status, 200);
    assert.equal(await (await request("/get-session", undefined, signupCookie)).json(), null);

    const wrongPassword = await request("/sign-in/email", { email: credentials.email, password: "wrong-password" });
    assert.equal(wrongPassword.status, 401);
    const login = await request("/sign-in/email", { email: credentials.email, password: credentials.password });
    assert.equal(login.status, 200);
    assert.equal((await login.json()).user.role, role);
    const loginSession = await request("/get-session", undefined, cookies(login));
    assert.equal((await loginSession.json()).user.id, created.user.id);

    const update = await request("/update-user", { role: "admin" }, cookies(login));
    assert.equal(update.status, 400);
    const duplicate = await request("/sign-up/email", { ...credentials, role });
    assert.ok(duplicate.status >= 400);
  });
}

test("rejects invalid roles, blank names, and short passwords", async () => {
  const request = setup();
  for (const role of ["admin", "unknown", "", 123]) {
    assert.equal((await request("/sign-up/email", { ...credentials, role })).status, 400);
  }
  assert.equal((await request("/sign-up/email", { ...credentials, name: "   ", role: "student" })).status, 400);
  assert.equal((await request("/sign-up/email", { ...credentials, password: "short", role: "student" })).status, 400);
});
