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
    const res = await axios.get(item.url, { timeout: 10000 }); // 10s timeout
    const time = Date.now() - start;
    return {
      ...item,
      status: res.status >= 200 && res.status < 400 ? "✅ Online" : "❌ Down",
      responseTime: time,
      lastChecked: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
    };
  } catch {
    return {
      ...item,
      status: "❌ Down",
      responseTime: null,
      lastChecked: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
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
  urls.push({ url, name: name || url });
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
