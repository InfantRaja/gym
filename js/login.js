const SESSION_KEY = 'limitbreak-auth';
const form = document.getElementById('loginForm');
const message = document.getElementById('loginMessage');
const password = document.getElementById('password');
const passwordToggle = document.getElementById('passwordToggle');

passwordToggle.addEventListener('click', () => {
  const visible = password.type === 'text';
  password.type = visible ? 'password' : 'text';
  passwordToggle.textContent = visible ? 'Show' : 'Hide';
  passwordToggle.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
});

document.getElementById('forgotPassword').addEventListener('click', event => {
  event.preventDefault();
  message.textContent = 'Demo access is shown below the form.';
});

const demoNote = document.querySelector('.demo-note');
if (demoNote) {
  demoNote.style.cursor = 'pointer';
  demoNote.title = 'Click to fill demo credentials';
  demoNote.addEventListener('click', () => {
    document.getElementById('email').value = 'demo@limitbreak.app';
    password.value = 'limitbreak';
  });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const passwordValue = password.value;
  message.textContent = '';
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: passwordValue })
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 503) {
        if ((email === 'demo@limitbreak.app' && passwordValue === 'limitbreak') || !email) {
          setLocalDemoSession('demo@limitbreak.app');
        } else {
          const savedAuth = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
          if (savedAuth.email && savedAuth.email.toLowerCase() === email) {
            setLocalDemoSession(email);
          } else {
            message.textContent = 'Offline mode active. Click "Demo access" below to sign in.';
            return;
          }
        }
      } else {
        message.textContent = result.error || 'Could not sign in. Please try again.';
        return;
      }
    } else {
      localStorage.setItem('limitbreak-user-id', result.user.id);
      localStorage.setItem('limitbreak-user-name', result.user.name);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ email: result.user.email, signedInAt: new Date().toISOString(), remember: document.getElementById('remember').checked }));
    }
  } catch {
    if (email === 'demo@limitbreak.app' && passwordValue === 'limitbreak') setLocalDemoSession(email);
    else {
      message.textContent = 'Could not reach the server. Check that LimitBreak is running.';
      return;
    }
  }
  message.className = 'login-message success-message';
  message.textContent = 'Signed in. Loading your dashboard...';
  setTimeout(() => { window.location.href = 'home.html'; }, 450);
});

function setLocalDemoSession(email) {
  localStorage.setItem('limitbreak-user-id', 'demo');
  localStorage.setItem('limitbreak-user-name', 'Alex Morgan');
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, signedInAt: new Date().toISOString(), remember: document.getElementById('remember').checked }));
}
