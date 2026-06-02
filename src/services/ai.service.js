const { metrics } = require("../utils/metrics");

let client = null;
try {
  const OpenAI = require("openai");
  if (process.env.OPENAI_API_KEY) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch {
  /* openai not installed */
}

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const SYS =
  "You are a senior tech recruiter and staff engineer reviewing a developer's GitHub portfolio. " +
  "Be specific, constructive, and concise. Reply ONLY with valid JSON.";

async function analyzeWithAI(a) {
  if (!client) return fallback(a);
  const compact = {
    login: a.profile.login,
    name: a.profile.name,
    bio: a.profile.bio,
    followers: a.profile.followers,
    public_repos: a.profile.public_repos,
    score: a.score,
    topLanguages: a.stats.languages.slice(0, 6),
    topRepos: a.stats.topRepos.map((r) => ({
      name: r.name,
      stars: r.stargazers_count,
      description: r.description,
      language: r.language,
      topics: r.topics,
      hasLicense: !!r.license,
      hasReadme: r.hasReadme,
    })),
  };
  const schema = `{
  "summary": "2-3 sentence executive summary",
  "strengths": ["3-5 specific strengths"],
  "weaknesses": ["3-5 specific gaps with concrete examples"],
  "recruiterFeedback": "tough-love paragraph from a recruiter's POV",
  "readmeTips": ["5 actionable README improvements"],
  "buildNext": [{"idea":"project idea","why":"why this fills a gap","stack":["tech","stack"]}]
}`;

  const start = Date.now();
  try {
    const res = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      temperature: 0.5,
      messages: [
        { role: "system", content: SYS },
        {
          role: "user",
          content: `Analyze this GitHub portfolio and reply ONLY as JSON matching:\n${schema}\n\nData:\n${JSON.stringify(compact)}`,
        },
      ],
    });
    const txt = res.choices[0]?.message?.content || "{}";
    metrics?.aiResponseTime?.observe((Date.now() - start) / 1000);
    return JSON.parse(txt);
  } catch (e) {
    console.error("AI error:", e.message);
    return fallback(a);
  }
}

function fallback(a) {
  const langs = a.stats.languages.slice(0, 3).map((l) => l.name).join(", ") || "your stack";
  const r = Math.max(a.repos?.length || 1, 1);
  return {
    summary: `@${a.profile.login} has ${a.repos?.length || 0} active repos with a portfolio score of ${a.score.total}/100 (Rank ${a.score.rank}). Strong signal in ${langs}.`,
    strengths: [
      `${a.stats.totalStars} total stars across ${a.repos?.length || 0} repos`,
      `Breadth across ${a.stats.languages.length} languages`,
      a.profile.bio ? "Profile bio is set" : "Active recent commits",
    ],
    weaknesses: [
      a.stats.withReadme / r < 0.6 ? "Several repos lack a substantive README" : "Pin your best 6 repos on your profile",
      a.stats.withLicense / r < 0.5 ? "Most repos are missing a LICENSE file" : "Add live demo links to top projects",
      !a.profile.blog ? "No personal site / portfolio link on profile" : "Consider blogging about your top project",
    ],
    recruiterFeedback:
      "Heuristic read: portfolio shows engineering breadth but recruiters skim for impact. Lead with one flagship project, pinned, with a 60-second demo GIF and a clean README.",
    readmeTips: [
      "Open with one sentence on what the project does and who it's for",
      "Add a screenshot / GIF above the fold",
      "List exact 'Run locally' commands",
      "Document the stack and architecture in 3 lines",
      "End with deployment status badges and a link to a live demo",
    ],
    buildNext: [
      { idea: "Production-grade SaaS template in your top language", why: "Shows you can ship end-to-end", stack: a.stats.languages.slice(0, 3).map((l) => l.name) },
    ],
  };
}

module.exports = { analyzeWithAI };
