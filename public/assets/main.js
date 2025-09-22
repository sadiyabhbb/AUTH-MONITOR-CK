// ================= Show floating text message =================
function showMessage(text, type='success', duration=2000){
  const msg = document.createElement('div');
  msg.className = 'floating-msg ' + (type==='success' ? 'success' : 'error');
  msg.textContent = text;
  document.body.appendChild(msg);

  // Show
  requestAnimationFrame(()=>{ 
    msg.style.opacity = '1';
    msg.style.transform = 'translateX(-50%) translateY(0)';
  });

  // Hide after duration
  setTimeout(()=>{
    msg.style.opacity = '0';
    msg.style.transform = 'translateX(-50%) translateY(-20px)';
  }, duration);

  // Remove from DOM
  setTimeout(()=> msg.remove(), duration + 300);
}

// ================= Login =================
const loginForm = document.getElementById("loginForm");
if(loginForm){
  loginForm.addEventListener("submit", async e=>{
    e.preventDefault();
    const data = { username:e.target.username.value, password:e.target.password.value };
    try {
      const res = await fetch("/login", { 
        method:"POST", 
        headers:{"Content-Type":"application/json"}, 
        body:JSON.stringify(data) 
      });
      const json = await res.json();
      if(json.success){
        showMessage('Login successful!', 'success');
        setTimeout(()=> window.location.href="/dashboard", 800);
      } else showMessage(json.error || "Login failed", 'error');
    } catch(err){ 
      showMessage('Server error. Try again.', 'error'); 
      console.error(err); 
    }
  });
}

// ================= Register =================
const registerForm = document.getElementById("registerForm");
if(registerForm){
  registerForm.addEventListener("submit", async e=>{
    e.preventDefault();
    const data = { 
      username:e.target.username.value, 
      email:e.target.email.value, 
      password:e.target.password.value 
    };
    try {
      const res = await fetch("/register",{ 
        method:"POST", 
        headers:{"Content-Type":"application/json"}, 
        body:JSON.stringify(data) 
      });
      const json = await res.json();
      if(json.success){
        showMessage("Registered successfully!", 'success');
        setTimeout(()=> window.location.href="/login", 800);
      } else showMessage(json.error || "Registration failed",'error');
    } catch(err){ 
      showMessage('Server error. Try again.', 'error'); 
      console.error(err);
    }
  });
}

// ================= Logout =================
function logout(){
  fetch("/logout",{method:"POST"}).then(res=>res.json()).then(json=>{
    if(json.success) window.location.href="/login";
    else showMessage(json.error || "Logout failed", 'error');
  });
}
