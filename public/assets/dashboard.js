const canvas = document.getElementById('waterCanvas');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

const waveCount = 5, waves=[], particles=[];
for(let i=0;i<waveCount;i++){
  waves.push({y:height*Math.random(), amplitude:10+Math.random()*20, wavelength:100+Math.random()*200, speed:0.01+Math.random()*0.02, phase:Math.random()*2*Math.PI});
}
for(let i=0;i<100;i++){
  particles.push({x:Math.random()*width, y:Math.random()*height, r:1+Math.random()*2, speedX:(Math.random()-0.5)*0.3, speedY:(Math.random()-0.5)*0.3});
}

function drawBackground(){
  ctx.clearRect(0,0,width,height);
  ctx.fillStyle='#0d0d0d';
  ctx.fillRect(0,0,width,height);
  ctx.strokeStyle='rgba(33,150,243,0.3)'; ctx.lineWidth=2;
  waves.forEach(w=>{
    ctx.beginPath();
    for(let x=0;x<width;x+=2){
      const y = w.y + Math.sin((x/w.wavelength)+w.phase)*w.amplitude;
      if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke(); w.phase+=w.speed;
  });
  ctx.fillStyle='rgba(33,150,243,0.3)';
  particles.forEach(p=>{
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    p.x+=p.speedX; p.y+=p.speedY;
    if(p.x<0)p.x=width;if(p.x>width)p.x=0;if(p.y<0)p.y=height;if(p.y>height)p.y=0;
  });
  requestAnimationFrame(drawBackground);
}
drawBackground();
window.addEventListener('resize',()=>{width=canvas.width=window.innerWidth;height=canvas.height=window.innerHeight;});

// Fetch dashboard data
async function fetchStatus(){
  try{
    const res = await fetch('/status');
    const data = await res.json();
    const list = document.getElementById('urlList');
    list.innerHTML='';
    data.forEach(item=>{
      const li = document.createElement('li');
      li.className='card';
      li.innerHTML=`
        <div class="card-header" onclick="this.nextElementSibling.classList.toggle('collapsed')">
          <strong>${item.name||item.url}</strong>
          <span class="toggle-btn">▼</span>
        </div>
        <div class="card-body collapsed">
          <p><strong>URL:</strong> ${item.url}</p>
          <p><strong>Status:</strong> <span class="status ${item.status.startsWith('✅')?'online':'offline'}">${item.status}</span></p>
          <p><strong>Response Time:</strong> ${item.responseTime!=null?item.responseTime+' ms':'N/A'}</p>
          <p><strong>Added:</strong> ${new Date(item.addedTime).toLocaleString("en-US",{timeZone:"Asia/Dhaka"})}</p>
          <p><strong>Author:</strong> ${item.author||'AHMED'}</p>
          <button class="remove-btn" onclick="removeURL('${item.url}')">🗑 Remove</button>
        </div>`;
      list.appendChild(li);
    });
  }catch(err){console.error(err);}
}

async function addURL(){
  const url=document.getElementById('urlInput').value.trim();
  if(!url)return alert('Enter a URL');
  const name=prompt('Enter a title/name for this link')||url;
  await fetch('/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,name})});
  document.getElementById('urlInput').value='';
  fetchStatus();
}
async function removeURL(url){await fetch('/remove',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})}); fetchStatus();}
function logout(){fetch("/logout",{method:"POST"}).then(res=>res.json()).then(json=>{if(json.success) window.location.href="/login";else alert("Logout failed");});}

fetchStatus(); setInterval(fetchStatus,60000);
