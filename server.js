const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// URLs array: { url, name, status, responseTime, lastChecked }
let urls = [];

// Ping function
async function pingUrls() {
  for (let urlObj of urls) {
    try {
      const start = Date.now();
      const response = await fetch(urlObj.url, { method: "GET" });
      const end = Date.now();

      urlObj.responseTime = end - start;
      urlObj.lastChecked = new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" });

      if (response.ok) {
        urlObj.status = "✅ Online";
      } else {
        urlObj.status = `❌ Error (${response.status})`;
      }
    } catch (err) {
      urlObj.status = "❌ Down";
      urlObj.responseTime = null;
      urlObj.lastChecked = new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" });
    }
  }
}

// API: Get all URLs with status
app.get("/status", (req, res) => {
  res.json(urls);
});

// API: Add URL with optional name/title
app.post("/add", (req, res) => {
  const { url, name } = req.body;
  if (!url) return res.status(400).send("URL is required");

  // Avoid duplicates
  if (!urls.find(u => u.url === url)) {
    urls.push({
      url,
      name: name || url,
      status: "⏳ Checking...",
      responseTime: null,
      lastChecked: null
    });
  }
  res.sendStatus(200);
});

// API: Remove URL
app.post("/remove", (req, res) => {
  const { url } = req.body;
  urls = urls.filter(u => u.url !== url);
  res.sendStatus(200);
});

// Initial ping and interval ping every 1 minute
pingUrls();
setInterval(pingUrls, 60 * 1000);

// Keep server alive ping
app.get("/ping", (req, res) => res.send("OK"));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Uptime monitor running at http://localhost:${PORT}`);
});
