const express = require("express");
const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const session = require("express-session");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'uptime-monitor-secret',
  resave: false,
  saveUninitialized: true
}));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Data files
const DATA_FILE = path.join(__dirname, "data/urls.json");
const USER_FILE = path.join(__dirname, "data/users.json");
fs.ensureFileSync(DATA_FILE);
fs.ensureFileSync(USER_FILE);

// Load & Save
const loadURLs = () => fs.readJSONSync(DATA_FILE, { throws: false }) || [];
const saveURLs = (urls) => fs.writeJSONSync(DATA_FILE, urls, { spaces: 2 });

const loadUsers = () => fs.readJSONSync(USER_FILE, { throws: false }) || [];
const saveUsers = (users) => fs.writeJSONSync(USER_FILE, users, { spaces: 2 });

// Auth middleware
function requireLogin(req, res, next) {
  if (req.session.user) next();
  else res.redirect("/login.html");
}

// --- Routes ---

// Root redirect to login
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// Register
app.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  if(!username || !email || !password) return res.json({ error: "All fields required" });

  const users = loadUsers();
  if(users.find(u=>u.username===username || u.email===email))
    return res.json({ error: "User already exists" });

  users.push({ username, email, password });
  saveUsers(users);
  res.json({ success: true });
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username===username && u.password===password);
  if(user) {
    req.session.user = user;
    res.json({ success: true });
  } else res.json({ error: "Invalid credentials" });
});

// Logout
app.get("/logout", (req,res)=>{
  req.session.destroy();
  res.redirect("/login.html");
});

// Dashboard status
app.get("/status", requireLogin, async (req, res) => {
  const urls = loadURLs();
  const results = await Promise.all(urls.map(pingURL));
  res.json(results);
});

app.post("/add", requireLogin, async (req, res) => {
  const { url, name } = req.body;
  const urls = loadURLs();
  urls.push({ url, name: name || url, addedTime: Date.now(), author: req.session.user.username });
  saveURLs(urls);
  res.json({ success: true });
});

app.post("/remove", requireLogin, (req, res) => {
  let urls = loadURLs();
  urls = urls.filter(item => item.url !== req.body.url);
  saveURLs(urls);
  res.json({ success: true });
});

// --- Ping function ---
async function pingURL(item) {
  try {
    const start = Date.now();
    const res = await axios.get(item.url, { timeout: 10000 });
    const time = Date.now() - start;
    let uptime = item.addedTime ? `${Math.floor((Date.now()-item.addedTime)/60000)}m` : "N/A";
    return { ...item, status: res.status<400?"✅ Online":"❌ Down", responseTime: time, lastChecked:new Date().toLocaleString("en-GB",{timeZone:"Asia/Dhaka"}), uptime };
  } catch {
    let uptime = item.addedTime ? `${Math.floor((Date.now()-item.addedTime)/60000)}m` : "N/A";
    return { ...item, status:"❌ Down", responseTime:null, lastChecked:new Date().toLocaleString("en-GB",{timeZone:"Asia/Dhaka"}), uptime };
  }
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`🚀 Server running on port ${PORT}`));
