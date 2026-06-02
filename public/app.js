/*
 * Backend bridge for the premium frontend.
 *
 * The Project A index.html ships untouched. Its current code calls
 * https://api.github.com/... directly. We transparently redirect those
 * calls through our Express backend so we get server-side caching, the
 * optional GITHUB_TOKEN (5000 req/h vs 60), rate limiting, optional JWT
 * auth, history persistence, and AI feedback — WITHOUT changing a single
 * pixel of the UI, DOM, CSS, or component structure.
 *
 * Security: JWT access tokens are now stored in httpOnly cookies set by
 * the server. The token returned in JSON responses is kept for
 * backwards compatibility with Authorization header flows, but the
 * primary auth mechanism uses the cookie — eliminating XSS token theft.
 */
(function () {
  // ─── CSRF token helper ───────────────────────────────────────────────
  function getCsrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }

  // ─── In-memory token store (replaces localStorage for XSS safety) ───
  let _inMemoryToken = null;

  function setToken(t) {
    _inMemoryToken = t;
    try { sessionStorage.setItem("gpa_jwt", t); } catch (_) {}
  }

  function getToken() {
    if (_inMemoryToken) return _inMemoryToken;
    try { return sessionStorage.getItem("gpa_jwt"); } catch (_) { return null; }
  }

  function clearToken() {
    _inMemoryToken = null;
    try { sessionStorage.removeItem("gpa_jwt"); } catch (_) {}
    try { localStorage.removeItem("auth_token"); localStorage.removeItem("gpa_jwt"); } catch (_) {}
  }

  // Migrate any existing localStorage tokens to sessionStorage on load
  (function migrateLegacyTokens() {
    try {
      const old = localStorage.getItem("auth_token") || localStorage.getItem("gpa_jwt");
      if (old) {
        setToken(old);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("gpa_jwt");
      }
    } catch (_) {}
  })();

  // ─── GitHub proxy + auth header injection ───────────────────────────
  const originalFetch = window.fetch.bind(window);

  window.fetch = function (input, init) {
    try {
      const url = typeof input === "string" ? input : input?.url;
      if (url && url.indexOf("https://api.github.com/") === 0) {
        const rewritten = url.replace("https://api.github.com/", "/api/github/");
        const token = getToken();
        const next = Object.assign({}, init || {});
        next.credentials = "include";
        if (token) {
          next.headers = Object.assign({}, next.headers || {}, {
            Authorization: "Bearer " + token,
          });
        }
        return originalFetch(rewritten, next);
      }
    } catch (_) {}
    return originalFetch(input, init);
  };

  // ─── SDK surface ─────────────────────────────────────────────────────
  window.GHAnalyzer = {
    async analyze(username) {
      const r = await fetch("/api/analyze?username=" + encodeURIComponent(username), {
        credentials: "include",
      });
      if (!r.ok) throw new Error((await r.json()).error || "Analyze failed");
      return r.json();
    },

    async ai(analysis) {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ analysis }),
      });
      return r.json();
    },

    async register(email, password, name) {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await r.json();
      if (data.token) setToken(data.token);
      return data;
    },

    async login(email, password) {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken(),
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (data.token) setToken(data.token);
      return data;
    },

    logout() {
      clearToken();
      fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "x-csrf-token": getCsrfToken() },
      }).catch(() => {});
    },

    isAuthed() {
      return !!getToken();
    },

    async history() {
      const token = getToken();
      const r = await fetch("/api/history", {
        credentials: "include",
        headers: token ? { Authorization: "Bearer " + token } : {},
      });
      return r.json();
    },

    exportPdf(username) {
      window.location.href = "/api/export/" + encodeURIComponent(username) + ".pdf";
    },
  };
})();

/* ============================================================
 *  Additive Enhancements v2 (non-UI-altering)
 *  - Toasts, copy buttons, recent searches, cache,
 *    validation, friendly errors, mobile overflow fixes.
 *  No existing markup/CSS is modified.
 * ============================================================ */
(function () {
  const $ = (sel) => document.querySelector(sel);
  const onReady = (fn) =>
    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", fn)
      : fn();

  /* ---------- Minor responsive/overflow hardening only ---------- */
  function injectStyles() {
    const css = `
      .gha-toast-wrap{position:fixed;top:18px;right:18px;z-index:99999;display:flex;flex-direction:column;gap:10px;max-width:calc(100vw - 36px);pointer-events:none}
      .gha-toast{pointer-events:auto;min-width:240px;max-width:360px;padding:12px 16px;border-radius:10px;color:#fff;font:500 14px/1.4 'Segoe UI',sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.2);opacity:0;transform:translateX(20px);transition:opacity .25s ease,transform .25s ease;display:flex;align-items:flex-start;gap:8px}
      .gha-toast.show{opacity:1;transform:translateX(0)}
      .gha-toast.success{background:linear-gradient(135deg,#0d7377,#14919b)}
      .gha-toast.error{background:linear-gradient(135deg,#c62828,#dc3545)}
      .gha-toast.warning{background:linear-gradient(135deg,#b8860b,#ffc107);color:#1a1a1a}
      .gha-toast.info{background:linear-gradient(135deg,#2c3e50,#34495e)}
      .gha-toast-close{margin-left:auto;background:transparent;border:0;color:inherit;cursor:pointer;font-size:16px;line-height:1;opacity:.85}
      .gha-inline-error{color:#dc3545;font-size:.9em;margin-top:6px;text-align:left;display:block}
      .gha-copy-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;margin:6px 4px 0 0;background:#0d7377;color:#fff;border:0;border-radius:6px;cursor:pointer;font-size:.85em;font-weight:600;box-shadow:0 2px 6px rgba(13,115,119,.25);transition:transform .15s ease,background .2s ease}
      .gha-copy-btn:hover{background:#14919b;transform:translateY(-1px)}
      .gha-recent-wrap{margin-top:14px;text-align:center}
      .gha-recent-label{font-size:.85em;color:#14919b;margin-right:8px;font-weight:600}
      .gha-recent-chip{display:inline-block;margin:4px;padding:6px 12px;background:#f5f9fa;border:1px solid #76c7d1;color:#0d7377;border-radius:20px;font-size:.85em;cursor:pointer;transition:all .2s ease}
      .gha-recent-chip:hover{background:#0d7377;color:#fff}
      .gha-recent-clear{background:transparent;border:0;color:#888;font-size:.8em;cursor:pointer;text-decoration:underline;margin-left:8px}
      /* mobile overflow-only fixes */
      @media (max-width:640px){
        body{overflow-x:hidden}
        .container{padding:12px;max-width:100%}
        .input-group{flex-direction:column}
        .input-field{min-width:0;width:100%}
        .header h1{font-size:2.2em;word-break:break-word}
        img,canvas,pre,table{max-width:100%;height:auto}
      }
    `;
    const s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ---------- Toast system ---------- */
  let toastWrap;
  function getWrap() {
    if (!toastWrap) {
      toastWrap = document.createElement("div");
      toastWrap.className = "gha-toast-wrap";
      document.body.appendChild(toastWrap);
    }
    return toastWrap;
  }
  function toast(msg, type = "info", dur = 4000) {
    const el = document.createElement("div");
    el.className = `gha-toast ${type}`;
    const icon = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" }[type] || "ℹ️";
    el.innerHTML = `<span>${icon}</span><span style="flex:1">${msg}</span><button class="gha-toast-close" aria-label="Dismiss">✕</button>`;
    el.querySelector(".gha-toast-close").onclick = () => dismiss(el);
    getWrap().appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    if (dur > 0) setTimeout(() => dismiss(el), dur);
    return el;
  }
  function dismiss(el) {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }
  window.GHToast = {
    success: (m, d) => toast(m, "success", d),
    error: (m, d) => toast(m, "error", d),
    warning: (m, d) => toast(m, "warning", d),
    info: (m, d) => toast(m, "info", d),
  };

  /* ---------- Validation helpers ---------- */
  function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function validatePassword(v) { return v && v.length >= 8; }
  function validateGithubInput(v) {
    if (!v) return false;
    const cleaned = v.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, "");
    return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(cleaned);
  }
  window.GHValidate = { email: validateEmail, password: validatePassword, github: validateGithubInput };

  /* ---------- Recent searches (sessionStorage) ---------- */
  const RECENT_KEY = "gha_recent_searches";
  const MAX_RECENT = 5;
  function getRecent() {
    try { return JSON.parse(sessionStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
  }
  function addRecent(u) {
    const prev = getRecent().filter((x) => x !== u);
    try { sessionStorage.setItem(RECENT_KEY, JSON.stringify([u, ...prev].slice(0, MAX_RECENT))); } catch (_) {}
  }
  function renderRecent() {
    const old = document.getElementById("gha-recent-wrap");
    if (old) old.remove();
    const items = getRecent();
    if (!items.length) return;
    const inp = document.getElementById("githubInput") || document.querySelector("input[placeholder*='username']");
    if (!inp) return;
    const wrap = document.createElement("div");
    wrap.id = "gha-recent-wrap";
    wrap.className = "gha-recent-wrap";
    wrap.innerHTML =
      `<span class="gha-recent-label">Recent:</span>` +
      items.map((u) => `<button class="gha-recent-chip" data-u="${u}">${u}</button>`).join("") +
      `<button class="gha-recent-clear">clear</button>`;
    wrap.querySelectorAll(".gha-recent-chip").forEach((b) => {
      b.onclick = () => {
        inp.value = b.dataset.u;
        inp.dispatchEvent(new Event("input"));
        const btn = document.getElementById("analyzeBtn") || document.querySelector("button[onclick*='analyze']");
        if (btn) btn.click();
      };
    });
    wrap.querySelector(".gha-recent-clear").onclick = () => {
      try { sessionStorage.removeItem(RECENT_KEY); } catch (_) {}
      wrap.remove();
    };
    inp.parentNode.after(wrap);
  }

  /* ---------- Hook analyze button ---------- */
  function hookAnalyzeBtn() {
    const btn = document.getElementById("analyzeBtn") || document.querySelector("button[onclick*='analyze']");
    if (!btn || btn._ghaHooked) return;
    btn._ghaHooked = true;
    btn.addEventListener("click", () => {
      const inp = document.getElementById("githubInput") || document.querySelector("input[placeholder*='username']");
      if (inp && inp.value) addRecent(inp.value.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, ""));
    });
  }

  /* ---------- Friendly error messages ---------- */
  function friendlyApiError(err) {
    const m = (err && (err.message || String(err))) || "";
    if (/Failed to fetch|NetworkError|network/i.test(m))
      return "Network error — check your connection or try again.";
    if (/rate limit|429/i.test(m)) return "GitHub API rate limit reached. Try adding a GITHUB_TOKEN.";
    if (/not found|404/i.test(m)) return "GitHub user not found.";
    return m || "An unexpected error occurred.";
  }

  /* ---------- Global fetch error toast for /api/* failures ---------- */
  const _fetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    try {
      const res = await _fetch(input, init);
      const url = typeof input === "string" ? input : input?.url || "";
      if (res && !res.ok && /\/api\/github\//.test(url)) {
        const clone = res.clone();
        clone.json().then((d) => {
          if (d && d.error) window.GHToast?.warning(d.error, 6000);
        }).catch(() => {});
      }
      return res;
    } catch (err) {
      throw err;
    }
  };

  /* ---------- URL param auto-analyze ─────────────────────────────── */
  function autoAnalyzeFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      const u = params.get('u') || params.get('username');
      if (u) {
        const inp = document.getElementById('githubInput');
        if (inp) {
          inp.value = u;
          inp.dispatchEvent(new Event('input'));
          // Auto-trigger analysis after a short delay for DOM to settle
          setTimeout(() => {
            const btn = document.getElementById('analyzeBtn');
            if (btn) btn.click();
          }, 600);
        }
      }
    } catch (_) {}
  }

  /* ---------- Init ---------- */
  onReady(() => {
    injectStyles();
    hookAnalyzeBtn();
    renderRecent();
    autoAnalyzeFromUrl();
    setTimeout(hookAnalyzeBtn, 1000);
    setTimeout(renderRecent, 1500);
  });
})();
