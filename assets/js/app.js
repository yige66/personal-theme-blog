const state = {
  blog: null,
  query: '',
  category: 'all',
  tag: 'all'
};

const elements = {
  title: document.querySelector('title'),
  heroTitle: document.querySelector('#hero-title'),
  heroSubtitle: document.querySelector('.hero-subtitle'),
  heroImage: document.querySelector('.hero-media img'),
  postGrid: document.querySelector('#postGrid'),
  emptyState: document.querySelector('#emptyState'),
  categoryFilters: document.querySelector('#categoryFilters'),
  tagFilters: document.querySelector('#tagFilters'),
  searchInput: document.querySelector('#searchInput'),
  archiveList: document.querySelector('#archiveList'),
  noteList: document.querySelector('#noteList'),
  linkBoard: document.querySelector('#linkBoard'),
  postDialog: document.querySelector('#postDialog'),
  dialogTitle: document.querySelector('#dialogTitle'),
  dialogCategory: document.querySelector('#dialogCategory'),
  dialogMeta: document.querySelector('#dialogMeta'),
  dialogContent: document.querySelector('#dialogContent'),
  closeDialog: document.querySelector('.close-dialog'),
  authorBio: document.querySelector('#authorBio'),
  ownerName: document.querySelector('#ownerName'),
  ownerLocation: document.querySelector('#ownerLocation'),
  ownerEmail: document.querySelector('#ownerEmail'),
  year: document.querySelector('#year')
};

init();

async function init() {
  elements.year.textContent = new Date().getFullYear();
  bindEvents();

  try {
    const response = await fetch('/api/blog', { headers: { Accept: 'application/json' } });
    const payload = await response.json();
    if (!payload.success) {
      throw new Error(payload.error || '读取博客数据失败');
    }
    state.blog = payload.data;
    applySite(state.blog.site, state.blog.stats);
    renderFilters();
    renderPosts();
    renderArchive();
    renderNotes();
    renderLinks();
  } catch (error) {
    elements.postGrid.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

function bindEvents() {
  elements.searchInput.addEventListener('input', (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderPosts();
  });

  elements.closeDialog.addEventListener('click', () => {
    elements.postDialog.close();
  });

  elements.postDialog.addEventListener('click', (event) => {
    if (event.target === elements.postDialog) {
      elements.postDialog.close();
    }
  });
}

function applySite(site, stats) {
  document.documentElement.style.setProperty('--green', site.themeColor);
  document.documentElement.style.setProperty('--gold', site.accentColor);
  elements.title.textContent = site.title;
  elements.heroTitle.textContent = site.title;
  elements.heroSubtitle.textContent = site.subtitle;
  elements.heroImage.src = site.heroImage;
  elements.heroImage.alt = `${site.title} 主题头图`;
  elements.authorBio.textContent = site.bio;
  elements.ownerName.textContent = site.owner;
  elements.ownerLocation.textContent = site.location || 'Location not set';
  elements.ownerEmail.textContent = site.email || 'Email not set';
  elements.ownerEmail.href = site.email ? `mailto:${site.email}` : '#about';
  document.querySelector('[data-stat="posts"]').textContent = stats.posts;
  document.querySelector('[data-stat="tags"]').textContent = stats.tags;
  document.querySelector('[data-stat="categories"]').textContent = stats.categories;
}

function renderFilters() {
  const posts = state.blog.posts;
  const categories = ['all', ...new Set(posts.map((post) => post.category))];
  const tags = ['all', ...new Set(posts.flatMap((post) => post.tags))];

  elements.categoryFilters.innerHTML = categories.map((category) => {
    const label = category === 'all' ? '全部' : category;
    return `<button class="chip ${state.category === category ? 'active' : ''}" type="button" data-category="${escapeAttribute(category)}">${escapeHtml(label)}</button>`;
  }).join('');

  elements.tagFilters.innerHTML = tags.map((tag) => {
    const label = tag === 'all' ? '全部' : tag;
    return `<button class="chip ${state.tag === tag ? 'active' : ''}" type="button" data-tag="${escapeAttribute(tag)}">${escapeHtml(label)}</button>`;
  }).join('');

  elements.categoryFilters.querySelectorAll('[data-category]').forEach((button) => {
    button.addEventListener('click', () => {
      state.category = button.dataset.category;
      renderFilters();
      renderPosts();
    });
  });

  elements.tagFilters.querySelectorAll('[data-tag]').forEach((button) => {
    button.addEventListener('click', () => {
      state.tag = button.dataset.tag;
      renderFilters();
      renderPosts();
    });
  });
}

function renderPosts() {
  const posts = getFilteredPosts();
  elements.emptyState.hidden = posts.length > 0;
  elements.postGrid.innerHTML = posts.map(renderPostCard).join('');
  elements.postGrid.querySelectorAll('[data-open-post]').forEach((button) => {
    button.addEventListener('click', () => openPost(button.dataset.openPost));
  });
}

function renderPostCard(post) {
  return `
    <article class="post-card ${post.featured ? 'featured' : ''}">
      <img src="${escapeAttribute(post.cover)}" alt="${escapeAttribute(post.title)} 封面">
      <div class="post-body">
        <div class="post-meta">
          <time datetime="${escapeAttribute(post.createdAt)}">${formatDate(post.createdAt)}</time>
          <span>${escapeHtml(post.category)}</span>
          ${post.featured ? '<span>置顶</span>' : ''}
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.summary)}</p>
        <div class="post-tags">${post.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
        <button class="read-button" type="button" data-open-post="${escapeAttribute(post.id)}">阅读全文</button>
      </div>
    </article>
  `;
}

function renderArchive() {
  elements.archiveList.innerHTML = state.blog.posts.map((post) => `
    <li>
      <time datetime="${escapeAttribute(post.createdAt)}">${formatDate(post.createdAt)}</time>
      <button type="button" data-open-post="${escapeAttribute(post.id)}">${escapeHtml(post.title)}</button>
      <span>${escapeHtml(post.category)}</span>
    </li>
  `).join('');

  elements.archiveList.querySelectorAll('[data-open-post]').forEach((button) => {
    button.addEventListener('click', () => openPost(button.dataset.openPost));
  });
}

function renderNotes() {
  elements.noteList.innerHTML = state.blog.notes.map((note) => `
    <article class="note-card">
      <time datetime="${escapeAttribute(note.date)}">${escapeHtml(note.date)}</time>
      <p>${escapeHtml(note.content)}</p>
    </article>
  `).join('');
}

function renderLinks() {
  elements.linkBoard.innerHTML = state.blog.links.map((link) => `
    <a class="link-card" href="${escapeAttribute(link.url)}" target="${link.url.startsWith('http') ? '_blank' : '_self'}" rel="noreferrer">
      <strong>${escapeHtml(link.title)}</strong>
      <span>${escapeHtml(link.description)}</span>
    </a>
  `).join('');
}

function getFilteredPosts() {
  return state.blog.posts.filter((post) => {
    const haystack = [
      post.title,
      post.summary,
      post.category,
      ...post.tags
    ].join(' ').toLowerCase();
    const matchesQuery = state.query === '' || haystack.includes(state.query);
    const matchesCategory = state.category === 'all' || post.category === state.category;
    const matchesTag = state.tag === 'all' || post.tags.includes(state.tag);
    return matchesQuery && matchesCategory && matchesTag;
  });
}

function openPost(postId) {
  const post = state.blog.posts.find((item) => item.id === postId);
  if (!post) {
    return;
  }

  elements.dialogTitle.textContent = post.title;
  elements.dialogCategory.textContent = post.category;
  elements.dialogMeta.innerHTML = `
    <time datetime="${escapeAttribute(post.createdAt)}">${formatDate(post.createdAt)}</time>
    <span>${post.tags.map(escapeHtml).join(' / ')}</span>
  `;
  elements.dialogContent.innerHTML = renderMarkdown(post.content);
  elements.postDialog.showModal();
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let listItems = [];
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push(`<p>${paragraph.map(renderInline).join('<br>')}</p>`);
      paragraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push(`<ul>${listItems.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
      listItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === '') {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push(`<h2>${renderInline(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith('# ')) {
      flushParagraph();
      flushList();
      blocks.push(`<h2>${renderInline(line.slice(2))}</h2>`);
      continue;
    }

    if (/^- /.test(line)) {
      flushParagraph();
      listItems.push(line.slice(2));
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks.join('');
}

function renderInline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
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
