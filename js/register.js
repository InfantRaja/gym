import { AuthError, getUser, signup } from 'https://esm.sh/@netlify/identity@2.0.0';

const form = document.getElementById('registerForm');
const message = document.getElementById('registerMessage');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');
const passwordToggle = document.getElementById('passwordToggle');
const submitButton = form.querySelector('[type="submit"]');

passwordToggle.addEventListener('click', () => {
  const visible = password.type === 'text';
  password.type = visible ? 'password' : 'text';
  confirmPassword.type = visible ? 'password' : 'text';
  passwordToggle.textContent = visible ? 'Show' : 'Hide';
  passwordToggle.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  showMessage('');
  if (password.value !== confirmPassword.value) {
    showMessage('The passwords do not match.');
    confirmPassword.focus();
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = 'Creating account…';
  try {
    const name = document.getElementById('name').value.trim();
    const user = await signup(document.getElementById('email').value.trim(), password.value, { full_name: name });
    if (user.emailVerified) {
      saveUser(user, name);
      showMessage('Account created. Opening your dashboard…', true);
      window.location.replace('home.html');
    } else {
      form.reset();
      showMessage('Account created. Check your email to confirm it, then sign in.', true);
    }
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.status === 403) showMessage('New account registration is currently closed.');
      else if (error.status === 422) showMessage('Use a valid email and a stronger password.');
      else showMessage(error.message || 'Could not create the account.');
    } else showMessage('Could not create the account. Please try again.');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Create account <span>→</span>';
  }
});

function saveUser(user, fallbackName) {
  localStorage.setItem('limitbreak-user-id', user.id);
  localStorage.setItem('limitbreak-user-name', user.name || user.userMetadata?.full_name || fallbackName);
}
function showMessage(text, success = false) {
  message.className = `login-message${success ? ' success-message' : ''}`;
  message.textContent = text;
}
getUser().then(user => { if (user) window.location.replace('home.html'); });
