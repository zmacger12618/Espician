import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// 0. DYNAMIC .ENV LOADER (Keeps GOOGLE_CLIENT_SECRET safely on Backend only!)
// ============================================================================
function loadEnvConfig() {
  const envPath = path.join(__dirname, '.env');
  const parsed = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      parsed[key] = val;
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
  return {
    clientId: parsed.GOOGLE_CLIENT_ID || parsed.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '',
    clientSecret: parsed.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri:
      parsed.GOOGLE_REDIRECT_URI ||
      parsed.VITE_GOOGLE_REDIRECT_URI ||
      process.env.GOOGLE_REDIRECT_URI ||
      'http://localhost:3001/api/auth/google/callback',
    frontendUrl: parsed.FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000'
  };
}
loadEnvConfig();

const PORT = 3001;

// ============================================================================
// 1. SQLITE DATABASE INITIALIZATION (database/espician.sqlite)
// ============================================================================
const DB_DIR = path.join(__dirname, 'database');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = path.join(DB_DIR, 'espician.sqlite');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode & Foreign Keys for high performance and relational integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT,
    password_salt TEXT,
    provider TEXT NOT NULL DEFAULT 'custom',
    google_sub TEXT UNIQUE,
    avatar TEXT,
    club_name TEXT NOT NULL,
    coach_name TEXT NOT NULL,
    is_tutorial_completed INTEGER NOT NULL DEFAULT 0,
    account_level INTEGER NOT NULL DEFAULT 1,
    account_exp INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    last_login_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS club_states (
    user_id TEXT PRIMARY KEY,
    current_day INTEGER NOT NULL DEFAULT 1,
    team_json TEXT NOT NULL,
    market_json TEXT NOT NULL,
    pvp_stats_json TEXT NOT NULL,
    pending_starter_json TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS clubs (
    user_id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    club_name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    coach_name TEXT NOT NULL,
    current_day INTEGER NOT NULL DEFAULT 1,
    total_budget INTEGER NOT NULL DEFAULT 25000,
    team_reputation INTEGER NOT NULL DEFAULT 60,
    current_tactic TEXT NOT NULL DEFAULT 'Balanced',
    fans_count INTEGER NOT NULL DEFAULT 12500,
    lineup_json TEXT NOT NULL,
    assigned_champions_json TEXT NOT NULL,
    coaches_json TEXT NOT NULL,
    pvp_stats_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS club_players (
    user_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    squad_status TEXT NOT NULL DEFAULT 'active',
    in_game_name TEXT NOT NULL,
    real_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    role TEXT NOT NULL,
    salary INTEGER NOT NULL,
    morale INTEGER NOT NULL,
    energy INTEGER NOT NULL,
    level INTEGER NOT NULL,
    exp INTEGER NOT NULL,
    max_exp INTEGER NOT NULL,
    combat_point INTEGER NOT NULL,
    market_price INTEGER NOT NULL,
    dna_max_mechanics INTEGER NOT NULL,
    dna_max_awareness INTEGER NOT NULL,
    dna_base_ego INTEGER NOT NULL,
    dna_learning_speed REAL NOT NULL,
    stat_mechanics INTEGER NOT NULL,
    stat_awareness INTEGER NOT NULL,
    stat_teamwork INTEGER NOT NULL,
    stat_professionalism INTEGER NOT NULL,
    stat_clutch INTEGER NOT NULL,
    stat_consistency INTEGER NOT NULL,
    stat_stamina INTEGER NOT NULL,
    conditions_json TEXT NOT NULL,
    equipped_gear_json TEXT NOT NULL,
    masteries_json TEXT NOT NULL,
    avatar TEXT NOT NULL,
    PRIMARY KEY (user_id, player_id, squad_status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS club_market_listings (
    user_id TEXT NOT NULL,
    listing_id TEXT NOT NULL,
    price INTEGER NOT NULL,
    listed_by TEXT NOT NULL,
    scouted_at TEXT NOT NULL,
    player_id TEXT NOT NULL,
    in_game_name TEXT NOT NULL,
    role TEXT NOT NULL,
    combat_point INTEGER NOT NULL,
    player_json TEXT NOT NULL,
    PRIMARY KEY (user_id, listing_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS match_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    winner TEXT NOT NULL,
    prize INTEGER NOT NULL,
    rep_gain INTEGER NOT NULL,
    day INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS fishing_states (
    user_id TEXT PRIMARY KEY,
    angler_level INTEGER NOT NULL DEFAULT 1,
    angler_exp INTEGER NOT NULL DEFAULT 0,
    sea_coins INTEGER NOT NULL DEFAULT 250,
    equipped_rod_id TEXT NOT NULL DEFAULT 'rod_bamboo',
    equipped_bait_id TEXT NOT NULL DEFAULT 'bait_dough',
    total_catches INTEGER NOT NULL DEFAULT 0,
    state_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

console.log(`[SQLite DB] Initialized relational database at: ${DB_PATH}`);

// ============================================================================
// 2. CRYPTO & PASSWORD HASHING HELPERS
// ============================================================================
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, storedHash, storedSalt) {
  if (!storedHash || !storedSalt) return false;
  const derived = crypto.scryptSync(password, storedSalt, 64);
  const storedBuf = Buffer.from(storedHash, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date().toISOString();
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
  const stmt = db.prepare(
    `INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`
  );
  stmt.run(token, userId, expiresAt, now);
  return token;
}

function getUserFromRequest(req) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const session = db
    .prepare(`SELECT user_id, expires_at FROM sessions WHERE token = ?`)
    .get(token);

  if (!session) return null;
  if (Date.now() > session.expires_at) {
    db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
    return null;
  }

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(session.user_id);
  return user ? { user, token } : null;
}

function formatUserResponse(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    provider: row.provider,
    avatar: row.avatar,
    clubName: row.club_name,
    coachName: row.coach_name,
    isTutorialCompleted: Boolean(row.is_tutorial_completed),
    accountLevel: row.account_level || 1,
    accountExp: row.account_exp || 0
  };
}

function mapPlayerRowToObject(r) {
  return {
    id: r.player_id,
    inGameName: r.in_game_name,
    realName: r.real_name,
    age: r.age,
    role: r.role,
    salary: r.salary,
    morale: r.morale,
    energy: r.energy,
    level: r.level,
    exp: r.exp,
    maxExp: r.max_exp,
    combatPoint: r.combat_point,
    marketPrice: r.market_price,
    dna: {
      maxMechanicsCap: r.dna_max_mechanics,
      maxAwarenessCap: r.dna_max_awareness,
      baseEgo: r.dna_base_ego,
      learningSpeed: r.dna_learning_speed
    },
    stats: {
      mechanics: r.stat_mechanics,
      mapAwareness: r.stat_awareness,
      teamwork: r.stat_teamwork,
      professionalism: r.stat_professionalism,
      clutch: r.stat_clutch,
      consistency: r.stat_consistency,
      stamina: r.stat_stamina
    },
    conditions: JSON.parse(r.conditions_json || '[]'),
    equippedGear: JSON.parse(r.equipped_gear_json || '{}'),
    championMasteries: JSON.parse(r.masteries_json || '{}'),
    avatar: r.avatar
  };
}

function saveNormalizedClubState(userId, state) {
  if (!state || !state.myTeam) return;
  const now = new Date().toISOString();
  const team = state.myTeam;
  const currentDay = state.currentDay || 1;
  const marketListings = state.marketListings || [];
  const pvpStats = state.championPvPStats || {};
  const pendingStarter = state.pendingStarterSquad || [];

  db.exec('BEGIN');
  try {
    // Step 1: Upsert into clubs table
    db.prepare(
      `INSERT INTO clubs (
        user_id, club_id, club_name, short_name, coach_name, current_day,
        total_budget, team_reputation, current_tactic, fans_count,
        lineup_json, assigned_champions_json, coaches_json, pvp_stats_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        club_name = excluded.club_name,
        short_name = excluded.short_name,
        coach_name = excluded.coach_name,
        current_day = excluded.current_day,
        total_budget = excluded.total_budget,
        team_reputation = excluded.team_reputation,
        current_tactic = excluded.current_tactic,
        fans_count = excluded.fans_count,
        lineup_json = excluded.lineup_json,
        assigned_champions_json = excluded.assigned_champions_json,
        coaches_json = excluded.coaches_json,
        pvp_stats_json = excluded.pvp_stats_json,
        updated_at = excluded.updated_at`
    ).run(
      userId,
      team.id || 'team_espician',
      team.name || 'Espician Gaming',
      team.shortName || 'ESP',
      team.coachName || 'Coach',
      currentDay,
      team.totalBudget ?? 25000,
      team.teamReputation ?? 60,
      team.currentTactic || 'Balanced',
      team.fansCount ?? 12500,
      JSON.stringify(team.selectedLineup || {}),
      JSON.stringify(team.assignedChampions || {}),
      JSON.stringify(team.coaches || []),
      JSON.stringify(pvpStats),
      now
    );

    // Step 2: Replace normalized club_players rows (active roster + starter_pack)
    db.prepare(`DELETE FROM club_players WHERE user_id = ?`).run(userId);
    const insertPlayerStmt = db.prepare(
      `INSERT INTO club_players (
        user_id, player_id, squad_status, in_game_name, real_name, age, role,
        salary, morale, energy, level, exp, max_exp, combat_point, market_price,
        dna_max_mechanics, dna_max_awareness, dna_base_ego, dna_learning_speed,
        stat_mechanics, stat_awareness, stat_teamwork, stat_professionalism,
        stat_clutch, stat_consistency, stat_stamina,
        conditions_json, equipped_gear_json, masteries_json, avatar
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const p of team.roster || []) {
      insertPlayerStmt.run(
        userId,
        p.id,
        'active',
        p.inGameName,
        p.realName || p.inGameName,
        p.age || 19,
        p.role,
        p.salary || 1000,
        p.morale ?? 85,
        p.energy ?? 90,
        p.level || 1,
        p.exp || 0,
        p.maxExp || 200,
        p.combatPoint || 70,
        p.marketPrice || 4000,
        p.dna?.maxMechanicsCap || 85,
        p.dna?.maxAwarenessCap || 85,
        p.dna?.baseEgo || 40,
        p.dna?.learningSpeed || 1.1,
        p.stats?.mechanics || 70,
        p.stats?.mapAwareness || 70,
        p.stats?.teamwork || 70,
        p.stats?.professionalism || 70,
        p.stats?.clutch || 70,
        p.stats?.consistency || 70,
        p.stats?.stamina || 75,
        JSON.stringify(p.conditions || []),
        JSON.stringify(p.equippedGear || {}),
        JSON.stringify(p.championMasteries || {}),
        p.avatar || ''
      );
    }

    for (const p of pendingStarter) {
      insertPlayerStmt.run(
        userId,
        p.id,
        'starter_pack',
        p.inGameName,
        p.realName || p.inGameName,
        p.age || 18,
        p.role,
        p.salary || 900,
        p.morale ?? 90,
        p.energy ?? 100,
        p.level || 2,
        p.exp || 100,
        p.maxExp || 400,
        p.combatPoint || 72,
        p.marketPrice || 4200,
        p.dna?.maxMechanicsCap || 90,
        p.dna?.maxAwarenessCap || 88,
        p.dna?.baseEgo || 35,
        p.dna?.learningSpeed || 1.2,
        p.stats?.mechanics || 72,
        p.stats?.mapAwareness || 72,
        p.stats?.teamwork || 74,
        p.stats?.professionalism || 80,
        p.stats?.clutch || 75,
        p.stats?.consistency || 78,
        p.stats?.stamina || 84,
        JSON.stringify(p.conditions || []),
        JSON.stringify(p.equippedGear || {}),
        JSON.stringify(p.championMasteries || {}),
        p.avatar || ''
      );
    }

    // Step 3: Replace normalized club_market_listings rows
    db.prepare(`DELETE FROM club_market_listings WHERE user_id = ?`).run(userId);
    const insertListingStmt = db.prepare(
      `INSERT INTO club_market_listings (
        user_id, listing_id, price, listed_by, scouted_at,
        player_id, in_game_name, role, combat_point, player_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const m of marketListings) {
      if (!m || !m.player) continue;
      insertListingStmt.run(
        userId,
        m.id,
        m.price || 4000,
        m.listedBy || 'free_agent',
        m.scoutedAt || 'Free Agent Pool',
        m.player.id,
        m.player.inGameName,
        m.player.role,
        m.player.combatPoint || 75,
        JSON.stringify(m.player)
      );
    }

    // Step 4: Keep club_states mirror synchronized
    db.prepare(
      `INSERT INTO club_states (
        user_id, current_day, team_json, market_json, pvp_stats_json, pending_starter_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        current_day = excluded.current_day,
        team_json = excluded.team_json,
        market_json = excluded.market_json,
        pvp_stats_json = excluded.pvp_stats_json,
        pending_starter_json = excluded.pending_starter_json,
        updated_at = excluded.updated_at`
    ).run(
      userId,
      currentDay,
      JSON.stringify(team),
      JSON.stringify(marketListings),
      JSON.stringify(pvpStats),
      JSON.stringify(pendingStarter),
      now
    );

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('[SQLite DB] Error saving normalized club state:', err);
  }
}

function getClubStateForUser(userId) {
  // Primary: Read from normalized relational tables (clubs + club_players + club_market_listings)
  const clubRow = db.prepare(`SELECT * FROM clubs WHERE user_id = ?`).get(userId);
  if (clubRow) {
    try {
      const activePlayers = db
        .prepare(`SELECT * FROM club_players WHERE user_id = ? AND squad_status = 'active'`)
        .all(userId)
        .map(mapPlayerRowToObject);

      const starterPlayers = db
        .prepare(`SELECT * FROM club_players WHERE user_id = ? AND squad_status = 'starter_pack'`)
        .all(userId)
        .map(mapPlayerRowToObject);

      const marketRows = db
        .prepare(`SELECT * FROM club_market_listings WHERE user_id = ?`)
        .all(userId)
        .map((m) => ({
          id: m.listing_id,
          price: m.price,
          listedBy: m.listed_by,
          scoutedAt: m.scouted_at,
          player: JSON.parse(m.player_json)
        }));

      return {
        currentDay: clubRow.current_day,
        myTeam: {
          id: clubRow.club_id,
          name: clubRow.club_name,
          shortName: clubRow.short_name,
          coachName: clubRow.coach_name,
          totalBudget: clubRow.total_budget,
          teamReputation: clubRow.team_reputation,
          currentTactic: clubRow.current_tactic,
          fansCount: clubRow.fans_count,
          selectedLineup: JSON.parse(clubRow.lineup_json || '{}'),
          assignedChampions: JSON.parse(clubRow.assigned_champions_json || '{}'),
          coaches: JSON.parse(clubRow.coaches_json || '[]'),
          roster: activePlayers
        },
        marketListings: marketRows,
        championPvPStats: JSON.parse(clubRow.pvp_stats_json || '{}'),
        pendingStarterSquad: starterPlayers
      };
    } catch (err) {
      console.error('[SQLite DB] Error reading normalized club tables:', err);
    }
  }

  // Fallback & Auto-Migrate existing club_states row into normalized tables
  const row = db.prepare(`SELECT * FROM club_states WHERE user_id = ?`).get(userId);
  if (!row) return null;
  try {
    const parsedState = {
      currentDay: row.current_day,
      myTeam: JSON.parse(row.team_json),
      marketListings: JSON.parse(row.market_json),
      championPvPStats: JSON.parse(row.pvp_stats_json),
      pendingStarterSquad: row.pending_starter_json ? JSON.parse(row.pending_starter_json) : []
    };
    saveNormalizedClubState(userId, parsedState);
    return parsedState;
  } catch (err) {
    console.error('[SQLite DB] Error parsing club_states JSON:', err);
    return null;
  }
}

// Helper to parse JSON body from HTTP request
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(payload));
}

// ============================================================================
// 3. HTTP REST API SERVER + WEBSOCKET SERVER
// ============================================================================
const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  try {
    // --- GET /api/db/status ---
    if (req.method === 'GET' && pathname === '/api/db/status') {
      const userCount = db.prepare(`SELECT COUNT(*) as count FROM users`).get().count;
      const matchCount = db.prepare(`SELECT COUNT(*) as count FROM match_history`).get().count;
      return sendJson(res, 200, {
        status: 'online',
        engine: 'SQLite (node:sqlite WAL)',
        dbFile: 'database/espician.sqlite',
        totalUsers: userCount,
        totalMatches: matchCount
      });
    }

    // --- POST /api/auth/register ---
    if (req.method === 'POST' && pathname === '/api/auth/register') {
      const body = await readJsonBody(req);
      const username = (body.username || '').trim();
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';
      const initialClubState = body.initialClubState || null;

      if (username.length < 3) {
        return sendJson(res, 400, {
          error: 'ชื่อผู้ใช้ (Username) ต้องมีความยาวอย่างน้อย 3 ตัวอักษร'
        });
      }
      if (!email.includes('@') || email.length < 5) {
        return sendJson(res, 400, {
          error: 'รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'
        });
      }
      if (password.length < 6) {
        return sendJson(res, 400, {
          error: 'รหัสผ่าน (Password) ต้องมีความยาวอย่างน้อย 6 ตัวอักษร'
        });
      }

      // Check existing username or email in SQLite
      const existing = db
        .prepare(`SELECT id, username, email FROM users WHERE username = ? OR email = ?`)
        .get(username, email);

      if (existing) {
        const dupField =
          existing.username.toLowerCase() === username.toLowerCase()
            ? `ชื่อผู้ใช้ "${username}"`
            : `อีเมล "${email}"`;
        return sendJson(res, 409, {
          error: `${dupField} มีอยู่ในฐานข้อมูลแล้ว กรุณาใช้ชื่ออื่นหรือกดเข้าสู่ระบบ`
        });
      }

      const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const { hash, salt } = hashPassword(password);
      const now = new Date().toISOString();
      const clubName = `${username} Esports`;
      const coachName = username;
      const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;

      db.prepare(
        `INSERT INTO users (
          id, username, email, password_hash, password_salt, provider,
          avatar, club_name, coach_name, is_tutorial_completed, created_at, last_login_at
        ) VALUES (?, ?, ?, ?, ?, 'custom', ?, ?, ?, 0, ?, ?)`
      ).run(userId, username, email, hash, salt, avatar, clubName, coachName, now, now);

      if (initialClubState && initialClubState.myTeam) {
        saveNormalizedClubState(userId, initialClubState);
      }

      const token = createSession(userId);
      const createdUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);

      console.log(`[SQLite Auth] Registered new user: ${username} (${email})`);
      return sendJson(res, 201, {
        token,
        user: formatUserResponse(createdUser),
        clubState: getClubStateForUser(userId)
      });
    }

    // --- POST /api/auth/login ---
    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const body = await readJsonBody(req);
      const identifier = (body.identifier || body.username || body.email || '').trim();
      const password = body.password || '';

      if (!identifier || !password) {
        return sendJson(res, 400, {
          error: 'กรุณากรอกชื่อผู้ใช้ (หรืออีเมล) และรหัสผ่านให้ครบถ้วน'
        });
      }

      const userRow = db
        .prepare(`SELECT * FROM users WHERE username = ? OR email = ?`)
        .get(identifier, identifier.toLowerCase());

      if (!userRow) {
        return sendJson(res, 401, {
          error: `ไม่พบบัญชี "${identifier}" ในฐานข้อมูล กรุณากดสมัครสมาชิก (Create Account) ก่อน`
        });
      }

      if (userRow.provider === 'google' && !userRow.password_hash) {
        return sendJson(res, 401, {
          error: 'บัญชีนี้ผูกกับ Google Account กรุณาเข้าสู่ระบบด้วยปุ่ม Sign in with Google'
        });
      }

      const isValid = verifyPassword(password, userRow.password_hash, userRow.password_salt);
      if (!isValid) {
        return sendJson(res, 401, {
          error: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านของคุณอีกครั้ง'
        });
      }

      const now = new Date().toISOString();
      db.prepare(`UPDATE users SET last_login_at = ? WHERE id = ?`).run(now, userRow.id);

      const token = createSession(userRow.id);
      console.log(`[SQLite Auth] User logged in: ${userRow.username}`);

      return sendJson(res, 200, {
        token,
        user: formatUserResponse(userRow),
        clubState: getClubStateForUser(userRow.id)
      });
    }

    // --- GET /api/auth/google/url (Returns Google OAuth 2.0 Authorization Endpoint URL) ---
    if (req.method === 'GET' && pathname === '/api/auth/google/url') {
      const envCfg = loadEnvConfig();
      const clientId = urlObj.searchParams.get('client_id') || envCfg.clientId;
      const redirectUri = urlObj.searchParams.get('redirect_uri') || envCfg.redirectUri;

      if (!clientId) {
        return sendJson(res, 400, {
          error:
            'ยังไม่ได้ตั้งค่า GOOGLE_CLIENT_ID และ GOOGLE_CLIENT_SECRET ในไฟล์ .env บนเซิร์ฟเวอร์'
        });
      }

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'select_account');

      return sendJson(res, 200, {
        url: authUrl.toString(),
        redirectUri,
        hasClientSecretConfigured: Boolean(envCfg.clientSecret)
      });
    }

    // --- GET or POST /api/auth/google/callback (Secure Backend Authorization Code Exchange) ---
    if (
      (req.method === 'GET' || req.method === 'POST') &&
      pathname === '/api/auth/google/callback'
    ) {
      const envCfg = loadEnvConfig();
      let code = urlObj.searchParams.get('code') || '';
      let errorParam = urlObj.searchParams.get('error') || '';
      let initialClubState = null;

      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        code = body.code || code;
        initialClubState = body.initialClubState || null;
      }

      if (errorParam) {
        if (req.method === 'GET') {
          res.writeHead(302, {
            Location: `${envCfg.frontendUrl}/?auth_error=${encodeURIComponent(
              `Google OAuth ถูกยกเลิก: ${errorParam}`
            )}`
          });
          return res.end();
        }
        return sendJson(res, 400, { error: `Google OAuth error: ${errorParam}` });
      }

      if (!code) {
        return sendJson(res, 400, { error: 'ไม่พบรหัส Authorization Code จาก Google' });
      }

      if (!envCfg.clientId || !envCfg.clientSecret) {
        const msg =
          'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า GOOGLE_CLIENT_ID หรือ GOOGLE_CLIENT_SECRET ในไฟล์ .env';
        if (req.method === 'GET') {
          res.writeHead(302, {
            Location: `${envCfg.frontendUrl}/?auth_error=${encodeURIComponent(msg)}`
          });
          return res.end();
        }
        return sendJson(res, 500, { error: msg });
      }

      // 1. Exchange Authorization Code for Access Token & ID Token using Client ID + Client Secret
      const tokenParams = new URLSearchParams({
        code,
        client_id: envCfg.clientId,
        client_secret: envCfg.clientSecret,
        redirect_uri: envCfg.redirectUri,
        grant_type: 'authorization_code'
      });

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString()
      });

      const tokenData = await tokenRes.json().catch(() => ({}));
      if (!tokenRes.ok || !tokenData.access_token) {
        const errDetail =
          tokenData.error_description || tokenData.error || 'Token exchange failed';
        console.error('[Google OAuth Callback] Token exchange error:', tokenData);
        if (req.method === 'GET') {
          res.writeHead(302, {
            Location: `${envCfg.frontendUrl}/?auth_error=${encodeURIComponent(
              `แลกเปลี่ยนรหัส Google OAuth ไม่สำเร็จ: ${errDetail}`
            )}`
          });
          return res.end();
        }
        return sendJson(res, 401, {
          error: `แลกเปลี่ยนรหัส Google OAuth ไม่สำเร็จ: ${errDetail}`
        });
      }

      // 2. Fetch Google User Profile using the verified Access Token
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });

      const googleProfile = await profileRes.json().catch(() => null);
      if (!profileRes.ok || !googleProfile || !googleProfile.sub || !googleProfile.email) {
        const msg = 'ไม่สามารถดึงข้อมูลโปรไฟล์จาก Google UserInfo API ได้';
        if (req.method === 'GET') {
          res.writeHead(302, {
            Location: `${envCfg.frontendUrl}/?auth_error=${encodeURIComponent(msg)}`
          });
          return res.end();
        }
        return sendJson(res, 401, { error: msg });
      }

      // 3. Automatically Create or Log the User into SQLite Database
      const googleSub = googleProfile.sub;
      const email = googleProfile.email.toLowerCase();
      const displayName =
        googleProfile.name || googleProfile.given_name || email.split('@')[0] || 'GoogleCoach';
      const picture =
        googleProfile.picture ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`;
      const now = new Date().toISOString();

      let userRow = db
        .prepare(`SELECT * FROM users WHERE google_sub = ? OR email = ?`)
        .get(googleSub, email);

      if (!userRow) {
        let candidateUsername = displayName.replace(/\s+/g, '');
        if (candidateUsername.length < 3) candidateUsername = `Coach_${googleSub.slice(-4)}`;
        const nameTaken = db
          .prepare(`SELECT id FROM users WHERE username = ?`)
          .get(candidateUsername);
        if (nameTaken) {
          candidateUsername = `${candidateUsername}_${googleSub.slice(-4)}`;
        }

        const userId = `usr_google_${Date.now()}`;
        const clubName = `${displayName} Esports`;

        db.prepare(
          `INSERT INTO users (
            id, username, email, password_hash, password_salt, provider, google_sub,
            avatar, club_name, coach_name, is_tutorial_completed, account_level, account_exp, created_at, last_login_at
          ) VALUES (?, ?, ?, NULL, NULL, 'google', ?, ?, ?, ?, 0, 1, 0, ?, ?)`
        ).run(userId, candidateUsername, email, googleSub, picture, clubName, displayName, now, now);

        if (initialClubState && initialClubState.myTeam) {
          saveNormalizedClubState(userId, initialClubState);
        }

        userRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
        console.log(`[Google OAuth Callback] Created new SQLite user: ${email} (${googleSub})`);
      } else {
        db.prepare(
          `UPDATE users SET google_sub = ?, avatar = ?, last_login_at = ? WHERE id = ?`
        ).run(googleSub, picture, now, userRow.id);
        userRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userRow.id);
        console.log(`[Google OAuth Callback] Logged in existing SQLite user: ${email}`);
      }

      const sessionToken = createSession(userRow.id);

      // 4. Redirect back to Frontend with Session Token (if GET redirect) or return JSON (if POST)
      if (req.method === 'GET') {
        res.writeHead(302, {
          Location: `${envCfg.frontendUrl}/?auth_token=${encodeURIComponent(sessionToken)}`
        });
        return res.end();
      }

      return sendJson(res, 200, {
        token: sessionToken,
        user: formatUserResponse(userRow),
        clubState: getClubStateForUser(userRow.id)
      });
    }

    // --- POST /api/auth/google (Real Google OAuth 2.0 Verification + DB Upsert) ---
    if (req.method === 'POST' && pathname === '/api/auth/google') {
      const body = await readJsonBody(req);
      const { accessToken, idToken, initialClubState } = body;

      if (!accessToken && !idToken) {
        return sendJson(res, 400, {
          error: 'ไม่พบ Google OAuth Token กรุณาล็อกอินผ่านหน้าต่าง Google จริง'
        });
      }

      let googleProfile = null;

      // Verify token directly against official Google OAuth endpoints
      if (accessToken) {
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!googleRes.ok) {
          return sendJson(res, 401, {
            error: 'Google Access Token ไม่ผ่านการตรวจสอบจากเซิร์ฟเวอร์ Google'
          });
        }
        googleProfile = await googleRes.json();
      } else if (idToken) {
        const googleRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
        );
        if (!googleRes.ok) {
          return sendJson(res, 401, {
            error: 'Google ID Token (JWT) ไม่ผ่านการตรวจสอบจากเซิร์ฟเวอร์ Google'
          });
        }
        googleProfile = await googleRes.json();
      }

      if (!googleProfile || !googleProfile.sub || !googleProfile.email) {
        return sendJson(res, 401, {
          error: 'ข้อมูลโปรไฟล์จาก Google ไม่สมบูรณ์'
        });
      }

      const googleSub = googleProfile.sub;
      const email = googleProfile.email.toLowerCase();
      const displayName =
        googleProfile.name || googleProfile.given_name || email.split('@')[0] || 'GoogleCoach';
      const picture =
        googleProfile.picture ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`;
      const now = new Date().toISOString();

      // Check if user already exists by google_sub or email
      let userRow = db
        .prepare(`SELECT * FROM users WHERE google_sub = ? OR email = ?`)
        .get(googleSub, email);

      if (!userRow) {
        // Ensure unique username
        let candidateUsername = displayName.replace(/\s+/g, '');
        if (candidateUsername.length < 3) candidateUsername = `Coach_${googleSub.slice(-4)}`;
        const nameTaken = db
          .prepare(`SELECT id FROM users WHERE username = ?`)
          .get(candidateUsername);
        if (nameTaken) {
          candidateUsername = `${candidateUsername}_${googleSub.slice(-4)}`;
        }

        const userId = `usr_google_${Date.now()}`;
        const clubName = `${displayName} Esports`;

        db.prepare(
          `INSERT INTO users (
            id, username, email, password_hash, password_salt, provider, google_sub,
            avatar, club_name, coach_name, is_tutorial_completed, created_at, last_login_at
          ) VALUES (?, ?, ?, NULL, NULL, 'google', ?, ?, ?, ?, 0, ?, ?)`
        ).run(userId, candidateUsername, email, googleSub, picture, clubName, displayName, now, now);

        if (initialClubState && initialClubState.myTeam) {
          saveNormalizedClubState(userId, initialClubState);
        }

        userRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
        console.log(`[SQLite Auth] Created new Google OAuth user: ${email}`);
      } else {
        db.prepare(
          `UPDATE users SET google_sub = ?, avatar = ?, last_login_at = ? WHERE id = ?`
        ).run(googleSub, picture, now, userRow.id);
        userRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userRow.id);
        console.log(`[SQLite Auth] Existing Google OAuth user logged in: ${email}`);
      }

      const token = createSession(userRow.id);
      return sendJson(res, 200, {
        token,
        user: formatUserResponse(userRow),
        clubState: getClubStateForUser(userRow.id)
      });
    }

    // --- GET /api/auth/me ---
    if (req.method === 'GET' && pathname === '/api/auth/me') {
      const auth = getUserFromRequest(req);
      if (!auth) {
        return sendJson(res, 401, { error: 'เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' });
      }
      return sendJson(res, 200, {
        user: formatUserResponse(auth.user),
        clubState: getClubStateForUser(auth.user.id)
      });
    }

    // --- POST /api/auth/logout ---
    if (req.method === 'POST' && pathname === '/api/auth/logout') {
      const auth = getUserFromRequest(req);
      if (auth) {
        db.prepare(`DELETE FROM sessions WHERE token = ?`).run(auth.token);
      }
      return sendJson(res, 200, { success: true });
    }

    // --- PUT /api/club/state (Save Club & Game Progress to SQLite) ---
    if (req.method === 'PUT' && pathname === '/api/club/state') {
      const auth = getUserFromRequest(req);
      if (!auth) {
        return sendJson(res, 401, { error: 'Unauthorized' });
      }

      const body = await readJsonBody(req);
      const now = new Date().toISOString();
      const userId = auth.user.id;

      if (typeof body.isTutorialCompleted === 'boolean') {
        db.prepare(`UPDATE users SET is_tutorial_completed = ? WHERE id = ?`).run(
          body.isTutorialCompleted ? 1 : 0,
          userId
        );
      }

      if (typeof body.accountLevel === 'number' && typeof body.accountExp === 'number') {
        db.prepare(`UPDATE users SET account_level = ?, account_exp = ? WHERE id = ?`).run(
          body.accountLevel,
          body.accountExp,
          userId
        );
      }

      if (body.myTeam) {
        db.prepare(`UPDATE users SET club_name = ?, coach_name = ? WHERE id = ?`).run(
          body.myTeam.name || auth.user.club_name,
          body.myTeam.coachName || auth.user.coach_name,
          userId
        );

        saveNormalizedClubState(userId, {
          currentDay: body.currentDay || 1,
          myTeam: body.myTeam,
          marketListings: body.marketListings || [],
          championPvPStats: body.championPvPStats || {},
          pendingStarterSquad: body.pendingStarterSquad || []
        });
      }

      return sendJson(res, 200, { success: true, savedAt: now });
    }

    // --- POST /api/club/match-history ---
    if (req.method === 'POST' && pathname === '/api/club/match-history') {
      const auth = getUserFromRequest(req);
      if (!auth) {
        return sendJson(res, 401, { error: 'Unauthorized' });
      }
      const body = await readJsonBody(req);
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO match_history (user_id, winner, prize, rep_gain, day, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        auth.user.id,
        body.winner || 'blue',
        body.prize || 0,
        body.repGain || 0,
        body.day || 1,
        now
      );
      return sendJson(res, 201, { success: true });
    }

    // --- GET /api/fishing/state ---
    if (req.method === 'GET' && pathname === '/api/fishing/state') {
      const auth = getUserFromRequest(req);
      if (!auth) {
        return sendJson(res, 401, { error: 'Unauthorized' });
      }
      const row = db
        .prepare(`SELECT state_json FROM fishing_states WHERE user_id = ?`)
        .get(auth.user.id);
      if (!row || !row.state_json) {
        return sendJson(res, 200, { state: null });
      }
      return sendJson(res, 200, { state: JSON.parse(row.state_json) });
    }

    // --- PUT /api/fishing/state ---
    if (req.method === 'PUT' && pathname === '/api/fishing/state') {
      const auth = getUserFromRequest(req);
      if (!auth) {
        return sendJson(res, 401, { error: 'Unauthorized' });
      }
      const body = await readJsonBody(req);
      const now = new Date().toISOString();
      const st = body.state || body;
      db.prepare(
        `INSERT INTO fishing_states (
          user_id, angler_level, angler_exp, sea_coins, equipped_rod_id, equipped_bait_id, total_catches, state_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          angler_level = excluded.angler_level,
          angler_exp = excluded.angler_exp,
          sea_coins = excluded.sea_coins,
          equipped_rod_id = excluded.equipped_rod_id,
          equipped_bait_id = excluded.equipped_bait_id,
          total_catches = excluded.total_catches,
          state_json = excluded.state_json,
          updated_at = excluded.updated_at`
      ).run(
        auth.user.id,
        st.anglerLevel || 1,
        st.anglerExp || 0,
        st.seaCoins ?? 250,
        st.equippedRodId || 'rod_bamboo',
        st.equippedBaitId || 'bait_dough',
        st.totalCatches || 0,
        JSON.stringify(st),
        now
      );
      return sendJson(res, 200, { success: true, savedAt: now });
    }

    // Default health check
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(`Espician SQLite Backend & LAN Multiplayer Server running on port ${PORT}`);
  } catch (err) {
    console.error('[API Server Error]:', err);
    return sendJson(res, 500, { error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ฐานข้อมูล' });
  }
});

// ============================================================================
// 4. WEBSOCKET LAN MULTIPLAYER RELAY
// ============================================================================
const wss = new WebSocketServer({ server });
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'ESP-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

wss.on('connection', (ws) => {
  console.log('[Online Server] New client connected');
  let currentRoomCode = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'CREATE_ROOM': {
          const roomCode = generateRoomCode();
          currentRoomCode = roomCode;
          rooms.set(roomCode, {
            code: roomCode,
            hostWs: ws,
            guestWs: null,
            hostTeam: data.team,
            guestTeam: null,
            status: 'waiting'
          });

          ws.send(
            JSON.stringify({
              type: 'ROOM_CREATED',
              code: roomCode,
              isHost: true,
              team: data.team
            })
          );
          break;
        }

        case 'JOIN_ROOM': {
          const targetCode = data.code?.trim().toUpperCase();
          const room = rooms.get(targetCode);

          if (!room) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                message: `ไม่พบห้องรหัส "${targetCode}" กรุณาตรวจสอบรหัสห้องอีกครั้ง`
              })
            );
            return;
          }

          if (room.guestWs && room.guestWs.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                message: `ห้อง "${targetCode}" มีผู้เล่นเข้าร่วมเต็มแล้ว (2/2)`
              })
            );
            return;
          }

          currentRoomCode = targetCode;
          room.guestWs = ws;
          room.guestTeam = data.team;
          room.status = 'ready';

          if (room.hostWs && room.hostWs.readyState === WebSocket.OPEN) {
            room.hostWs.send(
              JSON.stringify({
                type: 'GUEST_JOINED',
                code: targetCode,
                enemyTeam: data.team,
                status: 'ready'
              })
            );
          }

          ws.send(
            JSON.stringify({
              type: 'ROOM_JOINED',
              code: targetCode,
              isHost: false,
              enemyTeam: room.hostTeam,
              status: 'ready'
            })
          );
          break;
        }

        case 'START_ONLINE_MATCH': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (room) {
            room.status = 'playing';
            const payload = JSON.stringify({ type: 'MATCH_STARTED' });
            if (room.hostWs?.readyState === WebSocket.OPEN) room.hostWs.send(payload);
            if (room.guestWs?.readyState === WebSocket.OPEN) room.guestWs.send(payload);
          }
          break;
        }

        case 'SYNC_MATCH_ACTION': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (room) {
            const target = ws === room.hostWs ? room.guestWs : room.hostWs;
            if (target && target.readyState === WebSocket.OPEN) {
              target.send(
                JSON.stringify({
                  type: 'SYNC_MATCH_ACTION',
                  action: data.action
                })
              );
            }
          }
          break;
        }
      }
    } catch (err) {
      console.error('[Online Server] Message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomCode && rooms.has(currentRoomCode)) {
      const room = rooms.get(currentRoomCode);
      if (ws === room.hostWs) {
        if (room.guestWs?.readyState === WebSocket.OPEN) {
          room.guestWs.send(
            JSON.stringify({
              type: 'OPPONENT_DISCONNECTED',
              message: 'เจ้าของห้องตัดการเชื่อมต่อ ห้องถูกปิดแล้ว'
            })
          );
        }
        rooms.delete(currentRoomCode);
      } else if (ws === room.guestWs) {
        room.guestWs = null;
        room.guestTeam = null;
        room.status = 'waiting';
        if (room.hostWs?.readyState === WebSocket.OPEN) {
          room.hostWs.send(
            JSON.stringify({
              type: 'OPPONENT_DISCONNECTED',
              message: 'คู่แข่งออกจากห้อง กำลังรอผู้เล่นใหม่...'
            })
          );
        }
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SQLite + LAN Server] Listening on http://0.0.0.0:${PORT}`);
});
