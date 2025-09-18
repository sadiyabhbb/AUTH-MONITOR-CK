const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let urls = [];

// Function to ping all URLs
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
    } catch (error) {
      urlObj.status = "❌ Down";
      urlObj.responseTime = null;
      urlObj.lastChecked = new Date().toLocaleString();
    }
  }
}

// API: get status
app.get("/status", (req, res) => {
  res.json(urls);
});

// API: add URL
app.post("/add", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).send("URL is required");

  if (!urls.find(u => u.url === url)) {
    urls.push({
      url,
      status: "⏳ Checking...",
      responseTime: null,
      lastChecked: null
    });
  }
  res.sendStatus(200);
});

// API: remove URL
app.post("/remove", (req, res) => {
  const { url } = req.body;
  urls = urls.filter(u => u.url !== url);
  res.sendStatus(200);
});

// Ping every 1 min
setInterval(pingUrls, 60 * 1000);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
