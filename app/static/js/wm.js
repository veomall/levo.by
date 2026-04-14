/**
 * Window Manager — handles window creation, dragging, resizing,
 * minimize/maximize/close, focus management, and taskbar integration.
 */
const WM = (() => {
    let windows = [];
    let zCounter = 100;
    const container = () => document.getElementById('windows-container') || document.body;
    const taskbarWins = () => document.getElementById('taskbar-windows');

    /** win31 | winxp | win7 | win81 | win10 | win11 */
    function iconOsSuffix() {
        const c = document.body?.className || '';
        if (/\bos-win31\b/.test(c)) return '31';
        if (/\bos-winxp\b/.test(c)) return 'xp';
        if (/\bos-win7\b/.test(c)) return '7';
        if (/\bos-win81\b/.test(c)) return '81';
        if (/\bos-win10\b/.test(c)) return '10';
        if (/\bos-win11\b/.test(c)) return '11';
        return '31';
    }

    function useModernIconSet() {
        const s = iconOsSuffix();
        return s === '7' || s === '81' || s === '10' || s === '11';
    }

    /**
     * Symbol id in desktop.html: classic base, -xp, -w7, -w8, -w10, -w11, or -tile (Start screen plitки).
     */
    function iconId(symbolId, opts) {
        opts = opts || {};
        if (opts.tile) return `${symbolId}-tile`;
        const s = iconOsSuffix();
        if (s === '31') return symbolId;
        if (s === 'xp') return `${symbolId}-xp`;
        if (s === '7') return `${symbolId}-w7`;
        if (s === '81') return `${symbolId}-w8`;
        if (s === '10') return `${symbolId}-w10`;
        if (s === '11') return `${symbolId}-w11`;
        return symbolId;
    }

    function iconSvgClasses(opts) {
        opts = opts || {};
        if (opts.tile) return 'icon-svg icon-svg-tile';
        const s = iconOsSuffix();
        if (s === '31') return 'icon-svg icon-svg-classic icon-svg-os31';
        if (s === 'xp') return 'icon-svg icon-svg-classic icon-svg-osxp';
        return `icon-svg icon-svg-modern icon-svg-os${s}`;
    }

    /** Desktop 32×32 sprites — class reflects OS; shapes come from iconId(), not CSS filters */
    function iconImgClasses() {
        const s = iconOsSuffix();
        if (s === '31') return 'icon-img icon-img-classic icon-img-os31';
        if (s === 'xp') return 'icon-img icon-img-classic icon-img-osxp';
        return `icon-img icon-img-modern icon-img-os${s}`;
    }

    function createIcon(symbolId, size = 16, opts) {
        opts = opts || {};
        const id = iconId(symbolId, opts);
        return `<svg class="${iconSvgClasses(opts)}" width="${size}" height="${size}"><use href="#icon-${id}"/></svg>`;
    }

    function createWindow(opts) {
        const id = 'win-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
        const w = opts.width || 500;
        const h = opts.height || 380;
        const maxW = window.innerWidth - 40;
        const maxH = window.innerHeight - 80;
        const x = opts.x ?? Math.min(40 + windows.length * 26, maxW - w);
        const y = opts.y ?? Math.min(30 + windows.length * 26, maxH - h);

        const el = document.createElement('div');
        el.className = 'win-window';
        el.id = id;
        el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${++zCounter}`;

        const icon = opts.icon || 'app';
        const menubar = opts.menubar || '';
        const toolbar = opts.toolbar || '';

        el.innerHTML = `
            <div class="win-titlebar" data-wid="${id}">
                ${createIcon(icon)}
                <span class="title-text">${opts.title || 'Window'}</span>
                <button class="win-titlebar-btn" data-action="minimize" title="Minimize">▼</button>
                <button class="win-titlebar-btn" data-action="maximize" title="Maximize">□</button>
                <button class="win-titlebar-btn" data-action="close" title="Close">✕</button>
            </div>
            ${menubar}
            ${toolbar}
            <div class="win-body ${opts.bodyClass || ''}" id="${id}-body">${opts.body || ''}</div>
            ${opts.statusbar ? `<div class="win-statusbar">${opts.statusbar}</div>` : ''}
            <div class="win-resize-handle" data-wid="${id}"></div>
        `;

        container().appendChild(el);

        const winObj = { id, el, title: opts.title, icon, minimized: false, maximized: false, prevRect: null, onClose: opts.onClose };
        windows.push(winObj);

        setupDrag(el, id);
        setupResize(el, id);
        setupTitlebarButtons(el, id);
        addTaskbarButton(winObj);
        focusWindow(id);

        if (opts.onReady) opts.onReady(el, id);
        return { el, id, body: el.querySelector('.win-body') };
    }

    function setupDrag(el, id) {
        const tb = el.querySelector('.win-titlebar');
        let dragging = false, ox, oy;

        tb.addEventListener('mousedown', e => {
            if (e.target.closest('.win-titlebar-btn')) return;
            const winObj = getWin(id);
            if (winObj && winObj.maximized) return;
            dragging = true;
            ox = e.clientX - el.offsetLeft;
            oy = e.clientY - el.offsetTop;
            focusWindow(id);
            e.preventDefault();
        });

        document.addEventListener('mousemove', e => {
            if (!dragging) return;
            el.style.left = (e.clientX - ox) + 'px';
            el.style.top = Math.max(0, e.clientY - oy) + 'px';
        });

        document.addEventListener('mouseup', () => { dragging = false; });
    }

    function setupResize(el, id) {
        const handle = el.querySelector('.win-resize-handle');
        let resizing = false, startX, startY, startW, startH;

        handle.addEventListener('mousedown', e => {
            const winObj = getWin(id);
            if (winObj && winObj.maximized) return;
            resizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startW = el.offsetWidth;
            startH = el.offsetHeight;
            focusWindow(id);
            e.preventDefault();
            e.stopPropagation();
        });

        document.addEventListener('mousemove', e => {
            if (!resizing) return;
            el.style.width = Math.max(200, startW + (e.clientX - startX)) + 'px';
            el.style.height = Math.max(120, startH + (e.clientY - startY)) + 'px';
        });

        document.addEventListener('mouseup', () => { resizing = false; });
    }

    function setupTitlebarButtons(el, id) {
        el.querySelectorAll('.win-titlebar-btn').forEach(btn => {
            btn.addEventListener('mousedown', e => e.stopPropagation());
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'close') closeWindow(id);
                else if (action === 'minimize') minimizeWindow(id);
                else if (action === 'maximize') toggleMaximize(id);
            });
        });

        el.addEventListener('mousedown', () => focusWindow(id));
    }

    function focusWindow(id) {
        windows.forEach(w => {
            w.el.classList.toggle('inactive', w.id !== id);
        });
        const winObj = getWin(id);
        if (winObj) {
            winObj.el.style.zIndex = ++zCounter;
        }
        updateTaskbar();
    }

    function minimizeWindow(id) {
        const w = getWin(id);
        if (!w) return;
        w.minimized = true;
        w.el.classList.add('minimized');
        updateTaskbar();
        const visible = windows.filter(x => !x.minimized);
        if (visible.length) focusWindow(visible[visible.length - 1].id);
    }

    function toggleMaximize(id) {
        const w = getWin(id);
        if (!w) return;
        if (w.maximized) {
            w.maximized = false;
            w.el.classList.remove('maximized');
            if (w.prevRect) {
                w.el.style.left = w.prevRect.left;
                w.el.style.top = w.prevRect.top;
                w.el.style.width = w.prevRect.width;
                w.el.style.height = w.prevRect.height;
            }
        } else {
            w.prevRect = { left: w.el.style.left, top: w.el.style.top, width: w.el.style.width, height: w.el.style.height };
            w.maximized = true;
            w.el.classList.add('maximized');
        }
    }

    function closeWindow(id) {
        const idx = windows.findIndex(w => w.id === id);
        if (idx === -1) return;
        const w = windows[idx];
        if (w.onClose) w.onClose();
        w.el.remove();
        windows.splice(idx, 1);
        removeTaskbarButton(id);
        const visible = windows.filter(x => !x.minimized);
        if (visible.length) focusWindow(visible[visible.length - 1].id);
    }

    function restoreWindow(id) {
        const w = getWin(id);
        if (!w) return;
        w.minimized = false;
        w.el.classList.remove('minimized');
        focusWindow(id);
    }

    function addTaskbarButton(winObj) {
        const bar = taskbarWins();
        if (!bar) return;
        const btn = document.createElement('div');
        btn.className = 'taskbar-btn';
        btn.id = 'tb-' + winObj.id;
        btn.innerHTML = `${createIcon(winObj.icon)} <span class="tb-text">${winObj.title}</span>`;
        btn.addEventListener('click', () => {
            if (winObj.minimized) {
                restoreWindow(winObj.id);
            } else {
                const isTop = winObj.el.style.zIndex == zCounter;
                if (isTop) minimizeWindow(winObj.id);
                else focusWindow(winObj.id);
            }
        });
        bar.appendChild(btn);
    }

    function removeTaskbarButton(id) {
        const btn = document.getElementById('tb-' + id);
        if (btn) btn.remove();
    }

    function updateTaskbar() {
        windows.forEach(w => {
            const btn = document.getElementById('tb-' + w.id);
            if (btn) {
                btn.classList.toggle('active', !w.el.classList.contains('inactive') && !w.minimized);
            }
        });
    }

    function getWin(id) { return windows.find(w => w.id === id); }
    function getWindows() { return windows; }
    function getIcon(name, size, opts) { return createIcon(name, size == null ? 16 : size, opts); }

    return { createWindow, closeWindow, focusWindow, minimizeWindow, toggleMaximize, restoreWindow, getWindows, getIcon, iconId, useModernIconSet, iconImgClasses, iconOsSuffix };
})();
