/**
 * Serveur de données de développement : json-server 0.17.4 utilisé comme module Express.
 *
 *   npm run api          # http://localhost:5050
 *   npm run api:reset    # restaure les données de référence puis démarre
 *
 * - `db.seed.json` (versionné) est copié vers `db.json` (ignoré par Git) au premier démarrage.
 * - Authentification par jeton opaque : POST /auth/login, GET /auth/me, POST /auth/logout.
 * - Toute autre route exige `Authorization: Bearer <jeton>` ; `/users` et `/db` ne sont pas exposés.
 * - Les notifications sont cloisonnées par utilisateur (`userId` imposé par le serveur).
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const jsonServer = require('json-server');

const PORT = Number(process.env.API_PORT ?? 5050);
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const SEED_FILE = path.join(__dirname, 'db.seed.json');
const DB_FILE = path.join(__dirname, 'db.json');

if (process.argv.includes('--reset') || !fs.existsSync(DB_FILE)) {
  fs.copyFileSync(SEED_FILE, DB_FILE);
}

const server = jsonServer.create();
const router = jsonServer.router(DB_FILE);
const db = router.db;

/** Jetons actifs : jeton → { userId, expiresAt }. Perdus au redémarrage (le client reçoit 401). */
const sessions = new Map();

function verifyPassword(password, stored) {
  const [scheme, salt, expected] = String(stored).split('$');
  if (scheme !== 'scrypt' || !salt || !expected) return false;
  const actual = crypto.scryptSync(String(password ?? ''), salt, 64);
  const expectedBuffer = Buffer.from(expected, 'hex');
  return expectedBuffer.length === actual.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

function publicUser({ id, name, email }) {
  return { id, name, email };
}

function bearerToken(req) {
  const match = /^Bearer (\S+)$/.exec(req.get('Authorization') ?? '');
  return match ? match[1] : null;
}

function activeSession(token) {
  const session = token ? sessions.get(token) : undefined;
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

// Logger, no-cache et body-parser ; pas de CORS : le navigateur passe par le proxy d'Angular.
server.use(jsonServer.defaults({ noCors: true, static: path.join(__dirname, 'public') }));
server.use(jsonServer.bodyParser);

// --- Route publique ---------------------------------------------------------------------------

server.post('/auth/login', (req, res) => {
  const { username, password } = req.body ?? {};
  const login = String(username ?? '').trim().toLowerCase();
  const user = db
    .get('users')
    .find((candidate) => candidate.email.toLowerCase() === login)
    .value();

  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect.' });
  }

  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(token, { userId: user.id, expiresAt });
  return res.json({ token, expiresAt: new Date(expiresAt).toISOString(), user: publicUser(user) });
});

// --- Contrôle d'accès : tout le reste exige un jeton valide -------------------------------------

server.use((req, res, next) => {
  const token = bearerToken(req);
  const session = activeSession(token);
  if (!session) {
    return res.status(401).json({ message: 'Authentification requise.' });
  }
  req.token = token;
  req.userId = session.userId;
  return next();
});

server.get('/auth/me', (req, res) => {
  const user = db.get('users').find({ id: req.userId }).value();
  return user ? res.json(publicUser(user)) : res.sendStatus(401);
});

server.post('/auth/logout', (req, res) => {
  sessions.delete(req.token);
  return res.sendStatus(204);
});

// Ressources internes jamais exposées (mots de passe, base complète).
server.use(['/users', '/db'], (_req, res) => res.sendStatus(404));

// --- Cloisonnement des notifications par utilisateur ------------------------------------------

server.use('/notifications', (req, res, next) => {
  const [id, ...nested] = req.path.split('/').filter(Boolean);

  if (nested.length > 0) {
    return res.sendStatus(404);
  }
  if (id) {
    const notification = db.get('notifications').find({ id }).value();
    if (!notification || notification.userId !== req.userId) {
      return res.sendStatus(404);
    }
  } else if (req.method === 'GET') {
    req.query.userId = String(req.userId);
  }

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const { userId: _ignored, id: _id, ...body } = req.body ?? {};
    req.body = { ...body, userId: req.userId };
    if (req.method === 'POST') {
      req.body.id = crypto.randomUUID();
      req.body.createdAt = new Date().toISOString();
      req.body.readAt = null;
    }
  }
  return next();
});

// Le client ne voit jamais le propriétaire d'une notification.
router.render = (req, res) => {
  const isNotification = req.originalUrl.startsWith('/notifications');
  const strip = (item) => {
    if (!isNotification || !item || typeof item !== 'object') return item;
    const { userId: _userId, ...rest } = item;
    return rest;
  };
  const data = res.locals.data;
  res.jsonp(Array.isArray(data) ? data.map(strip) : strip(data));
};

server.use(router);

server.listen(PORT, () => {
  console.log(`API json-server : http://localhost:${PORT} (données : ${path.relative(process.cwd(), DB_FILE)})`);
});
