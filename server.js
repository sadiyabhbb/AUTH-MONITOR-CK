const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const urlsFile = path.join(__dirname, 'urls.json');
let urls = fs.existsSync(urlsFile) ? JSON.parse(fs.readFileSync(urlsFile)) : [];

function saveUrls() { fs.writeFileSync(urlsFile, JSON.stringify(urls, null, 2)); }

const statusMap = {};

// Ping function
async function pingUrls() {
  for (let url of urls) {
    try {
      const res = await fetch(url);
      statusMap[url] = res.status >= 200 && res.status < 300 ? '✅ Online' : `❌ Error (${res.status})`;
    } catch (err) {
      statusMap[url] = '❌ Down';
    }
  }
}
pingUrls();
setInterval(pingUrls, 5*60*1000);

// Routes
app.get('/status', (req, res) => {
  res.json(urls.map(url => ({ url, status: statusMap[url] || '⏳ Checking...' })));
});

app.post('/add', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  if (!urls.includes(url)) { urls.push(url); saveUrls(); pingUrls(); }
  res.json({ success: true });
});

app.post('/remove', (req, res) => {
  const { url } = req.body;
  urls = urls.filter(u => u !== url);
  saveUrls();
  res.json({ success: true });
});

// Optional ping for uptime
app.get('/ping', (req,res)=> res.send('OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Uptime monitor running on port ${PORT}`));
