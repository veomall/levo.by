/**
 * Admin Panel — CMS with rethought UX and Lucide icons.
 */
(() => {
    const $ = s => document.querySelector(s);
    let token = localStorage.getItem('admin_token') || '';
    let section = 'profile';

    function el(tag, attrs = {}, ...kids) {
        const e = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) {
            if (k === 'cls') e.className = v;
            else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
            else if (k === 'html') e.innerHTML = v;
            else e.setAttribute(k, v ?? '');
        }
        for (const c of kids.flat()) {
            if (c == null) continue;
            e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
        }
        return e;
    }

    function ic(name) {
        const s = el('span', { cls: 'lc' });
        s.innerHTML = `<i data-lucide="${name}"></i>`;
        return s;
    }

    function ric() { if (window.lucide) lucide.createIcons(); }

    function toast(msg, ok = true) {
        const t = el('div', { cls: `toast toast-${ok ? 'success' : 'error'}` });
        t.innerHTML = `<i data-lucide="${ok ? 'check' : 'alert-circle'}"></i> `;
        t.appendChild(document.createTextNode(msg));
        document.body.appendChild(t);
        ric();
        setTimeout(() => t.remove(), 3000);
    }

    async function api(method, url, body) {
        const opts = { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        const r = await fetch(url, opts);
        if (r.status === 401 || r.status === 403) { token = ''; localStorage.removeItem('admin_token'); render(); return null; }
        return r.json();
    }

    async function uploadFile(file) {
        const fd = new FormData();
        const safeName = (file && file.name && /\.[a-z0-9]+$/i.test(file.name))
            ? file.name
            : `paste-${Date.now()}.png`;
        fd.append('file', file, safeName);
        const r = await fetch('/api/admin/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
        let data;
        try {
            data = await r.json();
        } catch {
            return { detail: 'Invalid server response' };
        }
        if (!r.ok) {
            return { detail: data.detail || data.message || `HTTP ${r.status}`, url: null };
        }
        return data;
    }

    const CYR_TO_LAT = {
        а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
        к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
        х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
        і: 'i', ї: 'yi', є: 'ye', ґ: 'g', ў: 'u',
    };

    const LATIN1 = { ß: 'ss', æ: 'ae', œ: 'oe', ø: 'o', ð: 'd', þ: 'th' };

    function transliterateChunk(str) {
        if (!str || !String(str).trim()) return '';
        let raw = String(str).normalize('NFD').replace(/\p{M}/gu, '');
        let out = '';
        for (const ch of raw) {
            const lo = ch.toLowerCase();
            if (Object.prototype.hasOwnProperty.call(CYR_TO_LAT, lo)) out += CYR_TO_LAT[lo];
            else if (Object.prototype.hasOwnProperty.call(LATIN1, lo)) out += LATIN1[lo];
            else if (/[a-z0-9]/i.test(ch) && ch.codePointAt(0) < 128) out += lo;
            else if (/\s/.test(ch) || ch === '-' || ch === '_') out += ' ';
            else out += ' ';
        }
        return out
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function normalizeBlogSlug(slugOrTitle, maxWords = 8) {
        const text = (slugOrTitle || '').trim();
        if (!text) return '';
        const tailRe = /^(.+)-(\d{4}-\d{2}-\d{2})$/;
        const m = text.match(tailRe);
        let coreRaw;
        let dateSuf;
        if (m) { coreRaw = m[1]; dateSuf = m[2]; }
        else { coreRaw = text; dateSuf = null; }
        let core = transliterateChunk(coreRaw);
        const words = core.split('-').filter(Boolean).slice(0, maxWords);
        const coreSlug = words.join('-');
        if (dateSuf) return coreSlug ? `${coreSlug}-${dateSuf}` : dateSuf;
        const d = new Date();
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return coreSlug ? `${coreSlug}-${ds}` : ds;
    }

    function imageFromClipboard(dataTransfer) {
        if (!dataTransfer) return null;
        const files = dataTransfer.files;
        if (files && files.length) {
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                if (f.type.startsWith('image/')) return f;
            }
        }
        const items = dataTransfer.items;
        if (!items || !items.length) return null;
        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            if (it.kind === 'file') {
                const f = it.getAsFile();
                if (!f) continue;
                if (f.type.startsWith('image/')) return f;
                /* Chrome/Edge часто дают вставленный снимок с пустым type */
                if (!f.type && f.size > 0) {
                    return new File([f], `pasted-${Date.now()}.png`, { type: 'image/png' });
                }
            }
            if (it.type && it.type.startsWith('image/')) {
                const f = it.getAsFile();
                if (f) return f;
            }
        }
        return null;
    }

    /* ======== RENDER ======== */

    function render() {
        const app = $('#app');
        app.innerHTML = '';
        if (!token) { renderLogin(app); return; }
        app.appendChild(buildLayout());
        loadSection();
    }

    function renderLogin(app) {
        app.innerHTML = '';
        const icon = el('div', { cls: 'login-icon' });
        icon.innerHTML = '<i data-lucide="lock"></i>';
        app.appendChild(el('div', { cls: 'login-page' },
            el('div', { cls: 'login-box' },
                icon,
                el('h2', {}, 'Admin Panel'),
                el('div', { cls: 'form' },
                    field('Username', 'login-u', ''),
                    field('Password', 'login-p', '', 'password'),
                    el('button', { cls: 'btn btn-primary', onclick: doLogin }, 'Sign In'),
                    el('div', { cls: 'login-err', id: 'login-err' })
                )
            )
        ));
        ric();
        setTimeout(() => { const u = $('#login-u'); if (u) u.focus(); }, 50);
        app.querySelector('#login-p').onkeydown = e => { if (e.key === 'Enter') doLogin(); };
    }

    async function doLogin() {
        const u = $('#login-u')?.value, p = $('#login-p')?.value;
        try {
            const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
            const d = await r.json();
            if (d.access_token) { token = d.access_token; localStorage.setItem('admin_token', token); render(); }
            else { const e = $('#login-err'); if (e) e.textContent = d.detail || 'Invalid credentials'; }
        } catch { const e = $('#login-err'); if (e) e.textContent = 'Connection error'; }
    }

    /* -------- LAYOUT -------- */

    const NAV = [
        { id: 'profile', icon: 'user', label: 'Profile' },
        { id: 'projects', icon: 'layers', label: 'Projects' },
        { id: 'blog', icon: 'pen-line', label: 'Blog Posts' },
        { id: 'experience', icon: 'briefcase', label: 'Experience' },
        { id: 'skills', icon: 'bar-chart-3', label: 'Skills' },
    ];

    function buildLayout() {
        const logoIcon = el('div', { cls: 'logo-dot' });
        logoIcon.innerHTML = '<i data-lucide="settings"></i>';

        const layout = el('div', { cls: 'layout' },
            el('aside', { cls: 'sidebar' },
                el('div', { cls: 'sidebar-logo' }, logoIcon, 'Admin'),
                el('nav', { cls: 'sidebar-nav' },
                    ...NAV.map(n => el('div', {
                        cls: `nav-item ${section === n.id ? 'active' : ''}`,
                        onclick: () => { section = n.id; render(); }
                    }, ic(n.icon), n.label)),
                    el('div', { cls: 'nav-sep' }),
                    el('div', { cls: 'nav-item', onclick: () => window.open('/', '_blank') }, ic('monitor'), 'View Site'),
                    el('div', { cls: 'nav-item', onclick: () => window.open('/blog', '_blank') }, ic('book-open'), 'View Blog'),
                ),
                el('div', { cls: 'sidebar-foot' },
                    el('a', { href: '#', onclick: e => { e.preventDefault(); token = ''; localStorage.removeItem('admin_token'); render(); } }, ic('log-out'), 'Sign Out')
                ),
            ),
            el('div', { cls: 'main' },
                el('div', { cls: 'topbar' },
                    el('h2', { id: 'hdr' }),
                    el('div', { cls: 'topbar-actions', id: 'hdr-actions' })
                ),
                el('div', { cls: 'page' }, el('div', { cls: 'page-inner', id: 'content' }))
            )
        );
        setTimeout(ric, 0);
        return layout;
    }

    function loadSection() {
        ({ profile: loadProfile, projects: loadProjects, blog: loadBlog, experience: loadExperience, skills: loadSkills })[section]?.();
    }

    function hdr(t) { const e = $('#hdr'); if (e) e.textContent = t; }
    function acts(...bs) { const e = $('#hdr-actions'); if (e) { e.innerHTML = ''; bs.forEach(b => e.appendChild(b)); } }
    function cnt() { return $('#content'); }

    function field(label, id, value, type = 'text', ph = '') {
        return el('div', { cls: 'form-row' }, el('label', { for: id }, label), el('input', { cls: 'input', id, type, value: value ?? '', placeholder: ph }));
    }

    function textField(label, id, value, rows = 4) {
        return el('div', { cls: 'form-row' }, el('label', { for: id }, label), el('textarea', { cls: 'input', id, rows: String(rows) }, value ?? ''));
    }

    function btn(label, iconName, cls, fn) {
        const b = el('button', { cls, onclick: fn });
        if (iconName) b.innerHTML = `<i data-lucide="${iconName}"></i> `;
        b.appendChild(document.createTextNode(label));
        return b;
    }

    function cardHeader(title, iconName) {
        const div = el('div', { cls: 'card-header' });
        div.innerHTML = `<h3><span class="lc"><i data-lucide="${iconName}"></i></span> ${title}</h3>`;
        return div;
    }

    function emptyState(iconName, text) {
        const div = el('div', { cls: 'card empty' });
        div.innerHTML = `<div class="em-icon"><i data-lucide="${iconName}"></i></div>`;
        div.appendChild(el('p', {}, `${text}. Click the button above to create one.`));
        return div;
    }

    /* ======== PROFILE ======== */

    async function loadProfile() {
        hdr('Profile'); acts();
        const p = await api('GET', '/api/profile');
        if (!p) return;
        const c = cnt(); c.innerHTML = '';

        let photoUrl = p.photo_url || '';
        const photoFileInput = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
        const photoPreview = el('div', { cls: 'photo-preview', onclick: () => photoFileInput.click() });
        photoPreview.innerHTML = photoUrl
            ? `<img src="${photoUrl}" alt="">`
            : '<i data-lucide="camera"></i>';

        photoFileInput.addEventListener('change', async () => {
            const f = photoFileInput.files[0]; if (!f) return;
            const d = await uploadFile(f);
            if (d.url) {
                photoUrl = d.url;
                photoPreview.innerHTML = `<img src="${d.url}" alt="">`;
                toast('Photo uploaded');
            }
        });

        c.appendChild(el('div', { cls: 'card' },
            cardHeader('About You', 'user'),
            el('div', { cls: 'form' },
                el('div', { cls: 'photo-upload' },
                    photoPreview, photoFileInput,
                    el('div', {},
                        el('div', { style: 'font-size:13px;font-weight:600;margin-bottom:2px' }, 'Photo'),
                        el('div', { style: 'font-size:12px;color:var(--a-muted)' }, 'Click to upload')
                    )
                ),
                el('div', { cls: 'form-grid' }, field('Name', 'pf-name', p.name), field('Title / Role', 'pf-title', p.title)),
                textField('Bio', 'pf-bio', p.bio, 3),
            )
        ));

        c.appendChild(el('div', { cls: 'card' },
            cardHeader('Contacts & Links', 'link'),
            el('div', { cls: 'form' },
                el('div', { cls: 'form-grid' }, field('Email', 'pf-email', p.email, 'email'), field('GitHub username', 'pf-github', p.github)),
                el('div', { cls: 'form-grid' }, field('LinkedIn', 'pf-linkedin', p.linkedin, 'url', 'https://linkedin.com/in/...'), field('Telegram', 'pf-telegram', p.telegram, 'text', '@username')),
                btn('Save Profile', 'save', 'btn btn-primary', async () => {
                    const d = { photo_url: photoUrl };
                    'name,title,bio,email,github,linkedin,telegram'.split(',').forEach(k => { d[k] = $(`#pf-${k}`)?.value || ''; });
                    d.website = ''; d.location = '';
                    const r = await api('PUT', '/api/admin/profile', d);
                    if (r) toast('Profile saved!');
                })
            )
        ));
        ric();
    }

    /* ======== PROJECTS ======== */

    async function loadProjects() {
        hdr('Projects');
        acts(btn('New Project', 'plus', 'btn btn-primary', () => editProject({})));
        const items = await api('GET', '/api/admin/projects');
        if (!items) return;
        const c = cnt(); c.innerHTML = '';

        if (!items.length) { c.appendChild(emptyState('layers', 'No projects yet')); ric(); return; }

        const list = el('div', { cls: 'card' });
        const inner = el('div', { cls: 'list-items' });
        items.forEach(p => {
            const icon = el('div', { cls: 'li-icon' }); icon.innerHTML = '<i data-lucide="layers"></i>';
            const row = el('div', { cls: 'list-item clickable', onclick: () => editProject(p) },
                icon,
                el('div', { cls: 'li-body' },
                    el('div', { cls: 'li-title' }, p.title),
                    el('div', { cls: 'li-sub' },
                        p.tags ? el('span', {}, p.tags) : null,
                        p.url ? el('span', { style: 'font-size:12px;color:var(--a-accent)' }, p.url.replace(/^https?:\/\//, '')) : null
                    )
                ),
            );
            inner.appendChild(row);
        });
        list.appendChild(inner);
        c.appendChild(list);
        ric();
    }

    function editProject(data = {}) {
        hdr(data.id ? 'Edit Project' : 'New Project');
        const actBtns = [btn('Back', 'arrow-left', 'btn btn-ghost btn-sm', loadProjects)];
        if (data.id) actBtns.push(btn('Delete', 'trash-2', 'btn btn-danger btn-sm', async () => { if (confirm('Delete this project?')) { await api('DELETE', `/api/admin/projects/${data.id}`); toast('Deleted'); loadProjects(); } }));
        acts(...actBtns);
        const c = cnt(); c.innerHTML = '';
        c.appendChild(el('div', { cls: 'card' },
            cardHeader('Project Details', 'layers'),
            el('div', { cls: 'form' },
                field('Title', 'pj-title', data.title),
                el('div', { cls: 'form-grid' }, field('Project URL', 'pj-url', data.url, 'url', 'https://...'), field('GitHub URL', 'pj-github_url', data.github_url, 'url')),
                field('Tags (comma-separated)', 'pj-tags', data.tags),
                textField('Description', 'pj-description', data.description, 5),
                btn('Save Project', 'save', 'btn btn-primary', async () => {
                    const b = {};
                    'title,url,github_url,tags,description'.split(',').forEach(k => b[k] = $(`#pj-${k}`)?.value || '');
                    b.icon = 'app'; b.sort_order = 0;
                    data.id ? await api('PUT', `/api/admin/projects/${data.id}`, b) : await api('POST', '/api/admin/projects', b);
                    toast('Saved!'); loadProjects();
                })
            )
        ));
        ric();
    }

    /* ======== BLOG ======== */

    async function loadBlog() {
        hdr('Blog Posts');
        acts(btn('New Post', 'plus', 'btn btn-primary', () => openWriter({})));
        const items = await api('GET', '/api/admin/blog');
        if (!items) return;
        const c = cnt(); c.innerHTML = '';

        if (!items.length) { c.appendChild(emptyState('pen-line', 'No blog posts yet')); ric(); return; }

        const cards = el('div', { cls: 'blog-cards' });
        items.forEach(p => {
            const thumb = el('div', { cls: 'bc-thumb' });
            if (p.cover_image) {
                thumb.innerHTML = `<div class="bc-blur" style="background-image:url('${p.cover_image}')"></div><img src="${p.cover_image}" alt="">`;
            } else {
                thumb.innerHTML = '<div class="bc-empty"><i data-lucide="file-text"></i></div>';
            }

            const card = el('div', { cls: 'blog-card', onclick: () => openWriter(p) },
                thumb,
                el('div', { cls: 'bc-body' },
                    el('div', { cls: 'bc-title' }, p.title),
                    el('div', { cls: 'bc-meta' },
                        p.published ? el('span', { cls: 'badge badge-ok' }, 'Published') : el('span', { cls: 'badge badge-dim' }, 'Draft'),
                        el('span', {}, p.created_at ? new Date(p.created_at).toLocaleDateString() : ''),
                    ),
                    p.excerpt ? el('div', { cls: 'bc-excerpt' }, p.excerpt) : null
                ),
            );
            cards.appendChild(card);
        });

        c.appendChild(cards);
        ric();
    }

    /* ======== WRITER ======== */

    async function openWriter(data = {}) {
        if (data.id && !data.content) {
            const d = await api('GET', `/api/blog/${data.slug}`);
            if (d) data = { ...data, content: d.content };
        }

        let showPreview = false;
        let coverUrl = data.cover_image || '';
        const overlay = el('div', { cls: 'writer-overlay' });

        // -- Top bar
        const backBtn = btn('Back', 'arrow-left', 'btn btn-ghost btn-sm', () => overlay.remove());
        const spacer = el('span', { cls: 'wt-spacer' });
        const pubToggle = el('label', { cls: 'toggle', style: 'font-size:13px' },
            el('input', { type: 'checkbox', id: 'w-published', ...(data.published ? { checked: '' } : {}) }),
            'Published'
        );
        const previewBtn = el('button', { cls: 'btn btn-ghost btn-sm', onclick: togglePreview });
        previewBtn.innerHTML = '<i data-lucide="eye"></i> Preview';
        const saveBtn = btn('Save', 'save', 'btn btn-primary btn-sm', () => savePost(data.id, overlay));

        const topItems = [backBtn, spacer, pubToggle];
        if (data.id) {
            const delBtn = btn('Delete', 'trash-2', 'btn btn-danger btn-sm', async () => {
                if (!confirm('Delete this post?')) return;
                await api('DELETE', `/api/admin/blog/${data.id}`);
                toast('Deleted'); overlay.remove(); loadBlog();
            });
            topItems.push(delBtn);
        }
        topItems.push(previewBtn, saveBtn);
        overlay.appendChild(el('div', { cls: 'writer-topbar' }, ...topItems));

        // -- Title + slug (Latin slug + date; matches server normalize_blog_slug)
        const slugSpan = el('div', { cls: 'wh-slug', id: 'w-slug-display' }, data.slug ? `slug: ${data.slug}` : '');
        const titleInput = el('input', { cls: 'wh-title', id: 'w-title', placeholder: 'Post title...', value: data.title || '' });
        titleInput.addEventListener('input', () => {
            if (!data.id) {
                const s = normalizeBlogSlug(titleInput.value);
                slugSpan.textContent = s ? `slug: ${s}` : '';
            }
        });

        // -- Cover upload
        const coverFileInput = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
        const coverArea = el('div', { cls: 'cover-upload', id: 'w-cover-area', onclick: () => coverFileInput.click() });

        function renderCover() {
            coverArea.innerHTML = '';
            if (coverUrl) {
                coverArea.appendChild(el('img', { src: coverUrl }));
                const rm = el('button', { cls: 'remove-cover', onclick: e => { e.stopPropagation(); coverUrl = ''; renderCover(); } }, '×');
                coverArea.appendChild(rm);
            } else {
                coverArea.innerHTML = '<i data-lucide="image-plus" style="width:28px;height:28px;color:#d4d4d8"></i>';
                coverArea.appendChild(el('p', {}, 'Click or paste image (Ctrl+V)'));
            }
            coverArea.appendChild(coverFileInput);
            ric();
        }

        coverFileInput.addEventListener('change', async () => {
            const f = coverFileInput.files[0]; if (!f) return;
            const d = await uploadFile(f);
            if (d.url) { coverUrl = d.url; renderCover(); toast('Cover uploaded'); }
        });

        renderCover();
        coverArea.tabIndex = 0;
        coverArea.setAttribute('title', 'Click to choose file, or paste an image from clipboard (works when editor or title is focused too)');

        overlay.appendChild(el('div', { cls: 'writer-head' }, titleInput, slugSpan, coverArea));

        // -- Meta row (tags, excerpt)
        overlay.appendChild(el('div', { cls: 'writer-meta-row' },
            el('div', { cls: 'wm-field' }, el('label', {}, 'Tags'), el('input', { cls: 'wm-input', id: 'w-tags', value: data.tags || '', style: 'width:220px', placeholder: 'tech, web, ...' })),
            el('div', { cls: 'wm-field' }, el('label', {}, 'Excerpt'), el('input', { cls: 'wm-input', id: 'w-excerpt', value: data.excerpt || '', style: 'width:300px', placeholder: 'Short description...' })),
        ));

        // -- Toolbar (single image button, no duplicate)
        const toolbar = el('div', { cls: 'writer-toolbar' });
        const TB = [
            { t: 'B', tip: 'Bold (Ctrl+B)', fn: () => wrap('**', '**') },
            { t: 'I', tip: 'Italic (Ctrl+I)', fn: () => wrap('*', '*'), style: 'font-style:italic' },
            { t: 'S', tip: 'Strikethrough', fn: () => wrap('~~', '~~'), style: 'text-decoration:line-through' },
            '|',
            { t: 'H1', tip: 'Heading 1', fn: () => prefix('# ') },
            { t: 'H2', tip: 'Heading 2', fn: () => prefix('## ') },
            { t: 'H3', tip: 'Heading 3', fn: () => prefix('### ') },
            '|',
            { icon: 'link', tip: 'Insert Link (Ctrl+K)', fn: doInsertLink },
            { icon: 'image', tip: 'Insert/Upload Image', fn: () => showImageDialog(overlay) },
            '|',
            { t: '{ }', tip: 'Code Block', fn: () => wrap('\n```\n', '\n```\n') },
            { t: '`', tip: 'Inline Code', fn: () => wrap('`', '`') },
            '|',
            { icon: 'list', tip: 'Bullet List', fn: () => prefix('- ') },
            { icon: 'list-ordered', tip: 'Numbered List', fn: () => prefix('1. ') },
            { icon: 'quote', tip: 'Blockquote', fn: () => prefix('> ') },
            { icon: 'minus', tip: 'Horizontal Rule', fn: () => ins('\n\n---\n\n') },
            '|',
            { icon: 'table', tip: 'Table', fn: () => ins('\n| Col 1 | Col 2 | Col 3 |\n|-------|-------|-------|\n| data  | data  | data  |\n') },
        ];
        TB.forEach(b => {
            if (b === '|') { toolbar.appendChild(el('div', { cls: 'tb-sep' })); return; }
            const bt = el('button', { cls: 'tb', title: b.tip, onclick: e => { e.preventDefault(); b.fn(); } });
            if (b.icon) bt.innerHTML = `<i data-lucide="${b.icon}"></i>`;
            else { bt.textContent = b.t; if (b.style) bt.style.cssText = b.style; }
            toolbar.appendChild(bt);
        });
        overlay.appendChild(toolbar);

        // -- Editor + Preview
        const textarea = el('textarea', { id: 'w-editor', placeholder: 'Start writing...' }, data.content || '');
        const previewDiv = el('div', { cls: 'writer-preview', id: 'w-preview' });
        const writerBody = el('div', { cls: 'writer-body', id: 'w-body' },
            el('div', { cls: 'writer-editor' }, textarea),
            previewDiv
        );
        overlay.appendChild(writerBody);

        // -- Footer
        let wordCount = countWords(data.content || '');
        const wcSpan = el('span', {}, `${wordCount} words`);
        overlay.appendChild(el('div', { cls: 'writer-footer' }, wcSpan, el('span', {}, 'Markdown')));

        document.body.appendChild(overlay);
        ric();
        textarea.focus();

        // Keyboard shortcuts
        textarea.addEventListener('keydown', e => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'b') { e.preventDefault(); wrap('**', '**'); }
                else if (e.key === 'i') { e.preventDefault(); wrap('*', '*'); }
                else if (e.key === 's') { e.preventDefault(); savePost(data.id, overlay); }
                else if (e.key === 'k') { e.preventDefault(); doInsertLink(); }
            }
            if (e.key === 'Tab') { e.preventDefault(); ins('    '); }
        });

        let previewTimer;
        textarea.addEventListener('input', () => {
            wordCount = countWords(textarea.value);
            wcSpan.textContent = `${wordCount} words`;
            if (showPreview) { clearTimeout(previewTimer); previewTimer = setTimeout(refreshPreview, 300); }
        });

        function togglePreview() {
            showPreview = !showPreview;
            previewDiv.classList.toggle('visible', showPreview);
            writerBody.classList.toggle('has-preview', showPreview);
            previewBtn.innerHTML = showPreview ? '<i data-lucide="pen-line"></i> Editor' : '<i data-lucide="eye"></i> Preview';
            ric();
            if (showPreview) refreshPreview();
        }

        async function refreshPreview() {
            const r = await api('POST', '/api/admin/preview-markdown', { content: textarea.value });
            if (r) previewDiv.innerHTML = r.html || '<p style="color:var(--a-muted)">Start writing...</p>';
        }

        function getTA() { return $('#w-editor'); }

        function wrap(before, after) {
            const ta = getTA(); if (!ta) return;
            const s = ta.selectionStart, e = ta.selectionEnd;
            const sel = ta.value.substring(s, e) || 'text';
            ta.value = ta.value.substring(0, s) + before + sel + after + ta.value.substring(e);
            ta.selectionStart = s + before.length;
            ta.selectionEnd = s + before.length + sel.length;
            ta.focus();
            if (showPreview) { clearTimeout(previewTimer); previewTimer = setTimeout(refreshPreview, 300); }
        }

        function prefix(pfx) {
            const ta = getTA(); if (!ta) return;
            const s = ta.selectionStart;
            const ls = ta.value.lastIndexOf('\n', s - 1) + 1;
            ta.value = ta.value.substring(0, ls) + pfx + ta.value.substring(ls);
            ta.selectionStart = ta.selectionEnd = s + pfx.length;
            ta.focus();
            if (showPreview) { clearTimeout(previewTimer); previewTimer = setTimeout(refreshPreview, 300); }
        }

        function ins(text) {
            const ta = getTA(); if (!ta) return;
            const p = ta.selectionStart;
            ta.value = ta.value.substring(0, p) + text + ta.value.substring(ta.selectionEnd);
            ta.selectionStart = ta.selectionEnd = p + text.length;
            ta.focus();
            if (showPreview) { clearTimeout(previewTimer); previewTimer = setTimeout(refreshPreview, 300); }
        }

        /* Одна вставка из буфера на весь редактор: Chrome даёт image с kind=file и пустым type — см. imageFromClipboard */
        overlay.addEventListener('paste', async (e) => {
            const img = imageFromClipboard(e.clipboardData);
            if (!img) return;
            const t = e.target;
            const inEditor = t === textarea || (t.closest && t.closest('.writer-editor'));
            const inTitle = t === titleInput;
            const inCover = t === coverArea || (coverArea.contains && coverArea.contains(t));
            e.preventDefault();
            e.stopPropagation();
            const d = await uploadFile(img);
            if (!d || !d.url) {
                toast((d && d.detail) || 'Upload failed', false);
                return;
            }
            if (inEditor) {
                ins(`![image](${d.url})`);
                toast('Image inserted');
            } else if (inTitle || inCover) {
                coverUrl = d.url;
                renderCover();
                toast('Cover set');
            } else {
                ins(`![image](${d.url})`);
                toast('Image inserted');
            }
        }, true);

        function doInsertLink() {
            const url = prompt('Enter URL:', 'https://');
            if (!url) return;
            wrap('[', `](${url})`);
        }

        function showImageDialog(parent) {
            const bg = el('div', { cls: 'modal-bg', onclick: e => { if (e.target === bg) bg.remove(); } });
            const fileIn = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
            const urlIn = el('input', { cls: 'input', placeholder: 'https://example.com/image.png', style: 'flex:1' });

            const dzIcon = el('div', { style: 'margin-bottom:4px' });
            dzIcon.innerHTML = '<i data-lucide="upload-cloud" style="width:32px;height:32px;color:var(--a-muted)"></i>';

            const dz = el('div', { cls: 'drop-zone', onclick: () => fileIn.click() }, dzIcon, el('p', {}, 'Click or drag & drop to upload'), fileIn);

            fileIn.addEventListener('change', async () => {
                const f = fileIn.files[0]; if (!f) return;
                const d = await uploadFile(f);
                if (d && d.url) { ins(`![${f.name}](${d.url})`); bg.remove(); toast('Uploaded!'); }
                else toast((d && d.detail) || 'Upload failed', false);
            });

            dz.addEventListener('dragover', e => { e.preventDefault(); dz.style.borderColor = 'var(--a-accent)'; });
            dz.addEventListener('dragleave', () => dz.style.borderColor = '');
            dz.addEventListener('drop', e => { e.preventDefault(); dz.style.borderColor = ''; if (e.dataTransfer.files[0]) { fileIn.files = e.dataTransfer.files; fileIn.dispatchEvent(new Event('change')); } });

            bg.tabIndex = 0;
            bg.addEventListener('paste', async (e) => {
                const img = imageFromClipboard(e.clipboardData);
                if (!img) return;
                e.preventDefault();
                e.stopPropagation();
                const d = await uploadFile(img);
                if (d && d.url) { ins(`![image](${d.url})`); bg.remove(); toast('Pasted'); }
                else toast((d && d.detail) || 'Upload failed', false);
            }, true);

            bg.appendChild(el('div', { cls: 'modal' },
                el('h3', {}, 'Insert Image'),
                el('p', { style: 'font-size:11px;color:var(--a-muted);margin:0 0 8px' }, 'Paste from clipboard (Ctrl+V), drop a file, or use URL'),
                dz,
                el('div', { style: 'margin:14px 0 10px;font-size:12px;text-align:center;color:var(--a-muted)' }, '— or insert by URL —'),
                el('div', { style: 'display:flex;gap:8px' },
                    urlIn,
                    btn('Insert', null, 'btn btn-primary btn-sm', () => { if (urlIn.value) { ins(`![image](${urlIn.value})`); bg.remove(); } })
                ),
                el('div', { style: 'text-align:right;margin-top:14px' }, btn('Cancel', null, 'btn btn-ghost btn-sm', () => bg.remove())),
            ));

            parent.appendChild(bg);
            ric();
            setTimeout(() => bg.focus(), 50);
        }

        async function savePost(id, ov) {
            const slug = data.id ? data.slug : normalizeBlogSlug(titleInput.value);
            const body = {
                title: titleInput.value || '',
                slug: slug || '',
                content: textarea.value || '',
                excerpt: $('#w-excerpt')?.value || '',
                cover_image: coverUrl,
                tags: $('#w-tags')?.value || '',
                published: $('#w-published')?.checked || false,
            };
            if (!body.title) { toast('Title is required', false); return; }
            if (!body.slug) { toast('Could not generate slug', false); return; }
            if (id) await api('PUT', `/api/admin/blog/${id}`, body);
            else await api('POST', '/api/admin/blog', body);
            toast('Post saved!');
            ov.remove();
            loadBlog();
        }
    }

    function countWords(t) { return t.trim() ? t.trim().split(/\s+/).length : 0; }

    /* ======== EXPERIENCE ======== */

    async function loadExperience() {
        hdr('Work Experience');
        acts(btn('New Entry', 'plus', 'btn btn-primary', () => editExp({})));
        const items = await api('GET', '/api/admin/experience');
        if (!items) return;
        const c = cnt(); c.innerHTML = '';

        if (!items.length) { c.appendChild(emptyState('briefcase', 'No experience entries yet')); ric(); return; }

        const list = el('div', { cls: 'card' });
        const inner = el('div', { cls: 'list-items' });
        items.forEach(e => {
            const icon = el('div', { cls: 'li-icon' }); icon.innerHTML = '<i data-lucide="briefcase"></i>';
            inner.appendChild(el('div', { cls: 'list-item clickable', onclick: () => editExp(e) },
                icon,
                el('div', { cls: 'li-body' },
                    el('div', { cls: 'li-title' }, e.role),
                    el('div', { cls: 'li-sub' }, el('span', {}, e.company), el('span', {}, `${e.start_date} — ${e.end_date}`))
                ),
            ));
        });
        list.appendChild(inner);
        c.appendChild(list);
        ric();
    }

    function dateToMonth(str) {
        if (!str) return '';
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
        const m = str.match(/(\d{4})-(\d{2})/);
        return m ? `${m[1]}-${m[2]}` : '';
    }

    function monthToDisplay(val) {
        if (!val) return '';
        const [y, m] = val.split('-');
        const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${names[parseInt(m, 10) - 1]} ${y}`;
    }

    function editExp(data = {}) {
        hdr(data.id ? 'Edit Experience' : 'New Experience');
        const actBtns = [btn('Back', 'arrow-left', 'btn btn-ghost btn-sm', loadExperience)];
        if (data.id) actBtns.push(btn('Delete', 'trash-2', 'btn btn-danger btn-sm', async () => { if (confirm('Delete this entry?')) { await api('DELETE', `/api/admin/experience/${data.id}`); toast('Deleted'); loadExperience(); } }));
        acts(...actBtns);
        const c = cnt(); c.innerHTML = '';

        const isCurrent = !data.end_date || data.end_date === 'Present';
        const endDateField = el('div', { cls: 'form-row', id: 'ex-end-wrap' },
            el('label', { for: 'ex-end' }, 'End date'),
            el('input', { cls: 'input', id: 'ex-end', type: 'month', value: isCurrent ? '' : dateToMonth(data.end_date) })
        );
        if (isCurrent) endDateField.style.display = 'none';

        const currentToggle = el('label', { cls: 'toggle', style: 'margin-top:4px' },
            el('input', { type: 'checkbox', id: 'ex-current', ...(isCurrent ? { checked: '' } : {}) }),
            'I currently work here'
        );
        currentToggle.querySelector('input').addEventListener('change', e => {
            endDateField.style.display = e.target.checked ? 'none' : '';
        });

        c.appendChild(el('div', { cls: 'card' },
            cardHeader('Experience Details', 'briefcase'),
            el('div', { cls: 'form' },
                el('div', { cls: 'form-grid' }, field('Company', 'ex-company', data.company), field('Role', 'ex-role', data.role)),
                el('div', { cls: 'form-grid' },
                    el('div', { cls: 'form-row' }, el('label', { for: 'ex-start' }, 'Start date'), el('input', { cls: 'input', id: 'ex-start', type: 'month', value: dateToMonth(data.start_date) })),
                    endDateField
                ),
                currentToggle,
                textField('Description', 'ex-desc', data.description, 5),
                btn('Save', 'save', 'btn btn-primary', async () => {
                    const isCur = $('#ex-current')?.checked;
                    const startVal = $('#ex-start')?.value || '';
                    const endVal = isCur ? 'Present' : ($('#ex-end')?.value || '');
                    const b = {
                        company: $('#ex-company').value,
                        role: $('#ex-role').value,
                        description: $('#ex-desc').value,
                        start_date: startVal ? monthToDisplay(startVal) : '',
                        end_date: endVal === 'Present' ? 'Present' : (endVal ? monthToDisplay(endVal) : ''),
                        sort_order: 0
                    };
                    data.id ? await api('PUT', `/api/admin/experience/${data.id}`, b) : await api('POST', '/api/admin/experience', b);
                    toast('Saved!'); loadExperience();
                })
            )
        ));
        ric();
    }

    /* ======== SKILLS ======== */

    async function loadSkills() {
        hdr('Skills');
        acts(btn('New Skill', 'plus', 'btn btn-primary', () => editSkill({})));
        const items = await api('GET', '/api/admin/skills');
        if (!items) return;
        const c = cnt(); c.innerHTML = '';

        if (!items.length) { c.appendChild(emptyState('bar-chart-3', 'No skills yet')); ric(); return; }

        const grouped = {};
        items.forEach(s => { (grouped[s.category] = grouped[s.category] || []).push(s); });

        Object.entries(grouped).forEach(([cat, skills]) => {
            const card = el('div', { cls: 'card' });
            card.appendChild(cardHeader(cat, 'folder'));
            const inner = el('div', { cls: 'list-items' });
            skills.forEach(s => {
                inner.appendChild(el('div', { cls: 'list-item clickable', onclick: () => editSkill(s) },
                    el('div', { cls: 'li-body', style: 'flex:1' },
                        el('div', { style: 'display:flex;align-items:center;justify-content:space-between' },
                            el('div', { cls: 'li-title' }, s.name),
                            el('span', { style: 'font-size:12px;color:var(--a-muted);font-weight:600' }, `${s.level}%`)
                        ),
                        el('div', { style: 'margin-top:6px;width:100%;height:6px;background:#e4e4e7;border-radius:3px;overflow:hidden' },
                            el('div', { style: `width:${s.level}%;height:100%;background:var(--a-accent);border-radius:3px;transition:width .3s` })
                        )
                    ),
                ));
            });
            card.appendChild(inner);
            c.appendChild(card);
        });
        ric();
    }

    function editSkill(data = {}) {
        hdr(data.id ? 'Edit Skill' : 'New Skill');
        const actBtns = [btn('Back', 'arrow-left', 'btn btn-ghost btn-sm', loadSkills)];
        if (data.id) actBtns.push(btn('Delete', 'trash-2', 'btn btn-danger btn-sm', async () => { if (confirm('Delete this skill?')) { await api('DELETE', `/api/admin/skills/${data.id}`); toast('Deleted'); loadSkills(); } }));
        acts(...actBtns);
        const c = cnt(); c.innerHTML = '';

        const levelVal = data.level ?? 50;
        const levelLabel = el('span', { style: 'font-size:14px;font-weight:700;color:var(--a-accent);min-width:40px;text-align:right' }, `${levelVal}%`);
        const levelSlider = el('input', { type: 'range', min: '0', max: '100', value: String(levelVal), id: 'sk-level', cls: 'range-slider' });
        levelSlider.addEventListener('input', () => { levelLabel.textContent = `${levelSlider.value}%`; });

        c.appendChild(el('div', { cls: 'card' },
            cardHeader('Skill Details', 'bar-chart-3'),
            el('div', { cls: 'form' },
                el('div', { cls: 'form-grid' }, field('Name', 'sk-name', data.name), field('Category', 'sk-cat', data.category || 'General')),
                el('div', { cls: 'form-row' },
                    el('label', {}, 'Proficiency'),
                    el('div', { style: 'display:flex;align-items:center;gap:14px' }, levelSlider, levelLabel)
                ),
                btn('Save', 'save', 'btn btn-primary', async () => {
                    const b = { name: $('#sk-name').value, category: $('#sk-cat').value, level: parseInt($('#sk-level').value) || 50 };
                    data.id ? await api('PUT', `/api/admin/skills/${data.id}`, b) : await api('POST', '/api/admin/skills', b);
                    toast('Saved!'); loadSkills();
                })
            )
        ));
        ric();
    }

    /* ======== HELPERS ======== */

    async function del(type, id) {
        if (!confirm('Delete this item?')) return;
        await api('DELETE', `/api/admin/${type}/${id}`);
        toast('Deleted'); loadSection();
    }

    render();
})();
