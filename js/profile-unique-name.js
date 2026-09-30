document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profileForm');
  const nameInput = document.getElementById('name');
  if (!form || !nameInput) return;

  const feedback = document.createElement('p');
  feedback.className = 'name-feedback';
  feedback.setAttribute('role', 'status');
  nameInput.after(feedback);

  let approved = false;
  form.addEventListener('submit', async event => {
    if (approved) {
      approved = false;
      return;
    }
    if (!localStorage.getItem('limitbreak-user-id')) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    feedback.classList.remove('error');
    feedback.textContent = 'Checking name availability...';
    const submitButton = form.querySelector('button[type="submit"],button:not([type])');
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch('/api/profile/name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.value.trim() })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not verify name availability.');
      feedback.textContent = '';
      approved = true;
      form.requestSubmit(submitButton || undefined);
    } catch (error) {
      feedback.classList.add('error');
      feedback.textContent = error.message;
      if (submitButton) submitButton.disabled = false;
    }
  }, true);
});
