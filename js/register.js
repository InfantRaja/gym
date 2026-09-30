import { openGoogleAuthModal, openEmailOtpModal } from './google-auth.js';

const form = document.getElementById('registerForm');
const message = document.getElementById('registerMessage');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');
const passwordToggle = document.getElementById('passwordToggle');
const googleSignInBtn = document.getElementById('googleSignInBtn');

passwordToggle.addEventListener('click', () => {
  const visible = password.type === 'text';
  password.type = visible ? 'password' : 'text';
  confirmPassword.type = visible ? 'password' : 'text';
  passwordToggle.textContent = visible ? 'Show' : 'Hide';
  passwordToggle.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
});

// Google Sign-In & Instant Verification on Registration page
if (googleSignInBtn) {
  googleSignInBtn.addEventListener('click', () => {
    openGoogleAuthModal({
      onAuthenticated: (user) => {
        message.className = 'login-message success-message';
        message.textContent = `Welcome ${user.name || 'Athlete'}! Google account verified. Loading dashboard...`;
        setTimeout(() => {
          window.location.href = 'home.html';
        }, 400);
      }
    });
  });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  message.className = 'login-message';
  message.textContent = '';
  
  if (password.value !== confirmPassword.value) {
    message.textContent = 'The passwords do not match.';
    confirmPassword.focus();
    return;
  }

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const passwordVal = password.value;

  // Open 6-Digit Email Verification Code Modal
  openEmailOtpModal({
    email,
    name,
    onVerified: async () => {
      await finalizeRegistration(name, email, passwordVal);
    },
    onCancel: () => {
      message.textContent = 'Verification was cancelled. Please verify your email to create an account.';
    }
  });
});

async function finalizeRegistration(name, email, passwordVal) {
  message.className = 'login-message';
  message.textContent = 'Verifying and creating your account...';

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
      message.textContent = result.error || 'Could not create the account.';
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
    message.className = 'login-message success-message';
    message.textContent = 'Email verified! Account created. Opening your dashboard...';
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

  message.className = 'login-message success-message';
  message.textContent = 'Email verified! Profile created. Opening your dashboard...';
  setTimeout(() => { window.location.href = 'home.html'; }, 500);
}
