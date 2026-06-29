const state = {
  csrfToken: '',
  data: null,
  selectedPostId: '',
  search: '',
  uploadPath: ''
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
  siteEffects: document.querySelector('#siteEffects'),
  siteCommentsEnabled: document.querySelector('#siteCommentsEnabled'),
  siteCommentProvider: document.querySelector('#siteCommentProvider'),
  siteCommentMapping: document.querySelector('#siteCommentMapping'),
  siteCommentRepo: document.querySelector('#siteCommentRepo'),
  siteCommentClientId: document.querySelector('#siteCommentClientId'),
  siteCloudMusicIds: document.querySelector('#siteCloudMusicIds'),
  siteFriendLinkApplyFormat: document.querySelector('#siteFriendLinkApplyFormat'),
  siteMusic: document.querySelector('#siteMusic'),
  siteGallery: document.querySelector('#siteGallery'),
  musicEditor: document.querySelector('#musicEditor'),
  galleryEditor: document.querySelector('#galleryEditor'),
  mediaForm: document.querySelector('#mediaForm'),
  addMusicButton: document.querySelector('#addMusicButton'),
  addGalleryButton: document.querySelector('#addGalleryButton'),
  uploadFile: document.querySelector('#uploadFile'),
  uploadTarget: document.querySelector('#uploadTarget'),
  uploadButton: document.querySelector('#uploadButton'),
  copyUploadPathButton: document.querySelector('#copyUploadPathButton'),
  uploadPath: document.querySelector('#uploadPath'),
  linksForm: document.querySelector('#linksForm'),
  linksInput: document.querySelector('#linksInput'),
  linksEditor: document.querySelector('#linksEditor'),
  addLinkButton: document.querySelector('#addLinkButton'),
  projectsForm: document.querySelector('#projectsForm'),
  projectsInput: document.querySelector('#projectsInput'),
  projectsEditor: document.querySelector('#projectsEditor'),
  addProjectButton: document.querySelector('#addProjectButton'),
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
    button.addEventListener('keydown', handlePanelKeydown);
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
  elements.mediaForm.addEventListener('submit', handleSaveMedia);
  elements.addLinkButton.addEventListener('click', () => addStructuredItem('links'));
  elements.addProjectButton.addEventListener('click', () => addStructuredItem('projects'));
  elements.addMusicButton.addEventListener('click', () => addStructuredItem('music'));
  elements.addGalleryButton.addEventListener('click', () => addStructuredItem('gallery'));
  elements.uploadButton.addEventListener('click', handleUploadImage);
  elements.copyUploadPathButton.addEventListener('click', handleCopyUploadPath);
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
    const isActive = button.dataset.panel === panelId;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });
  elements.panels.forEach((panel) => {
    const isActive = panel.id === panelId;
    panel.classList.toggle('active', isActive);
    panel.hidden = !isActive;
  });
}

function handlePanelKeydown(event) {
  const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
  if (!keys.includes(event.key)) {
    return;
  }

  event.preventDefault();
  const buttons = [...elements.navButtons];
  const currentIndex = buttons.indexOf(event.currentTarget);
  const lastIndex = buttons.length - 1;
  const nextIndex = getNextPanelIndex(event.key, currentIndex, lastIndex);
  const nextButton = buttons[nextIndex];
  if (!nextButton) {
    return;
  }

  showPanel(nextButton.dataset.panel);
  nextButton.focus();
}

function getNextPanelIndex(key, currentIndex, lastIndex) {
  if (key === 'Home') return 0;
  if (key === 'End') return lastIndex;
  if (key === 'ArrowDown' || key === 'ArrowRight') return currentIndex >= lastIndex ? 0 : currentIndex + 1;
  if (key === 'ArrowUp' || key === 'ArrowLeft') return currentIndex <= 0 ? lastIndex : currentIndex - 1;
  return currentIndex;
}

function renderAll() {
  renderMetrics();
  renderRecentPosts();
  renderPostList();
  renderSiteForm();
  renderStructuredEditors();
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
    <button class="compact-post" type="button" role="listitem" data-edit-post="${escapeAttribute(post.id)}">
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
    <button class="admin-post-row ${state.selectedPostId === post.id ? 'active' : ''}" type="button" role="listitem" data-post-id="${escapeAttribute(post.id)}" aria-pressed="${state.selectedPostId === post.id ? 'true' : 'false'}">
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
  elements.siteEffects.value = JSON.stringify(site.effects || {}, null, 2);
  elements.siteCommentsEnabled.checked = Boolean(site.comments?.enabled);
  elements.siteCommentProvider.value = site.comments?.provider || 'utterances';
  elements.siteCommentMapping.value = site.comments?.mapping || 'pathname';
  elements.siteCommentRepo.value = site.comments?.repo || '';
  elements.siteCommentClientId.value = site.comments?.clientId || '';
  elements.siteCloudMusicIds.value = (site.cloudMusicIds || []).join(', ');
  elements.siteFriendLinkApplyFormat.value = site.friendLinkApplyFormat || '';
  elements.siteMusic.value = JSON.stringify(site.music || [], null, 2);
  elements.siteGallery.value = JSON.stringify(site.gallery || [], null, 2);
}

async function handleSaveSite(event) {
  event.preventDefault();
  await saveSitePayload('Site profile saved');
}
function renderStructuredEditors() {
  renderLinksEditor();
  renderProjectsEditor();
  renderMusicEditor();
  renderGalleryEditor();
}

function renderJsonEditors() {
  elements.linksInput.value = JSON.stringify(state.data.links || [], null, 2);
  elements.projectsInput.value = JSON.stringify(state.data.projects || [], null, 2);
  elements.siteMusic.value = JSON.stringify(state.data.site.music || [], null, 2);
  elements.siteGallery.value = JSON.stringify(state.data.site.gallery || [], null, 2);
  elements.notesInput.value = JSON.stringify(state.data.notes || [], null, 2);
}

function renderLinksEditor() {
  elements.linksEditor.innerHTML = (state.data.links || []).map((link, index) => `
    <article class="structured-item" role="listitem" data-kind="links" data-index="${index}">
      <div class="structured-item-head"><strong>友链 ${index + 1}</strong><button class="button danger" type="button" data-remove="links:${index}" aria-label="删除友链 ${index + 1}">删除</button></div>
      <label><span>标题</span><input data-field="title" value="${escapeAttribute(link.title || '')}"></label>
      <label><span>URL</span><input data-field="url" value="${escapeAttribute(link.url || '')}"></label>
      <label><span>描述</span><input data-field="description" value="${escapeAttribute(link.description || '')}"></label>
      <div class="form-row"><label><span>头像</span><input data-field="avatar" value="${escapeAttribute(link.avatar || '')}"></label><label><span>徽章</span><input data-field="badge" value="${escapeAttribute(link.badge || '')}"></label></div>
      <div class="form-row"><label><span>主题色</span><input data-field="themeColor" value="${escapeAttribute(link.themeColor || '')}"></label><label><span>相识时间</span><input data-field="since" value="${escapeAttribute(link.since || '')}"></label></div>
    </article>
  `).join('');
  bindStructuredRemove(elements.linksEditor);
}

function renderProjectsEditor() {
  elements.projectsEditor.innerHTML = (state.data.projects || []).map((project, index) => `
    <article class="structured-item" role="listitem" data-kind="projects" data-index="${index}">
      <div class="structured-item-head"><strong>项目 ${index + 1}</strong><button class="button danger" type="button" data-remove="projects:${index}" aria-label="删除项目 ${index + 1}">删除</button></div>
      <div class="form-row"><label><span>标题</span><input data-field="title" value="${escapeAttribute(project.title || '')}"></label><label><span>状态</span><input data-field="status" value="${escapeAttribute(project.status || 'active')}"></label></div>
      <label><span>描述</span><textarea data-field="description" rows="3">${escapeHtml(project.description || '')}</textarea></label>
      <div class="form-row"><label><span>访问地址</span><input data-field="url" value="${escapeAttribute(project.url || '')}"></label><label><span>仓库地址</span><input data-field="repo" value="${escapeAttribute(project.repo || '')}"></label></div>
      <div class="form-row"><label><span>封面</span><input data-field="cover" value="${escapeAttribute(project.cover || '')}"></label><label><span>开始日期</span><input data-field="startedAt" type="date" value="${escapeAttribute(project.startedAt || '')}"></label></div>
      <div class="form-row check-row"><label><input data-field="featured" type="checkbox" ${project.featured ? 'checked' : ''}><span>首页精选</span></label><label><span>标签</span><input data-field="tags" value="${escapeAttribute((project.tags || []).join(', '))}"></label></div>
    </article>
  `).join('');
  bindStructuredRemove(elements.projectsEditor);
}

function renderMusicEditor() {
  elements.musicEditor.innerHTML = (state.data.site.music || []).map((track, index) => `
    <article class="structured-item" role="listitem" data-kind="music" data-index="${index}">
      <div class="structured-item-head"><strong>音乐 ${index + 1}</strong><button class="button danger" type="button" data-remove="music:${index}" aria-label="删除音乐 ${index + 1}">删除</button></div>
      <div class="form-row"><label><span>标题</span><input data-field="title" value="${escapeAttribute(track.title || '')}"></label><label><span>艺术家</span><input data-field="artist" value="${escapeAttribute(track.artist || '')}"></label></div>
      <div class="form-row"><label><span>氛围</span><input data-field="mood" value="${escapeAttribute(track.mood || '')}"></label><label><span>音频地址</span><input data-field="url" value="${escapeAttribute(track.url || '')}"></label></div>
      <div class="form-row"><label><span>封面</span><input data-field="cover" value="${escapeAttribute(track.cover || '')}"></label><label><span>来源</span><input data-field="source" value="${escapeAttribute(track.source || '')}"></label></div>
      <label><span>歌词 LRC</span><textarea data-field="lrc" rows="3">${escapeHtml(track.lrc || track.lyric || '')}</textarea></label>
    </article>
  `).join('');
  bindStructuredRemove(elements.musicEditor);
}

function renderGalleryEditor() {
  elements.galleryEditor.innerHTML = (state.data.site.gallery || []).map((item, index) => `
    <article class="structured-item" role="listitem" data-kind="gallery" data-index="${index}">
      <div class="structured-item-head"><strong>相册 ${index + 1}</strong><button class="button danger" type="button" data-remove="gallery:${index}" aria-label="删除相册 ${index + 1}">删除</button></div>
      <div class="form-row"><label><span>标题</span><input data-field="title" value="${escapeAttribute(item.title || '')}"></label><label><span>图片地址</span><input data-field="image" value="${escapeAttribute(item.image || '')}"></label></div>
      <label><span>描述</span><textarea data-field="description" rows="3">${escapeHtml(item.description || '')}</textarea></label>
    </article>
  `).join('');
  bindStructuredRemove(elements.galleryEditor);
}

function bindStructuredRemove(container) {
  container.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => removeStructuredItem(button.dataset.remove));
  });
}

function readStructuredItems(container, mapper) {
  return [...container.querySelectorAll('.structured-item')].map((item) => mapper(item));
}

function fieldValue(item, field) {
  const input = item.querySelector(`[data-field="${field}"]`);
  return input?.value?.trim() || '';
}

function fieldChecked(item, field) {
  return Boolean(item.querySelector(`[data-field="${field}"]`)?.checked);
}

function syncLinksJsonFromEditor() {
  const links = readStructuredItems(elements.linksEditor, (item) => ({
    title: fieldValue(item, 'title'),
    url: fieldValue(item, 'url') || '#',
    description: fieldValue(item, 'description'),
    avatar: fieldValue(item, 'avatar'),
    themeColor: fieldValue(item, 'themeColor'),
    badge: fieldValue(item, 'badge'),
    since: fieldValue(item, 'since')
  }));
  elements.linksInput.value = JSON.stringify(links, null, 2);
  return links;
}

function syncProjectsJsonFromEditor() {
  const projects = readStructuredItems(elements.projectsEditor, (item) => ({
    id: state.data.projects[Number(item.dataset.index)]?.id || '',
    title: fieldValue(item, 'title'),
    description: fieldValue(item, 'description'),
    url: fieldValue(item, 'url') || '#',
    repo: fieldValue(item, 'repo'),
    cover: fieldValue(item, 'cover') || '/assets/img/admin-board.svg',
    tags: fieldValue(item, 'tags').split(',').map((tag) => tag.trim()).filter(Boolean),
    status: fieldValue(item, 'status') || 'active',
    featured: fieldChecked(item, 'featured'),
    startedAt: fieldValue(item, 'startedAt') || new Date().toISOString().slice(0, 10)
  }));
  elements.projectsInput.value = JSON.stringify(projects, null, 2);
  return projects;
}

function syncMediaJsonFromEditors() {
  const music = readStructuredItems(elements.musicEditor, (item) => ({
    id: state.data.site.music[Number(item.dataset.index)]?.id || '',
    title: fieldValue(item, 'title'),
    artist: fieldValue(item, 'artist') || 'Local Playlist',
    mood: fieldValue(item, 'mood'),
    url: fieldValue(item, 'url'),
    cover: fieldValue(item, 'cover') || '/assets/img/hero-mountain.svg',
    source: fieldValue(item, 'source') || 'local-draft',
    lrc: fieldValue(item, 'lrc')
  }));
  const gallery = readStructuredItems(elements.galleryEditor, (item) => ({
    title: fieldValue(item, 'title'),
    description: fieldValue(item, 'description'),
    image: fieldValue(item, 'image') || '/assets/img/hero-mountain.svg'
  }));
  elements.siteMusic.value = JSON.stringify(music, null, 2);
  elements.siteGallery.value = JSON.stringify(gallery, null, 2);
  return { music, gallery };
}

function addStructuredItem(kind) {
  if (kind === 'links') {
    state.data.links = [...(state.data.links || []), { title: '', url: 'https://', description: '', avatar: '', badge: '', themeColor: '', since: '' }];
    renderLinksEditor();
    return;
  }
  if (kind === 'projects') {
    state.data.projects = [...(state.data.projects || []), { title: '', description: '', url: '#', repo: '', cover: state.uploadPath || '/assets/img/admin-board.svg', tags: [], status: 'active', featured: false, startedAt: new Date().toISOString().slice(0, 10) }];
    renderProjectsEditor();
    return;
  }
  if (kind === 'music') {
    state.data.site.music = [...(state.data.site.music || []), { title: '', artist: 'Local Playlist', mood: '', url: '', cover: state.uploadPath || '/assets/img/hero-mountain.svg', source: 'local-draft', lrc: '' }];
    renderMusicEditor();
    return;
  }
  if (kind === 'gallery') {
    state.data.site.gallery = [...(state.data.site.gallery || []), { title: '', description: '', image: state.uploadPath || '/assets/img/hero-mountain.svg' }];
    renderGalleryEditor();
  }
}

function removeStructuredItem(value) {
  const [kind, rawIndex] = String(value || '').split(':');
  const index = Number(rawIndex);
  if (!Number.isInteger(index) || index < 0) return;
  if (kind === 'links') { state.data.links = state.data.links.filter((_item, itemIndex) => itemIndex !== index); renderLinksEditor(); }
  if (kind === 'projects') { state.data.projects = state.data.projects.filter((_item, itemIndex) => itemIndex !== index); renderProjectsEditor(); }
  if (kind === 'music') { state.data.site.music = state.data.site.music.filter((_item, itemIndex) => itemIndex !== index); renderMusicEditor(); }
  if (kind === 'gallery') { state.data.site.gallery = state.data.site.gallery.filter((_item, itemIndex) => itemIndex !== index); renderGalleryEditor(); }
  renderJsonEditors();
}

async function handleSaveMedia(event) {
  event.preventDefault();
  await saveSitePayload('Media saved');
}

async function saveSitePayload(successMessage) {
  const { music, gallery } = syncMediaJsonFromEditors();
  try {
    const effects = JSON.parse(elements.siteEffects.value || '{}');
    const site = readSitePayload(music, gallery, effects);
    const payload = await api('/api/admin/site', { method: 'PUT', body: site, csrf: true });
    state.data = payload.data;
    renderAll();
    showToast(successMessage);
  } catch (error) {
    showToast(error.message, true);
  }
}

function readSitePayload(music, gallery, effects) {
  return {
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
    cloudMusicIds: elements.siteCloudMusicIds.value.split(',').map((item) => item.trim()).filter(Boolean),
    friendLinkApplyFormat: elements.siteFriendLinkApplyFormat.value,
    effects,
    comments: {
      enabled: elements.siteCommentsEnabled.checked,
      provider: elements.siteCommentProvider.value || 'utterances',
      repo: elements.siteCommentRepo.value,
      clientId: elements.siteCommentClientId.value,
      mapping: elements.siteCommentMapping.value || 'pathname',
      label: 'comment',
      theme: 'preferred-color-scheme'
    },
    music,
    gallery
  };
}

async function handleUploadImage() {
  const file = elements.uploadFile.files?.[0];
  if (!file) { showToast('Please choose an image', true); return; }
  try {
    const payload = await api('/api/admin/uploads/image', { method: 'POST', body: { filename: file.name, contentType: file.type, dataBase64: await fileToBase64(file) }, csrf: true });
    state.uploadPath = payload.data.url;
    elements.uploadPath.value = payload.data.url;
    applyUploadedPath(payload.data.url);
    showToast('Image uploaded');
  } catch (error) {
    showToast(error.message, true);
  }
}

async function handleCopyUploadPath() {
  const value = elements.uploadPath.value.trim();
  if (!value) { showToast('No upload path yet', true); return; }
  try {
    await navigator.clipboard.writeText(value);
    showToast('Upload path copied');
  } catch (_error) {
    elements.uploadPath.focus();
    elements.uploadPath.select();
    showToast('Upload path selected');
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('Image read failed'));
    reader.readAsDataURL(file);
  });
}

function applyUploadedPath(path) {
  const target = elements.uploadTarget.value;
  if (target === 'heroImage') elements.siteHeroImage.value = path;
  if (target === 'avatar') elements.siteAvatar.value = path;
  if (target === 'postCover') elements.postCover.value = path;
  if (target === 'galleryImage') {
    setLastStructuredField(elements.galleryEditor, 'image', path, 'gallery', syncMediaJsonFromEditors);
  }
  if (target === 'projectCover') {
    setLastStructuredField(elements.projectsEditor, 'cover', path, 'projects', syncProjectsJsonFromEditor);
  }
}

function setLastStructuredField(container, field, value, fallbackKind, syncJson) {
  let inputs = [...container.querySelectorAll(`[data-field="${field}"]`)];
  if (inputs.length === 0) {
    addStructuredItem(fallbackKind);
    inputs = [...container.querySelectorAll(`[data-field="${field}"]`)];
  }

  const input = inputs.at(-1);
  if (!input) {
    return;
  }

  input.value = value;
  syncJson();
}
async function handleSaveLinks(event) {
  event.preventDefault();
  try {
    const links = syncLinksJsonFromEditor();
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
    const projects = syncProjectsJsonFromEditor();
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

