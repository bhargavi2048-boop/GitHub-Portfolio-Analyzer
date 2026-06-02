const { memo, bust, store } = require("../src/utils/cache");

describe("cache.memo", () => {
  beforeEach(() => store.flushAll());

  test("caches producer output", async () => {
    let calls = 0;
    const fn = () => memo("k1", 60, async () => { calls++; return 42; });
    expect(await fn()).toBe(42);
    expect(await fn()).toBe(42);
    expect(calls).toBe(1);
  });

  test("bust clears by prefix", async () => {
    await memo("user:1", 60, async () => "a");
    await memo("user:2", 60, async () => "b");
    await bust("user:");
    expect(store.keys().filter((k) => k.startsWith("user:"))).toHaveLength(0);
  });
});
