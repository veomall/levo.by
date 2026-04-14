/**
 * Desktop environment — icons, start menu, clock, app launcher,
 * context menu, screensaver, settings persistence, notifications,
 * system tray, OS theme switching with install animation, Konami.
 * Supports: Win 3.1, XP, 7, 8.1, 10, 11 — each with unique UI.
 */
const Desktop = (() => {
    const DESKTOP_APPS = [
        { id: 'filemanager', name: 'File Manager', icon: 'folder', launch: () => Apps.fileManager() },
        { id: 'terminal',    name: 'Terminal',      icon: 'terminal', launch: () => Terminal.open() },
        { id: 'about',       name: 'About Me',      icon: 'person',   launch: () => Apps.aboutMe() },
        { id: 'projects',    name: 'Projects',       icon: 'app',      launch: () => Apps.projects() },
        { id: 'blog',        name: 'Blog',           icon: 'blog',     launch: () => Apps.blog() },
        { id: 'career',      name: 'Career Path',    icon: 'chart',    launch: () => Apps.career() },
        { id: 'github',      name: 'GitHub Stats',   icon: 'github',   launch: () => Apps.githubStats() },
        { id: 'browser',     name: 'Browser',        icon: 'globe',    launch: () => Apps.browser() },
    ];

    const ACCESSORY_APPS = [
        { id: 'notepad',     name: 'Notepad',        icon: 'file',     launch: () => Apps.notepad() },
        { id: 'paint',       name: 'Paint',          icon: 'app',      launch: () => Apps.paint() },
        { id: 'settings',    name: 'Settings',       icon: 'settings', launch: () => Apps.settings() },
    ];

    const GAME_APPS = [
        { id: 'minesweeper', name: 'Minesweeper',    icon: 'mine',     launch: () => Apps.minesweeper() },
        { id: 'solitaire',   name: 'Solitaire',      icon: 'cards',    launch: () => Apps.solitaire() },
        { id: 'snake',       name: 'Snake',           icon: 'snake',    launch: () => Apps.snake() },
        { id: 'tetris',      name: 'Tetris',          icon: 'tetris',   launch: () => Apps.tetris() },
    ];

    const ALL_APPS = [...DESKTOP_APPS, ...ACCESSORY_APPS, ...GAME_APPS];

    let idleTimer;
    const IDLE_TIMEOUT = 180000;
    const SETTINGS_KEY = 'portfolioOS_settings';

    let settings = {
        osTheme: 'win31',
        lang: 'en',
        soundFx: true,
        screensaverType: 'starfield',
        wallpaper: '',
        accentColor: '',
    };

    const OS_THEMES = {
        win31:  { name: 'Windows 3.1',  year: 1992, cssClass: 'os-win31' },
        winxp:  { name: 'Windows XP',   year: 2001, cssClass: 'os-winxp' },
        win7:   { name: 'Windows 7',    year: 2009, cssClass: 'os-win7' },
        win81:  { name: 'Windows 8.1',  year: 2013, cssClass: 'os-win81' },
        win10:  { name: 'Windows 10',   year: 2015, cssClass: 'os-win10' },
        win11:  { name: 'Windows 11',   year: 2021, cssClass: 'os-win11' },
    };

    const I18N = {
        en: {
            start: 'Start', fileManager: 'File Manager', terminal: 'Terminal', aboutMe: 'About Me',
            projects: 'Projects', blog: 'Blog', careerPath: 'Career Path', githubStats: 'GitHub Stats',
            browser: 'Browser', notepad: 'Notepad', paint: 'Paint', minesweeper: 'Minesweeper',
            solitaire: 'Solitaire', snake: 'Snake', tetris: 'Tetris',
            settings: 'Settings', adminPanel: 'Admin Panel', blogReader: 'Blog Reader', shutdown: 'Shut Down',
            cascade: 'Cascade Windows', tile: 'Tile Windows', openTerminal: 'Open Terminal',
            run: 'Run...', screensaver: 'Screensaver', about: 'About Veomall OS',
            programs: 'Programs', accessories: 'Accessories', games: 'Games',
            allPrograms: 'All Programs', pinned: 'Pinned', recommended: 'Recommended',
            search: 'Search programs...', documents: 'Documents',
        },
        ru: {
            start: 'Пуск', fileManager: 'Проводник', terminal: 'Терминал', aboutMe: 'Обо мне',
            projects: 'Проекты', blog: 'Блог', careerPath: 'Карьера', githubStats: 'GitHub',
            browser: 'Браузер', notepad: 'Блокнот', paint: 'Paint', minesweeper: 'Сапёр',
            solitaire: 'Пасьянс', snake: 'Змейка', tetris: 'Тетрис',
            settings: 'Настройки', adminPanel: 'Админ-панель', blogReader: 'Читалка блога', shutdown: 'Выключить',
            cascade: 'Каскадом', tile: 'Плиткой', openTerminal: 'Терминал',
            run: 'Выполнить...', screensaver: 'Заставка', about: 'О системе',
            programs: 'Программы', accessories: 'Стандартные', games: 'Игры',
            allPrograms: 'Все программы', pinned: 'Закреплённые', recommended: 'Рекомендуемые',
            search: 'Поиск программ...', documents: 'Документы',
        },
        by: {
            start: 'Пуск', fileManager: 'Файлы', terminal: 'Тэрмінал', aboutMe: 'Пра мяне',
            projects: 'Праекты', blog: 'Блог', careerPath: 'Кар\'ера', githubStats: 'GitHub',
            browser: 'Браўзер', notepad: 'Нататнік', paint: 'Paint', minesweeper: 'Сапёр',
            solitaire: 'Пасьянс', snake: 'Змейка', tetris: 'Тэтрыс',
            settings: 'Наладкі', adminPanel: 'Адмін-панэль', blogReader: 'Чытанка блога', shutdown: 'Выключыць',
            cascade: 'Каскадам', tile: 'Пліткай', openTerminal: 'Тэрмінал',
            run: 'Выканаць...', screensaver: 'Застаўка', about: 'Пра сістэму',
            programs: 'Праграмы', accessories: 'Стандартныя', games: 'Гульні',
            allPrograms: 'Усе праграмы', pinned: 'Замацаваныя', recommended: 'Рэкамендаваныя',
            search: 'Пошук праграм...', documents: 'Дакументы',
        },
    };

    function t(key) { return I18N[settings.lang]?.[key] || I18N.en[key] || key; }
    function appName(app) {
        const nameMap = { filemanager: 'fileManager', terminal: 'terminal', about: 'aboutMe', projects: 'projects', blog: 'blog', career: 'careerPath', github: 'githubStats', browser: 'browser', notepad: 'notepad', paint: 'paint', minesweeper: 'minesweeper', solitaire: 'solitaire', snake: 'snake', tetris: 'tetris', settings: 'settings' };
        return t(nameMap[app.id] || app.id) || app.name;
    }

    function loadSettings() {
        try { const s = JSON.parse(localStorage.getItem(SETTINGS_KEY)); if (s) settings = { ...settings, ...s }; } catch {}
        if (settings.osTheme === 'win95') { settings.osTheme = 'win31'; saveSettings(); }
    }
    function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }

    function applyOsTheme() {
        const theme = OS_THEMES[settings.osTheme] || OS_THEMES.win31;
        document.body.className = theme.cssClass;
        if (settings.wallpaper) document.getElementById('desktop').style.background = settings.wallpaper;
        else document.getElementById('desktop').style.background = '';
        if (settings.accentColor) document.documentElement.style.setProperty('--os-accent', settings.accentColor);
        else document.documentElement.style.removeProperty('--os-accent');
    }

    function init() {
        loadSettings();
        applyOsTheme();
        renderIcons();
        renderStartMenu();
        startClock();
        setupStartButton();
        setupDesktopClick();
        setupContextMenu();
        setupScreensaver();
        setupKonamiCode();
        setupWindowSnap();
        setupSystemTray();
        setupTitlebarDblClick();
        runBoot();
    }

    function renderIcons() {
        const container = document.getElementById('desktop-icons');
        container.innerHTML = '';
        /* Windows 8.x: no desktop shortcuts — apps live on the Start screen only */
        if (settings.osTheme === 'win81') return;
        DESKTOP_APPS.forEach(app => {
            const el = document.createElement('div');
            el.className = 'desktop-icon';
            el.innerHTML = `<svg class="${WM.iconImgClasses()}" width="32" height="32"><use href="#icon-${WM.iconId(app.icon)}"/></svg><span class="icon-label">${appName(app)}</span>`;
            el.addEventListener('dblclick', () => { playClick(); app.launch(); });
            el.addEventListener('click', e => {
                if (!e.shiftKey) container.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                el.classList.add('selected');
            });
            container.appendChild(el);
        });
    }

    // OS-specific start menu rendering
    function renderStartMenu() {
        const os = settings.osTheme;
        const menuEl = document.getElementById('start-menu');
        const items = document.getElementById('start-menu-items');
        items.innerHTML = '';

        const sidebar = menuEl.querySelector('.menu-sidebar');
        if (sidebar) sidebar.querySelector('span').textContent = 'Veomall OS';

        if (os === 'win31') renderClassicMenu(items, os);
        else if (os === 'winxp' || os === 'win7') renderTwoColumnMenu(items, os);
        else if (os === 'win81') renderMetroTileMenu(items);
        else if (os === 'win10') renderWin10Menu(items);
        else if (os === 'win11') renderWin11Menu(items);
        else renderClassicMenu(items, os);

        const btn = document.getElementById('start-btn');
        if (os === 'winxp') btn.innerHTML = `<svg class="start-icon" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="7" fill="#4CAF50"/><rect x="3" y="3" width="4" height="4" fill="#FF5722" rx="1"/><rect x="9" y="3" width="4" height="4" fill="#2196F3" rx="1"/><rect x="3" y="9" width="4" height="4" fill="#FFC107" rx="1"/><rect x="9" y="9" width="4" height="4" fill="#4CAF50" rx="1"/></svg> ${t('start')}`;
        else if (os === 'win7') btn.innerHTML = `<svg class="start-icon" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="7" fill="url(#win7orb)" stroke="#2060A0" stroke-width="1"/><rect x="4" y="4" width="3.5" height="3.5" fill="#F25022" rx="0.5"/><rect x="8.5" y="4" width="3.5" height="3.5" fill="#7FBA00" rx="0.5"/><rect x="4" y="8.5" width="3.5" height="3.5" fill="#00A4EF" rx="0.5"/><rect x="8.5" y="8.5" width="3.5" height="3.5" fill="#FFB900" rx="0.5"/></svg>`;
        else if (os === 'win81' || os === 'win10') btn.innerHTML = `<svg class="start-icon" viewBox="0 0 16 16" width="16" height="16"><rect x="1" y="1" width="6.5" height="6.5" fill="currentColor"/><rect x="8.5" y="1" width="6.5" height="6.5" fill="currentColor"/><rect x="1" y="8.5" width="6.5" height="6.5" fill="currentColor"/><rect x="8.5" y="8.5" width="6.5" height="6.5" fill="currentColor"/></svg> ${os === 'win81' ? '' : t('start')}`;
        else if (os === 'win11') btn.innerHTML = `<svg class="start-icon" viewBox="0 0 16 16" width="16" height="16"><rect x="1" y="1" width="6.5" height="6.5" fill="currentColor" rx="1"/><rect x="8.5" y="1" width="6.5" height="6.5" fill="currentColor" rx="1"/><rect x="1" y="8.5" width="6.5" height="6.5" fill="currentColor" rx="1"/><rect x="8.5" y="8.5" width="6.5" height="6.5" fill="currentColor" rx="1"/></svg>`;
        else btn.innerHTML = `<svg class="start-icon" viewBox="0 0 16 16" width="16" height="16"><rect x="1" y="1" width="6" height="6" fill="#FF0000"/><rect x="9" y="1" width="6" height="6" fill="#00AA00"/><rect x="1" y="9" width="6" height="6" fill="#0000FF"/><rect x="9" y="9" width="6" height="6" fill="#FFAA00"/></svg> ${t('start')}`;
    }

    function renderClassicMenu(container, os) {
        const makeItem = (app) => { const el = document.createElement('div'); el.className = 'menu-item'; el.innerHTML = `${WM.getIcon(app.icon, 20)} <span>${appName(app)}</span>`; el.addEventListener('click', () => { closeStartMenu(); playClick(); app.launch(); }); return el; };

        DESKTOP_APPS.forEach(app => container.appendChild(makeItem(app)));
        addMenuDivider(container);

        const progSub = document.createElement('div');
        progSub.className = 'menu-submenu-parent';
        progSub.innerHTML = `<div class="menu-item">${WM.getIcon('folder', 20)} <span>${t('programs')}</span> <span style="margin-left:auto">►</span></div><div class="menu-submenu"></div>`;
        const subItems = progSub.querySelector('.menu-submenu');

        const accLabel = document.createElement('div'); accLabel.className = 'menu-sublabel'; accLabel.textContent = t('accessories');
        subItems.appendChild(accLabel);
        ACCESSORY_APPS.forEach(app => subItems.appendChild(makeItem(app)));
        const gameLabel = document.createElement('div'); gameLabel.className = 'menu-sublabel'; gameLabel.textContent = t('games');
        subItems.appendChild(gameLabel);
        GAME_APPS.forEach(app => subItems.appendChild(makeItem(app)));
        container.appendChild(progSub);
        addMenuDivider(container);

        addMenuItem(container, 'key', `${t('adminPanel')} ↗`, () => { closeStartMenu(); window.open('/admin', '_blank'); });
        addMenuItem(container, 'blog', `${t('blogReader')} ↗`, () => { closeStartMenu(); window.open('/blog', '_blank'); });
        addMenuDivider(container);
        addMenuItem(container, 'settings', t('settings'), () => { closeStartMenu(); Apps.settings(); });
        addMenuItem(container, 'computer', t('shutdown'), () => { closeStartMenu(); doShutdown(); });
    }

    function renderTwoColumnMenu(container, os) {
        container.classList.add('two-column-menu');
        const left = document.createElement('div'); left.className = 'menu-col menu-col-left';
        const right = document.createElement('div'); right.className = 'menu-col menu-col-right';

        const pinnedLabel = document.createElement('div'); pinnedLabel.className = 'menu-section-label'; pinnedLabel.textContent = os === 'win7' ? '' : t('pinned');
        left.appendChild(pinnedLabel);

        const makeItem = (app, cls = '') => { const el = document.createElement('div'); el.className = 'menu-item ' + cls; el.innerHTML = `${WM.getIcon(app.icon, 20)} <span>${appName(app)}</span>`; el.addEventListener('click', () => { closeStartMenu(); playClick(); app.launch(); }); return el; };

        DESKTOP_APPS.slice(0, 6).forEach(app => left.appendChild(makeItem(app)));

        const allProg = document.createElement('div'); allProg.className = 'menu-item menu-allprograms';
        allProg.innerHTML = `${WM.getIcon('folder', 20)} <span>${t('allPrograms')} ►</span>`;
        allProg.addEventListener('click', () => {
            left.innerHTML = '';
            const backBtn = document.createElement('div'); backBtn.className = 'menu-item menu-allprograms';
            backBtn.innerHTML = `◄ <span>${t('start')}</span>`;
            backBtn.addEventListener('click', () => { container.innerHTML = ''; renderTwoColumnMenu(container, os); });
            left.appendChild(backBtn);
            addMenuDivider(left);
            ALL_APPS.forEach(app => left.appendChild(makeItem(app)));
        });
        left.appendChild(allProg);

        const rightItems = [
            { icon: 'person', label: t('aboutMe'), fn: () => Apps.aboutMe() },
            { icon: 'folder', label: t('documents'), fn: () => Apps.fileManager() },
            { icon: 'chart', label: t('careerPath'), fn: () => Apps.career() },
            { icon: 'github', label: t('githubStats'), fn: () => Apps.githubStats() },
            { icon: 'globe', label: t('browser'), fn: () => Apps.browser() },
        ];
        rightItems.forEach(item => {
            const el = document.createElement('div'); el.className = 'menu-item';
            el.innerHTML = `${WM.getIcon(item.icon, 20)} <span>${item.label}</span>`;
            el.addEventListener('click', () => { closeStartMenu(); playClick(); item.fn(); });
            right.appendChild(el);
        });
        addMenuDivider(right);
        const settingsItem = document.createElement('div'); settingsItem.className = 'menu-item';
        settingsItem.innerHTML = `${WM.getIcon('settings', 20)} <span>${t('settings')}</span>`;
        settingsItem.addEventListener('click', () => { closeStartMenu(); playClick(); Apps.settings(); });
        right.appendChild(settingsItem);

        const shutdownArea = document.createElement('div'); shutdownArea.className = 'menu-shutdown-bar';
        shutdownArea.innerHTML = `<span class="menu-shutdown-btn">${t('shutdown')}</span>`;
        shutdownArea.querySelector('.menu-shutdown-btn').addEventListener('click', () => { closeStartMenu(); doShutdown(); });

        container.appendChild(left); container.appendChild(right);
        container.parentElement.appendChild(shutdownArea);
    }

    function renderMetroTileMenu(container) {
        container.classList.add('metro-menu');
        const root = document.createElement('div');
        root.className = 'metro-start-root';

        const header = document.createElement('div');
        header.className = 'metro-start-header';
        header.textContent = t('start');

        const scrollWrap = document.createElement('div');
        scrollWrap.className = 'metro-start-scroll';
        const row = document.createElement('div');
        row.className = 'metro-groups-row';

        const palette = ['#0078D4', '#5B2D8E', '#D83B01', '#107C10', '#00A4EF', '#E81123', '#8764B8', '#FF8C00', '#0099BC', '#2D7D9A', '#5C2D91', '#038387', '#C239B3', '#CA5010', '#00BCF2'];

        function addGroup(titleKey, tileDefs) {
            const group = document.createElement('div');
            group.className = 'metro-group';
            if (titleKey) {
                const lab = document.createElement('div');
                lab.className = 'metro-group-label';
                lab.textContent = t(titleKey);
                group.appendChild(lab);
            }
            const mosaic = document.createElement('div');
            mosaic.className = 'metro-tile-mosaic';
            tileDefs.forEach((def, i) => {
                const app = def.app;
                const wide = !!def.wide;
                const tile = document.createElement('div');
                tile.className = 'metro-tile' + (wide ? ' metro-tile--wide' : '');
                tile.style.background = def.color || palette[i % palette.length];
                const iconPx = wide ? 44 : 38;
                tile.innerHTML = `<div class="metro-tile-icon">${WM.getIcon(app.icon, iconPx, { tile: true })}</div><div class="metro-tile-label">${appName(app)}</div>`;
                tile.addEventListener('click', () => { closeStartMenu(); playClick(); app.launch(); });
                mosaic.appendChild(tile);
            });
            group.appendChild(mosaic);
            row.appendChild(group);
        }

        const mainTiles = [
            { app: DESKTOP_APPS[0] },
            { app: DESKTOP_APPS[1] },
            { app: DESKTOP_APPS[2] },
            { app: DESKTOP_APPS[3], wide: true },
            { app: DESKTOP_APPS[4], wide: true },
            { app: DESKTOP_APPS[5] },
            { app: DESKTOP_APPS[6] },
            { app: DESKTOP_APPS[7] },
        ].map((d, i) => ({ ...d, color: palette[i % palette.length] }));

        addGroup('programs', mainTiles);
        addGroup('accessories', ACCESSORY_APPS.map((app, i) => ({ app, color: palette[(i + 8) % palette.length] })));
        addGroup('games', GAME_APPS.map((app, i) => ({ app, color: palette[(i + 11) % palette.length] })));

        scrollWrap.appendChild(row);
        root.appendChild(header);
        root.appendChild(scrollWrap);

        const bottom = document.createElement('div');
        bottom.className = 'metro-bottom-bar';
        bottom.innerHTML = `<span class="menu-shutdown-btn">${WM.getIcon('settings', 16)} ${t('settings')}</span><span style="flex:1"></span><span class="menu-shutdown-btn">${t('shutdown')}</span>`;
        bottom.querySelectorAll('.menu-shutdown-btn')[0].addEventListener('click', () => { closeStartMenu(); playClick(); Apps.settings(); });
        bottom.querySelectorAll('.menu-shutdown-btn')[1].addEventListener('click', () => { closeStartMenu(); doShutdown(); });
        root.appendChild(bottom);

        container.appendChild(root);
    }

    function renderWin10Menu(container) {
        container.classList.add('win10-menu');
        const left = document.createElement('div'); left.className = 'win10-menu-list';
        const right = document.createElement('div'); right.className = 'win10-menu-tiles';

        const makeItem = (app) => { const el = document.createElement('div'); el.className = 'menu-item'; el.innerHTML = `${WM.getIcon(app.icon, 20)} <span>${appName(app)}</span>`; el.addEventListener('click', () => { closeStartMenu(); playClick(); app.launch(); }); return el; };
        ALL_APPS.forEach(app => left.appendChild(makeItem(app)));
        addMenuDivider(left);
        addMenuItem(left, 'settings', t('settings'), () => { closeStartMenu(); Apps.settings(); });
        addMenuItem(left, 'computer', t('shutdown'), () => { closeStartMenu(); doShutdown(); });

        const tileColors = ['#0078D4','#107C10','#D83B01','#5B2D8E','#DA3B01','#00695C','#C62828','#1565C0','#E65100','#2E7D32','#6A1B9A','#00838F'];
        const pinnedApps = [...DESKTOP_APPS.slice(0, 6), ...GAME_APPS.slice(0, 2)];
        pinnedApps.forEach((app, i) => {
            const tile = document.createElement('div'); tile.className = 'win10-tile';
            tile.style.background = tileColors[i % tileColors.length];
            tile.innerHTML = `<div class="metro-tile-icon">${WM.getIcon(app.icon, 28, { tile: true })}</div><div class="metro-tile-label">${appName(app)}</div>`;
            tile.addEventListener('click', () => { closeStartMenu(); playClick(); app.launch(); });
            right.appendChild(tile);
        });

        container.appendChild(left); container.appendChild(right);
    }

    function renderWin11Menu(container) {
        container.classList.add('win11-menu');

        const searchBar = document.createElement('div'); searchBar.className = 'win11-search';
        searchBar.innerHTML = `<input class="win11-search-input" placeholder="${t('search')}" readonly>`;
        container.appendChild(searchBar);

        const pinnedSection = document.createElement('div'); pinnedSection.className = 'win11-section';
        pinnedSection.innerHTML = `<div class="win11-section-label">${t('pinned')}</div>`;
        const pinnedGrid = document.createElement('div'); pinnedGrid.className = 'win11-pinned-grid';
        const pinnedApps = [...DESKTOP_APPS, ...GAME_APPS.slice(0, 2)];
        pinnedApps.forEach(app => {
            const item = document.createElement('div'); item.className = 'win11-pinned-item';
            item.innerHTML = `<div class="win11-pinned-icon">${WM.getIcon(app.icon, 28)}</div><div class="win11-pinned-label">${appName(app)}</div>`;
            item.addEventListener('click', () => { closeStartMenu(); playClick(); app.launch(); });
            pinnedGrid.appendChild(item);
        });
        pinnedSection.appendChild(pinnedGrid);
        container.appendChild(pinnedSection);

        const recSection = document.createElement('div'); recSection.className = 'win11-section';
        recSection.innerHTML = `<div class="win11-section-label">${t('recommended')}</div>`;
        const recGrid = document.createElement('div'); recGrid.className = 'win11-rec-grid';
        [{ icon: 'settings', label: t('settings'), fn: () => Apps.settings() },
         { icon: 'key', label: t('adminPanel'), fn: () => window.open('/admin', '_blank') },
         { icon: 'blog', label: t('blogReader'), fn: () => window.open('/blog', '_blank') },
        ].forEach(item => {
            const el = document.createElement('div'); el.className = 'win11-rec-item';
            el.innerHTML = `${WM.getIcon(item.icon, 20)} <span>${item.label}</span>`;
            el.addEventListener('click', () => { closeStartMenu(); playClick(); item.fn(); });
            recGrid.appendChild(el);
        });
        recSection.appendChild(recGrid);
        container.appendChild(recSection);

        const bottomBar = document.createElement('div'); bottomBar.className = 'win11-bottom';
        const shutdownBtn = document.createElement('div'); shutdownBtn.className = 'win11-power';
        shutdownBtn.innerHTML = `⏻`;
        shutdownBtn.addEventListener('click', () => { closeStartMenu(); doShutdown(); });
        bottomBar.appendChild(document.createElement('span')); bottomBar.appendChild(shutdownBtn);
        container.appendChild(bottomBar);
    }

    function addMenuItem(parent, icon, label, onClick) { const el = document.createElement('div'); el.className = 'menu-item'; el.innerHTML = `${WM.getIcon(icon, 20)} <span>${label}</span>`; el.addEventListener('click', onClick); parent.appendChild(el); }
    function addMenuDivider(parent) { const d = document.createElement('div'); d.className = 'menu-divider'; parent.appendChild(d); }

    function setupStartButton() {
        const btn = document.getElementById('start-btn');
        const menu = document.getElementById('start-menu');
        btn.addEventListener('click', e => {
            e.stopPropagation();
            playClick();
            const open = menu.classList.toggle('open');
            btn.classList.toggle('active', open);
            if (open) {
                const resetMetroScroll = () => {
                    const sc = document.querySelector('.metro-start-scroll');
                    if (sc) sc.scrollLeft = 0;
                };
                resetMetroScroll();
                requestAnimationFrame(resetMetroScroll);
                requestAnimationFrame(() => requestAnimationFrame(resetMetroScroll));
            }
        });
    }
    function closeStartMenu() {
        document.getElementById('start-menu').classList.remove('open');
        document.getElementById('start-btn').classList.remove('active');
        const old = document.querySelector('.menu-shutdown-bar');
        if (old) old.remove();
        const items = document.getElementById('start-menu-items');
        items.classList.remove('two-column-menu','metro-menu','win10-menu','win11-menu');
    }

    function setupDesktopClick() {
        document.addEventListener('click', e => {
            if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn') && !e.target.closest('.menu-shutdown-bar')) closeStartMenu();
            const ctx = document.getElementById('context-menu');
            if (ctx && !e.target.closest('#context-menu')) ctx.style.display = 'none';
            if (e.target === document.getElementById('desktop') || e.target === document.getElementById('desktop-icons')) {
                if (!e.target.closest('.desktop-icon')) document.querySelectorAll('.desktop-icon.selected').forEach(i => i.classList.remove('selected'));
            }
        });
    }

    function setupContextMenu() {
        document.getElementById('desktop').addEventListener('contextmenu', e => {
            if (e.target.closest('.win-window') || e.target.closest('#taskbar')) return;
            e.preventDefault(); showContextMenu(e.clientX, e.clientY);
        });
    }

    function showContextMenu(x, y) {
        let menu = document.getElementById('context-menu');
        if (!menu) { menu = document.createElement('div'); menu.id = 'context-menu'; menu.className = 'context-menu'; document.body.appendChild(menu); }
        menu.innerHTML = `
            <div class="ctx-item" data-action="cascade">⧉ ${t('cascade')}</div>
            <div class="ctx-item" data-action="tile">▦ ${t('tile')}</div>
            <div class="ctx-sep"></div>
            <div class="ctx-item" data-action="terminal">⌨ ${t('openTerminal')}</div>
            <div class="ctx-item" data-action="settings">⚙ ${t('settings')}</div>
            <div class="ctx-sep"></div>
            <div class="ctx-item" data-action="run">▶ ${t('run')}</div>
            <div class="ctx-item" data-action="screensaver">🌌 ${t('screensaver')}</div>
            <div class="ctx-item" data-action="about">ℹ ${t('about')}</div>
        `;
        menu.style.left = Math.min(x, window.innerWidth - 200) + 'px';
        menu.style.top = Math.min(y, window.innerHeight - 250) + 'px';
        menu.style.display = 'block';
        menu.querySelectorAll('.ctx-item').forEach(item => {
            item.onclick = () => { menu.style.display = 'none'; playClick(); const a = item.dataset.action;
                if (a === 'cascade') cascadeWindows(); else if (a === 'tile') tileWindows();
                else if (a === 'terminal') Terminal.open(); else if (a === 'settings') Apps.settings();
                else if (a === 'run') Apps.runDialog();
                else if (a === 'screensaver') startScreensaver(); else if (a === 'about') showAboutOS();
            };
        });
    }

    function cascadeWindows() { WM.getWindows().forEach((w, i) => { w.el.classList.remove('minimized','maximized'); w.minimized = false; w.maximized = false; w.el.style.left = (30+i*30)+'px'; w.el.style.top = (20+i*30)+'px'; w.el.style.width = '500px'; w.el.style.height = '380px'; }); }
    function tileWindows() { const wins = WM.getWindows().filter(w => !w.minimized); if (!wins.length) return; const cols = Math.ceil(Math.sqrt(wins.length)), rows = Math.ceil(wins.length/cols); const w = Math.floor(window.innerWidth/cols), h = Math.floor((window.innerHeight-48)/rows); wins.forEach((win,i) => { win.el.classList.remove('maximized'); win.maximized = false; win.el.style.left = (i%cols)*w+'px'; win.el.style.top = Math.floor(i/cols)*h+'px'; win.el.style.width = w+'px'; win.el.style.height = h+'px'; }); }

    function showAboutOS() {
        const osName = (OS_THEMES[settings.osTheme] || OS_THEMES.win31).name;
        WM.createWindow({ title: t('about'), icon: 'computer', width: 380, height: 280,
            body: `<div style="padding:24px;text-align:center">
                <div style="font-size:28px;margin-bottom:8px">${WM.getIcon('computer', 48)}</div>
                <h3 style="margin-bottom:4px">Veomall OS</h3>
                <p style="color:var(--win-dark);font-size:12px">Style: ${osName} — Build 1337</p>
                <div style="margin:16px 0;border-top:1px solid #ccc;border-bottom:1px solid #ccc;padding:12px 0;font-size:12px">
                    ${settings.lang === 'ru' ? 'Сайт-портфолио в стиле операционной системы.' : settings.lang === 'by' ? 'Сайт-партфоліа ў стылі аперацыйнай сістэмы.' : 'A portfolio website disguised as an operating system.'}<br>
                    FastAPI + Vanilla JS
                </div>
                <p style="font-size:11px;color:var(--win-dark)">© ${new Date().getFullYear()}</p>
            </div>`,
        });
    }

    // ---- OS Install Animation ----
    async function switchOs(newOs) {
        if (newOs === settings.osTheme) return;
        const theme = OS_THEMES[newOs];
        if (!theme) return;

        WM.getWindows().forEach(w => WM.closeWindow(w.id));

        const overlay = document.createElement('div');
        overlay.id = 'os-install-screen';
        overlay.className = 'install-' + newOs;
        document.body.appendChild(overlay);

        if (newOs === 'win31') {
            overlay.innerHTML = `<div class="install-31"><pre class="install-text" id="install-log"></pre></div>`;
            const log = overlay.querySelector('#install-log');
            const lines = ['Microsoft Windows 3.1 Setup','','Detecting hardware...','Installing display drivers...','Configuring Program Manager...','Setting up desktop...','Copying system files ████████████████ 100%','','Setup is complete. Restarting...'];
            for (const l of lines) { log.textContent += l + '\n'; await sleep(300); }
        } else if (newOs === 'winxp') {
            overlay.innerHTML = `<div class="install-xp"><div class="install-xp-left"><div class="install-xp-steps"><div class="install-xp-step active">Collecting information</div><div class="install-xp-step">Dynamic Update</div><div class="install-xp-step active">Preparing installation</div><div class="install-xp-step">Installing Windows</div><div class="install-xp-step">Finalizing installation</div></div></div><div class="install-xp-right"><div class="install-xp-title">Installing Windows</div><div class="install-xp-desc">Please wait while Setup installs Windows XP Professional...</div><div class="install-xp-bar"><div class="install-xp-fill" id="ixpfill"></div></div><div class="install-xp-time" id="ixptime">Estimated time remaining: 39 minutes</div></div></div>`;
            const fill = overlay.querySelector('#ixpfill'), time = overlay.querySelector('#ixptime');
            for (let i = 1; i <= 5; i++) { fill.style.width = (i*20)+'%'; time.textContent = `Estimated time remaining: ${39-i*8} minutes`; await sleep(500); }
        } else if (newOs === 'win7') {
            overlay.innerHTML = `<div class="install-7"><div class="install-7-logo">Windows 7</div><div class="install-7-anim"><div class="install-7-dots"><span></span><span></span><span></span><span></span></div></div><div class="install-7-step" id="i7step">Installing updates...</div></div>`;
            const step = overlay.querySelector('#i7step');
            for (const s of ['Expanding files...','Installing features...','Installing updates...','Completing installation...']) { step.textContent = s; await sleep(600); }
        } else if (newOs === 'win81') {
            overlay.innerHTML = `<div class="install-81"><div class="install-81-logo">Windows 8.1</div><div class="install-81-spinner"><div class="metro-dots"><span></span><span></span><span></span><span></span><span></span></div></div><div class="install-81-step" id="i81step">Getting devices ready</div><div class="install-81-pct" id="i81pct">0%</div></div>`;
            const step = overlay.querySelector('#i81step'), pct = overlay.querySelector('#i81pct');
            for (const s of [{t:'Getting devices ready',p:15},{t:'Getting devices ready',p:35},{t:'Installing apps',p:55},{t:'Installing apps',p:75},{t:'Taking care of a few things',p:90},{t:'Almost ready',p:100}]) { step.textContent = s.t; pct.textContent = s.p+'%'; await sleep(400); }
        } else if (newOs === 'win10') {
            overlay.innerHTML = `<div class="install-10"><div class="install-10-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" stroke="#0078D4" stroke-width="3" fill="none" stroke-dasharray="160 999" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1.5s" repeatCount="indefinite"/></circle></svg></div><div class="install-10-step" id="i10step">Working on updates</div><div class="install-10-pct" id="i10pct">0% complete</div><div class="install-10-sub">Don't turn off your PC</div></div>`;
            const step = overlay.querySelector('#i10step'), pct = overlay.querySelector('#i10pct');
            for (let i = 1; i <= 5; i++) { step.textContent = ['Working on updates','Installing features','Getting things ready','Almost there...','Let\'s go!'][i-1]; pct.textContent = (i*20)+'% complete'; await sleep(500); }
        } else if (newOs === 'win11') {
            overlay.innerHTML = `<div class="install-11"><div class="install-11-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" stroke="#0078D4" stroke-width="4" fill="none" stroke-dasharray="200 999" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="1.2s" repeatCount="indefinite"/></circle></svg></div><div class="install-11-step" id="i11step">Getting things ready</div><div class="install-11-sub">This might take a few minutes</div></div>`;
            const step = overlay.querySelector('#i11step');
            for (const s of ['Getting things ready','Installing features','Setting up your desktop','Almost there...','Let\'s go!']) { step.textContent = s; await sleep(500); }
        }

        await sleep(400);
        overlay.classList.add('fade-out');
        await sleep(600);
        overlay.remove();

        settings.osTheme = newOs;
        settings.wallpaper = '';
        settings.accentColor = '';
        saveSettings();
        applyOsTheme();
        renderIcons();
        renderStartMenu();
        notify('Veomall OS', `${theme.name} ${settings.lang === 'ru' ? 'установлена!' : settings.lang === 'by' ? 'усталявана!' : 'installed!'}`, 'computer');
    }

    // ---- System Tray ----
    function setupSystemTray() {
        const clock = document.getElementById('taskbar-clock');
        const tray = document.createElement('div');
        tray.id = 'system-tray';
        tray.innerHTML = `<span class="tray-icon" title="Sound" id="tray-sound">${settings.soundFx ? '🔊' : '🔇'}</span>`;
        clock.parentNode.insertBefore(tray, clock);
        tray.querySelector('#tray-sound').onclick = () => { settings.soundFx = !settings.soundFx; saveSettings(); tray.querySelector('#tray-sound').textContent = settings.soundFx ? '🔊' : '🔇'; };
        clock.title = new Date().toLocaleDateString(settings.lang === 'ru' ? 'ru-RU' : settings.lang === 'by' ? 'be-BY' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    function playClick() {
        if (!settings.soundFx) return;
        try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value = 800; gain.gain.value = 0.05; osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05); osc.stop(ctx.currentTime + 0.06); } catch {}
    }

    function notify(title, body, icon = 'computer') {
        const n = document.createElement('div'); n.className = 'os-notification';
        n.innerHTML = `<div class="os-notif-icon">${WM.getIcon(icon, 20)}</div><div><div class="os-notif-title">${title}</div><div class="os-notif-body">${body}</div></div>`;
        document.body.appendChild(n);
        setTimeout(() => n.classList.add('show'), 10);
        setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 400); }, 4000);
    }

    function setupTitlebarDblClick() { document.addEventListener('dblclick', e => { const tb = e.target.closest('.win-titlebar'); if (!tb || e.target.closest('.win-titlebar-btn')) return; const winId = tb.dataset.wid; if (winId) WM.toggleMaximize(winId); }); }

    function setupWindowSnap() {
        let snapIndicator;
        document.addEventListener('mousemove', e => {
            if (e.buttons !== 1) { if (snapIndicator) { snapIndicator.remove(); snapIndicator = null; } return; }
            const dragging = document.querySelector('.win-titlebar:active');
            if (!dragging) return;
            if (e.clientX <= 2 || e.clientX >= window.innerWidth - 3 || e.clientY <= 2) {
                if (!snapIndicator) { snapIndicator = document.createElement('div'); snapIndicator.className = 'snap-indicator'; document.body.appendChild(snapIndicator); }
                if (e.clientX <= 2) snapIndicator.style.cssText = 'left:0;top:0;width:50%;height:calc(100% - 48px);';
                else if (e.clientX >= window.innerWidth - 3) snapIndicator.style.cssText = 'left:50%;top:0;width:50%;height:calc(100% - 48px);';
                else snapIndicator.style.cssText = 'left:0;top:0;width:100%;height:calc(100% - 48px);';
            } else if (snapIndicator) { snapIndicator.remove(); snapIndicator = null; }
        });
    }

    function setupKonamiCode() {
        const code = [38,38,40,40,37,39,37,39,66,65]; let idx = 0;
        document.addEventListener('keydown', e => { if (e.keyCode === code[idx]) { idx++; if (idx === code.length) { idx = 0; triggerBSOD(); } } else idx = 0; });
    }

    function triggerBSOD() {
        const bsod = document.createElement('div'); bsod.id = 'bsod';
        bsod.innerHTML = `<pre style="max-width:600px;text-align:left">\n  An error has occurred. To continue:\n\n  Press Ctrl+Alt+Del to restart your computer.\n\n  Error: 0E : 016F : BFF9B3D4\n\n  *  Press any key to continue  <span class="bsod-blink">_</span>\n</pre>`;
        document.body.appendChild(bsod);
        const dismiss = () => { bsod.remove(); document.removeEventListener('keydown', dismiss); document.removeEventListener('click', dismiss); };
        setTimeout(() => { document.addEventListener('keydown', dismiss); document.addEventListener('click', dismiss); }, 500);
    }

    function doShutdown() {
        const msgs = { en: 'It is now safe to turn off your computer.', ru: 'Теперь питание компьютера можно отключить.', by: 'Цяпер сілкаванне камп\'ютара можна адключыць.' };
        const overlay = document.createElement('div'); overlay.id = 'shutdown-screen';
        overlay.innerHTML = `<div class="shutdown-msg">${msgs[settings.lang] || msgs.en}</div>`;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('active'), 10);
        overlay.addEventListener('click', () => overlay.remove());
    }

    // ---- Screensaver ----
    function setupScreensaver() {
        const events = ['mousemove','mousedown','keydown','touchstart','scroll'];
        function resetIdle() { clearTimeout(idleTimer); stopScreensaver(); idleTimer = setTimeout(startScreensaver, IDLE_TIMEOUT); }
        events.forEach(e => document.addEventListener(e, resetIdle, { passive: true }));
        resetIdle();
    }
    function startScreensaver() {
        if (document.getElementById('screensaver')) return;
        if (settings.screensaverType === 'pipes') startPipesScreensaver();
        else if (settings.screensaverType === 'matrix') startMatrixScreensaver();
        else startStarfieldScreensaver();
    }
    function startStarfieldScreensaver() {
        const canvas = document.createElement('canvas'); canvas.id = 'screensaver';
        canvas.style.cssText = 'position:fixed;inset:0;z-index:50000;cursor:none;background:#000';
        canvas.width = window.innerWidth; canvas.height = window.innerHeight; document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const stars = Array.from({length:200}, () => ({x:Math.random()*canvas.width-canvas.width/2,y:Math.random()*canvas.height-canvas.height/2,z:Math.random()*canvas.width}));
        const cx = canvas.width/2, cy = canvas.height/2;
        function frame() { if (!document.getElementById('screensaver')) return; ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(0,0,canvas.width,canvas.height);
            for (const star of stars) { star.z-=4; if (star.z<=0){star.z=canvas.width;star.x=Math.random()*canvas.width-cx;star.y=Math.random()*canvas.height-cy;}
                const sx=(star.x/star.z)*300+cx,sy=(star.y/star.z)*300+cy,r=Math.max(0,(1-star.z/canvas.width)*3);
                ctx.beginPath();ctx.arc(sx,sy,r,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${1-star.z/canvas.width})`;ctx.fill();} requestAnimationFrame(frame); }
        frame(); setupScreensaverDismiss(canvas);
    }
    function startPipesScreensaver() {
        const canvas = document.createElement('canvas'); canvas.id = 'screensaver';
        canvas.style.cssText = 'position:fixed;inset:0;z-index:50000;cursor:none;background:#000';
        canvas.width = window.innerWidth; canvas.height = window.innerHeight; document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d'); const colors = ['#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF','#00FFFF','#FF8800','#88FF00'];
        const PIPE_W = 6; function newPipe() { return {x:Math.random()*canvas.width,y:Math.random()*canvas.height,dir:Math.floor(Math.random()*4),color:colors[Math.floor(Math.random()*colors.length)],len:0}; }
        const pipes = []; for (let i=0;i<4;i++) pipes.push(newPipe());
        function frame() { if (!document.getElementById('screensaver')) return;
            for (const p of pipes) { ctx.strokeStyle=p.color;ctx.lineWidth=PIPE_W;ctx.lineCap='round';
                const dx=[0,0,-1,1][p.dir]*4,dy=[-1,1,0,0][p.dir]*4;ctx.beginPath();ctx.moveTo(p.x,p.y);p.x+=dx;p.y+=dy;ctx.lineTo(p.x,p.y);ctx.stroke();p.len++;
                if(p.len>30+Math.random()*80){const dirs=[0,1,2,3].filter(d=>d!==p.dir&&d!==(p.dir^1));p.dir=dirs[Math.floor(Math.random()*dirs.length)];p.len=0;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,PIPE_W,0,Math.PI*2);ctx.fill();}
                if(p.x<-10||p.x>canvas.width+10||p.y<-10||p.y>canvas.height+10)Object.assign(p,newPipe());} requestAnimationFrame(frame); }
        frame(); setupScreensaverDismiss(canvas);
    }
    function startMatrixScreensaver() {
        const canvas = document.createElement('canvas'); canvas.id = 'screensaver';
        canvas.style.cssText = 'position:fixed;inset:0;z-index:50000;cursor:none;background:#000';
        canvas.width = window.innerWidth; canvas.height = window.innerHeight; document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d'); const chars = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789ABCDEF';
        const fontSize = 14; const cols = Math.ceil(canvas.width/fontSize);
        const drops = Array.from({length:cols}, () => Math.random()*-100);
        function frame() { if (!document.getElementById('screensaver')) return;
            ctx.fillStyle='rgba(0,0,0,0.05)';ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle='#0F0';ctx.font=fontSize+'px monospace';
            for(let i=0;i<drops.length;i++){const ch=chars[Math.floor(Math.random()*chars.length)];ctx.fillText(ch,i*fontSize,drops[i]*fontSize);
                if(drops[i]*fontSize>canvas.height&&Math.random()>0.975)drops[i]=0;drops[i]++;} requestAnimationFrame(frame); }
        frame(); setupScreensaverDismiss(canvas);
    }
    function setupScreensaverDismiss(canvas) { canvas.addEventListener('click', stopScreensaver); let moved = false; canvas.addEventListener('mousemove', () => { if (moved) stopScreensaver(); moved = true; }); }
    function stopScreensaver() { const s = document.getElementById('screensaver'); if (s) s.remove(); }

    function startClock() {
        const el = document.getElementById('taskbar-clock');
        const loc = {en:'en-US',ru:'ru-RU',by:'be-BY'};
        function update() { const now = new Date(); el.textContent = now.toLocaleTimeString(loc[settings.lang]||[],{hour:'2-digit',minute:'2-digit'}); el.title = now.toLocaleDateString(loc[settings.lang]||'en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}); }
        update(); setInterval(update, 15000);
    }

    function runBoot() {
        const screen = document.getElementById('boot-screen');
        const fill = document.getElementById('boot-fill');
        const text = document.getElementById('boot-text');
        const msgs = ['Checking hardware...','Loading kernel...','Mounting filesystem...','Starting services...','Welcome!'];
        let step = 0;
        async function realBoot() {
            for (const msg of msgs) { text.textContent = msg; step++; fill.style.width = (step/msgs.length*100)+'%';
                if (step === 3) { try { await fetch('/api/profile'); } catch {} } await sleep(180); }
            screen.classList.add('fade-out'); setTimeout(() => screen.remove(), 600);
            const welcomeDefault = { en: 'Welcome! Double-click icons or right-click desktop for options.', ru: 'Добро пожаловать! Дважды щёлкните по иконке или правый клик для меню.', by: 'Вітаем! Двойчы пстрыкніце па абразку або правы клік для меню.' };
            const welcomeWin81 = { en: 'Welcome! Open the Start screen for your apps. Right-click the desktop for more options.', ru: 'Добро пожаловать! Откройте экран «Пуск» для приложений. Правый клик по рабочему столу — дополнительные действия.', by: 'Вітаем! Адкрыйце экран «Пуск» для праграм. Правы клік па працоўным стале — дадатковыя дзеянні.' };
            const welcomeMsgs = settings.osTheme === 'win81' ? welcomeWin81 : welcomeDefault;
            setTimeout(() => notify('Veomall OS', welcomeMsgs[settings.lang] || welcomeMsgs.en, 'computer'), 1200);
        }
        realBoot();
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    function getSettings() { return settings; }
    function setSettings(s) { Object.assign(settings, s); saveSettings(); applyOsTheme(); renderIcons(); renderStartMenu(); }

    return { init, DESKTOP_APPS, ACCESSORY_APPS, GAME_APPS, ALL_APPS: () => ALL_APPS, notify, getSettings, setSettings, OS_THEMES, t, appName, playClick, startScreensaver, switchOs, sleep };
})();

document.addEventListener('DOMContentLoaded', Desktop.init);
