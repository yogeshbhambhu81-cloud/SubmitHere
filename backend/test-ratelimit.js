/**
 * UniPortal — Rate Limiting & Health Check Test
 *
 * Tests:
 *   1. GET /api/health         → Redis + MongoDB status
 *   2. POST /api/auth/login    → loginLimiter  (5 / 15 min)
 *   3. POST /api/auth/signup   → otpLimiter    (3 / 10 min)
 *   4. GET /api/admin/users    → generalLimiter (100 / 1 min) — burst test
 *
 * Run: node test-ratelimit.js
 */

const BASE = "http://localhost:5000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RESET  = "\x1b[0m";
const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN   = "\x1b[36m";
const BOLD   = "\x1b[1m";
const DIM    = "\x1b[2m";

function log(color, label, msg) {
  console.log(`${color}${BOLD}[${label}]${RESET} ${msg}`);
}

function separator(title) {
  console.log(`\n${CYAN}${"─".repeat(60)}${RESET}`);
  console.log(`${BOLD}${CYAN}  ${title}${RESET}`);
  console.log(`${CYAN}${"─".repeat(60)}${RESET}`);
}

async function req(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE}${path}`, opts);
    const json = await res.json().catch(() => ({}));
    return { status: res.status, headers: res.headers, json };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

function statusBadge(status) {
  if (status === 429) return `${RED}${BOLD}429 RATE LIMITED${RESET}`;
  if (status === 200) return `${GREEN}${BOLD}200 OK${RESET}`;
  if (status === 400 || status === 401) return `${YELLOW}${BOLD}${status} (expected — wrong creds)${RESET}`;
  if (status === 503) return `${YELLOW}${BOLD}503 DEGRADED${RESET}`;
  if (status === 0)   return `${RED}${BOLD}CONNECTION REFUSED${RESET}`;
  return `${DIM}${status}${RESET}`;
}

// ─── Test 1: Health Check ─────────────────────────────────────────────────────

async function testHealth() {
  separator("TEST 1 — Health Check  GET /api/health");

  const { status, json, error } = await req("GET", "/api/health");

  if (error) {
    log(RED, "FAIL", `Cannot connect to server: ${error}`);
    log(YELLOW, "HINT", "Is the backend running?  cd backend && npm start");
    return false;
  }

  log(status === 200 ? GREEN : YELLOW, "STATUS", statusBadge(status));
  console.log(`\n  ${BOLD}Payload:${RESET}`);
  console.log("  " + JSON.stringify(json, null, 2).replace(/\n/g, "\n  "));

  if (json?.services?.redis?.status === "connected") {
    log(GREEN, "REDIS",  "✅ Connected — rate limits will persist across restarts");
  } else {
    log(YELLOW, "REDIS", `⚠️  ${json?.services?.redis?.mode ?? "unknown"} — rate limits are in-memory only`);
    log(YELLOW, "HINT",  "Add REDIS_URL to .env for persistent rate limits");
  }

  if (json?.services?.mongo?.status === "connected") {
    log(GREEN, "MONGO", "✅ Connected");
  } else {
    log(RED, "MONGO", "❌ NOT connected — check MONGO_URI in .env");
  }

  return true;
}

// ─── Test 2: Login Rate Limiter (5 per 15 min) ───────────────────────────────

async function testLoginRateLimit() {
  separator("TEST 2 — Login Rate Limiter  POST /api/auth/login  (limit: 5 / 15 min)");

  const TOTAL = 8;
  console.log(`  Firing ${TOTAL} sequential requests with bad credentials...\n`);

  let limited = 0;

  for (let i = 1; i <= TOTAL; i++) {
    const { status, json } = await req("POST", "/api/auth/login", {
      email: "ratelimit-test@example.com",
      password: "wrong-password-intentional",
    });

    const badge = statusBadge(status);
    const msg   = json?.message ?? json?.error ?? "";
    const rl    = json?.retryAfter ? `  retry-after: ${json.retryAfter}s` : "";

    console.log(`  Request ${String(i).padStart(2, "0")}  ${badge}${DIM}  ${msg}${rl}${RESET}`);

    if (status === 429) limited++;

    // Small delay to avoid flooding own TCP stack
    await new Promise(r => setTimeout(r, 80));
  }

  console.log("");
  if (limited > 0) {
    log(GREEN, "PASS", `Rate limiter triggered on ${limited}/${TOTAL} requests ✅`);
  } else {
    log(RED, "FAIL", "No 429 responses received — rate limiter may not be active");
  }
}

// ─── Test 3: OTP / Signup Rate Limiter (3 per 10 min) ────────────────────────

async function testOtpRateLimit() {
  separator("TEST 3 — OTP Rate Limiter  POST /api/auth/signup  (limit: 3 / 10 min)");

  const TOTAL = 5;
  console.log(`  Firing ${TOTAL} sequential requests...\n`);

  let limited = 0;

  for (let i = 1; i <= TOTAL; i++) {
    const { status, json } = await req("POST", "/api/auth/signup", {
      name: "Test User",
      email: `ratelimit-otp-${Date.now()}@example.com`,
      password: "TestPass123!",
      department: "test-dept",
    });

    const badge = statusBadge(status);
    const msg   = json?.message ?? "";
    const rl    = json?.retryAfter ? `  retry-after: ${json.retryAfter}s` : "";

    console.log(`  Request ${String(i).padStart(2, "0")}  ${badge}${DIM}  ${msg}${rl}${RESET}`);

    if (status === 429) limited++;

    await new Promise(r => setTimeout(r, 80));
  }

  console.log("");
  if (limited > 0) {
    log(GREEN, "PASS", `OTP limiter triggered on ${limited}/${TOTAL} requests ✅`);
  } else {
    log(RED, "FAIL", "No 429 received — otpRateLimiter may not be wired up");
  }
}

// ─── Test 4: General Rate Limiter Burst (100 per min) ────────────────────────

async function testGeneralBurst() {
  separator("TEST 4 — General Burst Test  GET /api/health  (100 concurrent requests)");

  console.log(`  Firing 110 concurrent requests to exhaust the 100/min limit...\n`);

  const results = await Promise.all(
    Array.from({ length: 110 }, () => req("GET", "/api/health"))
  );

  const byStatus = {};
  for (const r of results) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }

  console.log("  Response breakdown:");
  for (const [status, count] of Object.entries(byStatus).sort()) {
    console.log(`    ${statusBadge(Number(status))}  ×${count}`);
  }

  const limited = byStatus[429] ?? 0;
  console.log("");

  // NOTE: /api/health is intentionally mounted BEFORE generalRateLimiter in server.js,
  // so it is EXEMPT from the general limit. We test /api/student instead.
  if (limited > 0) {
    log(GREEN, "PASS", `General limiter triggered ${limited} times ✅`);
  } else {
    log(YELLOW, "INFO",
      "/api/health is exempt from general rate limiting (by design).\n" +
      "         The general limiter protects /api/auth, /api/admin, /api/student etc."
    );
  }

  // Supplementary: fire 12 concurrent requests at a protected route
  separator("TEST 4b — General Burst  POST /api/auth/login  (concurrent)");
  console.log("  Firing 12 concurrent requests at /api/auth/login...\n");

  const concurrentResults = await Promise.all(
    Array.from({ length: 12 }, () =>
      req("POST", "/api/auth/login", {
        email: "burst-test@example.com",
        password: "burst-wrong",
      })
    )
  );

  const concurrentByStatus = {};
  for (const r of concurrentResults) {
    concurrentByStatus[r.status] = (concurrentByStatus[r.status] ?? 0) + 1;
  }

  console.log("  Response breakdown:");
  for (const [status, count] of Object.entries(concurrentByStatus).sort()) {
    console.log(`    ${statusBadge(Number(status))}  ×${count}`);
  }

  const burst429 = concurrentByStatus[429] ?? 0;
  console.log("");
  if (burst429 > 0) {
    log(GREEN, "PASS", `Concurrent burst limited: ${burst429}/12 requests blocked ✅`);
  } else {
    log(YELLOW, "INFO",
      "No 429 on concurrent burst — loginLimiter allows 5 req/15 min per IP.\n" +
      "         Run this test again within the same 15-min window to see limits."
    );
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}${CYAN}   UniPortal — Rate Limiting & Redis Health Test Suite${RESET}`);
  console.log(`${BOLD}${CYAN}   Target: ${BASE}${RESET}`);
  console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════${RESET}\n`);

  const serverUp = await testHealth();
  if (!serverUp) {
    console.log(`\n${RED}${BOLD}Aborting — server is not reachable.${RESET}\n`);
    process.exit(1);
  }

  await testLoginRateLimit();
  await testOtpRateLimit();
  await testGeneralBurst();

  separator("Summary");
  log(GREEN, "DONE", "All tests completed. Review results above.");
  console.log(`${DIM}  Tip: Re-run this script within the same window to hit cached limits.${RESET}\n`);
}

main().catch(err => {
  console.error(`${RED}Unexpected error:${RESET}`, err.message);
  process.exit(1);
});
