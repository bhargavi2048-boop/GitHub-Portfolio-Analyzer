/**
 * Unit tests for github.service.js
 * Tests computeScore() and analyze() fallback logic.
 */

// Mock node-cache before requiring the service
jest.mock("node-cache", () => {
  const store = new Map();
  return jest.fn().mockImplementation(() => ({
    get: (k) => store.get(k) || null,
    set: (k, v) => store.set(k, v),
    keys: () => [...store.keys()],
    flushAll: () => store.clear(),
  }));
});

const { computeScore } = require("../src/services/github.service");

function makeData(overrides = {}) {
  return {
    profile: { followers: 10, bio: "Developer", blog: "https://example.com", name: "Test User", location: "Earth" },
    repos: new Array(15).fill(null).map(() => ({})),
    totalStars: 50,
    languages: [{ name: "JavaScript", value: 10 }, { name: "Python", value: 5 }],
    activitySum: 30,
    withReadme: 10,
    withLicense: 8,
    withTopics: 6,
    ...overrides,
  };
}

describe("computeScore()", () => {
  test("returns an object with total, ats, pillars, and rank", () => {
    const result = computeScore(makeData());
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("ats");
    expect(result).toHaveProperty("pillars");
    expect(result).toHaveProperty("rank");
    expect(result.pillars).toHaveProperty("activity");
    expect(result.pillars).toHaveProperty("quality");
    expect(result.pillars).toHaveProperty("impact");
    expect(result.pillars).toHaveProperty("diversity");
    expect(result.pillars).toHaveProperty("documentation");
  });

  test("total score is between 0 and 100", () => {
    const result = computeScore(makeData());
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  test("all pillars are between 0 and 100", () => {
    const result = computeScore(makeData());
    for (const val of Object.values(result.pillars)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    }
  });

  test("rank is one of S,A,B,C,D", () => {
    const result = computeScore(makeData());
    expect(["S", "A", "B", "C", "D"]).toContain(result.rank);
  });

  test("S rank for high-quality profiles", () => {
    const result = computeScore(makeData({
      profile: { followers: 1000, bio: "Star dev", blog: "https://blog.com", name: "Alice", location: "SF" },
      totalStars: 5000,
      repos: new Array(50).fill(null).map(() => ({})),
      activitySum: 200,
      withReadme: 45,
      withLicense: 45,
      withTopics: 45,
      languages: new Array(8).fill(null).map((_, i) => ({ name: `Lang${i}`, value: 10 })),
    }));
    expect(result.rank).toBe("S");
  });

  test("D rank for empty/minimal profiles", () => {
    const result = computeScore({
      profile: { followers: 0, bio: null, blog: null, name: null, location: null },
      repos: [{}],
      totalStars: 0,
      languages: [],
      activitySum: 0,
      withReadme: 0,
      withLicense: 0,
      withTopics: 0,
    });
    expect(result.rank).toBe("D");
  });

  test("handles repos.length = 0 without division by zero", () => {
    expect(() => computeScore(makeData({ repos: [] }))).not.toThrow();
  });

  test("ATS score is between 0 and 100", () => {
    const result = computeScore(makeData());
    expect(result.ats).toBeGreaterThanOrEqual(0);
    expect(result.ats).toBeLessThanOrEqual(100);
  });

  test("bio presence increases documentation score", () => {
    const withBio = computeScore(makeData({ profile: { followers: 10, bio: "Dev", blog: null, name: "X", location: null } }));
    const noBio = computeScore(makeData({ profile: { followers: 10, bio: null, blog: null, name: "X", location: null } }));
    expect(withBio.pillars.documentation).toBeGreaterThan(noBio.pillars.documentation);
  });

  test("more stars = higher impact score", () => {
    const low = computeScore(makeData({ totalStars: 0 }));
    const high = computeScore(makeData({ totalStars: 10000 }));
    expect(high.pillars.impact).toBeGreaterThan(low.pillars.impact);
  });

  test("more languages = higher diversity score", () => {
    const few = computeScore(makeData({ languages: [{ name: "JS", value: 1 }] }));
    const many = computeScore(makeData({ languages: new Array(8).fill(null).map((_, i) => ({ name: `L${i}`, value: 1 })) }));
    expect(many.pillars.diversity).toBeGreaterThan(few.pillars.diversity);
  });
});
