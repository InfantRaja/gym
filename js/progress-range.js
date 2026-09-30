import { getState, formatDate, escapeHtml } from './app.js';

const periods = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
  { label: '1 year', days: 365 }
];

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getWeightHistory(state) {
  if (Array.isArray(state.weightHistory) && state.weightHistory.length) {
    return state.weightHistory.filter(entry => Number.isFinite(Number(entry.weight)) && entry.date).sort((a, b) => a.date.localeCompare(b.date));
  }
  const today = new Date();
  return (state.weights || []).map((weight, index, weights) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (weights.length - index - 1) * 7);
    return { date: dateKey(date), weight: Number(weight) };
  });
}

function updateWeightChart(records, startDate, endDate, profile) {
  const filtered = records.filter(entry => entry.date >= startDate && entry.date <= endDate);
  const svg = document.querySelector('.progress-chart .chart svg');
  const labels = document.querySelectorAll('.progress-chart .chart-labels span');
  const trend = document.querySelector('.progress-chart .card-title .tag');
  if (!svg || labels.length < 2 || !trend) return;

  svg.querySelectorAll('.chart-area,.chart-line,.chart-dot').forEach(node => node.remove());
  if (!filtered.length) {
    labels[0].textContent = 'No weigh-ins';
    labels[1].textContent = `${formatDate(startDate)} – ${formatDate(endDate)}`;
    trend.textContent = `${profile.weight} kg current`;
    return;
  }

  const values = filtered.map(entry => Number(entry.weight));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = filtered.map((entry, index) => {
    const x = filtered.length === 1 ? 100 : index / (filtered.length - 1) * 100;
    const y = 20 + (max - Number(entry.weight)) / span * 125;
    return { x, y, weight: Number(entry.weight) };
  });
  const ns = 'http://www.w3.org/2000/svg';
  if (points.length > 1) {
    const area = document.createElementNS(ns, 'polygon');
    area.setAttribute('class', 'chart-area');
    area.setAttribute('points', `${points.map(point => `${point.x},${point.y}`).join(' ')} 100,160 0,160`);
    svg.appendChild(area);
  }
  const line = document.createElementNS(ns, 'polyline');
  line.setAttribute('class', 'chart-line');
  line.setAttribute('points', points.map(point => `${point.x},${point.y}`).join(' '));
  svg.appendChild(line);
  points.forEach(point => {
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('class', 'chart-dot');
    dot.setAttribute('cx', point.x);
    dot.setAttribute('cy', point.y);
    dot.setAttribute('r', '2.3');
    svg.appendChild(dot);
  });

  labels[0].textContent = formatDate(filtered[0].date);
  labels[1].textContent = formatDate(filtered[filtered.length - 1].date);
  const change = values[values.length - 1] - values[0];
  trend.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)} kg in range`;
}

function updateVolumeChart(workouts, startDate, days) {
  const bucketCount = days <= 7 ? 7 : days <= 30 ? 5 : days <= 90 ? 12 : days <= 180 ? 6 : 12;
  const bucketValues = Array(bucketCount).fill(0);
  const start = new Date(`${startDate}T00:00:00`);
  const dayWidth = days / bucketCount;

  workouts.forEach(workout => {
    const offset = Math.floor((new Date(`${workout.date}T00:00:00`) - start) / 86400000);
    const index = Math.max(0, Math.min(bucketCount - 1, Math.floor(offset / dayWidth)));
    bucketValues[index] += Number(workout.volume) || 0;
  });

  const bars = document.querySelector('.volume-bars');
  const labels = document.querySelector('.volume-labels');
  if (!bars || !labels) return;
  const max = Math.max(...bucketValues, 1);
  bars.innerHTML = bucketValues.map((value, index) => {
    const height = value ? Math.max(8, value / max * 100) : 0;
    const emptyStyle = value === 0 ? ';min-height:0;opacity:0' : '';
    return `<span class="volume-bar" title="Period ${index + 1}: ${value.toLocaleString()} kg" style="height:${height}%${emptyStyle}"></span>`;
  }).join('');

  const end = new Date(`${startDate}T00:00:00`);
  end.setDate(end.getDate() + days - 1);
  const labelIndexes = [...new Set([0, Math.floor((bucketCount - 1) / 3), Math.floor((bucketCount - 1) * 2 / 3), bucketCount - 1])];
  labels.innerHTML = labelIndexes.map(index => {
    const date = new Date(start);
    date.setDate(date.getDate() + Math.round(index * dayWidth));
    const labelDate = new Date(`${dateKey(date)}T12:00:00`);
    return `<span>${labelDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>`;
  }).join('');
  const volumeTitle = bars.closest('.card').querySelector('.card-title h2');
  if (volumeTitle) volumeTitle.textContent = days <= 7 ? 'Daily volume' : 'Training volume';
  const volumeTag = bars.closest('.card').querySelector('.card-title .tag');
  if (volumeTag) volumeTag.textContent = 'kg';
}

function updateHistory(workouts) {
  const body = document.querySelector('.table tbody');
  const countTag = body?.closest('.card')?.querySelector('.card-title .tag');
  if (!body) return;
  body.innerHTML = workouts.map(workout => `<tr><td>${formatDate(workout.date)}</td><td><strong>${escapeHtml(workout.type)}</strong><br><span class="muted">${workout.duration} min · ${workout.exercises} exercises</span></td><td class="accent">${Number(workout.volume).toLocaleString()} kg</td></tr>`).join('') || '<tr><td colspan="3" class="muted">No workouts recorded in this range.</td></tr>';
  if (countTag) countTag.textContent = `${workouts.length} in range`;
}

function updateMetrics(workouts, days) {
  const cards = document.querySelectorAll('.grid-4 .metric-card');
  if (cards.length < 3) return;
  const workoutValue = cards[1].querySelector('.stat-value');
  const workoutCaption = cards[1].querySelectorAll('.stat-label')[1];
  const volumeValue = cards[2].querySelector('.stat-value');
  const volumeCaption = cards[2].querySelectorAll('.stat-label')[1];
  const totalVolume = workouts.reduce((sum, workout) => sum + (Number(workout.volume) || 0), 0);
  if (workoutValue) workoutValue.textContent = String(workouts.length);
  if (workoutCaption) workoutCaption.textContent = `in the last ${days} days`;
  if (volumeValue) volumeValue.innerHTML = `${Math.round(totalVolume / 1000)}k`;
  if (volumeCaption) volumeCaption.textContent = `kg in the last ${days} days`;
}

function renderRange(days) {
  const state = getState();
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  const startDate = dateKey(start);
  const endDate = dateKey(end);
  const workouts = state.workouts.filter(workout => workout.date >= startDate && workout.date <= endDate).sort((a, b) => a.date.localeCompare(b.date));

  updateWeightChart(getWeightHistory(state), startDate, endDate, state.profile);
  updateVolumeChart(workouts, startDate, days);
  updateHistory(workouts.slice().reverse());
  updateMetrics(workouts, days);
}

document.addEventListener('DOMContentLoaded', () => {
  const buttons = [...document.querySelectorAll('.period-tab')];
  buttons.forEach((button, index) => {
    const period = periods.find(item => item.label === button.textContent.trim()) || periods[index];
    if (!period) return;
    button.dataset.days = String(period.days);
    button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    button.addEventListener('click', () => {
      buttons.forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      renderRange(period.days);
    });
  });
  const selected = buttons.find(button => button.classList.contains('active'));
  renderRange(Number(selected?.dataset.days || 30));
});
