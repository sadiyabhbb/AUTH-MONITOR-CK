const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => container.classList.add('active'));
loginBtn.addEventListener('click', () => container.classList.remove('active'));

// Forms
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

loginForm?.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm));
    const res = await fetch('/login', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
    });
    const result = await res.json();
    if(result.success) window.location.href='/dashboard.html';
    else alert(result.error);
});

registerForm?.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(registerForm));
    const res = await fetch('/register', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
    });
    const result = await res.json();
    if(result.success) alert('User registered successfully!');
    else alert(result.error);
});
