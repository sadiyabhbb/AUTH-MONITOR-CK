// ================= Show sliding message =================
function showMessage(text, type='success', duration=3000){
  const msgBox = document.createElement('div');
  msgBox.className = 'msg ' + (type==='success' ? 'success' : 'error');
  msgBox.textContent = text;

  // Add to body
  document.body.appendChild(msgBox);

  // Animate in
  msgBox.style.opacity = '0';
  msgBox.style.transform = 'translateX(-50%) translateY(-20px)';
  setTimeout(()=>{
    msgBox.style.transition = 'all 0.4s ease';
    msgBox.style.opacity = '1';
    msgBox.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);

  // Animate out & remove
  setTimeout(()=>{
    msgBox.style.opacity = '0';
    msgBox.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(()=> msgBox.remove(), 400);
  }, duration);
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
        showMessage('Login successful! Redirecting...', 'success');
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
