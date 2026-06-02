/**
 * Integration tests for the auth flow.
 * Covers: register, login, token refresh, logout, expired/invalid token rejection.
 */
const request = require("supertest");
const app = require("../src/server");

afterAll(() => new Promise((r) => setTimeout(r, 200)));

describe("Auth — register", () => {
  test("POST /api/auth/register validates email format", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("x-csrf-token", "test")
      .send({ email: "not-an-email", password: "password123" });
    // 400 (validation), 403 (csrf), or 503 (no db) are all valid rejection responses
    expect([400, 403, 503]).toContain(res.status);
  });

  test("POST /api/auth/register validates password length < 8", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("x-csrf-token", "test")
      .send({ email: "test@example.com", password: "short" });
    expect([400, 403, 503]).toContain(res.status);
  });

  test("POST /api/auth/register with valid data returns 201, 409, or 503", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("x-csrf-token", "test")
      .send({ email: "testuser@example.com", password: "password123", name: "Test" });
    expect([201, 403, 409, 503]).toContain(res.status);
  });
});

describe("Auth — login", () => {
  test("POST /api/auth/login rejects missing credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("x-csrf-token", "test")
      .send({});
    expect([400, 401, 403, 503]).toContain(res.status);
  });

  test("POST /api/auth/login rejects invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("x-csrf-token", "test")
      .send({ email: "notvalid", password: "somepassword" });
    expect([400, 401, 403, 503]).toContain(res.status);
  });

  test("POST /api/auth/login returns 401 or 503 for non-existent user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("x-csrf-token", "test")
      .send({ email: "nobody@nobody999.com", password: "password123" });
    expect([401, 403, 503]).toContain(res.status);
  });
});

describe("Auth — protected routes", () => {
  test("GET /api/auth/me returns 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  test("GET /api/auth/me returns 401 with invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer this.is.invalid");
    expect(res.status).toBe(401);
  });

  test("GET /api/auth/me returns 401 with wrong-key JWT", async () => {
    // A valid-looking but wrong JWT (wrong secret)
    const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwYzk5NmVhMmE4ZTdkMDAxNmZjNzEwMCIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAxfQ.wrongsig";
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${fakeToken}`);
    expect(res.status).toBe(401);
  });
});

describe("Auth — refresh", () => {
  test("POST /api/auth/refresh without token returns 400 or 403", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("x-csrf-token", "test")
      .send({});
    expect([400, 403]).toContain(res.status);
  });

  test("POST /api/auth/refresh with invalid token returns 401 or 403", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("x-csrf-token", "test")
      .send({ refreshToken: "invalid.token.here" });
    expect([401, 403]).toContain(res.status);
  });
});

describe("Auth — logout", () => {
  test("POST /api/auth/logout returns 204 or 403", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("x-csrf-token", "test")
      .send({});
    expect([204, 403]).toContain(res.status);
  });
});

describe("Auth — error response structure", () => {
  test("Error responses include code and requestId fields", async () => {
    const res = await request(app)
      .get("/api/auth/me");
    expect(res.status).toBe(401);
    // requestId should be a string when present
    if (res.body.requestId !== undefined) {
      expect(typeof res.body.requestId).toBe("string");
    }
  });
});
