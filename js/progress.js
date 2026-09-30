import { getState, renderShell, setPageTitle, formatDate, escapeHtml } from './app.js';
import './progress-range.js';

const shell = renderShell('progress');
const state = getState();
const hasWeights = state.weights && state.weights.length > 1;
const weights = hasWeights ? state.weights : (state.weights?.length === 1 ? state.weights : [Number(state.profile.weight) || 70]);
const max = Math.max(...weights);
const min = Math.min(...weights);
const points = hasWeights
  ? state.weights.map((weight, index) => `${Math.round(index / (state.weights.length - 1) * 100)},${20 + (weight - min) / (max - min || 1) * 125}`).join(' ')
  : '0,80 100,80';

const bars = state.workouts && state.workouts.length > 0
  ? state.workouts.slice(0, 7).reverse().map(workout => Math.min(100, (workout.volume || 0) / 100)).map(height => `<span class="volume-bar" style="height:${height}%"></span>`).join('')
  : [0, 0, 0, 0, 0, 0, 0].map(() => `<span class="volume-bar" style="height:0%"></span>`).join('');

const weightChangeText = state.profile.startingWeight && state.profile.weight && state.profile.startingWeight !== state.profile.weight
  ? `${(state.profile.startingWeight - state.profile.weight).toFixed(1)} kg total`
  : (state.profile.weight ? 'Current weight set' : 'Start logging weight in Profile');

const prsHtml = state.prs && state.prs.length > 0
  ? `<div class="list">${state.prs.map(pr => `
      <div class="pr-row">
        <div class="pr-badge">↗</div>
        <div>
          <strong>${escapeHtml(pr.exercise)}</strong>
          <small>${formatDate(pr.date)}</small>
        </div>
        <strong class="accent">${pr.weight} kg</strong>
      </div>
    `).join('')}</div>`
  : `<div style="padding:28px 14px;text-align:center;color:var(--muted);font-size:.78rem">
      <p style="margin:0 0 8px">No personal records yet.</p>
      <small>Complete exercises in a workout to record your first PR!</small>
    </div>`;

const workoutHistoryHtml = state.workouts && state.workouts.length > 0
  ? `<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Session</th><th>Volume</th></tr></thead><tbody>
      ${state.workouts.map(workout => `
        <tr>
          <td>${formatDate(workout.date)}</td>
          <td><strong>${escapeHtml(workout.type)}</strong><br><span class="muted">${workout.duration} min · ${workout.exercises} exercises</span></td>
          <td class="accent">${(workout.volume || 0).toLocaleString()} kg</td>
        </tr>
      `).join('')}
    </tbody></table></div>`
  : `<div style="padding:28px 14px;text-align:center;color:var(--muted);font-size:.78rem">
      <p style="margin:0 0 10px">No workout history recorded yet.</p>
      <a class="btn btn-primary" href="workout.html" style="display:inline-block;padding:7px 15px;font-size:.74rem">Start your first workout <span>→</span></a>
    </div>`;

shell.innerHTML = `
  ${setPageTitle('Progress, measured', 'LimitBreak / Your momentum')}
  <div class="period-tabs">
    ${['7 days', '30 days', '3 months', '6 months', '1 year'].map((period, index) => `
      <button class="period-tab ${index === 1 ? 'active' : ''}">${period}</button>
    `).join('')}
  </div>
  <section class="grid grid-4">
    <div class="card metric-card">
      <span class="stat-label">CURRENT WEIGHT</span>
      <div class="stat-value">${state.profile.weight || '—'}<span class="small muted"> ${state.profile.weight ? 'kg' : ''}</span></div>
      <div class="stat-label accent">${weightChangeText}</div>
    </div>
    <div class="card metric-card">
      <span class="stat-label">WORKOUTS</span>
      <div class="stat-value">${state.workouts.length}</div>
      <div class="stat-label">${state.workouts.length ? `${state.workouts.length} completed` : 'No workouts yet'}</div>
    </div>
    <div class="card metric-card">
      <span class="stat-label">TOTAL VOLUME</span>
      <div class="stat-value orange">${Math.round(state.workouts.reduce((sum, w) => sum + (w.volume || 0), 0) / 1000)}k</div>
      <div class="stat-label">kg moved</div>
    </div>
    <div class="card metric-card">
      <span class="stat-label">BEST STREAK</span>
      <div class="stat-value cyan">${state.streak}<span class="small muted"> days</span></div>
      <div class="stat-label">Current: ${state.streak} days</div>
    </div>
  </section>
  <section class="grid grid-2" style="margin-top:18px">
    <div class="card progress-chart">
      <div class="card-title">
        <h2>Weight progress</h2>
        <span class="tag">${hasWeights ? 'kg tracked' : 'No entries'}</span>
      </div>
      ${hasWeights ? `
        <div class="chart">
          <svg viewBox="0 0 100 160" preserveAspectRatio="none">
            <defs>
              <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stop-color="#c8f169"/>
                <stop offset="1" stop-color="#c8f169" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <line class="chart-grid" x1="0" y1="20" x2="100" y2="20"/>
            <line class="chart-grid" x1="0" y1="80" x2="100" y2="80"/>
            <line class="chart-grid" x1="0" y1="145" x2="100" y2="145"/>
            <polygon class="chart-area" points="0,${points} 100,160 0,160"/>
            <polyline class="chart-line" points="${points}"/>
            ${state.weights.map((weight, index) => `<circle class="chart-dot" cx="${Math.round(index / (state.weights.length - 1) * 100)}" cy="${20 + (weight - min) / (max - min || 1) * 125}" r="2.3"/>`).join('')}
          </svg>
        </div>
        <div class="chart-labels"><span>Start</span><span>Today</span></div>
      ` : `
        <div style="padding:45px 14px;text-align:center;color:var(--muted);font-size:.78rem">
          <p style="margin:0 0 8px">Track your weight over time.</p>
          <a class="accent" href="profile.html" style="font-weight:700">Update current weight in Profile →</a>
        </div>
      `}
    </div>
    <div class="card">
      <div class="card-title">
        <h2>Weekly volume</h2>
        <span class="tag">kg</span>
      </div>
      <div class="volume-bars">${bars}</div>
      <div class="volume-labels"><span>W-6</span><span>W-4</span><span>W-2</span><span>Now</span></div>
    </div>
  </section>
  <section class="grid grid-2" style="margin-top:18px">
    <div class="card">
      <div class="card-title">
        <h2>Personal records</h2>
        <span class="small muted">${state.prs.length ? 'Updated recently' : 'None yet'}</span>
      </div>
      ${prsHtml}
    </div>
    <div class="card">
      <div class="card-title">
        <h2>Workout history</h2>
        <span class="tag">${state.workouts.length} recent</span>
      </div>
      ${workoutHistoryHtml}
    </div>
  </section>
`;
