// Firestore and Auth for the server, without a service account.
//
// Service-account key creation is blocked by org policy on this Google Cloud
// org, so `admin.credential.cert(...)` has nothing to be given and
// `applicationDefault()` finds nothing on Vercel. Rather than fight the policy,
// the server signs in as one ordinary Firebase user — the robot — and talks to
// the Firestore and Identity REST APIs with that user's ID token.
//
// The one consequence worth holding on to: the Admin SDK ignored security
// rules, and the robot does not. Everything the server does now has to be
// allowed by firestore.rules, where the robot's uid is named explicitly.

const PROJECT_ID =
  process.env.GCLOUD_PROJECT
  || process.env.VITE_FIREBASE_PROJECT_ID
  || process.env.FIREBASE_PROJECT_ID;

const WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY;
const ROBOT_EMAIL = process.env.FIREBASE_ROBOT_EMAIL;
const ROBOT_PASSWORD = process.env.FIREBASE_ROBOT_PASSWORD;

const DOCS = () =>
  `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function requireConfig() {
  const missing = [];
  if (!PROJECT_ID) missing.push('VITE_FIREBASE_PROJECT_ID');
  if (!WEB_API_KEY) missing.push('FIREBASE_WEB_API_KEY');
  if (!ROBOT_EMAIL) missing.push('FIREBASE_ROBOT_EMAIL');
  if (!ROBOT_PASSWORD) missing.push('FIREBASE_ROBOT_PASSWORD');
  if (missing.length) {
    const err = new Error(`Server Firebase access is not configured: ${missing.join(', ')}`);
    err.missing = missing;
    throw err;
  }
}

// The token lives an hour and a serverless instance rarely lives that long,
// but instances are reused, so cache it and re-sign a minute before expiry.
let cached = { token: null, expiresAt: 0 };

async function robotToken() {
  requireConfig();
  if (cached.token && Date.now() < cached.expiresAt - 60_000) return cached.token;

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(WEB_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ROBOT_EMAIL, password: ROBOT_PASSWORD, returnSecureToken: true }),
    },
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.idToken) {
    throw new Error(`robot-sign-in-failed:${res.status}:${body?.error?.message || 'unknown'}`);
  }
  cached = {
    token: body.idToken,
    expiresAt: Date.now() + Number(body.expiresIn || 3600) * 1000,
  };
  return cached.token;
}

async function call(path, { method = 'GET', body, query } = {}) {
  const token = await robotToken();
  const url = `${DOCS()}${path}${query ? `?${query}` : ''}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error?.message || `${res.status}`;
    const err = new Error(`firestore-rest-failed:${res.status}:${message}`);
    err.status = res.status;
    throw err;
  }
  return payload;
}

// ---- value encoding -------------------------------------------------------
// Firestore's REST shape is typed. Admin SDK hid this; the shim cannot.

function encode(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === 'string') return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  if (typeof value === 'object') return { mapValue: { fields: encodeFields(value) } };
  return { stringValue: String(value) };
}

function encodeFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === undefined) continue;
    fields[k] = encode(v);
  }
  return fields;
}

function decode(value) {
  if (!value || typeof value !== 'object') return null;
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) {
    // get-repository-data calls .toDate() on these, so keep that shape while
    // still being a real Date for comparisons and string coercion.
    const d = new Date(value.timestampValue);
    d.toDate = () => d;
    return d;
  }
  if ('arrayValue' in value) return (value.arrayValue?.values || []).map(decode);
  if ('mapValue' in value) return decodeFields(value.mapValue?.fields);
  return null;
}

function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) out[k] = decode(v);
  return out;
}

const idFromName = (name) => String(name || '').split('/').pop();

function snapshot(doc, collection) {
  const id = idFromName(doc?.name);
  const data = decodeFields(doc?.fields);
  return {
    id,
    exists: Boolean(doc?.name),
    data: () => data,
    get ref() {
      return docRef(collection, id);
    },
  };
}

// ---- document + collection ------------------------------------------------

function docRef(collection, id) {
  return {
    id,
    async get() {
      try {
        const doc = await call(`/${collection}/${encodeURIComponent(id)}`);
        return snapshot(doc, collection);
      } catch (err) {
        if (err.status === 404) {
          return { id, exists: false, data: () => undefined, ref: docRef(collection, id) };
        }
        throw err;
      }
    },
    /**
     * merge:true patches only the top-level keys present, which is how every
     * caller here uses it — each one rebuilds the sub-object it is replacing.
     * Without merge the document is overwritten, same as the Admin SDK.
     */
    async set(data, options = {}) {
      const fields = encodeFields(data);
      const query = options.merge
        ? Object.keys(fields)
          .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
          .join('&')
        : '';
      await call(`/${collection}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        query,
        body: { fields },
      });
      return { id };
    },
  };
}

function collectionRef(name, constraints = {}) {
  const withConstraint = (patch) => collectionRef(name, { ...constraints, ...patch });

  const runQuery = async () => {
    const structuredQuery = { from: [{ collectionId: name }] };
    if (constraints.where) {
      structuredQuery.where = {
        fieldFilter: {
          field: { fieldPath: constraints.where.field },
          op: 'EQUAL',
          value: encode(constraints.where.value),
        },
      };
    }
    if (constraints.orderBy) {
      structuredQuery.orderBy = [{
        field: { fieldPath: constraints.orderBy.field },
        direction: constraints.orderBy.direction === 'desc' ? 'DESCENDING' : 'ASCENDING',
      }];
    }
    if (constraints.limit) structuredQuery.limit = constraints.limit;

    const rows = await call(':runQuery', { method: 'POST', body: { structuredQuery } });
    const docs = (Array.isArray(rows) ? rows : [])
      .filter((r) => r?.document)
      .map((r) => snapshot(r.document, name));
    return { docs, size: docs.length, empty: docs.length === 0 };
  };

  return {
    doc: (id) => docRef(name, id),
    where: (field, op, value) => {
      if (op !== '==') throw new Error(`unsupported-operator:${op}`);
      return withConstraint({ where: { field, value } });
    },
    orderBy: (field, direction = 'asc') => withConstraint({ orderBy: { field, direction } }),
    limit: (n) => withConstraint({ limit: n }),
    get: runQuery,
    async add(data) {
      const doc = await call(`/${name}`, { method: 'POST', body: { fields: encodeFields(data) } });
      return { id: idFromName(doc?.name) };
    },
  };
}

export const db = {
  collection: (name) => collectionRef(name),
};

// ---- auth -----------------------------------------------------------------

export const adminAuth = {
  /** Google validates the token; a bad one comes back as an error, not a user. */
  async verifyIdToken(idToken) {
    requireConfig();
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(WEB_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    );
    const body = await res.json().catch(() => ({}));
    const user = Array.isArray(body?.users) ? body.users[0] : null;
    if (!res.ok || !user?.localId) {
      throw new Error(`verify-id-token-failed:${res.status}:${body?.error?.message || 'unknown'}`);
    }
    return {
      uid: user.localId,
      email: String(user.email || '').trim().toLowerCase(),
      email_verified: Boolean(user.emailVerified),
    };
  },

  /**
   * Generating a reset link without sending it is an admin-only operation, and
   * the robot is not an admin. `sendPasswordResetEmail` below sends Firebase's
   * own message instead — see api/send-password-reset.js, which prefers our
   * letterhead and falls back to this.
   */
  async generatePasswordResetLink() {
    const err = new Error('generate-password-reset-link-requires-admin');
    err.code = 'requires-admin';
    throw err;
  },

  async sendPasswordResetEmail(email) {
    requireConfig();
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(WEB_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
      },
    );
    const body = await res.json().catch(() => ({}));
    // An unknown address must look identical to a known one, or the form
    // enumerates customers.
    if (!res.ok && body?.error?.message !== 'EMAIL_NOT_FOUND') {
      throw new Error(`send-reset-failed:${res.status}:${body?.error?.message || 'unknown'}`);
    }
    return { ok: true };
  },
};
