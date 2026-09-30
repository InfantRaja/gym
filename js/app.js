import { exercises, splits } from '../data/exercises.js';

const STORAGE_KEY = 'limitbreak-state';
const today = new Date().toISOString().slice(0, 10);
const demoDefaults = {
  profile: { name: 'Alex Morgan', age: 28, height: 178, weight: 82, startingWeight: 88, targetWeight: 78, goal: 'Strength', experience: 'Intermediate', trainingDays: 4 },
  nutrition: { calories: 2200, protein: 72, carbs: 210, fat: 68, water: 2.5, targets: { calories: 2800, protein: 120, carbs: 300, fat: 80, water: 3 } },
  steps: 6842,
  streak: 12,
  workouts: [
    { id: 'seed-1', date: today, type: 'Push Day', duration: 52, exercises: 5, volume: 6840, calories: 410 },
    { id: 'seed-2', date: '2026-09-26', type: 'Leg Day', duration: 68, exercises: 5, volume: 9240, calories: 560 },
    { id: 'seed-3', date: '2026-09-24', type: 'Pull Day', duration: 47, exercises: 5, volume: 5920, calories: 380 }
  ],
  prs: [{ exercise: 'Bench Press', weight: 80, date: '2026-09-21' }, { exercise: 'Squat', weight: 100, date: '2026-09-18' }, { exercise: 'Deadlift', weight: 120, date: '2026-09-12' }],
  weights: [88, 86.8, 85.5, 84.2, 83.1, 82],
  activeWorkout: null
};

const freshDefaults = {
  profile: { name: '', age: '', height: '', weight: '', startingWeight: '', targetWeight: '', goal: 'Strength', experience: 'Beginner', trainingDays: 3 },
  nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, targets: { calories: 2400, protein: 120, carbs: 250, fat: 70, water: 2.5 } },
  steps: 0,
  streak: 0,
  workouts: [],
  prs: [],
  weights: [],
  activeWorkout: null
};

export function isDemoUser() {
  const userId = localStorage.getItem('limitbreak-user-id');
  const auth = JSON.parse(localStorage.getItem('limitbreak-auth') || '{}');
  return userId === 'demo' || auth.email === 'demo@limitbreak.app';
}

export function getState() {
  const isDemo = isDemoUser();
  const currentDefaults = isDemo ? demoDefaults : freshDefaults;
  const currentName = localStorage.getItem('limitbreak-user-name') || (isDemo ? 'Alex Morgan' : 'Athlete');

  try {
    const raw = localStorage.getItem(getStorageKey());
    const stored = JSON.parse(raw || '{}');

    // Clean up seed data if a new user previously inherited Alex Morgan's seed values
    if (!isDemo && stored.workouts?.some(w => String(w.id).startsWith('seed-'))) {
      stored.workouts = [];
      stored.prs = [];
      stored.weights = [];
      stored.streak = 0;
      stored.steps = 0;
      if (stored.nutrition) {
        stored.nutrition.calories = 0;
        stored.nutrition.protein = 0;
        stored.nutrition.carbs = 0;
        stored.nutrition.fat = 0;
        stored.nutrition.water = 0;
      }
      if (stored.profile?.name === 'Alex Morgan' || !stored.profile?.name) {
        stored.profile = { ...freshDefaults.profile, name: currentName };
      }
      localStorage.setItem(getStorageKey(), JSON.stringify(stored));
    }

    const baseProfile = { ...currentDefaults.profile, name: currentName };
    const profile = { ...baseProfile, ...stored.profile };
    if (!profile.name || (profile.name === 'Alex Morgan' && !isDemo)) {
      profile.name = currentName;
    }

    return { ...currentDefaults, ...stored, profile };
  } catch {
    const fresh = structuredClone(currentDefaults);
    fresh.profile.name = currentName;
    return fresh;
  }
}
function getStorageKey() { return localStorage.getItem('limitbreak-user-id') ? `${STORAGE_KEY}:${localStorage.getItem('limitbreak-user-id')}` : STORAGE_KEY; }
export function saveState(patch) {
  const next = { ...getState(), ...patch };
  localStorage.setItem(getStorageKey(), JSON.stringify(next));
  if (localStorage.getItem('limitbreak-user-id')) {
    fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) }).catch(() => {});
  }
  return next;
}
export function resetState() { localStorage.removeItem(getStorageKey()); return getState(); }
export function syncMongoState() {
  if (!location.protocol.startsWith('http') || !localStorage.getItem('limitbreak-user-id')) return;
  const storageKey = getStorageKey();
  const localSnapshot = localStorage.getItem(storageKey);
  fetch('/api/state').then(response => response.ok ? response.json() : null).then(result => {
    if (!result) return;
    const currentSnapshot = localStorage.getItem(storageKey);
    if (currentSnapshot !== localSnapshot) {
      fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(getState()) }).catch(() => {});
    } else if (result.state) {
      const remoteSnapshot = JSON.stringify(result.state);
      if (remoteSnapshot !== localSnapshot) {
        localStorage.setItem(storageKey, remoteSnapshot);
        location.reload();
      }
    } else {
      fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(getState()) }).catch(() => {});
    }
  }).catch(() => {});
}
export function formatDate(date) { return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
export function byId(id) { return document.getElementById(id); }
export function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;' }[char])); }
export function initials(name) { return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(); }
export function getExercise(name) { return exercises.find(exercise => exercise.name === name); }
export { exercises, splits };

export function renderShell(activePage) {
  if (!localStorage.getItem('limitbreak-auth') && !localStorage.getItem('limitbreak-user-id')) {
    location.replace('login.html');
    return document.createElement('main');
  }
  syncMongoState();
  const nav = [{ id: 'feed', label: 'Home', icon: '⌂', href: 'home.html' }, { id: 'dashboard', label: 'Dashboard', icon: '◈', href: 'index.html' }, { id: 'workout', label: 'Workout', icon: '◒', href: 'workout.html' }, { id: 'exercises', label: 'Exercises', icon: '✦', href: 'exercises.html' }, { id: 'progress', label: 'Progress', icon: '↗', href: 'progress.html' }, { id: 'profile', label: 'Profile', icon: '◎', href: 'profile.html' }];
  const state = getState();
  const warmMode = localStorage.getItem('limitbreak-theme') === 'warm';
  document.body.classList.toggle('warm-mode', warmMode);
  document.body.insertAdjacentHTML('afterbegin', `<aside class="sidebar"><a class="brand" href="home.html"><span class="brand-mark">L</span><span>Limit<span>Break</span></span></a><nav>${nav.map(item => `<a class="nav-link ${item.id === activePage ? 'active' : ''}" href="${item.href}"><span class="nav-icon">${item.icon}</span>${item.label}</a>`).join('')}</nav><div class="sidebar-foot"><div class="mini-profile"><div class="avatar">${initials(state.profile.name)}</div><div><strong>${escapeHtml(state.profile.name)}</strong><small>${state.profile.goal}</small></div></div><button class="icon-button" id="themeToggle" title="Switch to ${warmMode ? 'dark' : 'light'} theme" aria-label="Switch to ${warmMode ? 'dark' : 'light'} theme" aria-pressed="${warmMode}">☼</button><button class="icon-button logout-button" id="logoutButton" title="Sign out" aria-label="Sign out">↪</button></div></aside><div class="mobile-header"><a class="brand" href="home.html"><span class="brand-mark">L</span><span>Limit<span>Break</span></span></a><div class="mobile-actions"><a class="avatar" href="profile.html">${initials(state.profile.name)}</a><button class="icon-button logout-button" id="mobileLogoutButton" title="Sign out" aria-label="Sign out">↪</button></div></div><main class="page-shell"></main><nav class="mobile-nav">${nav.map(item => `<a class="nav-link ${item.id === activePage ? 'active' : ''}" href="${item.href}"><span class="nav-icon">${item.icon}</span><small>${item.label}</small></a>`).join('')}</nav>`);
  document.querySelectorAll('.sidebar .brand,.mobile-header .brand').forEach(brand => { brand.href = 'home.html'; });
  document.getElementById('themeToggle')?.addEventListener('click', event => {
    const isWarmMode = document.body.classList.toggle('warm-mode');
    localStorage.setItem('limitbreak-theme', isWarmMode ? 'warm' : 'dark');
    event.currentTarget.setAttribute('aria-pressed', String(isWarmMode));
    event.currentTarget.setAttribute('aria-label', `Switch to ${isWarmMode ? 'dark' : 'light'} theme`);
    event.currentTarget.title = `Switch to ${isWarmMode ? 'dark' : 'light'} theme`;
  });
  document.querySelectorAll('#logoutButton,#mobileLogoutButton').forEach(button => button.addEventListener('click', async () => {
    button.disabled = true;
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    localStorage.removeItem('limitbreak-auth');
    localStorage.removeItem('limitbreak-user-id');
    localStorage.removeItem('limitbreak-user-name');
    location.replace('login.html');
  }));
  return document.querySelector('.page-shell');
}
export function setPageTitle(title, eyebrow = 'LimitBreak / 2026') { return `<header class="page-header"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1></div><div class="header-date">${formatDate(today)}</div></header>`; }
export function toast(message, type = 'success') { const node = document.createElement('div'); node.className = `toast ${type}`; node.textContent = message; document.body.appendChild(node); setTimeout(() => node.remove(), 2800); }
export function progressBar(value, target, color = 'lime') { const percent = Math.min(100, Math.round((value / target) * 100)); return `<div class="progress-track"><span class="progress-fill ${color}" style="width:${percent}%"></span></div>`; }
