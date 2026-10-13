import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

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
