import { getState, saveState, renderShell, setPageTitle, initials, toast, escapeHtml } from './app.js';
import './profile-nutrition.js';
import './profile-friends.js';
import './profile-unique-name.js';

const shell = renderShell('profile');
let state = getState();
const profile = state.profile;

shell.innerHTML = `
  ${setPageTitle('Your profile', 'LimitBreak / Personal settings')}
  <section class="card profile-hero">
    <div class="profile-avatar">${initials(profile.name || 'Athlete')}</div>
    <div>
      <h2>${escapeHtml(profile.name || 'Athlete')}</h2>
      <p>${profile.goal} · ${profile.experience} · ${profile.trainingDays || 3} training days / week</p>
    </div>
  </section>
  <section class="grid grid-2">
    <form class="card" id="profileForm">
      <div class="card-title">
        <h2>Personal details</h2>
        <span class="tag">Editable</span>
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="name">Name</label>
          <input id="name" value="${escapeHtml(profile.name || '')}" placeholder="Your name">
        </div>
        <div class="field">
          <label for="age">Age</label>
          <input id="age" type="number" value="${profile.age || ''}" placeholder="e.g. 24">
        </div>
        <div class="field">
          <label for="height">Height / cm</label>
          <input id="height" type="number" value="${profile.height || ''}" placeholder="e.g. 175">
        </div>
        <div class="field">
          <label for="weight">Current weight / kg</label>
          <input id="weight" type="number" step="0.1" value="${profile.weight || ''}" placeholder="e.g. 70">
        </div>
        <div class="field">
          <label for="targetWeight">Target weight / kg</label>
          <input id="targetWeight" type="number" step="0.1" value="${profile.targetWeight || ''}" placeholder="e.g. 70">
        </div>
        <div class="field">
          <label for="experience">Experience level</label>
          <select id="experience">
            ${['Beginner', 'Intermediate', 'Advanced'].map(item => `<option ${item === profile.experience ? 'selected' : ''}>${item}</option>`).join('')}
          </select>
        </div>
        <div class="field full">
          <label>Fitness goal</label>
          <div class="goal-options">
            ${['Muscle Gain', 'Fat Loss', 'Strength', 'General Fitness', 'Endurance'].map(goal => `
              <label class="goal-option">
                <input type="radio" name="goal" value="${goal}" ${goal === profile.goal ? 'checked' : ''}>
                <span>${goal}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <div class="field">
          <label for="trainingDays">Training days / week</label>
          <input id="trainingDays" type="number" min="1" max="7" value="${profile.trainingDays || 3}">
        </div>
      </div>
      <button class="btn btn-primary" style="margin-top:20px">Save profile</button>
    </form>
    <div class="card">
      <div class="card-title">
        <h2>Daily targets</h2>
        <span class="tag">Nutrition</span>
      </div>
      <form id="nutritionForm" class="form-grid">
        <div class="field">
          <label for="calories">Calories / kcal</label>
          <input id="calories" type="number" value="${state.nutrition.targets?.calories || 2400}">
        </div>
        <div class="field">
          <label for="protein">Protein / g</label>
          <input id="protein" type="number" value="${state.nutrition.targets?.protein || 120}">
        </div>
        <div class="field">
          <label for="carbs">Carbohydrates / g</label>
          <input id="carbs" type="number" value="${state.nutrition.targets?.carbs || 250}">
        </div>
        <div class="field">
          <label for="fat">Fat / g</label>
          <input id="fat" type="number" value="${state.nutrition.targets?.fat || 70}">
        </div>
        <div class="field">
          <label for="water">Water / L</label>
          <input id="water" type="number" step="0.1" value="${state.nutrition.targets?.water || 2.5}">
        </div>
        <button class="btn btn-secondary" style="margin-top:8px">Save targets</button>
      </form>
      <div class="settings-list" style="margin-top:20px">
        <div class="setting">
          <span>Weekly reminders</span>
          <button class="toggle on" aria-label="Toggle weekly reminders"></button>
        </div>
        <div class="setting">
          <span>Personal record alerts</span>
          <button class="toggle on" aria-label="Toggle personal record alerts"></button>
        </div>
        <div class="setting">
          <span>Unit system</span>
          <strong class="accent">Metric</strong>
        </div>
      </div>
    </div>
  </section>
`;

document.getElementById('profileForm').addEventListener('submit', event => {
  event.preventDefault();
  const curWeight = Number(document.getElementById('weight').value) || '';
  const next = {
    name: document.getElementById('name').value.trim() || profile.name,
    age: Number(document.getElementById('age').value) || '',
    height: Number(document.getElementById('height').value) || '',
    weight: curWeight,
    startingWeight: profile.startingWeight || curWeight,
    targetWeight: Number(document.getElementById('targetWeight').value) || '',
    goal: document.querySelector('input[name="goal"]:checked')?.value || profile.goal,
    experience: document.getElementById('experience').value,
    trainingDays: Number(document.getElementById('trainingDays').value) || 3
  };
  const weights = state.weights && state.weights.length ? [...state.weights] : [];
  if (curWeight && (!weights.length || weights[weights.length - 1] !== curWeight)) {
    weights.push(curWeight);
  }
  saveState({ profile: next, weights });
  toast('Profile updated');
});

document.getElementById('nutritionForm').addEventListener('submit', event => {
  event.preventDefault();
  const targets = {
    calories: Number(document.getElementById('calories').value) || 2400,
    protein: Number(document.getElementById('protein').value) || 120,
    carbs: Number(document.getElementById('carbs').value) || 250,
    fat: Number(document.getElementById('fat').value) || 70,
    water: Number(document.getElementById('water').value) || 2.5
  };
  saveState({ nutrition: { ...state.nutrition, targets } });
  toast('Daily targets saved');
});

document.querySelectorAll('.toggle').forEach(toggle => toggle.addEventListener('click', () => toggle.classList.toggle('on')));
