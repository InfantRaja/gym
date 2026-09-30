import { getState, saveState, renderShell, setPageTitle, progressBar, formatDate, escapeHtml, toast } from './app.js';

const SPLIT_CONFIGS = {
  'Push / Pull / Legs': {
    target: 6,
    routine: ['Push Day', 'Pull Day', 'Leg Day'],
    desc: '6 days / week · Push (Chest/Shoulders/Tri), Pull (Back/Bi), Legs'
  },
  'Upper / Lower': {
    target: 4,
    routine: ['Upper Body', 'Lower Body'],
    desc: '4 days / week · Upper strength & Lower power'
  },
  'Full Body': {
    target: 3,
    routine: ['Full Body A', 'Full Body B'],
    desc: '3 days / week · High efficiency compound movements'
  },
  'Arnold Split': {
    target: 6,
    routine: ['Chest & Back', 'Shoulders & Arms', 'Legs'],
    desc: '6 days / week · Classic bodybuilding antagonist split'
  }
};

function renderDashboard() {
  const shell = renderShell('dashboard');
  const state = getState();
  const latest = state.workouts && state.workouts.length > 0 ? state.workouts[0] : null;
  const firstName = escapeHtml(state.profile.name ? state.profile.name.split(' ')[0] : 'Athlete');

  // Weekly activity calculation
  const thisWeekWorkouts = (state.workouts || []).filter(w => {
    const d = new Date(`${w.date}T12:00:00`);
    const now = new Date();
    const diffDays = (now - d) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  });
  const completedThisWeek = thisWeekWorkouts.length;
  const totalCalories = (state.workouts || []).reduce((sum, workout) => sum + (workout.calories || 0), 0);

  // Day bars for weekly activity (M T W T F S S)
  const todayDayIndex = (new Date().getDay() + 6) % 7;
  const dayHeights = [0, 0, 0, 0, 0, 0, 0];
  if (state.workouts && state.workouts.length > 0) {
    state.workouts.slice(0, 7).forEach(w => {
      const d = new Date(`${w.date}T12:00:00`);
      const dayIdx = (d.getDay() + 6) % 7;
      dayHeights[dayIdx] = Math.min(100, Math.max(30, Math.round((w.volume || 3000) / 100)));
    });
  }

  // Hero copy
  const heroTag = latest ? `Today's focus / ${escapeHtml(latest.type)}` : `Today's focus / Start Training`;
  const heroHeadline = latest ? `Show up. <span class="accent">Break through.</span>` : `Make your next <span class="accent">rep count.</span>`;
  const heroText = latest
    ? `Your next rep is a small vote for the person you are becoming. Keep the streak alive.`
    : `Welcome to LimitBreak! You haven't recorded any workouts yet. Hit start workout below to record your first training session.`;

  // Split details
  const hasSplit = Boolean(state.selectedSplit && SPLIT_CONFIGS[state.selectedSplit]);
  const splitCfg = hasSplit ? SPLIT_CONFIGS[state.selectedSplit] : null;
  const weeklyTarget = splitCfg ? splitCfg.target : (Number(state.profile?.trainingDays) || 4);
  const splitPercent = hasSplit && weeklyTarget > 0 ? Math.min(100, Math.round((completedThisWeek / weeklyTarget) * 100)) : 0;

  let nextSession = 'First session';
  if (hasSplit && splitCfg.routine.length) {
    if (latest && latest.type) {
      const idx = splitCfg.routine.findIndex(r => latest.type.toLowerCase().includes(r.toLowerCase()));
      nextSession = splitCfg.routine[(idx + 1) % splitCfg.routine.length] || splitCfg.routine[0];
    } else {
      nextSession = splitCfg.routine[0];
    }
  }

  const splitCardHtml = hasSplit
    ? `
      <div class="card">
        <div class="card-title">
          <h2>Current split</h2>
          <button class="small accent" id="changeSplitBtn" type="button" style="background:none;border:none;cursor:pointer;font-weight:700">Change split →</button>
        </div>
        <div class="split-card">
          <div class="split-ring" style="background: conic-gradient(var(--lime) 0 ${splitPercent}%, var(--surface-3) ${splitPercent}% 100%);">
            <span class="split-percent">${splitPercent}%</span>
          </div>
          <div class="split-info">
            <h3>${escapeHtml(state.selectedSplit)}</h3>
            <p>Next session: <strong class="accent">${escapeHtml(nextSession)}</strong></p>
            <p style="margin-top:6px">${completedThisWeek} sessions completed this week</p>
          </div>
        </div>
        <div class="data-row" style="margin-top:14px">
          <span class="muted">Weekly target</span>
          <strong>${completedThisWeek} of ${weeklyTarget} workouts</strong>
        </div>
        ${progressBar(completedThisWeek, weeklyTarget)}
      </div>
    `
    : `
      <div class="card">
        <div class="card-title">
          <h2>Current split</h2>
          <span class="tag">Not set</span>
        </div>
        <div class="split-card">
          <div class="split-ring" style="background: conic-gradient(var(--line) 0% 100%);">
            <span class="split-percent" style="color:var(--muted)">0%</span>
          </div>
          <div class="split-info">
            <h3>No Split Selected</h3>
            <p>Select a workout routine to track weekly progress.</p>
            <button class="btn btn-primary split-select-btn" id="chooseSplitBtn" type="button">+ Select Training Split</button>
          </div>
        </div>
        <div class="data-row" style="margin-top:14px">
          <span class="muted">Weekly target</span>
          <strong>0 of ${weeklyTarget} workouts</strong>
        </div>
        ${progressBar(0, weeklyTarget)}
      </div>
    `;

  // Recent workouts section
  const recentWorkoutsHtml = (state.workouts && state.workouts.length > 0)
    ? `<div class="list">${state.workouts.slice(0, 3).map(workout => `
        <div class="history-item">
          <div class="history-date">
            <strong>${new Date(`${workout.date}T12:00:00`).getDate()}</strong>
            ${new Date(`${workout.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short' })}
          </div>
          <div>
            <strong>${escapeHtml(workout.type)}</strong>
            <div class="small muted">${workout.exercises} exercises · ${workout.duration} min</div>
          </div>
          <strong class="accent">${(workout.volume || 0).toLocaleString()} kg</strong>
        </div>
      `).join('')}</div>`
    : `<div style="padding:28px 14px;text-align:center;color:var(--muted);font-size:.78rem">
        <p style="margin:0 0 12px">No workouts recorded yet.</p>
        <a class="btn btn-primary" href="workout.html" style="display:inline-block;padding:8px 16px;font-size:.74rem">Start first workout <span>→</span></a>
      </div>`;

  shell.innerHTML = `
    ${setPageTitle(`Good morning, ${firstName}.`, 'LimitBreak / Overview')}
    <section class="card hero-card">
      <div class="hero-copy">
        <span class="tag">${heroTag}</span>
        <h2>${heroHeadline}</h2>
        <p>${heroText}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="workout.html">Start workout <span>→</span></a>
          <a class="btn btn-secondary" href="progress.html">View progress</a>
        </div>
      </div>
    </section>
    <section class="grid grid-4 dashboard-grid">
      <div class="card metric-card">
        <div class="metric-top"><span class="stat-label">WORKOUT STREAK</span><span class="metric-icon">◒</span></div>
        <div class="stat-value">${state.streak}<span class="small muted"> days</span></div>
        <div class="stat-label">${state.streak > 0 ? `Personal best: ${state.streak} days` : 'Start your streak today!'}</div>
      </div>
      <div class="card metric-card">
        <div class="metric-top"><span class="stat-label">CALORIES BURNED</span><span class="metric-icon orange">◌</span></div>
        <div class="stat-value orange">${totalCalories.toLocaleString()}</div>
        <div class="stat-label">${state.workouts.length ? `Across ${state.workouts.length} workouts` : 'No workouts yet'}</div>
      </div>
      <div class="card metric-card">
        <div class="metric-top"><span class="stat-label">STEPS TODAY</span><span class="metric-icon cyan">⌁</span></div>
        <div class="stat-value cyan">${(state.steps || 0).toLocaleString()}</div>
        <div class="stat-label">${Math.round((state.steps || 0) / 10000 * 100)}% of daily goal</div>
      </div>
      <div class="card metric-card">
        <div class="metric-top"><span class="stat-label">CURRENT WEIGHT</span><span class="metric-icon">↓</span></div>
        <div class="stat-value">${state.profile.weight || '—'}<span class="small muted"> ${state.profile.weight ? 'kg' : ''}</span></div>
        <div class="stat-label">${state.profile.targetWeight ? `Target ${state.profile.targetWeight} kg` : 'Set target in profile'}</div>
      </div>
    </section>
    <section class="grid grid-2 dashboard-grid">
      <div class="card activity-card">
        <div class="card-title">
          <h2>Weekly activity</h2>
          <span class="tag">${completedThisWeek} / 6 sessions</span>
        </div>
        <div class="week-bars">
          ${dayHeights.map((height, index) => `
            <div class="week-day ${index === todayDayIndex ? 'today' : ''}">
              <div class="bar" style="--height:${height}%"></div>
              <span>${['M','T','W','T','F','S','S'][index]}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ${splitCardHtml}
    </section>
    <section class="grid grid-2 dashboard-grid">
      <div class="card">
        <div class="card-title">
          <h2>Nutrition today</h2>
          <a class="small accent" href="profile.html">Update →</a>
        </div>
        <div class="nutrition-row">
          <div class="nutrition-head">
            <span>Calories</span>
            <strong>${state.nutrition.calories || 0} / ${state.nutrition.targets?.calories || 2400} kcal</strong>
          </div>
          ${progressBar(state.nutrition.calories || 0, state.nutrition.targets?.calories || 2400, 'orange')}
        </div>
        <div class="nutrition-row">
          <div class="nutrition-head">
            <span>Protein</span>
            <strong>${state.nutrition.protein || 0}g / ${state.nutrition.targets?.protein || 120}g</strong>
          </div>
          ${progressBar(state.nutrition.protein || 0, state.nutrition.targets?.protein || 120)}
        </div>
        <div class="nutrition-row">
          <div class="nutrition-head">
            <span>Water</span>
            <strong>${state.nutrition.water || 0}L / ${state.nutrition.targets?.water || 2.5}L</strong>
          </div>
          ${progressBar(state.nutrition.water || 0, state.nutrition.targets?.water || 2.5, 'cyan')}
        </div>
      </div>
      <div class="card">
        <div class="card-title">
          <h2>Recent workouts</h2>
          <a class="small accent" href="${state.workouts.length ? 'progress.html' : 'workout.html'}">${state.workouts.length ? 'View all →' : 'Start →'}</a>
        </div>
        ${recentWorkoutsHtml}
      </div>
    </section>
  `;

  // Attach split modal listeners
  const openModalBtn = document.getElementById('chooseSplitBtn') || document.getElementById('changeSplitBtn');
  if (openModalBtn) {
    openModalBtn.addEventListener('click', showSplitSelectorModal);
  }
}

function showSplitSelectorModal() {
  const existing = document.getElementById('splitModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'splitModal';
  modal.className = 'split-options-modal';
  modal.innerHTML = `
    <div class="split-options-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3>Choose Your Training Split</h3>
        <button type="button" id="closeSplitModal" style="background:none;border:none;color:var(--text);font-size:1.4rem;cursor:pointer">×</button>
      </div>
      <p>Pick a split that fits your schedule. Your dashboard will track your weekly progress and next workout.</p>
      <div class="split-opt-grid">
        ${Object.keys(SPLIT_CONFIGS).map(splitKey => `
          <button type="button" class="split-opt-btn" data-split="${escapeHtml(splitKey)}">
            <strong>${escapeHtml(splitKey)}</strong>
            <span>${escapeHtml(SPLIT_CONFIGS[splitKey].desc)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#closeSplitModal').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });

  modal.querySelectorAll('[data-split]').forEach(btn => {
    btn.addEventListener('click', () => {
      const chosenSplit = btn.dataset.split;
      const state = getState();
      saveState({
        selectedSplit: chosenSplit,
        userChoseSplit: true,
        profile: { ...state.profile, split: chosenSplit, trainingDays: SPLIT_CONFIGS[chosenSplit].target }
      });
      modal.remove();
      toast(`Split set to ${chosenSplit}!`);
      renderDashboard();
    });
  });
}

renderDashboard();
