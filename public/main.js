// ------------------ Show sliding message -------------------
function showMessage(text, type='error', duration=3000) {
  let msgBox = document.getElementById('msgBox');
  if(!msgBox){
    msgBox = document.createElement('div');
    msgBox.id = 'msgBox';
    msgBox.className = 'msg';
    document.body.appendChild(msgBox);
  }
  msgBox.textContent = text;
  msgBox.className = 'msg ' + (type==='success' ? 'success' : 'error');
  msgBox.style.left = '20px';
  msgBox.style.opacity = '1';

  setTimeout(()=>{
    msgBox.style.left = '100%';
    msgBox.style.opacity = '0';
    setTimeout(()=>{ msgBox.remove(); }, 500);
  }, duration);
}

// ------------------- DOM Ready -------------------
document.addEventListener("DOMContentLoaded", ()=>{
  // ------------------- Login form -------------------
  const loginForm = document.getElementById("loginForm");
  if(loginForm){
    loginForm.addEventListener("submit", async e=>{
      e.preventDefault();
      const data = { username: loginForm.username.value, password: loginForm.password.value };
      try {
        const res = await fetch("/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
        const json = await res.json();
        if(json.success){
          showMessage("Login successful!",'success');
          setTimeout(()=>window.location.href="/dashboard.html",900);
        } else showMessage(json.error || "Login failed",'error');
      } catch(err){ showMessage('Server error. Try again later.','error'); console.error(err); }
    });
  }

  // ------------------- Register form -------------------
  const registerForm = document.getElementById("registerForm");
  if(registerForm){
    registerForm.addEventListener("submit", async e=>{
      e.preventDefault();
      const data = { username: registerForm.username.value, email: registerForm.email.value, password: registerForm.password.value };
      try {
        const res = await fetch("/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
        const json = await res.json();
        if(json.success){
          showMessage("Registered successfully!",'success');
          setTimeout(()=>window.location.href="/login.html",900);
        } else showMessage(json.error || "Registration failed",'error');
      } catch(err){ showMessage('Server error. Try again later.','error'); console.error(err); }
    });
  }
});

// ------------------- Dashboard logout -------------------
function logout(){
  fetch("/logout",{method:"POST"})
  .then(res=>res.json())
  .then(json=>{
    if(json.success) window.location.href="/login.html";
    else showMessage(json.error || "Logout failed", 'error');
  });
}
