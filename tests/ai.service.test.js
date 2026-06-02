/**
 * Unit tests for ai.service.js — especially analyzeWithAI() fallback logic.
 */

jest.mock("node-cache", () => {
  const store = new Map();
  return jest.fn().mockImplementation(() => ({
    get: (k) => store.get(k) || null,
    set: (k, v) => store.set(k, v),
    keys: () => [...store.keys()],
    flushAll: () => store.clear(),
  }));
});

// We test the fallback by ensuring OPENAI_API_KEY is unset
delete process.env.OPENAI_API_KEY;

const { analyzeWithAI } = require("../src/services/ai.service");

function makeAnalysis(overrides = {}) {
  return {
    profile: {
      login: "testuser",
      name: "Test User",
      bio: "JavaScript developer",
      followers: 50,
      public_repos: 20,
    },
    score: { total: 65, rank: "A", ats: 70, pillars: {} },
    repos: new Array(10).fill(null).map(() => ({})),
    stats: {
      languages: [{ name: "JavaScript", value: 8 }, { name: "Python", value: 3 }],
      topRepos: [
        { name: "my-project", stargazers_count: 10, description: "A cool project", language: "JavaScript", topics: ["nodejs"], license: "MIT" },
      ],
      totalStars: 45,
      withReadme: 7,
      withLicense: 6,
      withTopics: 5,
    },
    ...overrides,
  };
}

describe("analyzeWithAI() fallback (no API key)", () => {
  test("returns a valid fallback object", async () => {
    const result = await analyzeWithAI(makeAnalysis());
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("weaknesses");
    expect(result).toHaveProperty("recruiterFeedback");
    expect(result).toHaveProperty("readmeTips");
    expect(result).toHaveProperty("buildNext");
  });

  test("summary mentions the username", async () => {
    const result = await analyzeWithAI(makeAnalysis());
    expect(result.summary).toMatch(/testuser/i);
  });

  test("strengths is a non-empty array", async () => {
    const result = await analyzeWithAI(makeAnalysis());
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  test("weaknesses is a non-empty array", async () => {
    const result = await analyzeWithAI(makeAnalysis());
    expect(Array.isArray(result.weaknesses)).toBe(true);
    expect(result.weaknesses.length).toBeGreaterThan(0);
  });

  test("readmeTips is an array of at least 3 tips", async () => {
    const result = await analyzeWithAI(makeAnalysis());
    expect(Array.isArray(result.readmeTips)).toBe(true);
    expect(result.readmeTips.length).toBeGreaterThanOrEqual(3);
  });

  test("buildNext is an array with idea/why/stack", async () => {
    const result = await analyzeWithAI(makeAnalysis());
    expect(Array.isArray(result.buildNext)).toBe(true);
    const first = result.buildNext[0];
    expect(first).toHaveProperty("idea");
    expect(first).toHaveProperty("why");
    expect(first).toHaveProperty("stack");
  });

  test("no personal site weakness when blog is set", async () => {
    const result = await analyzeWithAI(makeAnalysis({
      profile: {
        login: "testuser",
        name: "Test",
        bio: "Dev",
        followers: 50,
        public_repos: 20,
        blog: "https://myblog.com",
      },
      stats: {
        languages: [{ name: "JS", value: 5 }],
        topRepos: [],
        totalStars: 0,
        withReadme: 8,
        withLicense: 8,
        withTopics: 8,
      },
    }));
    const weaknessText = result.weaknesses.join(" ").toLowerCase();
    expect(weaknessText).not.toMatch(/no personal site/i);
  });
});
