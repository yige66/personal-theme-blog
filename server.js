import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const DEFAULT_PORT = Number.parseInt(process.env.PORT || '4173', 10);
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const MAX_BODY_BYTES = 1024 * 1024;
const SESSION_COOKIE = 'blog_session';
const AUTH_FILE = 'auth.json';
const DATA_FILE = 'blog.json';
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const defaultSite = {
  title: '星屿手记',
  subtitle: '写代码，也写生活里发光的片刻。',
  owner: 'Lu Longfei',
  role: '全栈练习生 / 博客系统维护者',
  motto: '把日常、代码和灵感整理成可以再次抵达的星图。',
  bio: '计算机学习者 / 后端与前端练习者 / 喜欢把复杂问题拆成可以落地的小系统。',
  status: '正在向 XHBlogs 靠齐：玻璃拟态前台、独立控制台、动态、音乐、评论和可部署内容流。',
  location: 'Changsha, China',
  email: 'hello@example.com',
  github: 'https://github.com/',
  themeColor: '#6fb7a8',
  accentColor: '#f0c36a',
  heroImage: '/assets/img/hero-mountain.svg',
  avatar: '/assets/img/avatar-orbit.svg',
  level: 12,
  experience: 68,
  streak: 27,
  assistantName: '星屿助理',
  assistantPrompt: '我会根据站点文章、动态和作者资料，为访客推荐阅读路径，并提示评论、音乐与作品集入口。',
  comments: {
    enabled: false,
    provider: 'GitHub Issues / Gitalk',
    repo: 'your-name/blog-comments',
    clientId: ''
  },
  music: [
    {
      title: '晚风经过编译器',
      artist: 'Local Playlist',
      mood: '写作 / Coding',
      url: ''
    },
    {
      title: '纸页与星轨',
      artist: '星屿电台',
      mood: '阅读 / Quiet',
      url: ''
    }
  ],
  gallery: [
    {
      title: '山脉头图',
      description: '首页主题视觉与长期写作的起点。',
      image: '/assets/img/hero-mountain.svg'
    },
    {
      title: '桌面笔记',
      description: '把学习碎片整理成专题文章。',
      image: '/assets/img/desk-notes.svg'
    },
    {
      title: '后台面板',
      description: '本地控制台承载文章、动态和备份。',
      image: '/assets/img/admin-board.svg'
    }
  ]
};

const defaultData = {
  site: defaultSite,
  links: [],
  notes: [],
  posts: []
};

export function createBlogServer(options = {}) {
  const rootDir = options.rootDir ? resolve(options.rootDir) : __dirname;
  const dataDir = options.dataDir ? resolve(options.dataDir) : join(rootDir, 'data');
  const publicDir = options.publicDir ? resolve(options.publicDir) : PUBLIC_DIR;
  const sessionStore = new Map();

  const context = {
    rootDir,
    dataDir,
    publicDir,
    sessionStore
  };

  return createServer((request, response) => {
    handleRequest(request, response, context).catch((error) => {
      console.error('Unhandled request error:', error);
      sendJson(response, 500, { success: false, error: '服务器内部错误' });
    });
  });
}

async function handleRequest(request, response, context) {
  const url = new URL(request.url || '/', 'http://localhost');

  if (url.pathname.startsWith('/api/')) {
    await handleApi(request, response, context, url);
    return;
  }

  await serveStatic(request, response, context.publicDir, url.pathname);
}

async function handleApi(request, response, context, url) {
  try {
    await handleApiRoutes(request, response, context, url);
  } catch (error) {
    if (error instanceof ApiError) {
      sendJson(response, error.statusCode, { success: false, error: error.message });
      return;
    }
    throw error;
  }
}

async function handleApiRoutes(request, response, context, url) {
  if (request.method === 'GET' && url.pathname === '/api/blog') {
    const data = await readBlogData(context);
    sendJson(response, 200, {
      success: true,
      data: toPublicBlogData(data)
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/setup-status') {
    sendJson(response, 200, {
      success: true,
      data: { needsSetup: !(await authExists(context)) }
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/setup') {
    if (await authExists(context)) {
      sendJson(response, 409, { success: false, error: '后台账号已经初始化' });
      return;
    }

    const body = await readJsonBody(request);
    const password = validatePassword(body.password);
    const auth = createPasswordRecord(password);
    await writeAuth(context, auth);
    const session = createSession(context);
    setSessionCookie(response, session.token);
    sendJson(response, 201, {
      success: true,
      data: { csrfToken: session.csrfToken }
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/login') {
    const auth = await readAuth(context);
    if (!auth) {
      sendJson(response, 428, { success: false, error: '请先初始化后台密码' });
      return;
    }

    const body = await readJsonBody(request);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!verifyPassword(password, auth)) {
      sendJson(response, 401, { success: false, error: '密码不正确' });
      return;
    }

    const session = createSession(context);
    setSessionCookie(response, session.token);
    sendJson(response, 200, {
      success: true,
      data: { csrfToken: session.csrfToken }
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/logout') {
    const session = getSession(request, context);
    if (session) {
      context.sessionStore.delete(session.token);
    }
    clearSessionCookie(response);
    sendJson(response, 200, { success: true });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/admin/state') {
    const session = requireSession(request, context);
    const data = await readBlogData(context);
    sendJson(response, 200, {
      success: true,
      data: {
        ...data,
        csrfToken: session.csrfToken
      }
    });
    return;
  }

  if (url.pathname.startsWith('/api/admin/')) {
    requireSession(request, context);
    requireCsrf(request, context);
    await handleAdminApi(request, response, context, url);
    return;
  }

  sendJson(response, 404, { success: false, error: '接口不存在' });
}

async function handleAdminApi(request, response, context, url) {
  if (request.method === 'PUT' && url.pathname === '/api/admin/site') {
    const body = await readJsonBody(request);
    const site = validateSite(body);
    const data = await readBlogData(context);
    const nextData = { ...data, site };
    await writeBlogData(context, nextData);
    sendJson(response, 200, { success: true, data: nextData });
    return;
  }

  if (request.method === 'PUT' && url.pathname === '/api/admin/links') {
    const body = await readJsonBody(request);
    const links = validateLinks(body.links);
    const data = await readBlogData(context);
    const nextData = { ...data, links };
    await writeBlogData(context, nextData);
    sendJson(response, 200, { success: true, data: nextData });
    return;
  }

  if (request.method === 'PUT' && url.pathname === '/api/admin/notes') {
    const body = await readJsonBody(request);
    const notes = validateNotes(body.notes);
    const data = await readBlogData(context);
    const nextData = { ...data, notes };
    await writeBlogData(context, nextData);
    sendJson(response, 200, { success: true, data: nextData });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/admin/posts') {
    const body = await readJsonBody(request);
    const now = new Date().toISOString();
    const post = validatePost({
      ...body,
      id: createId('post'),
      slug: body.slug || slugify(body.title || ''),
      createdAt: now,
      updatedAt: now
    });
    const data = await readBlogData(context);
    assertUniqueSlug(data.posts, post.slug);
    const nextData = { ...data, posts: [post, ...data.posts] };
    await writeBlogData(context, nextData);
    sendJson(response, 201, { success: true, data: nextData });
    return;
  }

  const postMatch = url.pathname.match(/^\/api\/admin\/posts\/([^/]+)$/);
  if (postMatch && request.method === 'PUT') {
    const postId = decodeURIComponent(postMatch[1]);
    const body = await readJsonBody(request);
    const data = await readBlogData(context);
    const existingPost = data.posts.find((post) => post.id === postId);
    if (!existingPost) {
      sendJson(response, 404, { success: false, error: '文章不存在' });
      return;
    }

    const updatedPost = validatePost({
      ...existingPost,
      ...body,
      id: existingPost.id,
      slug: body.slug || slugify(body.title || existingPost.title),
      createdAt: existingPost.createdAt,
      updatedAt: new Date().toISOString()
    });
    assertUniqueSlug(data.posts, updatedPost.slug, updatedPost.id);
    const nextData = {
      ...data,
      posts: data.posts.map((post) => (post.id === postId ? updatedPost : post))
    };
    await writeBlogData(context, nextData);
    sendJson(response, 200, { success: true, data: nextData });
    return;
  }

  if (postMatch && request.method === 'DELETE') {
    const postId = decodeURIComponent(postMatch[1]);
    const data = await readBlogData(context);
    const nextPosts = data.posts.filter((post) => post.id !== postId);
    if (nextPosts.length === data.posts.length) {
      sendJson(response, 404, { success: false, error: '文章不存在' });
      return;
    }
    const nextData = { ...data, posts: nextPosts };
    await writeBlogData(context, nextData);
    sendJson(response, 200, { success: true, data: nextData });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/admin/import') {
    const body = await readJsonBody(request);
    const nextData = validateBlogData(body);
    await writeBlogData(context, nextData);
    sendJson(response, 200, { success: true, data: nextData });
    return;
  }

  sendJson(response, 404, { success: false, error: '接口不存在' });
}

async function serveStatic(request, response, publicDir, pathname) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405);
    response.end('Method Not Allowed');
    return;
  }

  const normalizedPath = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const routePath = pathname === '/' || normalizedPath === '.' ? '/index.html' : normalizedPath;
  const requestedPath = resolve(join(publicDir, routePath));
  const safePublicDir = resolve(publicDir);

  if (!requestedPath.startsWith(safePublicDir)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  const fallbackPath = resolve(join(publicDir, 'index.html'));
  const hasFileExtension = Boolean(extname(requestedPath));
  const filePath = existsSync(requestedPath) ? requestedPath : hasFileExtension ? requestedPath : fallbackPath;

  try {
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) {
      response.writeHead(404);
      response.end('Not Found');
      return;
    }

    const mimeType = MIME_TYPES[extname(filePath)] || 'application/octet-stream';
    response.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': filePath.endsWith('.html') ? 'no-store' : 'public, max-age=3600'
    });

    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404);
    response.end('Not Found');
  }
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new ApiError(413, '请求内容过大');
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApiError(400, 'JSON 格式不正确');
  }
}

async function readBlogData(context) {
  await ensureDataDir(context);
  const dataPath = join(context.dataDir, DATA_FILE);
  if (!existsSync(dataPath)) {
    await writeBlogData(context, defaultData);
    return defaultData;
  }

  const raw = await readFile(dataPath, 'utf8');
  return validateBlogData(JSON.parse(raw));
}

async function writeBlogData(context, data) {
  await ensureDataDir(context);
  const dataPath = join(context.dataDir, DATA_FILE);
  const tempPath = `${dataPath}.${process.pid}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await rename(tempPath, dataPath);
}

async function ensureDataDir(context) {
  await mkdir(context.dataDir, { recursive: true });
}

async function authExists(context) {
  return existsSync(join(context.dataDir, AUTH_FILE));
}

async function readAuth(context) {
  await ensureDataDir(context);
  const authPath = join(context.dataDir, AUTH_FILE);
  if (!existsSync(authPath)) {
    return null;
  }
  return JSON.parse(await readFile(authPath, 'utf8'));
}

async function writeAuth(context, auth) {
  await ensureDataDir(context);
  const authPath = join(context.dataDir, AUTH_FILE);
  await writeFile(authPath, `${JSON.stringify(auth, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
}

function createPasswordRecord(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 210000, 32, 'sha256').toString('hex');
  return {
    algorithm: 'pbkdf2-sha256',
    iterations: 210000,
    salt,
    hash,
    createdAt: new Date().toISOString()
  };
}

function verifyPassword(password, auth) {
  if (!auth?.salt || !auth?.hash || !Number.isInteger(auth.iterations)) {
    return false;
  }

  const hash = pbkdf2Sync(password, auth.salt, auth.iterations, 32, 'sha256');
  const expected = Buffer.from(auth.hash, 'hex');
  return hash.length === expected.length && timingSafeEqual(hash, expected);
}

function createSession(context) {
  const token = randomBytes(32).toString('hex');
  const csrfToken = randomBytes(32).toString('hex');
  const session = {
    token,
    csrfToken,
    expiresAt: Date.now() + SESSION_TTL_MS
  };
  context.sessionStore.set(token, session);
  return session;
}

function getSession(request, context) {
  const cookies = parseCookies(request.headers.cookie || '');
  const token = cookies[SESSION_COOKIE];
  if (!token) {
    return null;
  }

  const session = context.sessionStore.get(token);
  if (!session || session.expiresAt < Date.now()) {
    context.sessionStore.delete(token);
    return null;
  }

  return session;
}

function requireSession(request, context) {
  const session = getSession(request, context);
  if (!session) {
    throw new ApiError(401, '请先登录后台');
  }
  return session;
}

function requireCsrf(request, context) {
  const session = requireSession(request, context);
  const token = request.headers['x-csrf-token'];
  if (token !== session.csrfToken) {
    throw new ApiError(403, 'CSRF 校验失败');
  }
}

function setSessionCookie(response, token) {
  response.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`);
}

function clearSessionCookie(response) {
  response.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

function parseCookies(cookieHeader) {
  return cookieHeader.split(';').reduce((cookies, item) => {
    const [rawName, ...rawValue] = item.trim().split('=');
    if (!rawName) {
      return cookies;
    }
    return {
      ...cookies,
      [rawName]: decodeURIComponent(rawValue.join('='))
    };
  }, {});
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(JSON.stringify(payload));
}

function toPublicBlogData(data) {
  const posts = data.posts
    .filter((post) => post.status === 'published')
    .sort(comparePosts);

  return {
    site: data.site,
    links: data.links,
    notes: data.notes,
    posts,
    stats: {
      posts: posts.length,
      tags: [...new Set(posts.flatMap((post) => post.tags))].length,
      categories: [...new Set(posts.map((post) => post.category))].length
    }
  };
}

function comparePosts(a, b) {
  if (a.featured !== b.featured) {
    return a.featured ? -1 : 1;
  }
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function validateBlogData(input) {
  const site = validateSite(input.site || defaultData.site);
  const links = validateLinks(input.links || []);
  const notes = validateNotes(input.notes || []);
  const posts = Array.isArray(input.posts) ? input.posts.map(validatePost) : [];
  const slugs = new Set();

  for (const post of posts) {
    if (slugs.has(post.slug)) {
      throw new ApiError(400, `文章 slug 重复：${post.slug}`);
    }
    slugs.add(post.slug);
  }

  return {
    site,
    links,
    notes,
    posts
  };
}

function validateSite(input = {}) {
  const source = {
    ...defaultSite,
    ...input,
    comments: {
      ...defaultSite.comments,
      ...(input.comments || {})
    }
  };

  return {
    title: requiredString(source.title, '站点标题', 2, 40),
    subtitle: requiredString(source.subtitle, '站点副标题', 2, 120),
    owner: requiredString(source.owner, '作者名称', 2, 40),
    role: optionalString(source.role, 40),
    motto: optionalString(source.motto, 120),
    bio: requiredString(source.bio, '作者简介', 2, 260),
    status: optionalString(source.status, 140),
    location: optionalString(source.location, 80),
    email: optionalString(source.email, 120),
    github: optionalUrl(source.github),
    themeColor: validateColor(source.themeColor, '#6fb7a8'),
    accentColor: validateColor(source.accentColor, '#f0c36a'),
    heroImage: optionalPathOrUrl(source.heroImage, '/assets/img/hero-mountain.svg'),
    avatar: optionalPathOrUrl(source.avatar, '/assets/img/avatar-orbit.svg'),
    level: validateInteger(source.level, '等级', 1, 99, 12),
    experience: validateInteger(source.experience, '经验进度', 0, 100, 68),
    streak: validateInteger(source.streak, '连续写作天数', 0, 999, 27),
    assistantName: optionalString(source.assistantName, 40) || defaultSite.assistantName,
    assistantPrompt: optionalString(source.assistantPrompt, 240) || defaultSite.assistantPrompt,
    comments: validateComments(source.comments),
    music: validateMusic(source.music),
    gallery: validateGallery(source.gallery)
  };
}

function validateComments(input = {}) {
  return {
    enabled: Boolean(input.enabled),
    provider: optionalString(input.provider, 40) || defaultSite.comments.provider,
    repo: optionalString(input.repo, 120) || defaultSite.comments.repo,
    clientId: optionalString(input.clientId, 120)
  };
}

function validateMusic(input) {
  if (!Array.isArray(input)) {
    throw new ApiError(400, '歌单必须是数组');
  }

  return input.slice(0, 8).map((track) => ({
    title: requiredString(track.title, '歌曲标题', 1, 60),
    artist: optionalString(track.artist, 60) || 'Local Playlist',
    mood: optionalString(track.mood, 40),
    url: optionalPathOrUrl(track.url, '')
  }));
}

function validateGallery(input) {
  if (!Array.isArray(input)) {
    throw new ApiError(400, '照片墙必须是数组');
  }

  return input.slice(0, 9).map((item) => ({
    title: requiredString(item.title, '照片标题', 1, 60),
    description: optionalString(item.description, 120),
    image: optionalPathOrUrl(item.image, '/assets/img/hero-mountain.svg')
  }));
}

function validateLinks(input) {
  if (!Array.isArray(input)) {
    throw new ApiError(400, '友链必须是数组');
  }

  return input.slice(0, 12).map((link) => ({
    title: requiredString(link.title, '友链标题', 1, 40),
    url: optionalPathOrUrl(link.url, '#'),
    description: optionalString(link.description, 100)
  }));
}

function validateNotes(input) {
  if (!Array.isArray(input)) {
    throw new ApiError(400, '动态必须是数组');
  }

  return input.slice(0, 20).map((note) => ({
    id: optionalString(note.id, 80) || createId('note'),
    content: requiredString(note.content, '动态内容', 1, 160),
    date: validateDateString(note.date, '动态日期')
  }));
}

function validatePost(input) {
  const title = requiredString(input.title, '文章标题', 2, 80);
  const slug = validateSlug(input.slug || slugify(title));

  return {
    id: optionalString(input.id, 80) || createId('post'),
    title,
    slug,
    summary: requiredString(input.summary, '文章摘要', 2, 220),
    content: requiredString(input.content, '文章内容', 2, 20000),
    tags: validateTags(input.tags),
    category: requiredString(input.category, '文章分类', 1, 30),
    cover: optionalPathOrUrl(input.cover, '/assets/img/hero-mountain.svg'),
    status: input.status === 'draft' ? 'draft' : 'published',
    featured: Boolean(input.featured),
    createdAt: validateIsoDate(input.createdAt, '创建时间'),
    updatedAt: validateIsoDate(input.updatedAt, '更新时间')
  };
}

function validateTags(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return [...new Set(input.map((tag) => String(tag).trim()).filter(Boolean))]
    .slice(0, 8)
    .map((tag) => requiredString(tag, '文章标签', 1, 24));
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new ApiError(400, '密码长度需要在 8 到 128 位之间');
  }
  return password;
}

function requiredString(value, label, minLength, maxLength) {
  if (typeof value !== 'string') {
    throw new ApiError(400, `${label}不能为空`);
  }

  const trimmed = value.trim();
  if (trimmed.length < minLength || trimmed.length > maxLength) {
    throw new ApiError(400, `${label}长度需要在 ${minLength} 到 ${maxLength} 个字符之间`);
  }
  return trimmed;
}

function optionalString(value, maxLength) {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new ApiError(400, '字段格式不正确');
  }
  return value.trim().slice(0, maxLength);
}

function validateSlug(value) {
  const slug = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new ApiError(400, '文章 slug 只能使用小写字母、数字和连字符');
  }
  return slug;
}

function validateColor(value, fallback) {
  if (typeof value !== 'string' || value.trim() === '') {
    return fallback;
  }

  const color = value.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new ApiError(400, '主题颜色必须是 #RRGGBB 格式');
  }
  return color;
}

function validateInteger(value, label, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) {
    return fallback;
  }
  if (number < min || number > max) {
    throw new ApiError(400, `${label}需要在 ${min} 到 ${max} 之间`);
  }
  return number;
}
function optionalUrl(value) {
  if (!value) {
    return '';
  }

  const url = String(value).trim();
  if (!/^https?:\/\/[^\s]+$/.test(url)) {
    throw new ApiError(400, '链接必须以 http:// 或 https:// 开头');
  }
  return url;
}

function optionalPathOrUrl(value, fallback) {
  if (!value) {
    return fallback;
  }

  const pathOrUrl = String(value).trim();
  if (/^https?:\/\/[^\s]+$/.test(pathOrUrl) || /^\/[a-zA-Z0-9/_:.-]+$/.test(pathOrUrl) || /^#[a-zA-Z0-9_-]+$/.test(pathOrUrl)) {
    return pathOrUrl;
  }
  throw new ApiError(400, '路径或链接格式不正确');
}

function validateDateString(value, label) {
  const date = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T00:00:00.000Z`).getTime())) {
    throw new ApiError(400, `${label}格式应为 YYYY-MM-DD`);
  }
  return date;
}

function validateIsoDate(value, label) {
  const date = String(value || new Date().toISOString());
  if (Number.isNaN(new Date(date).getTime())) {
    throw new ApiError(400, `${label}不是有效日期`);
  }
  return new Date(date).toISOString();
}

function assertUniqueSlug(posts, slug, ignoredId = '') {
  const duplicated = posts.some((post) => post.slug === slug && post.id !== ignoredId);
  if (duplicated) {
    throw new ApiError(409, '文章 slug 已存在');
  }
}

function slugify(value) {
  const slug = String(value)
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `post-${Date.now()}`;
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`;
}

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

if (process.argv[1] && resolve(process.cwd(), process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createBlogServer();
  server.listen(DEFAULT_PORT, () => {
    console.log(`Personal theme blog is running at http://localhost:${DEFAULT_PORT}`);
    console.log(`Admin console: http://localhost:${DEFAULT_PORT}/admin.html`);
  });
}

