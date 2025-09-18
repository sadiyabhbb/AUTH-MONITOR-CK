const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const urlsFile = path.join(__dirname, "urls.json");
let urls = JSON.parse(fs.readFileSync(urlsFile));

// Function to save URLs
function saveUrls() {
    fs.writeFileSync(urlsFile, JSON.stringify(urls, null, 2));
}

// Ping all URLs every 5 minutes
const statusMap = {};
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
setInterval(pingUrls, 5 * 60 * 1000); // 5 min interval

// API to add new URL
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

// Dashboard
app.get("/", (req, res) => {
    let html = `
    <html>
    <head>
        <title>Uptime Monitor</title>
        <style>
            body { font-family: Arial; background: #f4f4f9; padding: 20px; }
            h1 { color: #333; }
            ul { list-style: none; padding: 0; }
            li { padding: 10px; margin: 5px 0; background: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);}
            .online { color: green; font-weight: bold; }
            .offline { color: red; font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>Uptime Monitor Dashboard</h1>
        <ul>
            ${urls.map(url => {
                const status = statusMap[url] || "⏳ Checking...";
                const cls = status.startsWith("✅") ? "online" : "offline";
                return `<li>${url} - <span class="${cls}">${status}</span></li>`;
            }).join("")}
        </ul>
    </body>
    </html>
    `;
    res.send(html);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
