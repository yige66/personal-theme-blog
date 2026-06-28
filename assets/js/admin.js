const state = {
  csrfToken: '',
  data: null,
  selectedPostId: '',
  search: ''
};

const elements = {
  authPanel: document.querySelector('#authPanel'),
  dashboard: document.querySelector('#dashboard'),
  authTitle: document.querySelector('#authTitle'),
  authHint: document.querySelector('#authHint'),
  authForm: document.querySelector('#authForm'),
  authMessage: document.querySelector('#authMessage'),
  passwordInput: document.querySelector('#passwordInput'),
  logoutButton: document.querySelector('#logoutButton'),
  toast: document.querySelector('#toast'),
  navButtons: document.querySelectorAll('.nav-button'),
  panels: document.querySelectorAll('.panel'),
  metricPosts: document.querySelector('#metricPosts'),
  metricPublished: document.querySelector('#metricPublished'),
  metricDrafts: document.querySelector('#metricDrafts'),
  metricTags: document.querySelector('#metricTags'),
  recentPosts: document.querySelector('#recentPosts'),
  notesForm: document.querySelector('#notesForm'),
  notesInput: document.querySelector('#notesInput'),
  newPostButton: document.querySelector('#newPostButton'),
  adminSearchInput: document.querySelector('#adminSearchInput'),
  adminPostList: document.querySelector('#adminPostList'),
  postForm: document.querySelector('#postForm'),
  postId: document.querySelector('#postId'),
  postTitle: document.querySelector('#postTitle'),
  postSlug: document.querySelector('#postSlug'),
  postSummary: document.querySelector('#postSummary'),
  postCategory: document.querySelector('#postCategory'),
  postTags: document.querySelector('#postTags'),
  postCover: document.querySelector('#postCover'),
  postContent: document.querySelector('#postContent'),
  postPublished: document.querySelector('#postPublished'),
  postFeatured: document.querySelector('#postFeatured'),
  editorTitle: document.querySelector('#editorTitle'),
  deletePostButton: document.querySelector('#deletePostButton'),
  resetPostButton: document.querySelector('#resetPostButton'),
  siteForm: document.querySelector('#siteForm'),
  siteTitle: document.querySelector('#siteTitle'),
  siteOwner: document.querySelector('#siteOwner'),
  siteSubtitle: document.querySelector('#siteSubtitle'),
  siteRole: document.querySelector('#siteRole'),
  siteMotto: document.querySelector('#siteMotto'),
  siteBio: document.querySelector('#siteBio'),
  siteStatus: document.querySelector('#siteStatus'),
  siteLocation: document.querySelector('#siteLocation'),
  siteEmail: document.querySelector('#siteEmail'),
  siteGithub: document.querySelector('#siteGithub'),
  siteHeroImage: document.querySelector('#siteHeroImage'),
  siteAvatar: document.querySelector('#siteAvatar'),
  siteStreak: document.querySelector('#siteStreak'),
  siteLevel: document.querySelector('#siteLevel'),
  siteExperience: document.querySelector('#siteExperience'),
  siteThemeColor: document.querySelector('#siteThemeColor'),
  siteAccentColor: document.querySelector('#siteAccentColor'),
  siteAssistantName: document.querySelector('#siteAssistantName'),
  siteAssistantPrompt: document.querySelector('#siteAssistantPrompt'),
  siteCommentsEnabled: document.querySelector('#siteCommentsEnabled'),
  siteCommentRepo: document.querySelector('#siteCommentRepo'),
  siteCommentClientId: document.querySelector('#siteCommentClientId'),
  siteMusic: document.querySelector('#siteMusic'),
  siteGallery: document.querySelector('#siteGallery'),
  linksForm: document.querySelector('#linksForm'),
  linksInput: document.querySelector('#linksInput'),
  projectsForm: document.querySelector('#projectsForm'),
  projectsInput: document.querySelector('#projectsInput'),
  exportButton: document.querySelector('#exportButton'),
  importInput: document.querySelector('#importInput'),
  importButton: document.querySelector('#importButton')
};

init();

async function init() {
  bindEvents();
  await loadSetupStatus();
  await loadAdminState();
}

function bindEvents() {
  elements.authForm.addEventListener('submit', handleAuthSubmit);
  elements.logoutButton.addEventListener('click', handleLogout);
  elements.navButtons.forEach((button) => {
    button.addEventListener('click', () => showPanel(button.dataset.panel));
  });
  elements.newPostButton.addEventListener('click', () => {
    showPanel('postsPanel');
    clearPostForm();
  });
  elements.adminSearchInput.addEventListener('input', (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderPostList();
  });
  elements.postForm.addEventListener('submit', handleSavePost);
  elements.resetPostButton.addEventListener('click', clearPostForm);
  elements.deletePostButton.addEventListener('click', handleDeletePost);
  elements.siteForm.addEventListener('submit', handleSaveSite);
  elements.linksForm.addEventListener('submit', handleSaveLinks);
  elements.projectsForm.addEventListener('submit', handleSaveProjects);
  elements.notesForm.addEventListener('submit', handleSaveNotes);
  elements.exportButton.addEventListener('click', handleExport);
  elements.importButton.addEventListener('click', handleImport);
  elements.postTitle.addEventListener('input', () => {
    if (!elements.postId.value && !elements.postSlug.value) {
      elements.postSlug.value = slugify(elements.postTitle.value);
    }
  });
}

async function loadSetupStatus() {
  const payload = await api('/api/setup-status');
  if (payload.data.needsSetup) {
    elements.authTitle.textContent = '初始化后台';
    elements.authHint.textContent = '首次使用需要设置一个至少 8 位的后台密码。';
    elements.passwordInput.autocomplete = 'new-password';
  }
}

async function loadAdminState() {
  try {
    const payload = await api('/api/admin/state');
    state.csrfToken = payload.data.csrfToken;
    state.data = { ...payload.data };
    delete state.data.csrfToken;
    showDashboard();
    renderAll();
  } catch (error) {
    showAuth();
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  elements.authMessage.textContent = '';

  try {
    const statusPayload = await api('/api/setup-status');
    const endpoint = statusPayload.data.needsSetup ? '/api/setup' : '/api/login';
    const payload = await api(endpoint, {
      method: 'POST',
      body: { password: elements.passwordInput.value }
    });
    state.csrfToken = payload.data.csrfToken;
    elements.passwordInput.value = '';
    await loadAdminState();
  } catch (error) {
    elements.authMessage.textContent = error.message;
  }
}

async function handleLogout() {
  await api('/api/logout', { method: 'POST' });
  state.csrfToken = '';
  state.data = null;
  showAuth();
}

function showAuth() {
  elements.authPanel.hidden = false;
  elements.dashboard.hidden = true;
}

function showDashboard() {
  elements.authPanel.hidden = true;
  elements.dashboard.hidden = false;
}

function showPanel(panelId) {
  elements.navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.panel === panelId);
  });
  elements.panels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === panelId);
  });
}

function renderAll() {
  renderMetrics();
  renderRecentPosts();
  renderPostList();
  renderSiteForm();
  renderJsonEditors();
  if (!state.selectedPostId) {
    clearPostForm();
  }
}

function renderMetrics() {
  const posts = state.data.posts;
  elements.metricPosts.textContent = posts.length;
  elements.metricPublished.textContent = posts.filter((post) => post.status === 'published').length;
  elements.metricDrafts.textContent = posts.filter((post) => post.status === 'draft').length;
  elements.metricTags.textContent = new Set(posts.flatMap((post) => post.tags)).size;
}

function renderRecentPosts() {
  const recentPosts = [...state.data.posts]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  elements.recentPosts.innerHTML = recentPosts.map((post) => `
    <button class="compact-post" type="button" data-edit-post="${escapeAttribute(post.id)}">
      <strong>${escapeHtml(post.title)}</strong>
      <span>${escapeHtml(post.status === 'published' ? '已发布' : '草稿')} / ${formatDate(post.updatedAt)}</span>
    </button>
  `).join('');

  elements.recentPosts.querySelectorAll('[data-edit-post]').forEach((button) => {
    button.addEventListener('click', () => {
      showPanel('postsPanel');
      selectPost(button.dataset.editPost);
    });
  });
}

function renderPostList() {
  const posts = state.data.posts.filter((post) => {
    const haystack = [post.title, post.category, ...post.tags].join(' ').toLowerCase();
    return state.search === '' || haystack.includes(state.search);
  });

  elements.adminPostList.innerHTML = posts.map((post) => `
    <button class="admin-post-row ${state.selectedPostId === post.id ? 'active' : ''}" type="button" data-post-id="${escapeAttribute(post.id)}">
      <strong>${escapeHtml(post.title)}</strong>
      <span>${escapeHtml(post.summary)}</span>
      <span class="row-meta">
        <span class="status-pill ${post.status === 'draft' ? 'draft' : ''}">${post.status === 'published' ? '已发布' : '草稿'}</span>
        <span>${escapeHtml(post.category)}</span>
        <span>${formatDate(post.updatedAt)}</span>
      </span>
    </button>
  `).join('');

  elements.adminPostList.querySelectorAll('[data-post-id]').forEach((button) => {
    button.addEventListener('click', () => selectPost(button.dataset.postId));
  });
}

function selectPost(postId) {
  const post = state.data.posts.find((item) => item.id === postId);
  if (!post) {
    return;
  }

  state.selectedPostId = postId;
  elements.postId.value = post.id;
  elements.postTitle.value = post.title;
  elements.postSlug.value = post.slug;
  elements.postSummary.value = post.summary;
  elements.postCategory.value = post.category;
  elements.postTags.value = post.tags.join(', ');
  elements.postCover.value = post.cover;
  elements.postContent.value = post.content;
  elements.postPublished.checked = post.status === 'published';
  elements.postFeatured.checked = post.featured;
  elements.editorTitle.textContent = '编辑文章';
  elements.deletePostButton.hidden = false;
  renderPostList();
}

function clearPostForm() {
  state.selectedPostId = '';
  elements.postForm.reset();
  elements.postId.value = '';
  elements.postCover.value = '/assets/img/hero-mountain.svg';
  elements.postPublished.checked = true;
  elements.postFeatured.checked = false;
  elements.editorTitle.textContent = '新建文章';
  elements.deletePostButton.hidden = true;
  renderPostList();
}

async function handleSavePost(event) {
  event.preventDefault();
  const post = readPostForm();
  const id = elements.postId.value;
  const endpoint = id ? `/api/admin/posts/${encodeURIComponent(id)}` : '/api/admin/posts';
  const method = id ? 'PUT' : 'POST';

  try {
    const payload = await api(endpoint, { method, body: post, csrf: true });
    state.data = payload.data;
    state.selectedPostId = id || payload.data.posts[0]?.id || '';
    renderAll();
    if (state.selectedPostId) {
      selectPost(state.selectedPostId);
    }
    showToast('文章已保存');
  } catch (error) {
    showToast(error.message, true);
  }
}

async function handleDeletePost() {
  const id = elements.postId.value;
  if (!id || !window.confirm('确定删除这篇文章吗？此操作不可撤销。')) {
    return;
  }

  try {
    const payload = await api(`/api/admin/posts/${encodeURIComponent(id)}`, { method: 'DELETE', csrf: true });
    state.data = payload.data;
    clearPostForm();
    renderAll();
    showToast('文章已删除');
  } catch (error) {
    showToast(error.message, true);
  }
}

function readPostForm() {
  return {
    title: elements.postTitle.value,
    slug: elements.postSlug.value || slugify(elements.postTitle.value),
    summary: elements.postSummary.value,
    category: elements.postCategory.value,
    tags: elements.postTags.value.split(',').map((tag) => tag.trim()).filter(Boolean),
    cover: elements.postCover.value || '/assets/img/hero-mountain.svg',
    content: elements.postContent.value,
    status: elements.postPublished.checked ? 'published' : 'draft',
    featured: elements.postFeatured.checked
  };
}

function renderSiteForm() {
  const site = state.data.site;
  elements.siteTitle.value = site.title;
  elements.siteOwner.value = site.owner;
  elements.siteSubtitle.value = site.subtitle;
  elements.siteRole.value = site.role || '';
  elements.siteMotto.value = site.motto || '';
  elements.siteBio.value = site.bio;
  elements.siteStatus.value = site.status || '';
  elements.siteLocation.value = site.location;
  elements.siteEmail.value = site.email;
  elements.siteGithub.value = site.github;
  elements.siteHeroImage.value = site.heroImage;
  elements.siteAvatar.value = site.avatar || '/assets/img/avatar-orbit.svg';
  elements.siteStreak.value = site.streak || 0;
  elements.siteLevel.value = site.level || 1;
  elements.siteExperience.value = site.experience || 0;
  elements.siteThemeColor.value = site.themeColor;
  elements.siteAccentColor.value = site.accentColor;
  elements.siteAssistantName.value = site.assistantName || '';
  elements.siteAssistantPrompt.value = site.assistantPrompt || '';
  elements.siteCommentsEnabled.checked = Boolean(site.comments?.enabled);
  elements.siteCommentRepo.value = site.comments?.repo || '';
  elements.siteCommentClientId.value = site.comments?.clientId || '';
  elements.siteMusic.value = JSON.stringify(site.music || [], null, 2);
  elements.siteGallery.value = JSON.stringify(site.gallery || [], null, 2);
}

async function handleSaveSite(event) {
  event.preventDefault();
  let music;
  let gallery;

  try {
    music = JSON.parse(elements.siteMusic.value || '[]');
    gallery = JSON.parse(elements.siteGallery.value || '[]');
  } catch {
    showToast('歌单或照片墙 JSON 格式不正确', true);
    return;
  }

  const site = {
    title: elements.siteTitle.value,
    owner: elements.siteOwner.value,
    subtitle: elements.siteSubtitle.value,
    role: elements.siteRole.value,
    motto: elements.siteMotto.value,
    bio: elements.siteBio.value,
    status: elements.siteStatus.value,
    location: elements.siteLocation.value,
    email: elements.siteEmail.value,
    github: elements.siteGithub.value,
    heroImage: elements.siteHeroImage.value,
    avatar: elements.siteAvatar.value,
    streak: Number.parseInt(elements.siteStreak.value, 10) || 0,
    level: Number.parseInt(elements.siteLevel.value, 10) || 1,
    experience: Number.parseInt(elements.siteExperience.value, 10) || 0,
    themeColor: elements.siteThemeColor.value,
    accentColor: elements.siteAccentColor.value,
    assistantName: elements.siteAssistantName.value,
    assistantPrompt: elements.siteAssistantPrompt.value,
    comments: {
      enabled: elements.siteCommentsEnabled.checked,
      provider: 'GitHub Issues / Gitalk',
      repo: elements.siteCommentRepo.value,
      clientId: elements.siteCommentClientId.value
    },
    music,
    gallery
  };

  try {
    const payload = await api('/api/admin/site', { method: 'PUT', body: site, csrf: true });
    state.data = payload.data;
    renderAll();
    showToast('站点资料已保存');
  } catch (error) {
    showToast(error.message, true);
  }
}

function renderJsonEditors() {
  elements.linksInput.value = JSON.stringify(state.data.links || [], null, 2);
  elements.projectsInput.value = JSON.stringify(state.data.projects || [], null, 2);
  elements.notesInput.value = JSON.stringify(state.data.notes || [], null, 2);
}

async function handleSaveLinks(event) {
  event.preventDefault();
  try {
    const links = JSON.parse(elements.linksInput.value);
    const payload = await api('/api/admin/links', { method: 'PUT', body: { links }, csrf: true });
    state.data = payload.data;
    renderAll();
    showToast('友链已保存');
  } catch (error) {
    showToast(error.message, true);
  }
}

async function handleSaveProjects(event) {
  event.preventDefault();
  try {
    const projects = JSON.parse(elements.projectsInput.value);
    const payload = await api('/api/admin/projects', { method: 'PUT', body: { projects }, csrf: true });
    state.data = payload.data;
    renderAll();
    showToast('\u9879\u76ee\u5df2\u4fdd\u5b58');
  } catch (error) {
    showToast(error.message, true);
  }
}

async function handleSaveNotes(event) {
  event.preventDefault();
  try {
    const notes = JSON.parse(elements.notesInput.value);
    const payload = await api('/api/admin/notes', { method: 'PUT', body: { notes }, csrf: true });
    state.data = payload.data;
    renderAll();
    showToast('动态已保存');
  } catch (error) {
    showToast(error.message, true);
  }
}

function handleExport() {
  const blob = new Blob([`${JSON.stringify(state.data, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `blog-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function handleImport() {
  if (!window.confirm('导入会覆盖当前博客内容，确认继续吗？')) {
    return;
  }

  try {
    const nextData = JSON.parse(elements.importInput.value);
    const payload = await api('/api/admin/import', { method: 'POST', body: nextData, csrf: true });
    state.data = payload.data;
    elements.importInput.value = '';
    clearPostForm();
    renderAll();
    showToast('导入完成');
  } catch (error) {
    showToast(error.message, true);
  }
}

async function api(path, options = {}) {
  const headers = {
    Accept: 'application/json'
  };

  const fetchOptions = {
    method: options.method || 'GET',
    headers
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(options.body);
  }

  if (options.csrf) {
    headers['X-CSRF-Token'] = state.csrfToken;
  }

  const response = await fetch(path, fetchOptions);
  const payload = await response.json().catch(() => ({
    success: false,
    error: '服务器响应格式不正确'
  }));

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || `请求失败：HTTP ${response.status}`);
  }

  return payload;
}

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  elements.toast.style.background = isError ? '#ffe8df' : '#e7f2df';
  elements.toast.style.borderColor = isError ? 'rgba(185, 79, 63, 0.28)' : 'rgba(47, 125, 104, 0.25)';
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 3200);
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || `post-${Date.now()}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

