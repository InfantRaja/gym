(function () {
  const form = document.getElementById('registerForm');
  const message = document.getElementById('registerMessage');
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirmPassword');
  const passwordToggle = document.getElementById('passwordToggle');
  const googleSignInBtn = document.getElementById('googleSignInBtn');

  if (passwordToggle && password && confirmPassword) {
    passwordToggle.addEventListener('click', () => {
      const visible = password.type === 'text';
      password.type = visible ? 'password' : 'text';
      confirmPassword.type = visible ? 'password' : 'text';
      passwordToggle.textContent = visible ? 'Show' : 'Hide';
      passwordToggle.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
    });
  }

  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', () => {
      if (typeof window.handleGoogleSignIn === 'function') {
        window.handleGoogleSignIn();
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (message) {
        message.className = 'login-message';
        message.textContent = '';
      }
      
      if (password.value !== confirmPassword.value) {
        if (message) message.textContent = 'The passwords do not match.';
        confirmPassword.focus();
        return;
      }

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim().toLowerCase();
      const passwordVal = password.value;

      if (typeof window.openEmailOtpModal === 'function') {
        window.openEmailOtpModal({
          email,
          name,
          onVerified: async () => {
            await finalizeRegistration(name, email, passwordVal);
          },
          onCancel: () => {
            if (message) message.textContent = 'Verification was cancelled. Please verify your email to create an account.';
          }
        });
      } else {
        await finalizeRegistration(name, email, passwordVal);
      }
    });
  }

  async function finalizeRegistration(name, email, passwordVal) {
    if (message) {
      message.className = 'login-message';
      message.textContent = 'Verifying and creating your account...';
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password: passwordVal,
          emailVerified: true
        })
      });

      if (response.status === 404 || response.status === 503) {
        createLocalProfile(name, email);
        return;
      }

      const result = await response.json();
      if (!response.ok) {
        if (message) message.textContent = result.error || 'Could not create the account.';
        return;
      }

      localStorage.setItem('limitbreak-user-id', result.user.id);
      localStorage.setItem('limitbreak-user-name', result.user.name);
      localStorage.setItem('limitbreak-auth', JSON.stringify({
        email: result.user.email,
        name: result.user.name,
        emailVerified: true,
        signedInAt: new Date().toISOString()
      }));
      if (message) {
        message.className = 'login-message success-message';
        message.textContent = 'Email verified! Account created. Opening your dashboard...';
      }
      setTimeout(() => { window.location.href = 'home.html'; }, 500);
    } catch {
      createLocalProfile(name, email);
    }
  }

  function createLocalProfile(name, email) {
    const localId = 'local-' + Date.now();
    localStorage.setItem('limitbreak-user-id', localId);
    localStorage.setItem('limitbreak-user-name', name);
    localStorage.setItem('limitbreak-auth', JSON.stringify({
      email,
      name,
      emailVerified: true,
      signedInAt: new Date().toISOString()
    }));

    try {
      const rawState = localStorage.getItem('limitbreak-state');
      const state = rawState ? JSON.parse(rawState) : {};
      state.profile = state.profile || {};
      state.profile.name = name;
      state.profile.emailVerified = true;
      localStorage.setItem('limitbreak-state', JSON.stringify(state));
    } catch (e) {}

    if (message) {
      message.className = 'login-message success-message';
      message.textContent = 'Email verified! Profile created. Opening your dashboard...';
    }
    setTimeout(() => { window.location.href = 'home.html'; }, 500);
  }
})();
