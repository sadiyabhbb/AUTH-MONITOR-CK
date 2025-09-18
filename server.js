const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const urlsFile = path.join(__dirname, "urls.json");
let urls = JSON.parse(fs.readFileSync(urlsFile, "utf-8"));

// Save URLs to file
function saveUrls() {
    fs.writeFileSync(urlsFile, JSON.stringify(urls, null, 2), "utf-8");
}

// Status map
const statusMap = {};

// Ping function
async function pingUrls() {
    for (let url of urls) {
        try {
            const res = await fetch(url);
            statusMap[url] = res.status >= 200 && res.status < 300 ? "✅ Online" : `❌ Error (${res.status})`;
        } catch (err) {
            statusMap[url] = "❌ Down";
        }
    }
}
pingUrls();
setInterval(pingUrls, 5 * 60 * 1000); // every 5 minutes

// Add new URL endpoint
app.post("/add", (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });
    if (!urls.includes(url)) {
        urls.push(url);
        saveUrls();
        pingUrls();
    }
    res.json({ success: true, urls });
});

// Dashboard route
app.get("/", (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Uptime Monitor Dashboard</title>
      <link rel="stylesheet" href="style.css">
    </head>
    <body>
      <div class="container">
        <h1>Uptime Monitor Dashboard</h1>
        <ul>
          ${urls.map(url => {
            const status = statusMap[url] || "⏳ Checking...";
            const cls = status.startsWith("✅") ? "online" : status.startsWith("❌") ? "offline" : "loading";
            return `<li>${url} - <span class="${cls}">${status}</span></li>`;
          }).join("")}
        </ul>
      </div>
    </body>
    </html>
    `;
    res.send(html);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Uptime monitor running on port ${PORT}`));
