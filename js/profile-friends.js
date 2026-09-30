const LOCAL_COMMUNITY_KEY = 'limitbreak-local-community';

const ATHLETE_PROFILES = {
  'ath-1': {
    name: 'Alex Morgan',
    handle: '@alex_m',
    goal: 'Strength & Hypertrophy',
    experience: 'Intermediate',
    trainingDays: 4,
    streak: 12,
    totalWorkouts: 48,
    prs: [
      { exercise: 'Bench Press', weight: 100 },
      { exercise: 'Squat', weight: 140 },
      { exercise: 'Deadlift', weight: 180 }
    ],
    workouts: [
      { type: 'Push Day', volume: 6840, duration: 52, date: 'Today', exercises: ['Bench Press', 'Incline DB Press', 'Lateral Raises', 'Tricep Pushdown'] },
      { type: 'Pull Day', volume: 5920, duration: 47, date: '2 days ago', exercises: ['Deadlift', 'Barbell Row', 'Face Pulls', 'Bicep Curls'] },
      { type: 'Leg Day', volume: 8400, duration: 60, date: '4 days ago', exercises: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Calf Raises'] }
    ]
  },
  'ath-2': {
    name: 'Jordan Hayes',
    handle: '@jordan_h',
    goal: 'Fat Loss & Conditioning',
    experience: 'Beginner',
    trainingDays: 3,
    streak: 5,
    totalWorkouts: 22,
    prs: [
      { exercise: 'Bench Press', weight: 75 },
      { exercise: 'Squat', weight: 90 },
      { exercise: 'Overhead Press', weight: 55 }
    ],
    workouts: [
      { type: 'Push Day', volume: 5400, duration: 45, date: 'Yesterday', exercises: ['DB Bench Press', 'Overhead Press', 'Pushups'] },
      { type: 'Full Body HIIT', volume: 4100, duration: 40, date: '3 days ago', exercises: ['Goblet Squat', 'Kettlebell Swings', 'Plank'] }
    ]
  },
  'ath-3': {
    name: 'Elena Rostova',
    handle: '@elena_fit',
    goal: 'Hypertrophy & Glutes',
    experience: 'Advanced',
    trainingDays: 5,
    streak: 19,
    totalWorkouts: 94,
    prs: [
      { exercise: 'Hip Thrust', weight: 160 },
      { exercise: 'Squat', weight: 125 },
      { exercise: 'Deadlift', weight: 145 }
    ],
    workouts: [
      { type: 'Leg & Glute Focus', volume: 9400, duration: 65, date: 'Today', exercises: ['Barbell Hip Thrust', 'Bulgarian Split Squat', 'Romanian Deadlift'] },
      { type: 'Upper Hypertrophy', volume: 6800, duration: 50, date: '2 days ago', exercises: ['Pull-ups', 'DB Shoulder Press', 'Cable Rows'] }
    ]
  },
  'ath-4': {
    name: 'Marcus Vance',
    handle: '@vance_power',
    goal: 'Powerlifting / Max Strength',
    experience: 'Advanced',
    trainingDays: 6,
    streak: 31,
    totalWorkouts: 142,
    prs: [
      { exercise: 'Squat', weight: 190 },
      { exercise: 'Bench Press', weight: 140 },
      { exercise: 'Deadlift', weight: 220 }
    ],
    workouts: [
      { type: 'Heavy Pull Day', volume: 11200, duration: 75, date: 'Today', exercises: ['Deadlift 5x3', 'Weighted Pull-ups', 'Pendlay Rows'] },
      { type: 'Bench Focus', volume: 8900, duration: 60, date: 'Yesterday', exercises: ['Competition Bench', 'Close Grip Bench', 'Dips'] }
    ]
  },
  'ath-5': {
    name: 'Maya Lin',
    handle: '@maya_trains',
    goal: 'General Fitness & Mobility',
    experience: 'Intermediate',
    trainingDays: 4,
    streak: 14,
    totalWorkouts: 56,
    prs: [
      { exercise: 'Squat', weight: 95 },
      { exercise: 'Deadlift', weight: 110 },
      { exercise: 'Bench Press', weight: 60 }
    ],
    workouts: [
      { type: 'Lower Body Strength', volume: 6200, duration: 50, date: 'Yesterday', exercises: ['Back Squat', 'Leg Curl', 'Walking Lunges'] },
      { type: 'Upper Body & Core', volume: 4800, duration: 42, date: '3 days ago', exercises: ['Dumbbell Press', 'Lat Pulldown', 'Hanging Leg Raise'] }
    ]
  },
  'ath-6': {
    name: 'Infant Raja',
    handle: '@infant_raja',
    goal: 'Athletic Conditioning & Muscle',
    experience: 'Intermediate',
    trainingDays: 5,
    streak: 8,
    totalWorkouts: 39,
    prs: [
      { exercise: 'Deadlift', weight: 150 },
      { exercise: 'Squat', weight: 120 },
      { exercise: 'Bench Press', weight: 90 }
    ],
    workouts: [
      { type: 'Upper Power Session', volume: 8100, duration: 58, date: 'Today', exercises: ['Flat Bench Press', 'Incline Dumbbell Press', 'Barbell Row', 'Bicep Curls'] },
      { type: 'Lower Strength', volume: 9200, duration: 62, date: 'Yesterday', exercises: ['Barbell Squat', 'Romanian Deadlift', 'Leg Press'] },
      { type: 'Pull & Core', volume: 6500, duration: 48, date: '3 days ago', exercises: ['Lat Pulldowns', 'Seated Cable Rows', 'Face Pulls', 'Hanging Knee Raises'] }
    ]
  },
  'ath-7': {
    name: 'David Goggins',
    handle: '@david_goggins',
    goal: 'Mental Toughness & Endurance',
    experience: 'Elite',
    trainingDays: 7,
    streak: 120,
    totalWorkouts: 420,
    prs: [
      { exercise: 'Deadlift', weight: 200 },
      { exercise: 'Squat', weight: 180 },
      { exercise: 'Pull-ups', weight: 50 }
    ],
    workouts: [
      { type: 'Iron Endurance', volume: 14500, duration: 90, date: 'Today', exercises: ['500 Pushups', '200 Pull-ups', 'Heavy Deadlifts', 'Core'] }
    ]
  }
};

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function getLocalMembers() {
  const defaults = [
    { id: 'ath-1', name: 'Alex Morgan', isFollowing: true },
    { id: 'ath-2', name: 'Jordan Hayes', isFollowing: false },
    { id: 'ath-3', name: 'Elena Rostova', isFollowing: true },
    { id: 'ath-4', name: 'Marcus Vance', isFollowing: false },
    { id: 'ath-5', name: 'Maya Lin', isFollowing: false },
    { id: 'ath-6', name: 'Infant Raja', isFollowing: true },
    { id: 'ath-7', name: 'David Goggins', isFollowing: false }
  ];
  try {
    const saved = localStorage.getItem(LOCAL_COMMUNITY_KEY);
    const list = saved ? JSON.parse(saved) : defaults;
    const currentName = localStorage.getItem('limitbreak-user-name');
    if (currentName && !list.some(m => m.name.toLowerCase() === currentName.toLowerCase())) {
      list.unshift({ id: 'user-current', name: currentName, isFollowing: false });
    }
    return list;
  } catch {
    return defaults;
  }
}

function saveLocalMembers(members) {
  try {
    localStorage.setItem(LOCAL_COMMUNITY_KEY, JSON.stringify(members));
  } catch {}
}

function getAthleteData(athleteId, name) {
  if (ATHLETE_PROFILES[athleteId]) return ATHLETE_PROFILES[athleteId];
  for (const key of Object.keys(ATHLETE_PROFILES)) {
    if (ATHLETE_PROFILES[key].name.toLowerCase() === (name || '').toLowerCase()) {
      return ATHLETE_PROFILES[key];
    }
  }
  const cleanName = name || 'Athlete';
  const handle = '@' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return {
    name: cleanName,
    handle,
    goal: 'Strength & Fitness',
    experience: 'Dedicated Athlete',
    trainingDays: 4,
    streak: 7,
    totalWorkouts: 25,
    prs: [
      { exercise: 'Bench Press', weight: 85 },
      { exercise: 'Squat', weight: 110 },
      { exercise: 'Deadlift', weight: 135 }
    ],
    workouts: [
      { type: 'Strength Session', volume: 7200, duration: 50, date: 'Today', exercises: ['Compound Lifts', 'Hypertrophy Sets', 'Core Finish'] }
    ]
  };
}

function getLocalFriendsData(query = '') {
  const members = getLocalMembers();
  const q = query.trim().toLowerCase();
  const filtered = q
    ? members.filter(m => m.name.toLowerCase().includes(q))
    : [];
  const followingList = members.filter(m => m.isFollowing);
  const followerList = members.slice(0, 3);
  return {
    followers: followerList.length,
    following: followingList.length,
    followerUsers: followerList,
    followingUsers: followingList,
    users: filtered
  };
}

function toggleLocalFollow(userId, nextFollowing) {
  const members = getLocalMembers();
  const member = members.find(m => m.id === userId);
  if (member) {
    member.isFollowing = nextFollowing;
    saveLocalMembers(members);
  }
}

async function requestFriends(query = '') {
  try {
    const response = await fetch(`/api/friends${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) {
      return getLocalFriendsData(query);
    }
    return await response.json();
  } catch {
    return getLocalFriendsData(query);
  }
}

function initProfileFriends() {
  const profileHero = document.querySelector('.profile-hero');
  if (!profileHero) return;

  const section = document.createElement('section');
  section.className = 'card friends-card';
  section.innerHTML = `
    <div class="card-title">
      <div>
        <h2>Training community</h2>
        <p class="friends-caption">Find people and follow their training journey.</p>
      </div>
    </div>
    <div class="friend-counts">
      <button class="friend-count" id="followerCount" type="button" aria-label="View followers">
        <strong>0</strong><span>Followers</span>
      </button>
      <button class="friend-count" id="followingCount" type="button" aria-label="View following">
        <strong>0</strong><span>Following</span>
      </button>
    </div>
    <label class="field friends-search-field" for="friendSearch">
      <span>Find members</span>
      <input id="friendSearch" type="search" placeholder="Search by name (e.g. Infant, Elena, Alex)" autocomplete="off">
    </label>
    <p class="friends-status" id="friendsStatus" role="status"></p>
    <div class="friends-results" id="friendsResults"></div>
    <dialog class="friends-dialog" id="friendsDialog" aria-labelledby="friendsDialogTitle">
      <div class="friends-dialog-heading">
        <div class="friends-heading-left">
          <button type="button" class="friends-back-btn" id="friendsBackBtn" style="display:none" aria-label="Back to list">←</button>
          <h2 id="friendsDialogTitle">Members</h2>
        </div>
        <button type="button" class="friends-close-btn" id="closeFriendsDialog" aria-label="Close dialog">×</button>
      </div>
      <div class="friends-people-list" id="friendsPeopleList"></div>
      <div class="friends-profile-view" id="friendsProfileView" style="display:none"></div>
    </dialog>
  `;
  profileHero.after(section);

  const search = section.querySelector('#friendSearch');
  const results = section.querySelector('#friendsResults');
  const status = section.querySelector('#friendsStatus');
  const dialog = section.querySelector('#friendsDialog');
  const peopleList = section.querySelector('#friendsPeopleList');
  const profileView = section.querySelector('#friendsProfileView');
  const backBtn = section.querySelector('#friendsBackBtn');
  const titleElem = section.querySelector('#friendsDialogTitle');
  let followerUsers = [];
  let followingUsers = [];
  let searchTimer;
  let activeReturnFn = null;

  function renderAthleteProfile(member, returnCallback) {
    const athlete = getAthleteData(member.id, member.name);
    const members = getLocalMembers();
    const currentStatus = members.find(m => m.id === member.id || m.name.toLowerCase() === member.name.toLowerCase());
    const isFollowing = currentStatus ? currentStatus.isFollowing : Boolean(member.isFollowing);

    titleElem.textContent = 'Athlete Profile';
    peopleList.style.display = 'none';
    profileView.style.display = 'flex';
    backBtn.style.display = returnCallback ? 'grid' : 'none';
    activeReturnFn = returnCallback;

    const initials = athlete.name.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
    const totalVolume = athlete.workouts.reduce((sum, w) => sum + (w.volume || 0), 0);

    profileView.innerHTML = `
      <div class="athlete-hero">
        <div class="athlete-avatar">${initials}</div>
        <h3 class="athlete-name">${athlete.name}</h3>
        <span class="athlete-handle">${athlete.handle}</span>
        <span class="athlete-badge">${athlete.goal} · ${athlete.trainingDays} days/wk</span>
        <div class="athlete-actions">
          <button type="button" class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}" id="profileFollowToggle">
            ${isFollowing ? 'Following ✓' : '+ Follow Athlete'}
          </button>
          <button type="button" class="btn btn-secondary" id="fistbumpBtn">👊 Fistbump</button>
        </div>
      </div>

      <div class="athlete-stats">
        <div class="athlete-stat-card">
          <span class="athlete-stat-val">${athlete.streak}</span>
          <span class="athlete-stat-label">Day Streak 🔥</span>
        </div>
        <div class="athlete-stat-card">
          <span class="athlete-stat-val">${athlete.totalWorkouts}</span>
          <span class="athlete-stat-label">Workouts</span>
        </div>
        <div class="athlete-stat-card">
          <span class="athlete-stat-val">${(totalVolume / 1000).toFixed(1)}k</span>
          <span class="athlete-stat-label">Volume (kg)</span>
        </div>
      </div>

      <div class="athlete-section">
        <h4 class="athlete-sec-title">Personal Records</h4>
        <div class="athlete-prs">
          ${athlete.prs.map(pr => `
            <div class="athlete-pr-pill">
              <span class="athlete-pr-name">${pr.exercise}</span>
              <strong class="athlete-pr-val">${pr.weight} kg</strong>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="athlete-section">
        <h4 class="athlete-sec-title">Recent Training</h4>
        <div class="athlete-workouts">
          ${athlete.workouts.map(w => `
            <div class="athlete-workout-card">
              <div class="athlete-w-head">
                <strong class="athlete-w-title">${w.type}</strong>
                <span class="athlete-w-date">${w.date}</span>
              </div>
              <div class="athlete-w-meta">
                <span>Volume: <strong>${w.volume.toLocaleString()} kg</strong></span>
                <span>Duration: <strong>${w.duration} min</strong></span>
              </div>
              <div class="athlete-w-tags">
                ${(w.exercises || []).map(ex => `<span class="athlete-w-tag">${ex}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const followBtn = profileView.querySelector('#profileFollowToggle');
    followBtn.addEventListener('click', async () => {
      const nextFollowing = !followBtn.classList.contains('btn-secondary');
      followBtn.disabled = true;
      toggleLocalFollow(member.id, nextFollowing);
      try {
        await fetch(`/api/friends/${encodeURIComponent(member.id)}`, { method: nextFollowing ? 'POST' : 'DELETE' });
      } catch {}
      followBtn.disabled = false;
      followBtn.className = `btn ${nextFollowing ? 'btn-secondary' : 'btn-primary'}`;
      followBtn.textContent = nextFollowing ? 'Following ✓' : '+ Follow Athlete';
      await refresh(search.value.trim());
    });

    const fistbump = profileView.querySelector('#fistbumpBtn');
    fistbump.addEventListener('click', () => {
      fistbump.textContent = '👊 Sent!';
      fistbump.style.borderColor = 'var(--lime)';
      setTimeout(() => { fistbump.textContent = '👊 Fistbump'; fistbump.style.borderColor = ''; }, 1800);
    });
  }

  backBtn.addEventListener('click', () => {
    if (activeReturnFn) activeReturnFn();
  });

  function showPeopleList(title, members) {
    titleElem.textContent = title;
    backBtn.style.display = 'none';
    profileView.style.display = 'none';
    peopleList.style.display = 'grid';
    activeReturnFn = null;
    peopleList.replaceChildren();

    if (!members.length) {
      peopleList.append(createElement('p', 'friends-empty', `No ${title.toLowerCase()} yet.`));
    } else {
      members.forEach(member => {
        const row = createElement('div', 'friend-person');
        const left = createElement('div', 'friend-person-left');
        const initials = member.name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
        left.append(createElement('span', 'friend-avatar', initials));
        const info = createElement('div', 'friend-person-info');
        info.append(createElement('strong', '', member.name));
        const athlete = getAthleteData(member.id, member.name);
        info.append(createElement('small', '', `${athlete.goal}`));
        left.append(info);

        const viewLink = createElement('span', 'friend-person-view', 'View Profile ›');
        row.append(left, viewLink);

        row.addEventListener('click', () => {
          renderAthleteProfile(member, () => showPeopleList(title, members));
        });

        peopleList.append(row);
      });
    }
    dialog.showModal();
  }

  section.querySelector('#followerCount').addEventListener('click', () => showPeopleList('Followers', followerUsers));
  section.querySelector('#followingCount').addEventListener('click', () => showPeopleList('Following', followingUsers));
  section.querySelector('#closeFriendsDialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  function renderResults(users) {
    results.replaceChildren();
    if (!users.length) {
      if (search.value.trim().length >= 2) results.append(createElement('p', 'friends-empty', 'No members found.'));
      return;
    }
    users.forEach(user => {
      const row = createElement('div', 'friend-result');
      const avatar = createElement('span', 'friend-avatar', user.name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase());
      const name = createElement('strong', '', user.name);

      avatar.style.cursor = 'pointer';
      name.style.cursor = 'pointer';
      const openProf = () => {
        renderAthleteProfile(user, () => dialog.close());
        dialog.showModal();
      };
      avatar.addEventListener('click', openProf);
      name.addEventListener('click', openProf);

      const action = createElement('button', user.isFollowing ? 'btn btn-secondary friend-action following' : 'btn btn-primary friend-action', user.isFollowing ? 'Following' : 'Follow');
      action.type = 'button';
      action.dataset.userId = user.id;
      action.dataset.following = String(user.isFollowing);
      row.append(avatar, name, action);
      results.append(row);
    });
  }

  async function refresh(query = '') {
    try {
      const data = await requestFriends(query);
      section.querySelector('#followerCount strong').textContent = String(data.followers);
      section.querySelector('#followingCount strong').textContent = String(data.following);
      followerUsers = data.followerUsers || [];
      followingUsers = data.followingUsers || [];
      renderResults(data.users);
      status.textContent = '';
    } catch (error) {
      const fallback = getLocalFriendsData(query);
      section.querySelector('#followerCount strong').textContent = String(fallback.followers);
      section.querySelector('#followingCount strong').textContent = String(fallback.following);
      followerUsers = fallback.followerUsers;
      followingUsers = fallback.followingUsers;
      renderResults(fallback.users);
      status.textContent = '';
    }
  }

  search.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const query = search.value.trim();
    if (query.length < 2) {
      renderResults([]);
      status.textContent = query ? 'Enter at least 2 characters.' : '';
      refresh();
      return;
    }
    status.textContent = 'Searching members...';
    searchTimer = setTimeout(() => refresh(query), 200);
  });

  results.addEventListener('click', async event => {
    const button = event.target.closest('[data-user-id]');
    if (!button) return;
    const following = button.dataset.following === 'true';
    button.disabled = true;
    status.textContent = following ? 'Updating following...' : 'Following member...';
    try {
      const response = await fetch(`/api/friends/${encodeURIComponent(button.dataset.userId)}`, { method: following ? 'DELETE' : 'POST' });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        toggleLocalFollow(button.dataset.userId, !following);
      } else {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not update follow status.');
      }
    } catch {
      toggleLocalFollow(button.dataset.userId, !following);
    }
    button.disabled = false;
    await refresh(search.value.trim());
  });

  refresh();
}

document.addEventListener('DOMContentLoaded', initProfileFriends);
