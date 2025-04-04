const loginsec=document.querySelector('.login-section')
const loginlink=document.querySelector('.login-link')
const registerlink=document.querySelector('.register-link')
registerlink.addEventListener('click',()=>{
    loginsec.classList.add('active')
})
loginlink.addEventListener('click',()=>{
    loginsec.classList.remove('active')
})

function register() {
    let register_username = document.getElementById('register-username').value;
    let register_email = document.getElementById('register-email').value;
    let register_password = document.getElementById('register-password').value;

    if (register_username === '' || register_email === '' || register_password === '') {
        alert("All fields are required");
        return;
    }

    fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: register_username,
            email: register_email,
            password: register_password
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || 'Registration failed'); });
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
    })
    .catch(error => alert('Error: ' + error.message));
}

function login() {
    let login_email = document.getElementById('login-email').value;
    let login_password = document.getElementById('login-password').value;

    if (login_email === '' || login_password === '') {
        alert("All fields are required");
        return;
    }

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: login_email,
            password: login_password
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || 'Login failed'); });
        }
        return response.json();
    })
    .then(data => {
        // Store user info in session storage
        sessionStorage.setItem('username', data.username);
        sessionStorage.setItem('email', login_email);
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    })
    .catch(error => alert('Error: ' + error.message));
}