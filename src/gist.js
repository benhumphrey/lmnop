const TOKEN_KEY = 'lmnop_gh_token';
const GIST_ID_KEY = 'lmnop_gist_id';
const GIST_FILENAME = 'lmnop-recipes.json';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token.trim());
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getGistId() {
  return localStorage.getItem(GIST_ID_KEY) || null;
}

export function saveGistId(id) {
  localStorage.setItem(GIST_ID_KEY, id);
}

// Find an existing LMNOP gist by filename, or return null
async function findGist(token) {
  const res = await fetch('https://api.github.com/gists', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (!res.ok) return null;
  const gists = await res.json();
  return gists.find(g => g.files && g.files[GIST_FILENAME]) || null;
}

// Create a new gist with current recipes
async function createGist(token, recipes) {
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'LMNOP electrolyte recipes',
      public: true,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(recipes, null, 2),
        },
      },
    }),
  });
  if (!res.ok) throw new Error('Failed to create gist');
  const data = await res.json();
  saveGistId(data.id);
  return data.id;
}

// Update existing gist
async function updateGist(token, gistId, recipes) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(recipes, null, 2),
        },
      },
    }),
  });
  if (!res.ok) throw new Error('Failed to update gist');
}

// Load recipes from gist (public read — no token needed if gist ID is known)
export async function loadFromGist(gistId) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const file = data.files?.[GIST_FILENAME];
  if (!file) return null;
  // For large files, content may need to be fetched from raw_url
  const content = file.truncated
    ? await (await fetch(file.raw_url)).text()
    : file.content;
  return JSON.parse(content);
}

// Save recipes — finds or creates gist as needed
export async function saveToGist(token, recipes) {
  let gistId = getGistId();
  if (gistId) {
    try {
      await updateGist(token, gistId, recipes);
      return gistId;
    } catch (_) {
      // Gist may have been deleted — fall through to find/create
    }
  }
  // Try to find existing gist
  const existing = await findGist(token);
  if (existing) {
    saveGistId(existing.id);
    await updateGist(token, existing.id, recipes);
    return existing.id;
  }
  // Create fresh
  return await createGist(token, recipes);
}

// Validate token and return user login, or throw
export async function validateToken(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (!res.ok) throw new Error('Invalid token');
  const data = await res.json();
  return data.login;
}
