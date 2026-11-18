const http = require("http");

const ORIGIN = process.env.SMOKE_ORIGIN || "http://localhost:3000";
const EMAIL = process.env.SMOKE_EMAIL || "admin@blog.test";
const PASSWORD = process.env.SMOKE_PASSWORD || "Admin123!";

function request(method, path, { headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, ORIGIN);
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method,
        headers: {
          ...(data ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}),
          ...headers,
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({ status: res.statusCode, headers: res.headers, text });
        });
      },
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function pickCookie(setCookie) {
  if (!setCookie) return "";
  const list = Array.isArray(setCookie) ? setCookie : [setCookie];
  return list
    .map((line) => line.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

(async () => {
  const login = await request("POST", "/api/auth/login", {
    body: { email: EMAIL, password: PASSWORD },
    headers: { Origin: ORIGIN, Referer: `${ORIGIN}/login` },
  });
  if (login.status !== 200) {
    console.error("Login failed", login.status, login.text.slice(0, 200));
    process.exit(1);
  }
  const cookie = pickCookie(login.headers["set-cookie"]);
  if (!cookie) {
    console.error("No session cookie returned");
    process.exit(1);
  }
  const profile = await request("GET", "/profile", { headers: { Cookie: cookie } });
  const okProfile =
    profile.status === 200 &&
    !profile.text.includes("Loading dashboard") &&
    (profile.text.includes("Blog list") || profile.text.includes("Profile"));
  const redirectedLogin = profile.status === 307 || profile.status === 302 || profile.text.includes("/login");
  console.log("login", login.status);
  console.log("profile", profile.status, okProfile ? "content-ok" : redirectedLogin ? "redirect-or-login" : "unexpected");
  if (!okProfile) {
    console.error(profile.text.slice(0, 500));
    process.exit(1);
  }
  console.log("smoke ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});