const form = document.getElementById('registerForm');
const message = document.getElementById('registerMessage');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');
const passwordToggle = document.getElementById('passwordToggle');

passwordToggle.addEventListener('click', () => {
  const visible = password.type === 'text';
  password.type = visible ? 'password' : 'text';
  confirmPassword.type = visible ? 'password' : 'text';
  passwordToggle.textContent = visible ? 'Show' : 'Hide';
  passwordToggle.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  message.className = 'login-message';
  message.textContent = '';
  if (password.value !== confirmPassword.value) {
    message.textContent = 'The passwords do not match.';
    confirmPassword.focus();
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: password.value
      })
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 503) {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const localId = 'local-' + Date.now();
        localStorage.setItem('limitbreak-user-id', localId);
        localStorage.setItem('limitbreak-user-name', name);
        localStorage.setItem('limitbreak-auth', JSON.stringify({ email, signedInAt: new Date().toISOString() }));
        message.className = 'login-message success-message';
        message.textContent = 'Offline profile created! Opening your dashboard...';
        setTimeout(() => { window.location.href = 'home.html'; }, 500);
        return;
      }
      message.textContent = result.error || 'Could not create the account.';
      return;
    }

    localStorage.setItem('limitbreak-user-id', result.user.id);
    localStorage.setItem('limitbreak-user-name', result.user.name);
    localStorage.setItem('limitbreak-auth', JSON.stringify({ email: result.user.email, signedInAt: new Date().toISOString() }));
    message.className = 'login-message success-message';
    message.textContent = 'Account created. Opening your dashboard...';
    setTimeout(() => { window.location.href = 'home.html'; }, 500);
  } catch {
    message.textContent = 'Could not reach the server. Check that LimitBreak is running.';
  }
});
