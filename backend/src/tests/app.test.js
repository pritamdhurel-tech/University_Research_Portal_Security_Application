const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../app"); // your test file is in src/tests, so ../app is src/app.js

test("root returns API info", async () => {
  const res = await request(app).get("/");
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});

test("unknown route returns 404", async () => {
  const res = await request(app).get("/api/does-not-exist");
  assert.equal(res.status, 404);
});

test("protected route rejects a request with no token", async () => {
  const res = await request(app).get("/api/auth/me");
  assert.equal(res.status, 401);
});
