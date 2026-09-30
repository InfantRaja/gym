function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatWorkoutDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTimeAgo(workout) {
  const savedAt = workout.savedAt ? new Date(workout.savedAt) : new Date(`${workout.date}T12:00:00`);
  if (Number.isNaN(savedAt.getTime())) return formatWorkoutDate(workout.date);
  const elapsedHours = Math.max(0, Math.floor((Date.now() - savedAt.getTime()) / 3600000));
  if (elapsedHours < 1) return 'Just now';
  if (elapsedHours < 24) return `${elapsedHours} ${elapsedHours === 1 ? 'hour' : 'hours'} ago`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} ${elapsedDays === 1 ? 'day' : 'days'} ago`;
}

function muscleImage(muscle) {
  const images = {
    Chest: 'chest.svg', Back: 'back.svg', Shoulders: 'shoulders.svg',
    Biceps: 'biceps.svg', Triceps: 'triceps.svg', Legs: 'legs.svg', Abs: 'abs.svg'
  };
  return images[muscle] ? `assets/images/${images[muscle]}` : '';
}

function renderExercise(exercise) {
  const row = makeElement('div', 'feed-exercise');
  const imagePath = muscleImage(exercise.muscle);
  if (imagePath) {
    const image = makeElement('img', 'feed-exercise-image');
    image.src = imagePath;
    image.alt = `${exercise.muscle} exercise`;
    image.onerror = () => image.remove();
    row.append(image);
  } else {
    row.append(makeElement('span', 'feed-exercise-image feed-exercise-placeholder', 'L'));
  }
  const setCount = exercise.sets?.length || 0;
  row.append(makeElement('span', 'feed-exercise-name', `${setCount} ${setCount === 1 ? 'set' : 'sets'} ${exercise.name}`));
  return row;
}

function renderWorkout(workout) {
  const post = makeElement('article', 'feed-post');
  const header = makeElement('div', 'feed-post-header');
  const avatarText = String(workout.userName || 'Member').trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  header.append(makeElement('span', 'feed-avatar', avatarText));
  const identity = makeElement('div', 'feed-identity');
  identity.append(makeElement('strong', '', workout.userName || 'LimitBreak member'));
  identity.append(makeElement('span', '', formatTimeAgo(workout)));
  header.append(identity);

  const title = makeElement('h3', 'feed-post-title', workout.type || 'Workout');
  const stats = makeElement('div', 'feed-workout-stats');
  const totalSets = (workout.exerciseDetails || []).reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0);
  [
    ['Time', workout.duration >= 60 ? `${Math.floor(workout.duration / 60)}h ${workout.duration % 60}min` : `${workout.duration} min`],
    ['Volume', `${Number(workout.volume).toLocaleString()} kg`],
    ['Sets', String(totalSets || '—')]
  ].forEach(([label, value]) => {
    const stat = makeElement('div', 'feed-stat');
    stat.append(makeElement('span', '', label), makeElement('strong', '', value));
    stats.append(stat);
  });

  const exerciseDetails = workout.exerciseDetails || [];
  const exerciseList = makeElement('div', 'feed-exercises');
  if (exerciseDetails.length) {
    const visible = exerciseDetails.slice(0, 3);
    visible.forEach(exercise => exerciseList.append(renderExercise(exercise)));
    if (exerciseDetails.length > visible.length) {
      const more = makeElement('button', 'feed-more', `See ${exerciseDetails.length - visible.length} more exercises`);
      more.type = 'button';
      more.addEventListener('click', () => {
        exerciseDetails.slice(3).forEach(exercise => exerciseList.insertBefore(renderExercise(exercise), more));
        more.remove();
      });
      exerciseList.append(more);
    }
  } else {
    exerciseList.append(makeElement('p', 'feed-legacy-note', `${workout.exercises} exercises · Details unavailable for this older workout.`));
  }

  const actions = makeElement('div', 'feed-post-actions');
  const share = makeElement('button', 'feed-share', '↗ Share workout');
  share.type = 'button';
  share.addEventListener('click', async () => {
    const shareText = `${workout.userName} completed ${workout.type}: ${Number(workout.volume).toLocaleString()} kg volume.`;
    try {
      if (navigator.share) await navigator.share({ title: 'LimitBreak workout', text: shareText, url: location.href });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        share.textContent = 'Copied workout details';
      }
    } catch {}
  });
  actions.append(share);
  post.append(header, title, stats, exerciseList, actions);
  return post;
}

async function renderFollowingFeed() {
  const shell = document.querySelector('.page-shell');
  if (!shell) return;

  const section = document.createElement('section');
  section.className = 'following-feed-section';
  section.innerHTML = '<div class="feed-section-heading"><div><p class="eyebrow">Your community</p><h2>Following activity</h2></div><a class="small accent" href="profile.html">Find people →</a></div><div class="following-feed-list" id="followingFeedList"><p class="muted small">Loading activity...</p></div><section class="suggested-athletes" id="suggestedAthletes"><div class="suggested-heading"><h2>Suggested athletes</h2><a href="profile.html">Find more →</a></div><div class="suggested-list" id="suggestedList"><p class="muted small">Loading members...</p></div></section>';
  const pageHeader = shell.querySelector('.page-header');
  if (pageHeader) pageHeader.after(section);
  else shell.append(section);
  const list = section.querySelector('#followingFeedList');
  const suggestedList = section.querySelector('#suggestedList');

  try {
    const response = await fetch('/api/feed');
    const result = await response.json();
    if (response.status === 401) {
      list.replaceChildren(makeElement('p', 'muted small', 'Sign in to see workouts from people you follow.'));
      section.querySelector('#suggestedAthletes').remove();
      return;
    }
    if (!response.ok) throw new Error(result.error || 'Could not load following activity.');
    if (!result.workouts.length) {
      const empty = makeElement('p', 'feed-empty', 'No saved workouts from people you follow yet. Follow athletes to see their training here.');
      list.replaceChildren(empty);
    } else {
      list.replaceChildren(...result.workouts.map(renderWorkout));
    }

    const suggestionResponse = await fetch('/api/friends/suggestions');
    const suggestionResult = await suggestionResponse.json();
    if (!suggestionResponse.ok) throw new Error(suggestionResult.error || 'Could not load suggested athletes.');
    if (!suggestionResult.users.length) {
      suggestedList.replaceChildren(makeElement('p', 'muted small', 'You are following everyone here.'));
      return;
    }
    suggestedList.replaceChildren(...suggestionResult.users.map(user => {
      const card = makeElement('article', 'suggested-athlete');
      const initials = user.name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
      card.append(makeElement('span', 'suggested-avatar', initials));
      card.append(makeElement('strong', '', user.name));
      const follow = makeElement('button', 'btn btn-secondary suggested-follow', '+ Follow');
      follow.type = 'button';
      follow.addEventListener('click', async () => {
        follow.disabled = true;
        try {
          const followResponse = await fetch(`/api/friends/${encodeURIComponent(user.id)}`, { method: 'POST' });
          const followResult = await followResponse.json();
          if (!followResponse.ok) throw new Error(followResult.error || 'Could not follow member.');
          card.remove();
          if (!suggestedList.querySelector('.suggested-athlete')) suggestedList.append(makeElement('p', 'muted small', 'You are following everyone here.'));
        } catch (error) {
          follow.disabled = false;
          follow.textContent = 'Try again';
        }
      });
      card.append(follow);
      return card;
    }));
  } catch (error) {
    list.replaceChildren(makeElement('p', 'muted small', error.message));
    suggestedList.replaceChildren();
  }
}

document.addEventListener('DOMContentLoaded', renderFollowingFeed);
