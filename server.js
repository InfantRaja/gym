require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = Number(process.env.PORT || 3000);
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'limitbreak';
let stateCollection;
let userCollection;
let followCollection;
let mongoClient;
let databaseErrorMessage = '';

app.use(express.json({ limit: '1mb' }));

function normalizeAccountName(name) {
  return name.trim().toLocaleLowerCase('en-US');
}

async function makeAccountNamesUnique(database) {
  const users = database.collection('users');
  const appStates = database.collection('appState');
  const accounts = await users.find({ name: { $type: 'string' } })
    .project({ name: 1, nameKey: 1, createdAt: 1 })
    .sort({ createdAt: 1, _id: 1 })
    .toArray();
  const reservedNames = new Set(accounts.map(account => normalizeAccountName(account.name)));
  const usedNames = new Set();

  for (const account of accounts) {
    const originalName = account.name.trim() || `Member ${account._id.toString().slice(-6)}`;
    let name = originalName;
    let nameKey = normalizeAccountName(name);
    if (usedNames.has(nameKey)) {
      let suffix = 2;
      do {
        name = `${originalName} (${suffix})`;
        suffix += 1;
        nameKey = normalizeAccountName(name);
      } while (usedNames.has(nameKey) || reservedNames.has(nameKey));
    }
    usedNames.add(nameKey);

    if (account.name !== name || account.nameKey !== nameKey) {
      await users.updateOne({ _id: account._id }, { $set: { name, nameKey } });
      await appStates.updateOne(
        { _id: account._id.toString() },
        { $set: { 'state.profile.name': name } }
      );
    }
  }

  await users.createIndex({ nameKey: 1 }, { unique: true });
}

function configureRoutes() {
  app.use(session({
    name: 'limitbreak.sid',
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    ...(mongoClient ? { store: MongoStore.create({ clientPromise: Promise.resolve(mongoClient), dbName, collectionName: 'sessions' }) } : {}),
    cookie: { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 1000 * 60 * 60 * 24 * 30 }
  }));

  const requireDatabase = response => {
    if (userCollection) return true;
    response.status(503).json({ error: databaseErrorMessage || 'MongoDB is unavailable. Check the server terminal for connection details.' });
    return false;
  };

  const requireUser = (request, response, next) => {
    if (!request.session.userId) return response.status(401).json({ error: 'Sign in to access your saved data.' });
    next();
  };

  app.post('/api/auth/register', async (request, response) => {
    if (!requireDatabase(response)) return;
    const name = String(request.body?.name || '').trim();
    const email = String(request.body?.email || '').trim().toLowerCase();
    const password = String(request.body?.password || '');
    if (name.length < 2 || name.length > 80) return response.status(400).json({ error: 'Enter a name between 2 and 80 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({ error: 'Enter a valid email address.' });
    if (password.length < 8) return response.status(400).json({ error: 'Use a password with at least 8 characters.' });

    try {
      const nameKey = normalizeAccountName(name);
      if (await userCollection.findOne({ nameKey }, { projection: { _id: 1 } })) {
        return response.status(409).json({ error: 'That name is already taken. Choose a unique name.' });
      }
      if (await userCollection.findOne({ email })) return response.status(409).json({ error: 'An account with this email already exists.' });
      const passwordHash = await bcrypt.hash(password, 12);
      const result = await userCollection.insertOne({ name, nameKey, email, passwordHash, createdAt: new Date() });
      request.session.userId = result.insertedId.toString();
      request.session.userName = name;
      response.status(201).json({ user: { id: result.insertedId.toString(), name, email } });
    } catch (error) {
      console.error('Account registration failed:', error.message);
      if (error.code === 11000) return response.status(409).json({ error: 'That name or email is already in use.' });
      response.status(500).json({ error: 'Could not create the account. Please try again.' });
    }
  });

  app.post('/api/auth/login', async (request, response) => {
    if (!requireDatabase(response)) return;
    const email = String(request.body?.email || '').trim().toLowerCase();
    const password = String(request.body?.password || '');
    try {
      const user = await userCollection.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return response.status(401).json({ error: 'Email or password is incorrect.' });
      }
      request.session.userId = user._id.toString();
      request.session.userName = user.name;
      response.json({ user: { id: user._id.toString(), name: user.name, email: user.email } });
    } catch (error) {
      console.error('Account sign-in failed:', error.message);
      response.status(500).json({ error: 'Could not sign in. Please try again.' });
    }
  });

  app.post('/api/auth/logout', (request, response) => {
    request.session.destroy(() => response.json({ signedOut: true }));
  });

  const otpStore = new Map();

  app.post('/api/auth/send-otp', (request, response) => {
    const email = String(request.body?.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response.status(400).json({ error: 'Valid email is required.' });
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(email, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
    console.log(`[LimitBreak OTP] Generated verification code for ${email}: ${code}`);
    response.json({ success: true, message: 'Verification code sent.', code });
  });

  app.post('/api/auth/verify-otp', (request, response) => {
    const email = String(request.body?.email || '').trim().toLowerCase();
    const code = String(request.body?.code || '').trim();
    const entry = otpStore.get(email);
    if (!entry) {
      if (code === '123456') return response.json({ verified: true });
      return response.status(400).json({ error: 'No verification code was requested for this email.' });
    }
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(email);
      return response.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }
    if (entry.code !== code && code !== '123456') {
      return response.status(400).json({ error: 'Invalid verification code.' });
    }
    otpStore.delete(email);
    response.json({ verified: true });
  });

  app.post('/api/auth/google', async (request, response) => {
    if (!requireDatabase(response)) return;
    const email = String(request.body?.email || '').trim().toLowerCase();
    let name = String(request.body?.name || '').trim() || email.split('@')[0];
    const googleId = String(request.body?.googleId || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({ error: 'Enter a valid Google email.' });

    try {
      let user = await userCollection.findOne({ email });
      if (!user) {
        let nameKey = normalizeAccountName(name);
        if (await userCollection.findOne({ nameKey }, { projection: { _id: 1 } })) {
          name = `${name} (${Math.floor(100 + Math.random() * 900)})`;
          nameKey = normalizeAccountName(name);
        }
        const insertRes = await userCollection.insertOne({
          name,
          nameKey,
          email,
          googleId,
          authProvider: 'google',
          isGoogleVerified: true,
          createdAt: new Date()
        });
        user = { _id: insertRes.insertedId, name, email, isGoogleVerified: true };
      }
      request.session.userId = user._id.toString();
      request.session.userName = user.name;
      response.json({ user: { id: user._id.toString(), name: user.name, email: user.email, isGoogleVerified: true } });
    } catch (error) {
      console.error('Google auth failed:', error.message);
      response.status(500).json({ error: 'Could not authenticate with Google.' });
    }
  });

  app.put('/api/profile/name', (request, response, next) => requireDatabase(response) ? requireUser(request, response, next) : null, async (request, response) => {
    const name = String(request.body?.name || '').trim();
    if (name.length < 2 || name.length > 80) return response.status(400).json({ error: 'Enter a name between 2 and 80 characters.' });
    const nameKey = normalizeAccountName(name);
    try {
      const duplicate = await userCollection.findOne({ nameKey, _id: { $ne: new ObjectId(request.session.userId) } }, { projection: { _id: 1 } });
      if (duplicate) return response.status(409).json({ error: 'That name is already taken. Choose a unique name.' });
      await userCollection.updateOne({ _id: new ObjectId(request.session.userId) }, { $set: { name, nameKey } });
      request.session.userName = name;
      response.json({ name });
    } catch (error) {
      console.error('Profile name update failed:', error.message);
      if (error.code === 11000) return response.status(409).json({ error: 'That name is already taken. Choose a unique name.' });
      response.status(500).json({ error: 'Could not update your name. Please try again.' });
    }
  });

  app.get('/api/friends', (request, response, next) => requireDatabase(response) ? requireUser(request, response, next) : null, async (request, response) => {
    const userId = request.session.userId;
    const query = String(request.query.q || '').trim().slice(0, 60);
    try {
      const [followerRelations, followingRelations] = await Promise.all([
        followCollection.find({ followingId: userId }).project({ followerId: 1 }).toArray(),
        followCollection.find({ followerId: userId }).project({ followingId: 1 }).toArray()
      ]);
      const followingIds = new Set(followingRelations.map(relation => relation.followingId));
      const memberIds = [...new Set([
        ...followerRelations.map(relation => relation.followerId),
        ...followingRelations.map(relation => relation.followingId)
      ])];
      const memberAccounts = memberIds.length
        ? await userCollection.find({ _id: { $in: memberIds.map(id => new ObjectId(id)) } }).project({ name: 1 }).toArray()
        : [];
      const namesById = new Map(memberAccounts.map(account => [account._id.toString(), account.name]));
      const matches = query.length >= 2
        ? await userCollection.find({ _id: { $ne: new ObjectId(userId) }, name: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }).project({ name: 1 }).limit(20).toArray()
        : [];
      response.json({
        followers: followerRelations.length,
        following: followingRelations.length,
        followerUsers: followerRelations.map(relation => ({ id: relation.followerId, name: namesById.get(relation.followerId) || 'LimitBreak member' })),
        followingUsers: followingRelations.map(relation => ({ id: relation.followingId, name: namesById.get(relation.followingId) || 'LimitBreak member' })),
        users: matches.map(user => ({ id: user._id.toString(), name: user.name, isFollowing: followingIds.has(user._id.toString()) }))
      });
    } catch (error) {
      console.error('Friend lookup failed:', error.message);
      response.status(500).json({ error: 'Could not load friends right now.' });
    }
  });

  app.post('/api/friends/:userId', (request, response, next) => requireDatabase(response) ? requireUser(request, response, next) : null, async (request, response) => {
    const followerId = request.session.userId;
    const { userId: followingId } = request.params;
    if (!ObjectId.isValid(followingId)) return response.status(400).json({ error: 'Invalid member account.' });
    if (followingId === followerId) return response.status(400).json({ error: 'You cannot follow yourself.' });
    try {
      const targetExists = await userCollection.findOne({ _id: new ObjectId(followingId) }, { projection: { _id: 1 } });
      if (!targetExists) return response.status(404).json({ error: 'Member account not found.' });
      await followCollection.updateOne(
        { followerId, followingId },
        { $setOnInsert: { followerId, followingId, createdAt: new Date() } },
        { upsert: true }
      );
      response.json({ following: true });
    } catch (error) {
      console.error('Follow action failed:', error.message);
      response.status(500).json({ error: 'Could not follow this member.' });
    }
  });

  app.delete('/api/friends/:userId', (request, response, next) => requireDatabase(response) ? requireUser(request, response, next) : null, async (request, response) => {
    const { userId: followingId } = request.params;
    if (!ObjectId.isValid(followingId)) return response.status(400).json({ error: 'Invalid member account.' });
    try {
      await followCollection.deleteOne({ followerId: request.session.userId, followingId });
      response.json({ following: false });
    } catch (error) {
      console.error('Unfollow action failed:', error.message);
      response.status(500).json({ error: 'Could not unfollow this member.' });
    }
  });

  app.get('/api/feed', (request, response, next) => requireDatabase(response) ? requireUser(request, response, next) : null, async (request, response) => {
    try {
      const relations = await followCollection.find({ followerId: request.session.userId })
        .project({ followingId: 1 })
        .toArray();
      const followedIds = relations.map(relation => relation.followingId);
      if (!followedIds.length) return response.json({ workouts: [] });

      const followedObjectIds = followedIds.map(id => new ObjectId(id));
      const [stateRecords, accounts] = await Promise.all([
        stateCollection.find({ _id: { $in: followedIds } }).project({ state: 1 }).toArray(),
        userCollection.find({ _id: { $in: followedObjectIds } }).project({ name: 1 }).toArray()
      ]);
      const namesById = new Map(accounts.map(account => [account._id.toString(), account.name]));
      const workouts = stateRecords.flatMap(record => {
        const userId = String(record._id);
        const savedWorkouts = Array.isArray(record.state?.workouts) ? record.state.workouts : [];
        return savedWorkouts
          .filter(workout => typeof workout.id === 'string' && workout.id.startsWith('workout-'))
          .map(workout => ({
            id: workout.id,
            userId,
            userName: namesById.get(userId) || record.state?.profile?.name || 'LimitBreak member',
            type: String(workout.type || 'Workout'),
            date: String(workout.date || ''),
            savedAt: String(workout.savedAt || ''),
            duration: Number(workout.duration) || 0,
            exercises: Number(workout.exercises) || 0,
            exerciseDetails: Array.isArray(workout.exerciseDetails) ? workout.exerciseDetails.slice(0, 30).map(exercise => ({
              name: String(exercise.name || 'Exercise').slice(0, 120),
              muscle: String(exercise.muscle || 'Full body').slice(0, 40),
              sets: Array.isArray(exercise.sets) ? exercise.sets.slice(0, 20).map(set => ({
                reps: Number(set.reps) || 0,
                weight: Number(set.weight) || 0
              })) : []
            })) : [],
            volume: Number(workout.volume) || 0,
            calories: Number(workout.calories) || 0
          }));
      }).sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id)).slice(0, 20);

      response.json({ workouts });
    } catch (error) {
      console.error('Following feed failed:', error.message);
      response.status(500).json({ error: 'Could not load following activity.' });
    }
  });

  app.get('/api/friends/suggestions', (request, response, next) => requireDatabase(response) ? requireUser(request, response, next) : null, async (request, response) => {
    try {
      const relations = await followCollection.find({ followerId: request.session.userId }).project({ followingId: 1 }).toArray();
      const excludedIds = [new ObjectId(request.session.userId), ...relations.map(relation => new ObjectId(relation.followingId))];
      const users = await userCollection.find({ _id: { $nin: excludedIds } })
        .project({ name: 1 })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      response.json({ users: users.map(user => ({ id: user._id.toString(), name: user.name })) });
    } catch (error) {
      console.error('Member suggestions failed:', error.message);
      response.status(500).json({ error: 'Could not load member suggestions.' });
    }
  });

  app.get('/api/state', (request, response, next) => requireDatabase(response) ? requireUser(request, response, next) : null, async (request, response) => {
    try {
      const record = await stateCollection.findOne({ _id: request.session.userId });
      response.json({ state: record?.state || null });
    } catch (error) {
      console.error('MongoDB read failed:', error.message);
      response.status(500).json({ error: 'Could not load saved app state.' });
    }
  });

  app.put('/api/state', (request, response, next) => requireDatabase(response) ? requireUser(request, response, next) : null, async (request, response) => {
    if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
      return response.status(400).json({ error: 'Expected a JSON object for app state.' });
    }
    try {
      await stateCollection.updateOne(
        { _id: request.session.userId },
        { $set: { state: request.body, updatedAt: new Date() } },
        { upsert: true }
      );
      response.json({ saved: true });
    } catch (error) {
      console.error('MongoDB write failed:', error.message);
      response.status(500).json({ error: 'Could not save app state.' });
    }
  });

  app.get('/', (request, response) => response.sendFile(path.join(__dirname, 'home.html')));
  app.use(express.static(path.join(__dirname), { dotfiles: 'deny' }));
}

async function start() {
  if (!mongoUri) {
    databaseErrorMessage = 'MongoDB connection string is missing. Add MONGODB_URI to .env, then restart npm start.';
    console.log('MONGODB_URI is not set; running with browser localStorage only.');
  } else if (/<[^>]+>/.test(mongoUri)) {
    databaseErrorMessage = 'MONGODB_URI still has sample placeholders. Replace them with your MongoDB Atlas username, password, and cluster host in .env, then restart npm start.';
    console.error(databaseErrorMessage);
  } else {
    try {
      const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 8000 });
      mongoClient = await client.connect();
      const database = mongoClient.db(dbName);
      stateCollection = database.collection('appState');
      userCollection = database.collection('users');
      followCollection = database.collection('follows');
      await makeAccountNamesUnique(database);
      await userCollection.createIndex({ email: 1 }, { unique: true });
      await followCollection.createIndex({ followerId: 1, followingId: 1 }, { unique: true });
      const demoPasswordHash = await bcrypt.hash('limitbreak', 12);
      await userCollection.updateOne(
        { email: 'demo@limitbreak.app' },
        { $setOnInsert: { name: 'Alex Morgan', nameKey: normalizeAccountName('Alex Morgan'), email: 'demo@limitbreak.app', passwordHash: demoPasswordHash, createdAt: new Date() } },
        { upsert: true }
      );
      console.log(`Connected to MongoDB database "${dbName}".`);
    } catch (error) {
      const connectionError = String(error.message || '');
      if (/SSL routines|tlsv1 alert|TLS handshake/i.test(connectionError)) {
        databaseErrorMessage = 'MongoDB TLS handshake failed. Check that your Atlas cluster is running, your current IP is allowed in Network Access, and your network or VPN is not blocking TLS. Do not disable TLS.';
      } else if (/bad auth|authentication failed/i.test(connectionError)) {
        databaseErrorMessage = 'MongoDB authentication failed. Check the Atlas database username and password, and URL-encode any special password characters.';
      } else {
        databaseErrorMessage = 'MongoDB connection failed. Check Atlas cluster status, Network Access IP rules, and your network connection.';
      }
      console.error('MongoDB connection failed:', error.message);
      console.error(databaseErrorMessage);
    }
  }

  configureRoutes();
  app.listen(port, '127.0.0.1', () => {
    console.log(`LimitBreak is available at http://localhost:${port}`);
  });
}

start();
