import { AuthError, getUser, handleAuthCallback, login, requestPasswordRecovery, updateUser } from 'https://esm.sh/@netlify/identity@2.0.0';

const form = document.getElementById('loginForm');
const message = document.getElementById('loginMessage');
const emailInput = document.getElementById('email');
const password = document.getElementById('password');
const passwordToggle = document.getElementById('passwordToggle');
const submitButton = form.querySelector('[type="submit"]');

passwordToggle.addEventListener('click', () => {
  const visible = password.type === 'text';
  password.type = visible ? 'password' : 'text';
  passwordToggle.textContent = visible ? 'Show' : 'Hide';
  passwordToggle.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
});

document.getElementById('forgotPassword').addEventListener('click', async event => {
  event.preventDefault();
  const email = emailInput.value.trim();
  if (!email || !emailInput.checkValidity()) {
    showMessage('Enter your email address first.');
    emailInput.focus();
    return;
  }
  setBusy(true, 'Sending…');
  try {
    await requestPasswordRecovery(email);
    showMessage('Check your email for a password reset link.', true);
  } catch (error) {
    showAuthError(error, 'Could not send the password reset email.');
  } finally {
    setBusy(false);
  }
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  showMessage('');
  setBusy(true, 'Signing in…');
  try {
    const user = await login(emailInput.value.trim(), password.value);
    saveUser(user);
    showMessage('Signed in. Loading your dashboard…', true);
    window.location.replace('home.html');
  } catch (error) {
    showAuthError(error, 'Could not sign in. Please try again.');
  } finally {
    setBusy(false);
  }
});

async function initialize() {
  try {
    const result = await handleAuthCallback();
    if (result?.type === 'recovery') {
      preparePasswordReset();
      return;
    }
    if (result?.user) {
      saveUser(result.user);
      showMessage(result.type === 'confirmation' ? 'Email confirmed. Opening your dashboard…' : 'Signed in. Opening your dashboard…', true);
      window.location.replace('home.html');
      return;
    }
  } catch (error) {
    showAuthError(error, 'The sign-in link could not be processed.');
    return;
  }
  const user = await getUser();
  if (user) {
    saveUser(user);
    window.location.replace('home.html');
  }
}

function preparePasswordReset() {
  document.querySelector('.eyebrow').textContent = 'Password recovery';
  document.querySelector('.login-card h2').textContent = 'Choose a new password.';
  document.querySelector('.login-subtitle').textContent = 'Use at least 8 characters for your new password.';
  emailInput.closest('.field').hidden = true;
  document.querySelector('.password-label label').textContent = 'New password';
  document.getElementById('forgotPassword').hidden = true;
  password.autocomplete = 'new-password';
  password.minLength = 8;
  submitButton.innerHTML = 'Update password <span>→</span>';
  document.querySelector('.remember').hidden = true;
  document.querySelector('.signup-copy').hidden = true;
  form.addEventListener('submit', async event => {
    event.stopImmediatePropagation();
    event.preventDefault();
    setBusy(true, 'Updating…');
    try {
      const user = await updateUser({ password: password.value });
      saveUser(user);
      showMessage('Password updated. Opening your dashboard…', true);
      window.location.replace('home.html');
    } catch (error) {
      showAuthError(error, 'Could not update your password.');
    } finally {
      setBusy(false);
    }
  }, true);
}

function saveUser(user) {
  localStorage.setItem('limitbreak-user-id', user.id);
  localStorage.setItem('limitbreak-user-name', user.name || user.userMetadata?.full_name || user.email.split('@')[0]);
}

function showAuthError(error, fallback) {
  if (error instanceof AuthError) {
    if (error.status === 401) return showMessage('Invalid email or password.');
    if (error.status === 422) return showMessage('Check the information you entered and try again.');
    return showMessage(error.message || fallback);
  }
  showMessage(fallback);
}

function showMessage(text, success = false) {
  message.className = `login-message${success ? ' success-message' : ''}`;
  message.textContent = text;
}

function setBusy(busy, label = 'Sign in') {
  submitButton.disabled = busy;
  if (busy) submitButton.textContent = label;
  else if (!document.querySelector('.eyebrow').textContent.includes('recovery')) submitButton.innerHTML = 'Sign in <span>→</span>';
}

initialize();
