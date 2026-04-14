/**
 * Application implementations — File Manager, About, Projects, Blog,
 * Career Path, GitHub Stats, Browser, Text Viewer, Minesweeper, Settings.
 */
const Apps = (() => {

    async function fetchJSON(url) {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
    }

    function textViewer(title, content, icon = 'file') {
        WM.createWindow({ title, icon, width: 480, height: 360, body: `<div class="text-viewer">${escapeHtml(content)}</div>` });
    }

    function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    function showLoading(el) { el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--win-dark)"><div class="win-loading"></div></div>'; }

    // ---- File Manager ----
    function fileManager(startPath = '') {
        let currentPath = startPath;
        const win = WM.createWindow({
            title: 'File Manager', icon: 'folder', width: 600, height: 420,
            toolbar: `<div class="address-bar"><label>Path:</label><input class="win-input" id="fm-path-input" value="C:\\" readonly></div>`,
            body: `<div class="fm-container"><div class="fm-tree" id="fm-tree"></div><div class="fm-files" id="fm-files"></div></div>`,
            statusbar: '<div class="win-statusbar-section" id="fm-status">Ready</div>',
        });
        const tree = win.el.querySelector('#fm-tree'), files = win.el.querySelector('#fm-files');
        const pathInput = win.el.querySelector('#fm-path-input'), status = win.el.querySelector('#fm-status');
        const rootDirs = ['About', 'Projects', 'Blog', 'Career'];

        function renderTree() {
            tree.innerHTML = '';
            const root = document.createElement('div');
            root.className = 'fm-tree-item' + (currentPath === '' ? ' selected' : '');
            root.innerHTML = `${WM.getIcon('computer')} C:\\`;
            root.onclick = () => navigate('');
            tree.appendChild(root);
            rootDirs.forEach(d => {
                const item = document.createElement('div');
                item.className = 'fm-tree-item' + (currentPath.toLowerCase() === d.toLowerCase() ? ' selected' : '');
                item.innerHTML = `${WM.getIcon('folder')} ${d}`;
                item.style.paddingLeft = '20px';
                item.onclick = () => navigate(d);
                tree.appendChild(item);
            });
        }

        async function navigate(path) {
            currentPath = path;
            pathInput.value = 'C:\\' + (path ? path.replace(/\//g, '\\') : '');
            renderTree();
            try {
                const data = await fetchJSON('/api/fs/' + encodeURIComponent(path || ''));
                if (data.type === 'file') {
                    const parentPath = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
                    currentPath = parentPath;
                    pathInput.value = 'C:\\' + (parentPath ? parentPath.replace(/\//g, '\\') : '');
                    renderTree();
                    textViewer(data.name, data.content || '', data.name.endsWith('.MD') ? 'file-md' : 'file');
                    return;
                }
                renderFiles(data);
                status.textContent = data.children ? `${data.children.length} item(s)` : 'File';
            } catch { files.innerHTML = '<div style="padding:8px;color:red">Error loading path</div>'; }
        }

        function renderFiles(data) {
            files.innerHTML = '';
            if (!data.children) return;
            if (currentPath) {
                const up = document.createElement('div');
                up.className = 'fm-file';
                up.innerHTML = `${WM.getIcon('folder', 32)}<span class="fm-file-name">..</span>`;
                up.ondblclick = () => navigate('');
                files.appendChild(up);
            }
            data.children.forEach(item => {
                const el = document.createElement('div');
                el.className = 'fm-file';
                const isDir = item.type === 'dir';
                const iconName = isDir ? 'folder' : (item.name.endsWith('.MD') ? 'file-md' : 'file');
                el.innerHTML = `${WM.getIcon(iconName, 32)}<span class="fm-file-name">${item.name}</span>`;
                el.ondblclick = () => { if (isDir) navigate(item.name); else navigate((currentPath ? currentPath + '/' : '') + item.name); };
                el.onclick = () => { files.querySelectorAll('.fm-file').forEach(f => f.classList.remove('selected')); el.classList.add('selected'); };
                files.appendChild(el);
            });
        }
        navigate(startPath);
    }

    // ---- About Me ----
    async function aboutMe() {
        const win = WM.createWindow({ title: Desktop.t('aboutMe'), icon: 'person', width: 450, height: 380, body: '' });
        showLoading(win.el.querySelector('.win-body'));
        try {
            const p = await fetchJSON('/api/profile');
            const skills = await fetchJSON('/api/skills');
            const body = win.el.querySelector('.win-body');
            let skillsHtml = '', cat = '';
            for (const s of skills) {
                if (s.category !== cat) { cat = s.category; skillsHtml += `<div class="bold mt-8">${cat}</div>`; }
                const bar = '█'.repeat(Math.round(s.level / 10)) + '░'.repeat(10 - Math.round(s.level / 10));
                skillsHtml += `<div style="font-family:var(--win-font-mono);font-size:11px">${s.name.padEnd(18, '\u00A0')} ${bar} ${s.level}%</div>`;
            }
            body.innerHTML = `<div class="about-container">
                <div class="about-header">
                    <div class="about-photo">${p.photo_url ? `<img src="${p.photo_url}" style="width:100%;height:100%;object-fit:cover">` : WM.getIcon('person', 40)}</div>
                    <div class="about-info"><h2>${escapeHtml(p.name)}</h2><div class="about-title">${escapeHtml(p.title)}</div><p>${escapeHtml(p.bio)}</p></div>
                </div>
                <div class="win-group" style="position:relative"><span class="win-group-title">Contacts</span>
                    <dl class="about-contacts">
                        ${p.email ? `<dt>Email:</dt><dd><a href="mailto:${p.email}">${escapeHtml(p.email)}</a></dd>` : ''}
                        ${p.github ? `<dt>GitHub:</dt><dd><a href="https://github.com/${p.github}" target="_blank">${escapeHtml(p.github)}</a></dd>` : ''}
                        ${p.linkedin ? `<dt>LinkedIn:</dt><dd><a href="${p.linkedin}" target="_blank">${escapeHtml(p.linkedin)}</a></dd>` : ''}
                        ${p.telegram ? `<dt>Telegram:</dt><dd><a href="https://t.me/${p.telegram}" target="_blank">@${escapeHtml(p.telegram)}</a></dd>` : ''}
                    </dl>
                </div>
                ${skills.length ? `<div class="win-group" style="position:relative"><span class="win-group-title">Skills</span>${skillsHtml}</div>` : ''}
            </div>`;
        } catch { win.el.querySelector('.win-body').innerHTML = '<div style="padding:16px">Failed to load profile.</div>'; }
    }

    // ---- Projects ----
    async function projects() {
        const win = WM.createWindow({ title: Desktop.t('projects'), icon: 'app', width: 520, height: 400, body: '' });
        showLoading(win.el.querySelector('.win-body'));
        try {
            const data = await fetchJSON('/api/projects');
            const body = win.el.querySelector('.win-body');
            if (!data.length) { body.innerHTML = '<div style="padding:16px">No projects yet.</div>'; return; }
            body.innerHTML = `<div style="padding:8px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start">${data.map(p => `
                <div class="fm-file" ondblclick="Apps._openProject(${p.id})" style="width:90px">${WM.getIcon(p.icon || 'app', 32)}<span class="fm-file-name">${escapeHtml(p.title)}</span></div>
            `).join('')}</div>`;
            window._projectsData = data;
        } catch { win.el.querySelector('.win-body').innerHTML = '<div style="padding:16px">Failed to load.</div>'; }
    }

    function _openProject(id) {
        const p = (window._projectsData || []).find(x => x.id === id); if (!p) return;
        const content = `${p.title}\n${'='.repeat(p.title.length)}\n\n${p.description}\n\n` + (p.url ? `URL: ${p.url}\n` : '') + (p.github_url ? `GitHub: ${p.github_url}\n` : '') + (p.tags ? `Tags: ${p.tags}\n` : '');
        textViewer(p.title, content, 'app');
    }

    // ---- Blog ----
    async function blog() {
        const win = WM.createWindow({
            title: Desktop.t('blog'), icon: 'blog', width: 480, height: 400, body: '',
            statusbar: '<div class="win-statusbar-section"><a href="/blog" target="_blank" style="color:var(--win-blue);font-size:11px">Open Blog Reader ↗</a></div>',
        });
        showLoading(win.el.querySelector('.win-body'));
        try {
            const data = await fetchJSON('/api/blog');
            const body = win.el.querySelector('.win-body');
            if (!data.length) { body.innerHTML = '<div style="padding:16px">No blog posts yet.</div>'; return; }
            body.innerHTML = data.map(p => `
                <div class="gh-repo-item" onclick="Apps._openBlogPost('${p.slug}')">
                    <div class="repo-name">${WM.getIcon('file-md')} ${escapeHtml(p.title)}</div>
                    <div style="font-size:10px;color:#808080;margin-top:2px">${p.tags} · ${new Date(p.created_at).toLocaleDateString()}</div>
                    ${p.excerpt ? `<div style="margin-top:2px">${escapeHtml(p.excerpt)}</div>` : ''}
                </div>
            `).join('');
        } catch { win.el.querySelector('.win-body').innerHTML = '<div style="padding:16px">Failed to load.</div>'; }
    }

    async function _openBlogPost(slug) {
        try {
            const data = await fetchJSON('/api/blog/' + slug);
            WM.createWindow({ title: data.title, icon: 'file-md', width: 540, height: 420, body: `<div style="padding:12px;overflow-y:auto;height:100%;font-size:13px;line-height:1.6">${data.html}</div>` });
        } catch { textViewer('Error', 'Failed to load post.', 'file'); }
    }

    // ---- Career Path ----
    async function career() {
        const win = WM.createWindow({ title: Desktop.t('careerPath'), icon: 'chart', width: 460, height: 400, body: '' });
        showLoading(win.el.querySelector('.win-body'));
        try {
            const data = await fetchJSON('/api/experience');
            const body = win.el.querySelector('.win-body');
            if (!data.length) { body.innerHTML = '<div class="career-container">No experience entries yet.</div>'; return; }
            body.innerHTML = `<div class="career-container">${data.map(e => `
                <div class="timeline-item"><div class="timeline-content"><h3>${escapeHtml(e.role)}</h3><div class="timeline-date">${escapeHtml(e.company)} · ${escapeHtml(e.start_date)} — ${escapeHtml(e.end_date)}</div><p>${escapeHtml(e.description)}</p></div></div>
            `).join('')}</div>`;
        } catch { win.el.querySelector('.win-body').innerHTML = '<div class="career-container">Failed to load.</div>'; }
    }

    // ---- GitHub Stats ----
    async function githubStats() {
        const win = WM.createWindow({ title: Desktop.t('githubStats'), icon: 'github', width: 480, height: 420, body: '' });
        showLoading(win.el.querySelector('.win-body'));
        try {
            const data = await fetchJSON('/api/github-stats');
            const body = win.el.querySelector('.win-body');
            if (data.error) { body.innerHTML = `<div class="gh-container"><p>${escapeHtml(data.error)}</p></div>`; return; }
            const langTags = Object.entries(data.languages).slice(0, 10).map(([l, c]) => `<span class="gh-lang-tag">${escapeHtml(l)} (${c})</span>`).join('');
            body.innerHTML = `<div class="gh-container">
                <div class="gh-header">${data.avatar ? `<img class="gh-avatar" src="${data.avatar}" alt="">` : ''}<div><div class="bold" style="font-size:14px">${escapeHtml(data.username)}</div><a href="https://github.com/${data.username}" target="_blank" style="font-size:11px;color:var(--win-blue)">View on GitHub ↗</a></div></div>
                <div class="gh-stats-grid">
                    <div class="gh-stat-box"><div class="stat-number">${data.public_repos}</div><div class="stat-label">Repos</div></div>
                    <div class="gh-stat-box"><div class="stat-number">${data.total_stars}</div><div class="stat-label">Stars</div></div>
                    <div class="gh-stat-box"><div class="stat-number">${data.followers}</div><div class="stat-label">Followers</div></div>
                    <div class="gh-stat-box"><div class="stat-number">${data.following}</div><div class="stat-label">Following</div></div>
                </div>
                <div class="win-group" style="position:relative"><span class="win-group-title">Languages</span><div class="gh-languages">${langTags || 'None'}</div></div>
                <div class="win-group" style="position:relative"><span class="win-group-title">Top Repositories</span><div class="gh-repo-list">
                    ${data.top_repos.map(r => `<div class="gh-repo-item" onclick="window.open('${r.url}','_blank')"><span class="repo-name">${escapeHtml(r.name)}</span><span style="float:right">⭐ ${r.stars}</span><div style="font-size:10px;color:#808080">${escapeHtml(r.description || '')} ${r.language ? '· ' + r.language : ''}</div></div>`).join('')}
                </div></div>
            </div>`;
        } catch { win.el.querySelector('.win-body').innerHTML = '<div class="gh-container"><p>Failed to fetch GitHub data.</p></div>'; }
    }

    // ---- Browser ----
    function browser(url = 'https://en.wikipedia.org') {
        const win = WM.createWindow({ title: Desktop.t('browser'), icon: 'globe', width: 640, height: 460, body: '', bodyClass: 'win-body-gray' });
        const body = win.el.querySelector('.win-body');
        body.style.cssText = 'display:flex;flex-direction:column;padding:0;margin:2px;background:var(--win-bg);';
        body.innerHTML = `
            <div class="browser-toolbar">
                <button class="win-toolbar-btn" id="br-back-${win.id}">◄</button><button class="win-toolbar-btn" id="br-fwd-${win.id}">►</button><button class="win-toolbar-btn" id="br-refresh-${win.id}">↻</button>
                <input class="win-input" id="br-url-${win.id}" value="${escapeHtml(url)}" style="flex:1;height:22px"><button class="win-toolbar-btn" id="br-go-${win.id}">Go</button>
            </div>
            <iframe class="browser-frame" id="br-frame-${win.id}" src="${url}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>`;
        const frame = body.querySelector(`#br-frame-${win.id}`), urlInput = body.querySelector(`#br-url-${win.id}`);
        const go = () => { let u = urlInput.value.trim(); if (u && !u.match(/^https?:\/\//)) u = 'https://' + u; frame.src = u; };
        body.querySelector(`#br-go-${win.id}`).onclick = go;
        urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        body.querySelector(`#br-back-${win.id}`).onclick = () => { try { frame.contentWindow.history.back(); } catch {} };
        body.querySelector(`#br-fwd-${win.id}`).onclick = () => { try { frame.contentWindow.history.forward(); } catch {} };
        body.querySelector(`#br-refresh-${win.id}`).onclick = () => { frame.src = frame.src; };
    }

    // ---- Minesweeper ----
    function minesweeper() {
        const ROWS = 9, COLS = 9, MINES = 10;
        let grid, revealed, flags, gameOver, mineCount, startTime, timerInterval;
        const win = WM.createWindow({ title: Desktop.t('minesweeper'), icon: 'mine', width: 230, height: 310, body: '<div class="mine-container" id="mine-root"></div>', bodyClass: 'win-body-gray', onClose: () => clearInterval(timerInterval) });
        const root = win.el.querySelector('#mine-root');
        initGame();
        function initGame() {
            grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
            revealed = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
            flags = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
            gameOver = false; mineCount = MINES; clearInterval(timerInterval); startTime = null;
            let placed = 0;
            while (placed < MINES) { const r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS); if (grid[r][c] !== -1) { grid[r][c] = -1; placed++; } }
            for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] !== -1) grid[r][c] = neighbors(r, c).filter(([nr, nc]) => grid[nr][nc] === -1).length;
            renderBoard();
        }
        function neighbors(r, c) { const n = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if ((dr || dc) && r + dr >= 0 && r + dr < ROWS && c + dc >= 0 && c + dc < COLS) n.push([r + dr, c + dc]); return n; }
        function renderBoard() {
            root.innerHTML = '';
            const header = document.createElement('div'); header.className = 'mine-header';
            header.innerHTML = `<div class="mine-counter" id="mine-mines">${String(mineCount).padStart(3, '0')}</div><div class="mine-face" id="mine-face">🙂</div><div class="mine-counter" id="mine-timer">000</div>`;
            root.appendChild(header); header.querySelector('#mine-face').onclick = initGame;
            const gridEl = document.createElement('div'); gridEl.className = 'mine-grid'; gridEl.style.gridTemplateColumns = `repeat(${COLS}, 20px)`;
            for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const cell = document.createElement('div'); cell.className = 'mine-cell'; cell.dataset.r = r; cell.dataset.c = c; cell.addEventListener('click', () => reveal(r, c)); cell.addEventListener('contextmenu', e => { e.preventDefault(); toggleFlag(r, c); }); gridEl.appendChild(cell); }
            root.appendChild(gridEl);
        }
        function getCell(r, c) { return root.querySelector(`.mine-cell[data-r="${r}"][data-c="${c}"]`); }
        function reveal(r, c) {
            if (gameOver || flags[r][c] || revealed[r][c]) return;
            if (!startTime) { startTime = Date.now(); timerInterval = setInterval(updateTimer, 1000); }
            revealed[r][c] = true; const cell = getCell(r, c); cell.classList.add('revealed');
            if (grid[r][c] === -1) { cell.classList.add('mine-hit'); cell.textContent = '💣'; endGame(false); return; }
            if (grid[r][c] > 0) { cell.textContent = grid[r][c]; cell.dataset.n = grid[r][c]; } else { neighbors(r, c).forEach(([nr, nc]) => reveal(nr, nc)); }
            checkWin();
        }
        function toggleFlag(r, c) { if (gameOver || revealed[r][c]) return; flags[r][c] = !flags[r][c]; const cell = getCell(r, c); cell.classList.toggle('flagged', flags[r][c]); mineCount += flags[r][c] ? -1 : 1; const counter = root.querySelector('#mine-mines'); if (counter) counter.textContent = String(Math.max(0, mineCount)).padStart(3, '0'); }
        function checkWin() { let u = 0; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!revealed[r][c]) u++; if (u === MINES) endGame(true); }
        function endGame(won) {
            gameOver = true; clearInterval(timerInterval);
            const face = root.querySelector('#mine-face'); if (face) face.textContent = won ? '😎' : '😵';
            if (won) Desktop.notify('Minesweeper', '🎉 You won!', 'mine');
            if (!won) { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] === -1 && !revealed[r][c]) { const cell = getCell(r, c); cell.classList.add('revealed'); cell.textContent = '💣'; } }
        }
        function updateTimer() { if (!startTime) return; const s = Math.min(999, Math.floor((Date.now() - startTime) / 1000)); const el = root.querySelector('#mine-timer'); if (el) el.textContent = String(s).padStart(3, '0'); }
    }

    // ---- Settings ----
    function settings() {
        const s = Desktop.getSettings();
        const osThemes = Desktop.OS_THEMES;
        const L = {
            en: { os:'Operating System',appearance:'Appearance',system:'System',accent:'Accent Color',wallpaper:'Wallpaper',screensaver:'Screensaver',lang:'Language',sounds:'Sounds',sysSound:'System sounds',about:'About',preview:'Preview',installTip:'Click an OS to install with a setup animation!',konami:'Try the Konami Code: ↑↑↓↓←→←→BA',starfield:'Starfield',pipes:'Pipes',matrix:'Matrix Rain' },
            ru: { os:'Операционная система',appearance:'Оформление',system:'Система',accent:'Цвет акцента',wallpaper:'Обои',screensaver:'Заставка',lang:'Язык',sounds:'Звуки',sysSound:'Системные звуки',about:'О системе',preview:'Предпросмотр',installTip:'Нажмите на ОС, чтобы установить с анимацией!',konami:'Код Конами: ↑↑↓↓←→←→BA',starfield:'Звёзды',pipes:'Трубы',matrix:'Матрица' },
            by: { os:'Аперацыйная сістэма',appearance:'Афармленне',system:'Сістэма',accent:'Колер акцэнту',wallpaper:'Шпалеры',screensaver:'Застаўка',lang:'Мова',sounds:'Гукі',sysSound:'Сістэмныя гукі',about:'Пра сістэму',preview:'Перадпрагляд',installTip:'Пстрыкніце на АС, каб усталяваць з анімацыяй!',konami:'Код Конамі: ↑↑↓↓←→←→BA',starfield:'Зоркі',pipes:'Трубы',matrix:'Матрыца' },
        };
        const ll = L[s.lang] || L.en;

        const win = WM.createWindow({ title: Desktop.t('settings'), icon: 'settings', width: 540, height: 480, body: '', bodyClass: 'win-body-gray' });
        const body = win.el.querySelector('.win-body');
        body.style.cssText = 'padding:0;margin:2px;display:flex;background:var(--win-bg);';

        const tabs = [
            { id: 'os', label: ll.os, icon: 'computer' },
            { id: 'appearance', label: ll.appearance, icon: 'settings' },
            { id: 'system', label: ll.system, icon: 'terminal' },
        ];
        let activeTab = 'os';
        const sidebar = document.createElement('div');
        sidebar.style.cssText = 'width:130px;border-right:2px solid var(--win-dark);padding:4px 0;flex-shrink:0;overflow-y:auto;';
        const content = document.createElement('div');
        content.style.cssText = 'flex:1;padding:12px;overflow-y:auto;';
        body.appendChild(sidebar); body.appendChild(content);

        function renderTabs() {
            sidebar.innerHTML = '';
            tabs.forEach(tab => {
                const el = document.createElement('div');
                el.className = 'admin-nav-item' + (activeTab === tab.id ? ' active' : '');
                el.innerHTML = `${WM.getIcon(tab.icon)} ${tab.label}`;
                el.onclick = () => { activeTab = tab.id; renderTabs(); renderContent(); };
                sidebar.appendChild(el);
            });
        }

        function renderContent() { content.innerHTML = ''; if (activeTab === 'os') renderOs(); else if (activeTab === 'appearance') renderAppearance(); else renderSystem(); }

        function section(title) { const h = document.createElement('div'); h.className = 'bold mb-8'; h.textContent = title; h.style.cssText = 'margin-top:12px;border-bottom:1px solid var(--win-dark);padding-bottom:4px;'; content.appendChild(h); }

        function renderOs() {
            section(ll.os);
            const tip = document.createElement('div');
            tip.style.cssText = 'font-size:11px;color:var(--win-dark);margin-bottom:8px;font-style:italic;';
            tip.textContent = ll.installTip; content.appendChild(tip);

            const grid = document.createElement('div');
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:6px;';
            const previews = {
                win31:  { bg:'#008080', tb:'#000080', wb:'#C0C0C0', tbStyle:'' },
                winxp:  { bg:'linear-gradient(#3a6ea5,#6ebfff)', tb:'linear-gradient(180deg,#0A246A,#3A6EA5,#0A246A)', wb:'#ECE9D8', tbStyle:'border-radius:6px 6px 0 0;' },
                win7:   { bg:'linear-gradient(135deg,#1a3a5c,#4a90d9)', tb:'rgba(100,150,200,0.6)', wb:'rgba(255,255,255,0.85)', tbStyle:'border-radius:4px 4px 0 0;' },
                win81:  { bg:'#1e1e1e', tb:'#2D7D9A', wb:'#F0F0F0', tbStyle:'' },
                win10:  { bg:'linear-gradient(#2b5797,#1e3650)', tb:'#000', wb:'#fff', tbStyle:'' },
                win11:  { bg:'linear-gradient(135deg,#1a1a2e,#0f3460)', tb:'#f3f3f3', wb:'#fbfbfb', tbStyle:'border-radius:6px 6px 0 0;' },
            };
            Object.entries(osThemes).forEach(([id, th]) => {
                const card = document.createElement('div');
                const isActive = s.osTheme === id;
                const p = previews[id] || previews.win31;
                card.style.cssText = `cursor:pointer;border:2px solid ${isActive ? 'var(--win-highlight)' : 'var(--win-dark)'};padding:6px;${isActive ? 'background:var(--win-light);' : ''}`;
                card.innerHTML = `<div style="height:55px;margin-bottom:4px;position:relative;background:${p.bg};border:1px solid #666;overflow:hidden;"><div style="position:absolute;top:6px;left:6px;right:6px;height:34px;background:${p.wb};border:1px solid #888;${p.tbStyle}"><div style="height:10px;background:${p.tb};${p.tbStyle}"></div></div><div style="position:absolute;bottom:0;left:0;right:0;height:8px;background:${id==='win81'||id==='win10'?'#1f1f1f':id==='win11'?'rgba(32,32,32,0.8)':p.wb};border-top:1px solid #888;"></div></div><div style="font-weight:bold;font-size:11px;">${th.name}</div><div style="font-size:9px;color:var(--win-dark);">${th.year}</div>`;
                card.onclick = async () => { if (id === s.osTheme) return; WM.closeWindow(win.id); await Desktop.switchOs(id); };
                grid.appendChild(card);
            });
            content.appendChild(grid);
        }

        function renderAppearance() {
            section(ll.accent);
            const accentColors = ['#000080','#2F4F4F','#4B0082','#8B0000','#006400','#0078D4','#5B2D8E','#1E7145','#DA3B01','#C239B3','#E81123','#0099BC','#FF8C00','#6B69D6','#038387','#00B294'];
            const colorGrid = document.createElement('div');
            colorGrid.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;';
            accentColors.forEach(c => {
                const swatch = document.createElement('div');
                const isActive = s.accentColor === c;
                swatch.style.cssText = `width:24px;height:24px;background:${c};cursor:pointer;border:2px solid ${isActive ? '#fff' : 'transparent'};box-shadow:${isActive ? '0 0 0 2px var(--win-highlight)' : 'none'};`;
                swatch.onclick = () => { s.accentColor = c; Desktop.setSettings(s); renderContent(); };
                colorGrid.appendChild(swatch);
            });
            const resetBtn = document.createElement('button'); resetBtn.className = 'win-btn'; resetBtn.textContent = 'Reset';
            resetBtn.onclick = () => { s.accentColor = ''; Desktop.setSettings(s); renderContent(); };
            colorGrid.appendChild(resetBtn);
            content.appendChild(colorGrid);

            section(ll.screensaver);
            const ssTypes = [{id:'starfield',name:ll.starfield},{id:'pipes',name:ll.pipes},{id:'matrix',name:ll.matrix}];
            const ssGrid = document.createElement('div'); ssGrid.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';
            ssTypes.forEach(ss => {
                const btn = document.createElement('button'); btn.className = 'win-btn';
                if (s.screensaverType === ss.id) btn.style.cssText = 'background:var(--win-highlight,var(--win-blue));color:#fff;';
                btn.textContent = ss.name;
                btn.onclick = () => { s.screensaverType = ss.id; Desktop.setSettings(s); renderContent(); };
                ssGrid.appendChild(btn);
            });
            const previewBtn = document.createElement('button'); previewBtn.className = 'win-btn'; previewBtn.textContent = ll.preview;
            previewBtn.onclick = () => Desktop.startScreensaver(); ssGrid.appendChild(previewBtn);
            content.appendChild(ssGrid);
        }

        function renderSystem() {
            section(ll.lang);
            const langRow = document.createElement('div'); langRow.style.cssText = 'display:flex;gap:6px;margin-bottom:12px;';
            [{id:'en',label:'English'},{id:'ru',label:'Русский'},{id:'by',label:'Беларуская'}].forEach(l => {
                const btn = document.createElement('button'); btn.className = 'win-btn';
                if (s.lang === l.id) btn.style.cssText = 'background:var(--win-highlight,var(--win-blue));color:#fff;';
                btn.textContent = l.label;
                btn.onclick = () => { s.lang = l.id; Desktop.setSettings(s); WM.closeWindow(win.id); settings(); };
                langRow.appendChild(btn);
            });
            content.appendChild(langRow);
            section(ll.sounds);
            const soundLabel = document.createElement('label'); soundLabel.className = 'win-checkbox';
            const soundCb = document.createElement('input'); soundCb.type = 'checkbox'; soundCb.checked = s.soundFx;
            soundCb.onchange = () => { s.soundFx = soundCb.checked; Desktop.setSettings(s); };
            soundLabel.appendChild(soundCb); soundLabel.appendChild(document.createTextNode(' ' + ll.sysSound));
            content.appendChild(soundLabel);
            const spacer = document.createElement('div'); spacer.style.height = '16px'; content.appendChild(spacer);
            section(ll.about);
            const osName = (osThemes[s.osTheme] || osThemes.win31).name;
            const info = document.createElement('div'); info.style.cssText = 'font-size:12px;line-height:1.6;';
            info.innerHTML = `<strong>Veomall OS</strong> — ${osName}<br>Build 1337<br>FastAPI + Vanilla JS<br><br><em style="color:var(--win-dark)">${ll.konami}</em>`;
            content.appendChild(info);
        }
        renderTabs(); renderContent();
    }

    // ---- Notepad ----
    function notepad(fileName = '', initialContent = '') {
        const t = Desktop.t;
        const title = fileName || (t('notepad') || 'Notepad');
        const win = WM.createWindow({ title, icon: 'file', width: 480, height: 360, body: '', bodyClass: 'win-body-gray' });
        const body = win.el.querySelector('.win-body');
        body.style.cssText = 'display:flex;flex-direction:column;padding:0;margin:2px;';
        body.innerHTML = `
            <div style="display:flex;gap:2px;padding:2px;border-bottom:1px solid var(--win-dark);">
                <button class="win-toolbar-btn" id="np-new-${win.id}">New</button>
                <button class="win-toolbar-btn" id="np-word-${win.id}">Word Wrap</button>
                <span style="flex:1"></span>
                <span style="font-size:10px;color:var(--win-dark);padding:4px;" id="np-count-${win.id}">0 chars</span>
            </div>
            <textarea class="win-textarea" id="np-text-${win.id}" style="flex:1;resize:none;border:none;font-family:var(--win-font-mono);font-size:12px;line-height:1.5;padding:8px;">${escapeHtml(initialContent)}</textarea>`;
        const ta = body.querySelector(`#np-text-${win.id}`);
        const count = body.querySelector(`#np-count-${win.id}`);
        ta.addEventListener('input', () => { count.textContent = ta.value.length + ' chars'; });
        body.querySelector(`#np-new-${win.id}`).onclick = () => { ta.value = ''; count.textContent = '0 chars'; };
        let wrap = true;
        body.querySelector(`#np-word-${win.id}`).onclick = (e) => { wrap = !wrap; ta.style.whiteSpace = wrap ? 'pre-wrap' : 'pre'; ta.style.overflowX = wrap ? 'hidden' : 'auto'; e.target.style.fontWeight = wrap ? 'bold' : 'normal'; };
        ta.focus();
    }

    // ---- Paint ----
    function paint() {
        const win = WM.createWindow({ title: 'Paint', icon: 'app', width: 520, height: 400, body: '', bodyClass: 'win-body-gray' });
        const body = win.el.querySelector('.win-body');
        body.style.cssText = 'display:flex;flex-direction:column;padding:0;margin:0;overflow:hidden;';

        const colors = ['#000000','#FFFFFF','#808080','#C0C0C0','#FF0000','#800000','#FFFF00','#808000','#00FF00','#008000','#00FFFF','#008080','#0000FF','#000080','#FF00FF','#800080','#FF8800','#00FF88'];
        let currentColor = '#000000';
        let brushSize = 3;
        let tool = 'brush';

        body.innerHTML = `
            <div style="display:flex;gap:2px;padding:3px;border-bottom:1px solid var(--win-dark);align-items:center;">
                <button class="win-toolbar-btn paint-tool active" data-tool="brush" title="Brush">✏</button>
                <button class="win-toolbar-btn paint-tool" data-tool="eraser" title="Eraser">⬜</button>
                <button class="win-toolbar-btn paint-tool" data-tool="fill" title="Fill">🪣</button>
                <span style="width:1px;height:18px;background:var(--win-dark);margin:0 2px"></span>
                <button class="win-toolbar-btn" id="paint-clear" title="Clear">✕</button>
                <span style="flex:1"></span>
                <label style="font-size:10px;display:flex;align-items:center;gap:2px;">Size: <input type="range" min="1" max="20" value="3" id="paint-size" style="width:60px;"></label>
            </div>
            <div style="flex:1;position:relative;background:#FFF;cursor:crosshair;">
                <canvas id="paint-canvas-${win.id}" style="width:100%;height:100%;"></canvas>
            </div>
            <div style="display:flex;gap:1px;padding:2px;border-top:1px solid var(--win-dark);flex-wrap:wrap;" id="paint-palette">
                ${colors.map(c => `<div class="paint-swatch${c === currentColor ? ' active' : ''}" data-color="${c}" style="width:16px;height:16px;background:${c};border:1px solid #666;cursor:pointer;"></div>`).join('')}
                <span style="flex:1"></span>
                <div style="width:24px;height:16px;background:${currentColor};border:2px inset var(--win-dark);" id="paint-current"></div>
            </div>`;

        const canvas = body.querySelector(`#paint-canvas-${win.id}`);
        const ctx = canvas.getContext('2d');

        function resizeCanvas() {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width; canvas.height = rect.height;
        }
        resizeCanvas();
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        new ResizeObserver(resizeCanvas).observe(canvas.parentElement);

        let drawing = false;
        let lastX, lastY;

        canvas.addEventListener('mousedown', e => { drawing = true; [lastX, lastY] = getPos(e);
            if (tool === 'fill') { floodFill(Math.round(lastX), Math.round(lastY), currentColor); drawing = false; return; }
            ctx.beginPath(); ctx.arc(lastX, lastY, brushSize/2, 0, Math.PI*2); ctx.fillStyle = tool === 'eraser' ? '#FFFFFF' : currentColor; ctx.fill();
        });
        canvas.addEventListener('mousemove', e => { if (!drawing) return; const [x, y] = getPos(e);
            ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(x, y);
            ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : currentColor; ctx.lineWidth = brushSize; ctx.lineCap = 'round'; ctx.stroke();
            [lastX, lastY] = [x, y];
        });
        canvas.addEventListener('mouseup', () => drawing = false);
        canvas.addEventListener('mouseleave', () => drawing = false);

        function getPos(e) { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

        function floodFill(x, y, fillColor) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const target = getPixel(x, y);
            const fc = hexToRgb(fillColor);
            if (target[0] === fc.r && target[1] === fc.g && target[2] === fc.b) return;
            const stack = [[x, y]];
            const w = canvas.width, h = canvas.height;
            while (stack.length) {
                const [cx, cy] = stack.pop();
                if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
                const idx = (cy * w + cx) * 4;
                if (data[idx] !== target[0] || data[idx+1] !== target[1] || data[idx+2] !== target[2]) continue;
                data[idx] = fc.r; data[idx+1] = fc.g; data[idx+2] = fc.b; data[idx+3] = 255;
                stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
            }
            ctx.putImageData(imageData, 0, 0);
            function getPixel(px, py) { const i = (py * w + px) * 4; return [data[i], data[i+1], data[i+2]]; }
        }
        function hexToRgb(hex) { const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16); return {r,g,b}; }

        body.querySelectorAll('.paint-tool').forEach(btn => { btn.onclick = () => { body.querySelectorAll('.paint-tool').forEach(b => b.classList.remove('active')); btn.classList.add('active'); tool = btn.dataset.tool; }; });
        body.querySelectorAll('.paint-swatch').forEach(sw => { sw.onclick = () => { body.querySelectorAll('.paint-swatch').forEach(s => s.classList.remove('active')); sw.classList.add('active'); currentColor = sw.dataset.color; body.querySelector('#paint-current').style.background = currentColor; }; });
        body.querySelector('#paint-clear').onclick = () => { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); };
        body.querySelector('#paint-size').oninput = (e) => { brushSize = parseInt(e.target.value); };
    }

    // ---- Run Dialog ----
    function runDialog() {
        const win = WM.createWindow({ title: 'Run', icon: 'terminal', width: 360, height: 150, body: `
            <div style="padding:16px;">
                <div style="margin-bottom:12px;font-size:12px;">Type the name of a program or command:</div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <span style="font-size:11px;">Open:</span>
                    <input class="win-input" id="run-input" style="flex:1;" placeholder="e.g. snake, tetris, solitaire">
                </div>
                <div style="display:flex;justify-content:flex-end;gap:4px;margin-top:12px;">
                    <button class="win-btn" id="run-ok">OK</button>
                    <button class="win-btn" id="run-cancel">Cancel</button>
                </div>
            </div>` });
        const input = win.el.querySelector('#run-input');
        const run = () => {
            const val = input.value.trim().toLowerCase();
            const map = { paint:paint, notepad:notepad, minesweeper:minesweeper, mine:minesweeper, solitaire:solitaire, snake:snake, tetris:tetris, settings:settings, terminal:()=>Terminal.open(), browser:browser, about:aboutMe, projects:projects, blog:blog, career:career, github:githubStats, filemanager:fileManager, files:fileManager };
            WM.closeWindow(win.id);
            if (map[val]) map[val](); else if (val) Terminal.open();
        };
        win.el.querySelector('#run-ok').onclick = run;
        win.el.querySelector('#run-cancel').onclick = () => WM.closeWindow(win.id);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
        setTimeout(() => input.focus(), 50);
    }

    // ---- Snake ----
    function snake() {
        const CELL = 16, COLS = 20, ROWS = 15;
        const W = COLS * CELL, H = ROWS * CELL;
        let snakeBody, food, dir, nextDir, score, gameOver, interval;
        const win = WM.createWindow({ title: Desktop.t('snake'), icon: 'snake', width: W + 20, height: H + 70, body: '', bodyClass: 'win-body-gray', onClose: () => clearInterval(interval) });
        const body = win.el.querySelector('.win-body');
        body.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:4px;';
        body.innerHTML = `<div style="display:flex;justify-content:space-between;width:${W}px;padding:2px 0;font-size:12px;"><span id="snake-score-${win.id}">Score: 0</span><button class="win-btn" id="snake-new-${win.id}" style="font-size:10px;padding:1px 8px;">New Game</button></div><canvas id="snake-cv-${win.id}" width="${W}" height="${H}" style="border:2px inset var(--win-dark);background:#000;"></canvas>`;
        const canvas = body.querySelector(`#snake-cv-${win.id}`);
        const ctx = canvas.getContext('2d');
        const scoreEl = body.querySelector(`#snake-score-${win.id}`);

        function initGame() { snakeBody = [[10,7],[9,7],[8,7]]; dir = {x:1,y:0}; nextDir = {x:1,y:0}; score = 0; gameOver = false; placeFood(); scoreEl.textContent = 'Score: 0'; clearInterval(interval); interval = setInterval(tick, 120); draw(); }

        function placeFood() { do { food = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) }; } while (snakeBody.some(s => s[0]===food.x && s[1]===food.y)); }

        function tick() {
            if (gameOver) return;
            dir = nextDir;
            const head = [snakeBody[0][0]+dir.x, snakeBody[0][1]+dir.y];
            if (head[0]<0||head[0]>=COLS||head[1]<0||head[1]>=ROWS || snakeBody.some(s=>s[0]===head[0]&&s[1]===head[1])) { gameOver = true; draw(); Desktop.notify('Snake', `Game Over! Score: ${score}`, 'snake'); return; }
            snakeBody.unshift(head);
            if (head[0]===food.x && head[1]===food.y) { score += 10; scoreEl.textContent = 'Score: ' + score; placeFood(); } else snakeBody.pop();
            draw();
        }

        function draw() {
            ctx.fillStyle = '#111'; ctx.fillRect(0,0,W,H);
            ctx.fillStyle = '#ff3333'; ctx.fillRect(food.x*CELL+1,food.y*CELL+1,CELL-2,CELL-2);
            snakeBody.forEach((s,i) => { ctx.fillStyle = i===0 ? '#00ff00' : '#00cc00'; ctx.fillRect(s[0]*CELL+1,s[1]*CELL+1,CELL-2,CELL-2); });
            if (gameOver) { ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#fff'; ctx.font='bold 20px sans-serif'; ctx.textAlign='center'; ctx.fillText('GAME OVER',W/2,H/2); ctx.font='14px sans-serif'; ctx.fillText('Score: '+score,W/2,H/2+24); }
        }

        document.addEventListener('keydown', function handler(e) {
            if (!win.el.isConnected) { document.removeEventListener('keydown', handler); return; }
            const k = e.key;
            if ((k==='ArrowUp'||k==='w')&&dir.y!==1) nextDir = {x:0,y:-1};
            else if ((k==='ArrowDown'||k==='s')&&dir.y!==-1) nextDir = {x:0,y:1};
            else if ((k==='ArrowLeft'||k==='a')&&dir.x!==1) nextDir = {x:-1,y:0};
            else if ((k==='ArrowRight'||k==='d')&&dir.x!==-1) nextDir = {x:1,y:0};
        });
        body.querySelector(`#snake-new-${win.id}`).onclick = initGame;
        initGame();
    }

    // ---- Tetris ----
    function tetris() {
        const COLS=10, ROWS=20, CELL=18;
        const W=COLS*CELL, H=ROWS*CELL;
        let board, piece, px, py, score, gameOver, interval, pieceType;
        const PIECES = [
            [[1,1,1,1]],
            [[1,1],[1,1]],
            [[0,1,0],[1,1,1]],
            [[1,0,0],[1,1,1]],
            [[0,0,1],[1,1,1]],
            [[1,1,0],[0,1,1]],
            [[0,1,1],[1,1,0]],
        ];
        const COLORS = ['#00FFFF','#FFFF00','#AA00FF','#FF8800','#0000FF','#00FF00','#FF0000'];
        const win = WM.createWindow({ title: Desktop.t('tetris'), icon: 'tetris', width: W+40, height: H+70, body: '', bodyClass: 'win-body-gray', onClose: () => clearInterval(interval) });
        const body = win.el.querySelector('.win-body');
        body.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:4px;';
        body.innerHTML = `<div style="display:flex;justify-content:space-between;width:${W}px;padding:2px 0;font-size:12px;"><span id="tet-score-${win.id}">Score: 0</span><button class="win-btn" id="tet-new-${win.id}" style="font-size:10px;padding:1px 8px;">New</button></div><canvas id="tet-cv-${win.id}" width="${W}" height="${H}" style="border:2px inset var(--win-dark);background:#111;"></canvas>`;
        const canvas = body.querySelector(`#tet-cv-${win.id}`);
        const ctx = canvas.getContext('2d');
        const scoreEl = body.querySelector(`#tet-score-${win.id}`);

        function initGame() { board = Array.from({length:ROWS}, ()=>Array(COLS).fill(0)); score=0; gameOver=false; scoreEl.textContent='Score: 0'; clearInterval(interval); spawnPiece(); interval = setInterval(tick, 400); draw(); }
        function spawnPiece() { pieceType = Math.floor(Math.random()*PIECES.length); piece = PIECES[pieceType].map(r=>[...r]); px = Math.floor((COLS-piece[0].length)/2); py = 0; if (collides(px,py,piece)) { gameOver = true; draw(); Desktop.notify('Tetris','Game Over! Score: '+score,'tetris'); clearInterval(interval); } }
        function collides(x,y,p) { for (let r=0;r<p.length;r++) for (let c=0;c<p[r].length;c++) if (p[r][c]) { if (x+c<0||x+c>=COLS||y+r>=ROWS) return true; if (y+r>=0&&board[y+r][x+c]) return true; } return false; }
        function merge() { for (let r=0;r<piece.length;r++) for (let c=0;c<piece[r].length;c++) if (piece[r][c]&&py+r>=0) board[py+r][px+c] = pieceType+1; }
        function clearLines() { let cleared = 0; for (let r=ROWS-1;r>=0;r--) { if (board[r].every(c=>c)) { board.splice(r,1); board.unshift(Array(COLS).fill(0)); cleared++; r++; } } score += [0,100,300,500,800][cleared]||0; scoreEl.textContent='Score: '+score; }
        function rotate() { const rotated = piece[0].map((_,i)=>piece.map(r=>r[i]).reverse()); if (!collides(px,py,rotated)) piece = rotated; }
        function tick() { if (gameOver) return; if (!collides(px,py+1,piece)) py++; else { merge(); clearLines(); spawnPiece(); } draw(); }

        function draw() {
            ctx.fillStyle='#111'; ctx.fillRect(0,0,W,H);
            for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) if (board[r][c]) { ctx.fillStyle=COLORS[board[r][c]-1]; ctx.fillRect(c*CELL+1,r*CELL+1,CELL-2,CELL-2); }
            if (piece && !gameOver) { ctx.fillStyle=COLORS[pieceType]; for (let r=0;r<piece.length;r++) for (let c=0;c<piece[r].length;c++) if (piece[r][c]) ctx.fillRect((px+c)*CELL+1,(py+r)*CELL+1,CELL-2,CELL-2); }
            for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) { ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.strokeRect(c*CELL,r*CELL,CELL,CELL); }
            if (gameOver) { ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#fff'; ctx.font='bold 20px sans-serif'; ctx.textAlign='center'; ctx.fillText('GAME OVER',W/2,H/2); }
        }

        document.addEventListener('keydown', function handler(e) {
            if (!win.el.isConnected) { document.removeEventListener('keydown', handler); return; }
            if (gameOver) return;
            if (e.key==='ArrowLeft'&&!collides(px-1,py,piece)) { px--; draw(); }
            else if (e.key==='ArrowRight'&&!collides(px+1,py,piece)) { px++; draw(); }
            else if (e.key==='ArrowDown') { if(!collides(px,py+1,piece)) py++; draw(); }
            else if (e.key==='ArrowUp') { rotate(); draw(); }
        });
        body.querySelector(`#tet-new-${win.id}`).onclick = initGame;
        initGame();
    }

    // ---- Solitaire (Klondike simplified) ----
    function solitaire() {
        const SUITS = ['♠','♥','♦','♣'];
        const SUIT_COLORS = {'♠':'#000','♥':'#D00','♦':'#D00','♣':'#000'};
        const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
        let deck, tableau, foundation, waste, stock, moves;

        const win = WM.createWindow({ title: Desktop.t('solitaire'), icon: 'cards', width: 500, height: 420, body: '', bodyClass: 'win-body-gray' });
        const body = win.el.querySelector('.win-body');
        body.style.cssText = 'padding:8px;background:#076324;overflow:auto;';

        function makeDeck() { const d = []; SUITS.forEach(s=>RANKS.forEach((r,i)=>d.push({suit:s,rank:r,value:i,faceUp:false}))); for (let i=d.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; } return d; }

        function initGame() {
            deck = makeDeck(); tableau = [[],[],[],[],[],[],[]]; foundation = [[],[],[],[]]; waste = []; stock = []; moves = 0;
            for (let c=0;c<7;c++) { for (let r=0;r<=c;r++) { const card = deck.pop(); if (r===c) card.faceUp=true; tableau[c].push(card); } }
            stock = deck.splice(0); render();
        }

        function cardHtml(card, clickable = false) {
            if (!card) return '';
            if (!card.faceUp) return `<div class="sol-card sol-back" ${clickable?'data-action="stock"':''}></div>`;
            const color = SUIT_COLORS[card.suit];
            return `<div class="sol-card sol-front" style="color:${color}" data-rank="${card.rank}" data-suit="${card.suit}"><span class="sol-card-rank">${card.rank}</span><span class="sol-card-suit">${card.suit}</span></div>`;
        }

        function render() {
            let html = `<div style="display:flex;gap:6px;margin-bottom:10px;align-items:flex-start;">`;
            html += `<div class="sol-pile sol-stock" data-action="draw">${stock.length ? '<div class="sol-card sol-back" data-action="draw"></div>' : '<div class="sol-empty-pile">↺</div>'}</div>`;
            html += `<div class="sol-pile sol-waste">${waste.length ? cardHtml(waste[waste.length-1]) : '<div class="sol-empty-pile"></div>'}</div>`;
            html += `<div style="flex:1"></div>`;
            foundation.forEach((f,i) => { html += `<div class="sol-pile sol-foundation" data-fi="${i}">${f.length ? cardHtml(f[f.length-1]) : '<div class="sol-empty-pile" data-fi="'+i+'">'+SUITS[i]+'</div>'}</div>`; });
            html += `</div><div style="display:flex;gap:6px;align-items:flex-start;">`;
            tableau.forEach((col,ci) => {
                html += `<div class="sol-column" data-col="${ci}">`;
                if (!col.length) html += `<div class="sol-empty-pile" data-col="${ci}"></div>`;
                col.forEach((card,ri) => { html += `<div class="sol-stacked" style="top:${ri*18}px;" data-col="${ci}" data-row="${ri}">${card.faceUp ? cardHtml(card) : '<div class="sol-card sol-back"></div>'}</div>`; });
                html += `</div>`;
            });
            html += `</div><div style="margin-top:8px;color:#fff;font-size:11px;">Moves: ${moves} <button class="win-btn" style="font-size:10px;padding:1px 6px;margin-left:8px;" id="sol-new-${win.id}">New Game</button></div>`;
            body.innerHTML = html;

            body.querySelector(`#sol-new-${win.id}`).onclick = initGame;
            body.querySelectorAll('[data-action="draw"]').forEach(el => el.onclick = drawCard);
            body.querySelectorAll('.sol-waste .sol-front').forEach(el => el.onclick = () => tryAutoMove(waste, waste.length-1, true));
            body.querySelectorAll('.sol-stacked').forEach(el => {
                const col = parseInt(el.dataset.col), row = parseInt(el.dataset.row);
                if (tableau[col][row] && tableau[col][row].faceUp) el.onclick = () => tryAutoMove(tableau[col], row, false);
            });
        }

        function drawCard() {
            if (stock.length) { const card = stock.pop(); card.faceUp = true; waste.push(card); }
            else { while (waste.length) { const c = waste.pop(); c.faceUp = false; stock.push(c); } }
            moves++; render();
        }

        function canPlaceOnFoundation(card, fi) {
            const f = foundation[fi];
            if (!f.length) return card.rank === 'A' && SUITS[fi] === card.suit;
            const top = f[f.length-1];
            return top.suit === card.suit && card.value === top.value + 1;
        }

        function canPlaceOnTableau(card, col) {
            const t = tableau[col];
            if (!t.length) return card.rank === 'K';
            const top = t[t.length-1];
            if (!top.faceUp) return false;
            const topRed = top.suit === '♥' || top.suit === '♦';
            const cardRed = card.suit === '♥' || card.suit === '♦';
            return topRed !== cardRed && card.value === top.value - 1;
        }

        function tryAutoMove(source, cardIndex, isWaste) {
            const card = source[cardIndex];
            if (!card || !card.faceUp) return;

            for (let fi = 0; fi < 4; fi++) {
                if (canPlaceOnFoundation(card, fi) && cardIndex === source.length - 1) {
                    foundation[fi].push(source.pop());
                    if (!isWaste && source.length && !source[source.length-1].faceUp) source[source.length-1].faceUp = true;
                    moves++; render();
                    if (foundation.every(f => f.length === 13)) Desktop.notify('Solitaire', '🎉 You won!', 'cards');
                    return;
                }
            }
            for (let ci = 0; ci < 7; ci++) {
                if (source === tableau[ci]) continue;
                if (canPlaceOnTableau(card, ci)) {
                    const moved = source.splice(cardIndex);
                    tableau[ci].push(...moved);
                    if (!isWaste && source.length && !source[source.length-1].faceUp) source[source.length-1].faceUp = true;
                    moves++; render(); return;
                }
            }
        }

        initGame();
    }

    return { fileManager, aboutMe, projects, blog, career, githubStats, browser, textViewer, minesweeper, settings, notepad, paint, runDialog, solitaire, snake, tetris, _openProject, _openBlogPost, escapeHtml };
})();
