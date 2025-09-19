const express = require("express");
const fs = require("fs-extra");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DATA_FILE = path.join(__dirname, "data/urls.json");
fs.ensureFileSync(DATA_FILE);

// Load URLs
function loadURLs() {
  try {
    return fs.readJSONSync(DATA_FILE);
  } catch {
    return [];
  }
}

// Save URLs
function saveURLs(urls) {
  fs.writeJSONSync(DATA_FILE, urls, { spaces: 2 });
}

// Ping a single URL
async function pingURL(item) {
  try {
    const start = Date.now();
    const res = await axios.get(item.url, { timeout: 10000 });
    const time = Date.now() - start;

    // calculate uptime duration
    let uptime = "N/A";
    if (item.addedTime) {
      const durationMs = Date.now() - item.addedTime;
      const minutes = Math.floor(durationMs / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      uptime = `${days}d ${hours % 24}h ${minutes % 60}m`;
    }

    return {
      ...item,
      status: res.status >= 200 && res.status < 400 ? "✅ Online" : "❌ Down",
      responseTime: time,
      lastChecked: new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }),
      uptime
    };
  } catch {
    let uptime = "N/A";
    if (item.addedTime) {
      const durationMs = Date.now() - item.addedTime;
      const minutes = Math.floor(durationMs / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      uptime = `${days}d ${hours % 24}h ${minutes % 60}m`;
    }
    return {
      ...item,
      status: "❌ Down",
      responseTime: null,
      lastChecked: new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }),
      uptime
    };
  }
}

// GET /status
app.get("/status", async (req, res) => {
  const urls = loadURLs();
  const results = await Promise.all(urls.map(pingURL));
  res.json(results);
});

// POST /add
app.post("/add", async (req, res) => {
  const { url, name } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });
  const urls = loadURLs();
  urls.push({
    url,
    name: name || url,
    addedTime: Date.now(),
    author: "LIKHON AHMED"
  });
  saveURLs(urls);
  res.json({ success: true });
});

// POST /remove
app.post("/remove", (req, res) => {
  const { url } = req.body;
  let urls = loadURLs();
  urls = urls.filter(item => item.url !== url);
  saveURLs(urls);
  res.json({ success: true });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Anti-sleep self ping (every 1 minute)
setInterval(async () => {
  try {
    await axios.get(`http://localhost:${PORT}/status`);
    console.log("🔄 Self-ping successful (1m interval)...");
  } catch (err) {
    console.log("❌ Self-ping failed:", err.message);
  }
}, 60 * 1000); // প্রতি 1 মিনিটে নিজের server কে ping করবে
