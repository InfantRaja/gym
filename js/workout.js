import { getState, saveState, renderShell, setPageTitle, getExercise, escapeHtml, toast } from './app.js';
import { exercises, workoutTemplates } from '../data/exercises.js';

const shell = renderShell('workout');
let session = getState().activeWorkout;
let timerSeconds = session?.elapsed || 0;
let timerRunning = false;
let timerInterval;
let showLibrary = !session;
let selectedExerciseName = '';

function makeExercise(name) {
  return { name, sets: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0, done: false })) };
}

function render() {
  if (showLibrary || !session) {
    renderLibrary();
    return;
  }
  renderSession();
}

function renderLibrary() {
  const categories = [...new Set(workoutTemplates.map(template => template.category))];
  shell.innerHTML = `${setPageTitle('Choose your workout', 'LimitBreak / Workout plans')}<section class="workout-library"><div class="library-heading"><div><h2>Start with a plan.</h2><p>Choose a ready-made session or build your own from scratch.</p></div>${session ? '<button class="btn btn-secondary" id="resumeSession">Resume active workout</button>' : ''}</div><div class="plan-filters"><label class="field"><span>Workout type</span><select id="categoryFilter"><option value="all">All workout types</option>${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}</select></label><label class="field"><span>Experience level</span><select id="difficultyFilter"><option value="all">All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label></div><div class="plan-grid" id="planGrid"></div></section>`;
  renderPlans();
  document.getElementById('categoryFilter').addEventListener('change', renderPlans);
  document.getElementById('difficultyFilter').addEventListener('change', renderPlans);
  document.getElementById('resumeSession')?.addEventListener('click', () => {
    showLibrary = false;
    render();
  });
}

function renderPlans() {
  const category = document.getElementById('categoryFilter').value;
  const difficulty = document.getElementById('difficultyFilter').value;
  const plans = workoutTemplates.filter(template =>
    (category === 'all' || template.category === category) &&
    (difficulty === 'all' || template.difficulty === difficulty || template.difficulty === 'Any level')
  );
  const planGrid = document.getElementById('planGrid');
  planGrid.innerHTML = plans.map(template => `<article class="card plan-card"><div class="plan-card-top"><span class="tag">${escapeHtml(template.category)}</span><span class="plan-level ${template.difficulty.toLowerCase()}">${escapeHtml(template.difficulty)}</span></div><h3>${escapeHtml(template.name)}</h3><p>${escapeHtml(template.description)}</p><div class="plan-card-meta"><span>${template.exercises.length} exercises</span><span>${template.exercises.length ? 'About 45 min' : 'Flexible session'}</span></div><button class="btn ${template.id === 'empty' ? 'btn-secondary' : 'btn-primary'} plan-start" data-template="${template.id}">${template.id === 'empty' ? 'Start empty workout' : 'Start workout'} <span>→</span></button></article>`).join('');
  planGrid.querySelectorAll('[data-template]').forEach(button => button.addEventListener('click', () => startTemplate(button.dataset.template)));
}

function startTemplate(templateId) {
  const template = workoutTemplates.find(item => item.id === templateId);
  if (!template) return;
  if (session && !confirm('Replace the active workout with this plan?')) return;
  session = {
    split: template.name,
    category: template.category,
    difficulty: template.difficulty,
    started: Date.now(),
    elapsed: 0,
    exercises: template.exercises.map(makeExercise),
    notes: ''
  };
  timerSeconds = 0;
  timerRunning = false;
  clearInterval(timerInterval);
  showLibrary = false;
  saveState({ activeWorkout: session });
  render();
}

function renderSession() {
  shell.innerHTML = `${setPageTitle('Training floor', 'LimitBreak / Active session')}<div class="workout-toolbar"><div class="active-plan-label"><span class="tag">${escapeHtml(session.difficulty || 'Custom')}</span><h2>${escapeHtml(session.split)}</h2></div><div class="timer"><span id="timer">${formatTime(timerSeconds)}</span><button id="timerToggle">${timerRunning ? 'Pause' : 'Start'}</button><button id="timerReset">Reset</button></div></div><div class="active-workout-actions"><button class="text-button" id="changePlan">← Choose another plan</button><span class="small muted">${session.exercises.length} exercises</span></div><div class="workout-layout"><section><div class="exercise-editor" id="exerciseEditor">${session.exercises.length ? session.exercises.map(exerciseMarkup).join('') : '<div class="empty-workout"><strong>Your session is ready.</strong><span>Add exercises below to get started.</span></div>'}</div><div class="add-exercise-row"><div class="exercise-search"><input id="exerciseSearch" type="search" placeholder="Search exercises by name, muscle, or equipment" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="exerciseSearchResults"><div class="exercise-search-results" id="exerciseSearchResults" role="listbox" hidden></div></div><button class="btn btn-secondary" id="addExercise" disabled>＋ Add exercise</button></div></section><aside class="card session-card"><span class="eyebrow">Session progress</span><div class="session-number" id="completedCount">${completedSets()}</div><div class="session-label">sets completed</div><div class="session-stats"><div class="session-stat"><strong>${volume().toLocaleString()}</strong><small>kg volume</small></div><div class="session-stat"><strong>${session.exercises.length}</strong><small>exercises</small></div></div><div class="field"><label for="workoutNotes">Session notes</label><textarea class="notes" id="workoutNotes" placeholder="How did it feel?">${escapeHtml(session.notes || '')}</textarea></div><div class="session-actions"><button class="btn btn-primary" id="finishWorkout">Finish & save workout</button><button class="btn btn-danger" id="exitWorkout">Exit session</button></div></aside></div>`;
  bindSessionEvents();
}

function formatTime(total) {
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function exerciseMarkup(exercise, index) {
  const details = getExercise(exercise.name);
  return `<article class="workout-exercise"><div class="exercise-heading"><div><h3>${escapeHtml(exercise.name)}</h3><small>${escapeHtml(details?.muscle || 'Full body')} · ${escapeHtml(details?.equipment || 'Free weights')}</small></div><button class="text-button remove" data-remove="${index}">Remove</button></div><div class="set-row header"><span>Set</span><span>Reps</span><span>Weight kg</span><span>Status</span><span>Actions</span></div>${exercise.sets.map((set, setIndex) => `<div class="set-row"><span class="set-number">${setIndex + 1}</span><input data-field="reps" data-exercise="${index}" data-set="${setIndex}" type="number" min="1" value="${set.reps}"><input data-field="weight" data-exercise="${index}" data-set="${setIndex}" type="number" min="0" value="${set.weight}"><span class="small ${set.done ? 'accent' : 'muted'}">${set.done ? 'Done' : 'Ready'}</span><span class="set-actions"><button class="check-set ${set.done ? 'done' : ''}" data-done="${index}:${setIndex}" aria-label="Mark set ${setIndex + 1} ${set.done ? 'incomplete' : 'complete'}">${set.done ? '✓' : '○'}</button><button class="remove-set" data-remove-set="${index}:${setIndex}" aria-label="Remove set ${setIndex + 1}" title="Remove set">×</button></span></div>`).join('')}<div class="exercise-footer"><button class="text-button" data-add-set="${index}">＋ Add set</button><span class="small muted">Rest 90 sec</span></div></article>`;
}

function completedSets() {
  return session.exercises.reduce((sum, exercise) => sum + exercise.sets.filter(set => set.done).length, 0);
}

function volume() {
  return session.exercises.reduce((sum, exercise) => sum + exercise.sets.reduce((exerciseTotal, set) => exerciseTotal + (Number(set.reps) || 0) * (Number(set.weight) || 0), 0), 0);
}

function persist() {
  session.elapsed = timerSeconds;
  session.notes = document.getElementById('workoutNotes')?.value ?? session.notes;
  saveState({ activeWorkout: session });
}

function bindSessionEvents() {
  document.querySelectorAll('[data-done]').forEach(button => button.addEventListener('click', () => {
    const [exerciseIndex, setIndex] = button.dataset.done.split(':').map(Number);
    session.exercises[exerciseIndex].sets[setIndex].done = !session.exercises[exerciseIndex].sets[setIndex].done;
    persist();
    render();
  }));

  document.querySelectorAll('[data-field]').forEach(input => input.addEventListener('change', () => {
    session.exercises[input.dataset.exercise].sets[input.dataset.set][input.dataset.field] = Number(input.value);
    persist();
    render();
  }));

  document.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
    session.exercises.splice(Number(button.dataset.remove), 1);
    persist();
    render();
  }));

  document.querySelectorAll('[data-add-set]').forEach(button => button.addEventListener('click', () => {
    session.exercises[button.dataset.addSet].sets.push({ reps: 10, weight: 0, done: false });
    persist();
    render();
  }));

  document.querySelectorAll('[data-remove-set]').forEach(button => button.addEventListener('click', () => {
    const [exerciseIndex, setIndex] = button.dataset.removeSet.split(':').map(Number);
    session.exercises[exerciseIndex].sets.splice(setIndex, 1);
    persist();
    render();
  }));

  const exerciseSearch = document.getElementById('exerciseSearch');
  const searchResults = document.getElementById('exerciseSearchResults');
  const addExerciseButton = document.getElementById('addExercise');

  function selectExercise(name) {
    selectedExerciseName = name;
    exerciseSearch.value = name;
    searchResults.hidden = true;
    exerciseSearch.setAttribute('aria-expanded', 'false');
    addExerciseButton.disabled = false;
  }

  exerciseSearch.addEventListener('input', () => {
    const query = exerciseSearch.value.trim().toLowerCase();
    selectedExerciseName = '';
    addExerciseButton.disabled = true;
    if (!query) {
      searchResults.hidden = true;
      exerciseSearch.setAttribute('aria-expanded', 'false');
      return;
    }
    const matches = exercises.filter(exercise => `${exercise.name} ${exercise.muscle} ${exercise.equipment} ${exercise.difficulty}`.toLowerCase().includes(query)).slice(0, 8);
    searchResults.innerHTML = matches.length
      ? matches.map(exercise => `<button class="exercise-search-result" type="button" role="option" data-exercise-name="${escapeHtml(exercise.name)}"><strong>${escapeHtml(exercise.name)}</strong><span>${escapeHtml(exercise.muscle)} · ${escapeHtml(exercise.equipment)} · ${escapeHtml(exercise.difficulty)}</span></button>`).join('')
      : '<p class="exercise-search-empty">No matching exercises.</p>';
    searchResults.hidden = false;
    exerciseSearch.setAttribute('aria-expanded', 'true');
  });

  searchResults.addEventListener('click', event => {
    const result = event.target.closest('[data-exercise-name]');
    if (result) selectExercise(result.dataset.exerciseName);
  });

  exerciseSearch.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      searchResults.querySelector('.exercise-search-result')?.focus();
    } else if (event.key === 'Escape') {
      searchResults.hidden = true;
      exerciseSearch.setAttribute('aria-expanded', 'false');
    } else if (event.key === 'Enter' && !selectedExerciseName) {
      const firstResult = searchResults.querySelector('.exercise-search-result');
      if (firstResult) {
        event.preventDefault();
        selectExercise(firstResult.dataset.exerciseName);
      }
    }
  });

  addExerciseButton.addEventListener('click', () => {
    if (!selectedExerciseName) return toast('Search and select an exercise first.', 'error');
    session.exercises.push(makeExercise(selectedExerciseName));
    selectedExerciseName = '';
    persist();
    render();
  });

  document.getElementById('workoutNotes').addEventListener('change', persist);
  document.getElementById('changePlan').addEventListener('click', () => {
    persist();
    showLibrary = true;
    render();
  });
  document.getElementById('timerToggle').addEventListener('click', toggleTimer);
  document.getElementById('timerReset').addEventListener('click', () => {
    timerSeconds = 0;
    document.getElementById('timer').textContent = formatTime(timerSeconds);
    persist();
  });
  document.getElementById('finishWorkout').addEventListener('click', finishWorkout);
  document.getElementById('exitWorkout').addEventListener('click', exitWorkout);
}

function toggleTimer() {
  timerRunning = !timerRunning;
  const toggle = document.getElementById('timerToggle');
  if (timerRunning) {
    timerInterval = setInterval(() => {
      timerSeconds += 1;
      document.getElementById('timer').textContent = formatTime(timerSeconds);
      if (timerSeconds % 15 === 0) persist();
    }, 1000);
  } else {
    clearInterval(timerInterval);
    persist();
  }
  toggle.textContent = timerRunning ? 'Pause' : 'Start';
}

async function finishWorkout() {
  const state = getState();
  const workouts = [{
    id: `workout-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    savedAt: new Date().toISOString(),
    type: session.split,
    duration: Math.max(1, Math.round(timerSeconds / 60)),
    exercises: session.exercises.length,
    exerciseDetails: session.exercises.map(exercise => ({
      name: exercise.name,
      muscle: getExercise(exercise.name)?.muscle || 'Full body',
      sets: exercise.sets.map(set => ({ reps: Number(set.reps) || 0, weight: Number(set.weight) || 0, done: Boolean(set.done) }))
    })),
    volume: volume(),
    calories: Math.round(volume() * 0.045)
  }, ...state.workouts];
  clearInterval(timerInterval);
  const nextState = saveState({ workouts, activeWorkout: null });
  session = null;
  if (localStorage.getItem('limitbreak-user-id')) {
    try {
      const response = await fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextState)
      });
      if (!response.ok) throw new Error('Cloud save failed');
      toast('Workout saved. Strong work.');
    } catch {
      toast('Workout saved on this device. Cloud sync failed.', 'error');
    }
  } else {
    toast('Workout saved. Strong work.');
  }
  setTimeout(() => { location.href = 'progress.html'; }, 700);
}

function exitWorkout() {
  if (!confirm('Exit and discard this session?')) return;
  clearInterval(timerInterval);
  saveState({ activeWorkout: null });
  session = null;
  location.href = 'home.html';
}

render();
