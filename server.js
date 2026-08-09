const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 5000;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const DATA = path.join(ROOT, "data", "cards.json");

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function readCards() { return JSON.parse(fs.readFileSync(DATA, "utf8")); }
function send(res, status, data, type = "application/json") {
  res.writeHead(status, { "Content-Type": type, "Access-Control-Allow-Origin": "*" });
  res.end(type.startsWith("application/json") ? JSON.stringify(data) : data);
}
function clamp(n, min = 0, max = 100) { return Math.max(min, Math.min(max, n)); }

function recommend(a) {
  const selected = Array.isArray(a.requirements) ? a.requirements : [];
  const monthly = a.monthlySpend || {};
  const totalMonthly = Object.values(monthly).map(Number).filter(Number.isFinite).reduce((x, y) => x + y, 0);

  return readCards().map(card => {
    let score = 0, reasons = [];
    const matches = selected.filter(x => card.categories.includes(x));
    score += matches.length * 13;
    selected.forEach(x => score += Number((card.benefitScores || {})[x] || 0) * .15);

    if (a.rewardType === "cashback" && card.rewardType === "cashback") { score += 15; reasons.push("Matches your preference for simple cashback."); }
    if (a.rewardType === "rewards" && card.rewardType === "points") { score += 15; reasons.push("Matches your preference for reward points."); }
    if (a.feePreference === "ltf" && card.annualFee === 0) { score += 15; reasons.push("Lifetime-free structure matches your fee preference."); }
    if (a.feePreference === "ltf" && card.annualFee > 0) score -= 8;
    if (a.feePreference === "paid" && card.annualFee > 0) { score += 10; reasons.push("Paid-card option can provide richer benefits."); }
    if (a.upiImportance === "important" && card.network === "RuPay" && card.upiScore >= 8) { score += 12; reasons.push("Strong fit for UPI spending."); }
    if (a.upiImportance === "important" && card.network !== "RuPay") { score -= 30; reasons.push("Note: this card's network does not support UPI linking."); }
    if (a.travelFrequency === "frequent" && card.travelScore >= 8) { score += 10; reasons.push("Strong travel benefits for frequent travellers."); }
    if (a.shoppingPreference === "amazon" && card.shoppingPartners.includes("Amazon")) { score += 8; reasons.push("Good fit for Amazon spending."); }
    if (a.shoppingPreference === "flipkart" && card.shoppingPartners.includes("Flipkart")) { score += 8; reasons.push("Good fit for Flipkart spending."); }
    if (matches.length) reasons.unshift(`Strong match for ${matches.slice(0, 2).join(" and ")}.`);

    const annualSpend = totalMonthly * 12;
    const reward = Math.min(annualSpend * Number(card.primaryRewardRate || 0) / 100, card.annualRewardCap || Infinity);
    return {
      card,
      score: clamp(Math.round(score + 35)),
      estimatedAnnualReward: Math.round(reward),
      estimatedNetValue: Math.round(reward - card.annualFee),
      reasons: [...new Set(reasons)].slice(0, 3)
    };
  }).sort((a, b) => b.score - a.score);
}

function staticFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, { message: "Not found" });
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, mime[ext] || "application/octet-stream");
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
    return res.end();
  }

  if (req.method === "GET" && pathname === "/api/health")
    return send(res, 200, { ok: true, service: "Credora API" });

  if (req.method === "GET" && pathname === "/api/cards") {
    let result = readCards();
    const q = String(parsed.query.search || "").trim().toLowerCase();
    const category = String(parsed.query.category || "").trim();
    if (q) result = result.filter(c => `${c.name} ${c.issuer} ${c.categories.join(" ")}`.toLowerCase().includes(q));
    if (category) result = result.filter(c => c.categories.includes(category));
    return send(res, 200, result);
  }

  if (req.method === "GET" && pathname.startsWith("/api/cards/")) {
    const id = pathname.split("/").pop();
    const card = readCards().find(c => c.id === id);
    return card ? send(res, 200, card) : send(res, 404, { message: "Card not found" });
  }

  if (req.method === "POST" && pathname === "/api/recommend") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const result = recommend(JSON.parse(body || "{}"));
        send(res, 200, { results: result.slice(0, 3), allMatches: result });
      } catch (e) { send(res, 400, { message: "Invalid recommendation data" }); }
    });
    return;
  }

  let filePath = pathname === "/" ? path.join(PUBLIC, "index.html") : path.join(PUBLIC, pathname);
  filePath = path.normalize(filePath);
  if (!filePath.startsWith(PUBLIC)) return send(res, 403, { message: "Forbidden" });
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return staticFile(res, filePath);
  return staticFile(res, path.join(PUBLIC, "index.html"));
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. If Credora is already running, open http://localhost:${PORT}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
server.listen(PORT, () => console.log(`Credora running at http://localhost:${PORT}`));