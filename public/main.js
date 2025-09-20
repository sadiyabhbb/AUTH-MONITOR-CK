const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => container.classList.add('active'));
loginBtn.addEventListener('click', () => container.classList.remove('active'));

// Form submit
document.getElementById("loginForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const form = e.target;
  const data = { username: form.username.value, password: form.password.value };
  const res = await fetch("/login",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
  const json = await res.json();
  if(json.success) window.location.href="/dashboard.html";
  else alert(json.error || "Login failed");
});

document.getElementById("registerForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const form = e.target;
  const data = { username: form.username.value, email: form.email.value, password: form.password.value };
  const res = await fetch("/register",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
  const json = await res.json();
  if(json.success){ alert("Registered successfully!"); container.classList.remove('active'); }
  else alert(json.error || "Registration failed");
});
