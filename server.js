const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const session = require("express-session");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ===== Session middleware =====
app.use(session({
  secret: "uptime-monitor-secret",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24*60*60*1000 } // 1 day
}));

// ===== Data files =====
const DATA_FILE = path.join(__dirname, "data/urls.json");
const USERS_FILE = path.join(__dirname, "data/users.json");
fs.ensureFileSync(DATA_FILE);
fs.ensureFileSync(USERS_FILE);

// ===== Load/Save helpers =====
const loadURLs = () => fs.readJSONSync(DATA_FILE, {throws:false}) || [];
const saveURLs = urls => fs.writeJSONSync(DATA_FILE, urls, {spaces:2});
const loadUsers = () => fs.readJSONSync(USERS_FILE, {throws:false}) || [];
const saveUsers = users => fs.writeJSONSync(USERS_FILE, users, {spaces:2});

// ===== Ping URL function =====
async function pingURL(item) {
  try{
    const start = Date.now();
    const res = await axios.get(item.url, { timeout: 10000 });
    const time = Date.now() - start;

    let uptime = "N/A";
    if(item.addedTime){
      const durationMs = Date.now() - item.addedTime;
      const minutes = Math.floor(durationMs/60000);
      const hours = Math.floor(minutes/60);
      const days = Math.floor(hours/24);
      uptime = `${days}d ${hours%24}h ${minutes%60}m`;
    }

    return {
      ...item,
      status: res.status>=200 && res.status<400 ? "✅ Online" : "❌ Down",
      responseTime: time,
      lastChecked: new Date().toLocaleString("en-GB",{timeZone:"Asia/Dhaka"}),
      uptime
    };
  } catch {
    let uptime = "N/A";
    if(item.addedTime){
      const durationMs = Date.now() - item.addedTime;
      const minutes = Math.floor(durationMs/60000);
      const hours = Math.floor(minutes/60);
      const days = Math.floor(hours/24);
      uptime = `${days}d ${hours%24}h ${minutes%60}m`;
    }
    return {
      ...item,
      status: "❌ Down",
      responseTime: null,
      lastChecked: new Date().toLocaleString("en-GB",{timeZone:"Asia/Dhaka"}),
      uptime
    };
  }
}

// ===== Routes =====

// Root route
app.get("/", (req, res) => {
  if(req.session.user) res.redirect("/dashboard.html");
  else res.redirect("/login");
});

// Pages
app.get("/login",(req,res)=>res.sendFile(path.join(__dirname,"public/login.html")));
app.get("/register",(req,res)=>res.sendFile(path.join(__dirname,"public/register.html")));
app.get("/dashboard.html",(req,res)=>{
  if(req.session.user) res.sendFile(path.join(__dirname,"public/dashboard.html"));
  else res.redirect("/login");
});

// ===== Auth API =====
app.post("/register",(req,res)=>{
  const {username,email,password} = req.body;
  if(!username||!email||!password) return res.json({success:false,error:"All fields required"});
  const users = loadUsers();
  if(users.find(u=>u.username===username || u.email===email)) return res.json({success:false,error:"User exists"});
  users.push({username,email,password});
  saveUsers(users);
  res.json({success:true});
});

app.post("/login",(req,res)=>{
  const {username,password} = req.body;
  const users = loadUsers();
  const user = users.find(u=>u.username===username && u.password===password);
  if(!user) return res.json({success:false,error:"Invalid credentials"});
  req.session.user={username:user.username,email:user.email};
  res.json({success:true});
});

app.post("/logout",(req,res)=>{
  req.session.destroy(err=>{
    if(err) return res.json({success:false,error:"Logout failed"});
    res.json({success:true});
  });
});

// ===== Monitor API (protected) =====
app.get("/status", async (req,res)=>{
  if(!req.session.user) return res.status(401).json({error:"Unauthorized"});
  const urls = loadURLs();
  const results = await Promise.all(urls.map(pingURL));
  res.json(results);
});

app.post("/add", (req,res)=>{
  if(!req.session.user) return res.status(401).json({error:"Unauthorized"});
  const {url,name} = req.body;
  if(!url) return res.status(400).json({error:"URL required"});
  const urls = loadURLs();
  urls.push({url,name:name||url,addedTime:Date.now(),author:req.session.user.username});
  saveURLs(urls);
  res.json({success:true});
});

app.post("/remove",(req,res)=>{
  if(!req.session.user) return res.status(401).json({error:"Unauthorized"});
  const {url} = req.body;
  let urls = loadURLs();
  urls = urls.filter(item=>item.url!==url);
  saveURLs(urls);
  res.json({success:true});
});

// ===== Start Server =====
const PORT = process.env.PORT||3000;
app.listen(PORT,()=>console.log(`🚀 Server running on port ${PORT}`));

// ===== Anti-sleep ping (ignore errors) =====
setInterval(async()=>{
  try {
    await axios.get(`http://localhost:${PORT}/status`).catch(()=>{});
    console.log("🔄 Self-ping executed");
  } catch(e) {
    console.log("❌ Self-ping fail:", e.message);
  }
}, 60*1000);
