#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { randomBytes, scryptSync } = require('crypto');

function parseArgs(argv) {
  const out = {
    username: '',
    password: '',
    displayName: '',
    email: '',
    role: 'owner',
    docId: '',
    isActive: true,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      out.help = true;
      continue;
    }

    if (arg === '--dry-run') {
      out.dryRun = true;
      continue;
    }

    if (arg === '--inactive') {
      out.isActive = false;
      continue;
    }

    if (arg === '--username' && i + 1 < argv.length) {
      out.username = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg.startsWith('--username=')) {
      out.username = arg.slice('--username='.length);
      continue;
    }

    if (arg === '--password' && i + 1 < argv.length) {
      out.password = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg.startsWith('--password=')) {
      out.password = arg.slice('--password='.length);
      continue;
    }

    if (arg === '--display-name' && i + 1 < argv.length) {
      out.displayName = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg.startsWith('--display-name=')) {
      out.displayName = arg.slice('--display-name='.length);
      continue;
    }

    if (arg === '--email' && i + 1 < argv.length) {
      out.email = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg.startsWith('--email=')) {
      out.email = arg.slice('--email='.length);
      continue;
    }

    if (arg === '--role' && i + 1 < argv.length) {
      out.role = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg.startsWith('--role=')) {
      out.role = arg.slice('--role='.length);
      continue;
    }

    if (arg === '--doc-id' && i + 1 < argv.length) {
      out.docId = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg.startsWith('--doc-id=')) {
      out.docId = arg.slice('--doc-id='.length);
    }
  }

  return out;
}

function printHelp() {
  console.log('Usage: node scripts/seed-admin-user.cjs --username <value> --password <value> [options]');
  console.log('');
  console.log('Required:');
  console.log('  --username        Admin username (used for login)');
  console.log('  --password        Admin password (hashed before write)');
  console.log('');
  console.log('Optional:');
  console.log('  --display-name    Display name (default: username)');
  console.log('  --email           Admin email (default: empty)');
  console.log('  --role            Single role string (default: owner)');
  console.log('  --doc-id          Force specific admin_users doc id');
  console.log('  --dry-run         Print payload without writing to Firestore');
  console.log('  --inactive        Seed user with isActive=false (safe placeholder)');
  console.log('  --help, -h        Show this help');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/seed-admin-user.cjs --username admin --password "ChangeMeNow!" --display-name "Maintley Owner" --email "owner@example.com"');
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function ensureAdminInitialized() {
  if (admin.apps.length > 0) {
    return;
  }

  const explicitPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (explicitPath && fs.existsSync(explicitPath)) {
    const serviceAccount = require(explicitPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return;
  }

  const fallbackPath = path.resolve(__dirname, '..', '..', 'serviceAccountKey.json');
  if (fs.existsSync(fallbackPath)) {
    const serviceAccount = require(fallbackPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return;
  }

  admin.initializeApp();
}

function buildPasswordFields(usernameLower, password) {
  const passwordSalt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(`${usernameLower}:${password}`, passwordSalt, 64).toString('hex');
  return { passwordSalt, passwordHash };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const username = String(args.username || '').trim();
  const usernameLower = normalizeUsername(username);
  const password = String(args.password || '');

  if (!usernameLower || !password.trim()) {
    printHelp();
    throw new Error('Both --username and --password are required.');
  }

  const displayName = String(args.displayName || username).trim() || username;
  const email = String(args.email || '').trim() || null;
  const role = String(args.role || 'owner').trim() || 'owner';
  const isActive = Boolean(args.isActive);

  const { passwordSalt, passwordHash } = buildPasswordFields(usernameLower, password);

  const payload = {
    username,
    usernameLower,
    displayName,
    email,
    passwordSalt,
    passwordHash,
    roles: [role],
    isActive,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (args.dryRun) {
    console.log('Dry run only. No write performed.');
    console.log(JSON.stringify({
      ...payload,
      updatedAt: '<serverTimestamp>',
    }, null, 2));
    return;
  }

  ensureAdminInitialized();
  const db = admin.firestore();

  let targetRef = null;

  if (args.docId) {
    targetRef = db.collection('admin_users').doc(String(args.docId).trim());
  } else {
    const existing = await db
      .collection('admin_users')
      .where('usernameLower', '==', usernameLower)
      .limit(1)
      .get();

    if (!existing.empty) {
      targetRef = existing.docs[0].ref;
    } else {
      targetRef = db.collection('admin_users').doc();
    }
  }

  const existingDoc = await targetRef.get();

  const finalPayload = {
    ...payload,
    ...(existingDoc.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
  };

  await targetRef.set(finalPayload, { merge: true });

  console.log('Admin user seeded successfully.');
  console.log(`Collection: admin_users`);
  console.log(`Doc ID: ${targetRef.id}`);
  console.log(`Username: ${username}`);
  console.log(`Role: ${role}`);
  console.log('You can now edit this record in Firebase Console if needed.');
}

run().catch((error) => {
  console.error(`seed-admin-user failed: ${error.message}`);
  process.exit(1);
});
