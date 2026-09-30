function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

async function requestFriends(query = '') {
  const response = await fetch(`/api/friends${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Could not load friends.');
  return result;
}

function initProfileFriends() {
  const profileHero = document.querySelector('.profile-hero');
  if (!profileHero) return;

  const section = document.createElement('section');
  section.className = 'card friends-card';
  section.innerHTML = '<div class="card-title"><div><h2>Training community</h2><p class="friends-caption">Find people and follow their training journey.</p></div></div><div class="friend-counts"><button class="friend-count" id="followerCount" type="button" aria-label="View followers"><strong>0</strong><span>Followers</span></button><button class="friend-count" id="followingCount" type="button" aria-label="View following"><strong>0</strong><span>Following</span></button></div><label class="field friends-search-field" for="friendSearch"><span>Find members</span><input id="friendSearch" type="search" placeholder="Search by name" autocomplete="off"></label><p class="friends-status" id="friendsStatus" role="status"></p><div class="friends-results" id="friendsResults"></div><dialog class="friends-dialog" id="friendsDialog" aria-labelledby="friendsDialogTitle"><div class="friends-dialog-heading"><h2 id="friendsDialogTitle">Members</h2><button type="button" id="closeFriendsDialog" aria-label="Close member list">×</button></div><div class="friends-people-list" id="friendsPeopleList"></div></dialog>';
  profileHero.after(section);

  const search = section.querySelector('#friendSearch');
  const results = section.querySelector('#friendsResults');
  const status = section.querySelector('#friendsStatus');
  const dialog = section.querySelector('#friendsDialog');
  const peopleList = section.querySelector('#friendsPeopleList');
  let followerUsers = [];
  let followingUsers = [];
  let searchTimer;

  function showPeopleList(title, members) {
    section.querySelector('#friendsDialogTitle').textContent = title;
    peopleList.replaceChildren();
    if (!members.length) {
      peopleList.append(createElement('p', 'friends-empty', `No ${title.toLowerCase()} yet.`));
    } else {
      members.forEach(member => {
        const row = createElement('div', 'friend-person');
        const initials = member.name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
        row.append(createElement('span', 'friend-avatar', initials));
        row.append(createElement('strong', '', member.name));
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
      status.textContent = error.message;
      results.replaceChildren();
      if (error.message.includes('Sign in')) {
        const link = createElement('a', 'friends-login-link', 'Sign in to find and follow members.');
        link.href = 'login.html';
        results.append(link);
      }
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
    searchTimer = setTimeout(() => refresh(query), 250);
  });

  results.addEventListener('click', async event => {
    const button = event.target.closest('[data-user-id]');
    if (!button) return;
    const following = button.dataset.following === 'true';
    button.disabled = true;
    status.textContent = following ? 'Updating following...' : 'Following member...';
    try {
      const response = await fetch(`/api/friends/${encodeURIComponent(button.dataset.userId)}`, { method: following ? 'DELETE' : 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update follow status.');
      await refresh(search.value.trim());
    } catch (error) {
      status.textContent = error.message;
      button.disabled = false;
    }
  });

  refresh();
}

document.addEventListener('DOMContentLoaded', initProfileFriends);
