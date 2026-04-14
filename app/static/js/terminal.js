/**
 * Terminal emulator — virtual command line for navigating the portfolio filesystem.
 */
const Terminal = (() => {
    function open() {
        let cwd = '';
        let history = [];
        let histIdx = -1;

        const win = WM.createWindow({
            title: 'Terminal - C:\\',
            icon: 'terminal',
            width: 560,
            height: 380,
            body: '',
            bodyClass: 'terminal-body',
        });

        const body = win.el.querySelector('.win-body');
        body.style.userSelect = 'text';

        printLine('Veomall OS Terminal [Version 3.1]', 'cmd-info');
        printLine('Type "help" for a list of commands.\n', 'cmd-info');
        createPrompt();

        function getPromptStr() {
            return 'C:\\' + (cwd ? cwd.replace(/\//g, '\\') : '') + '> ';
        }

        function printLine(text, cls = 'cmd-output') {
            const div = document.createElement('div');
            div.className = cls;
            div.textContent = text;
            body.appendChild(div);
        }

        function printHtml(html) {
            const div = document.createElement('div');
            div.className = 'cmd-output';
            div.innerHTML = html;
            body.appendChild(div);
        }

        function createPrompt() {
            const line = document.createElement('div');
            line.className = 'input-line';
            const prompt = document.createElement('span');
            prompt.className = 'prompt';
            prompt.textContent = getPromptStr();
            const input = document.createElement('input');
            input.type = 'text';
            input.autocomplete = 'off';
            input.spellcheck = false;

            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    const cmd = input.value;
                    input.disabled = true;
                    if (cmd.trim()) {
                        history.push(cmd);
                        histIdx = history.length;
                    }
                    handleCommand(cmd);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (histIdx > 0) { histIdx--; input.value = history[histIdx]; }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx]; }
                    else { histIdx = history.length; input.value = ''; }
                }
            });

            line.appendChild(prompt);
            line.appendChild(input);
            body.appendChild(line);
            setTimeout(() => input.focus(), 10);

            body.addEventListener('click', () => {
                const activeInput = body.querySelector('.input-line:last-child input:not([disabled])');
                if (activeInput) activeInput.focus();
            });
        }

        function updateTitle() {
            const titleEl = win.el.querySelector('.title-text');
            if (titleEl) titleEl.textContent = 'Terminal - C:\\' + (cwd ? cwd.replace(/\//g, '\\') : '');
        }

        async function handleCommand(raw) {
            const parts = raw.trim().split(/\s+/);
            const cmd = parts[0]?.toLowerCase();
            const args = parts.slice(1).join(' ');

            switch (cmd) {
                case '': break;
                case 'help':
                    printLine('Available commands:');
                    printLine('  dir, ls       List directory contents');
                    printLine('  cd <dir>      Change directory');
                    printLine('  cat <file>    View file contents');
                    printLine('  type <file>   View file contents');
                    printLine('  pwd           Print working directory');
                    printLine('  clear, cls    Clear screen');
                    printLine('  open <app>    Open an application');
                    printLine('  tree          Show directory tree');
                    printLine('  echo <text>   Print text');
                    printLine('  about         Show profile info');
                    printLine('  neofetch      System information');
                    printLine('  settings      Open settings');
                    printLine('  ver           Show version');
                    printLine('  help          Show this help');
                    printLine('');
                    printLine('  notepad, paint, run  Open apps');
                    printLine('');
                    printLine('Games: minesweeper, snake, tetris, solitaire');
                    printLine('');
                    printLine('Easter eggs: sudo, cowsay, fortune, hack, sl,');
                    printLine('  lolcat, piano, weather, rickroll, flip, shrug');
                    break;
                case 'ver':
                    printLine('Veomall OS [Version 3.1.0]');
                    break;
                case 'clear': case 'cls':
                    body.innerHTML = '';
                    break;
                case 'pwd':
                    printLine('C:\\' + (cwd ? cwd.replace(/\//g, '\\') : ''));
                    break;
                case 'echo':
                    printLine(args);
                    break;
                case 'dir': case 'ls':
                    await cmdDir(args);
                    break;
                case 'cd':
                    await cmdCd(args);
                    break;
                case 'cat': case 'type':
                    await cmdCat(args);
                    break;
                case 'tree':
                    await cmdTree();
                    break;
                case 'about':
                    await cmdAbout();
                    break;
                case 'open':
                    cmdOpen(args);
                    break;
                case 'matrix':
                    cmdMatrix(); break;
                case 'cowsay':
                    cmdCowsay(args || 'Moo!'); break;
                case 'sudo':
                    printLine('Nice try. You are not in the sudoers file. This incident will be reported.', 'cmd-error'); break;
                case 'fortune':
                    cmdFortune(); break;
                case 'settings':
                    Apps.settings(); printLine('Settings opened.', 'cmd-success'); break;
                case 'minesweeper': case 'mine':
                    Apps.minesweeper(); printLine('Game on!', 'cmd-success'); break;
                case 'hack':
                    cmdHack(); break;
                case 'sl':
                    cmdSteamLocomotive(); break;
                case 'lolcat':
                    cmdLolcat(args || 'meow~'); break;
                case 'piano':
                    cmdPiano(); break;
                case 'weather':
                    cmdWeather(); break;
                case 'paint':
                    Apps.paint(); printLine('Paint opened.', 'cmd-success'); break;
                case 'notepad':
                    Apps.notepad(); printLine('Notepad opened.', 'cmd-success'); break;
                case 'snake':
                    Apps.snake(); printLine('🐍 Snake opened!', 'cmd-success'); break;
                case 'tetris':
                    Apps.tetris(); printLine('Tetris opened!', 'cmd-success'); break;
                case 'solitaire':
                    Apps.solitaire(); printLine('♠ Solitaire opened!', 'cmd-success'); break;
                case 'run':
                    Apps.runDialog(); printLine('Run dialog opened.', 'cmd-success'); break;
                case 'rickroll':
                    printLine('Never gonna give you up, never gonna let you down...', 'cmd-info');
                    printLine('Never gonna run around and desert you!', 'cmd-info');
                    printLine('🎵 https://youtu.be/dQw4w9WgXcQ', 'cmd-success');
                    break;
                case 'flip':
                    printLine('(╯°□°)╯︵ ┻━┻', 'cmd-output'); break;
                case 'unflip':
                    printLine('┬─┬ ノ( ゜-゜ノ)', 'cmd-output'); break;
                case 'shrug':
                    printLine('¯\\_(ツ)_/¯', 'cmd-output'); break;
                case 'date':
                    printLine(new Date().toString()); break;
                case 'whoami':
                    printLine('visitor@portfolio-os'); break;
                case 'uname':
                    printLine('VeomallOS 3.1.0 x86_64 Web/1.0'); break;
                case 'neofetch':
                    await cmdNeofetch(); break;
                case 'rm':
                    if (args.includes('-rf')) printLine('🔥 Nice try! This is a read-only filesystem.', 'cmd-error');
                    else printLine('Permission denied.', 'cmd-error');
                    break;
                case 'exit':
                    WM.closeWindow(win.id); return;
                default:
                    printLine(`Bad command or file name: ${cmd}`, 'cmd-error');
            }

            createPrompt();
            body.scrollTop = body.scrollHeight;
        }

        async function cmdDir(arg) {
            const path = resolvePath(arg || '');
            try {
                const data = await fetch('/api/fs/' + encodeURIComponent(path)).then(r => r.json());
                if (data.type === 'dir' && data.children) {
                    printLine(` Directory of C:\\${path ? path.replace(/\//g, '\\') : ''}\n`);
                    for (const item of data.children) {
                        const type = item.type === 'dir' ? '<DIR>' : '     ';
                        printLine(`  ${type}  ${item.name}`);
                    }
                    printLine(`\n  ${data.children.length} item(s)`);
                } else {
                    printLine('Not a directory.', 'cmd-error');
                }
            } catch {
                printLine('Path not found.', 'cmd-error');
            }
        }

        async function cmdCd(arg) {
            if (!arg || arg === '\\' || arg === '/') { cwd = ''; updateTitle(); return; }
            if (arg === '..' || arg === '..\\' || arg === '../') {
                const parts = cwd.split('/').filter(Boolean);
                parts.pop();
                cwd = parts.join('/');
                updateTitle();
                return;
            }
            const path = resolvePath(arg);
            try {
                const data = await fetch('/api/fs/' + encodeURIComponent(path)).then(r => r.json());
                if (data.type === 'dir') {
                    cwd = path;
                    updateTitle();
                } else {
                    printLine(`${arg} is not a directory.`, 'cmd-error');
                }
            } catch {
                printLine(`Directory not found: ${arg}`, 'cmd-error');
            }
        }

        async function cmdCat(arg) {
            if (!arg) { printLine('Usage: cat <filename>', 'cmd-error'); return; }
            const path = resolvePath(arg);
            try {
                const data = await fetch('/api/fs/' + encodeURIComponent(path)).then(r => r.json());
                if (data.type === 'file' && data.content !== undefined) {
                    printLine(data.content);
                } else {
                    printLine('Cannot read: ' + arg, 'cmd-error');
                }
            } catch {
                printLine('File not found: ' + arg, 'cmd-error');
            }
        }

        async function cmdTree() {
            const dirs = ['About', 'Projects', 'Blog', 'Career'];
            printLine('C:\\');
            for (const d of dirs) {
                printLine(`├── ${d}/`);
                try {
                    const data = await fetch('/api/fs/' + encodeURIComponent(d)).then(r => r.json());
                    if (data.children) {
                        data.children.forEach((item, i) => {
                            const prefix = i === data.children.length - 1 ? '│   └── ' : '│   ├── ';
                            printLine(prefix + item.name);
                        });
                    }
                } catch {}
            }
            printLine('└── README.TXT');
        }

        async function cmdAbout() {
            try {
                const p = await fetch('/api/profile').then(r => r.json());
                printLine(`\n  ${p.name}`);
                printLine(`  ${p.title}`);
                printLine(`  ${p.location || ''}\n`);
                printLine(`  ${p.bio || ''}\n`);
                if (p.email) printLine(`  Email:    ${p.email}`);
                if (p.github) printLine(`  GitHub:   ${p.github}`);
                if (p.telegram) printLine(`  Telegram: @${p.telegram}`);
                printLine('');
            } catch {
                printLine('Failed to load profile.', 'cmd-error');
            }
        }

        function cmdOpen(appName) {
            if (!appName) { printLine('Usage: open <app>\nApps: filemanager, browser, about, projects, blog, career, github', 'cmd-info'); return; }
            const map = {
                'filemanager': () => Apps.fileManager(),
                'files': () => Apps.fileManager(),
                'browser': () => Apps.browser(),
                'about': () => Apps.aboutMe(),
                'projects': () => Apps.projects(),
                'blog': () => Apps.blog(),
                'career': () => Apps.career(),
                'github': () => Apps.githubStats(),
                'terminal': () => Terminal.open(),
            };
            const fn = map[appName.toLowerCase()];
            if (fn) { fn(); printLine(`Opened ${appName}.`, 'cmd-success'); }
            else printLine(`Unknown app: ${appName}. Try: ${Object.keys(map).join(', ')}`, 'cmd-error');
        }

        function cmdMatrix() {
            const chars = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ012345789ABCDEF';
            let running = true;
            const lines = 18;
            function addLine() {
                if (!running) return;
                let line = '';
                for (let i = 0; i < 60; i++) line += chars[Math.floor(Math.random() * chars.length)];
                printLine(line, 'cmd-success');
                body.scrollTop = body.scrollHeight;
                if (body.querySelectorAll('.cmd-success').length < lines * 2)
                    setTimeout(addLine, 50);
                else running = false;
            }
            addLine();
            printLine('\n  Wake up, Neo...', 'cmd-info');
        }

        function cmdCowsay(msg) {
            const top = ' ' + '_'.repeat(msg.length + 2);
            const mid = '< ' + msg + ' >';
            const bot = ' ' + '-'.repeat(msg.length + 2);
            printLine(top);
            printLine(mid);
            printLine(bot);
            printLine('        \\   ^__^');
            printLine('         \\  (oo)\\_______');
            printLine('            (__)\\       )\\/\\');
            printLine('                ||----w |');
            printLine('                ||     ||');
        }

        function cmdFortune() {
            const fortunes = [
                'A foolish man complains of his torn pocket. A wise man uses it to scratch his back.',
                'You will be successful in love... with your terminal.',
                'The bug is not in the code, it is in the developer.',
                'Have you tried turning it off and on again?',
                'There are 10 types of people: those who understand binary and those who don\'t.',
                '// TODO: write a funny fortune message',
                'It works on my machine ¯\\_(ツ)_/¯',
                'git commit -m "fixed everything" (narrator: they did not fix everything)',
            ];
            printLine(fortunes[Math.floor(Math.random() * fortunes.length)], 'cmd-info');
        }

        async function cmdNeofetch() {
            try {
                const p = await fetch('/api/profile').then(r => r.json());
                const art = [
                    '  ╔══════════╗ ',
                    '  ║ ▓▓▓▓▓▓▓▓ ║ ',
                    '  ║ ▓▓▓▓▓▓▓▓ ║ ',
                    '  ║ ▓▓▓▓▓▓▓▓ ║ ',
                    '  ╚══════════╝ ',
                    '   ╔════════╗  ',
                    '  ═╩════════╩═ ',
                ];
                const info = [
                    `${p.name || 'User'}@portfolio-os`,
                    '─'.repeat(30),
                    `OS: Veomall OS 3.1`,
                    `Host: ${window.location.hostname}`,
                    `Shell: portfolio-term 1.0`,
                    `Title: ${p.title || 'N/A'}`,
                    `Location: ${p.location || 'N/A'}`,
                ];
                for (let i = 0; i < Math.max(art.length, info.length); i++) {
                    const left = (art[i] || '                ').padEnd(18);
                    const right = info[i] || '';
                    printLine(left + right, i === 0 ? 'cmd-info' : 'cmd-output');
                }
            } catch {
                printLine('Failed to load system info.', 'cmd-error');
            }
        }

        function cmdHack() {
            const lines = [
                'INITIATING HACK SEQUENCE...',
                'Connecting to mainframe...',
                'Bypassing firewall ██████████ 100%',
                'Decrypting password: ********',
                'Access granted!',
                '',
                '> SELECT * FROM secrets WHERE classification = "TOP SECRET"',
                '',
                '┌────────────────────────────────────┐',
                '│  ERROR: You thought this was real?  │',
                '│  Nice try, script kiddie! 😄        │',
                '└────────────────────────────────────┘',
            ];
            let i = 0;
            function next() {
                if (i < lines.length) { printLine(lines[i], i < 5 ? 'cmd-success' : (i > 7 ? 'cmd-info' : 'cmd-output')); i++; body.scrollTop = body.scrollHeight; setTimeout(next, 200); }
                else createPrompt();
            }
            next();
            return;
        }

        function cmdSteamLocomotive() {
            const frames = [
                '      ====        ________',
                '  _D _|  |_______/        \\__I_I_____===__|_________',
                '   |(_)---  |   H\\________/ |   |        =|___ ___|',
                '   /     |  |   H  |  |     |   |         ||_| |_||',
                '  |      |  |   H  |__--------------------| [___] |',
                '  | ________|___H__/__|_____/[][]~\\_______|       |',
                '  |/ |   |-----------I_____I [][] []  D   |=======|_',
                '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__',
                ' |/-=|___|=   O=====O=====O=====O|_____/~\\___/        ',
                '  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/            ',
            ];
            frames.forEach(l => printLine(l, 'cmd-info'));
            printLine('\n  🚂 Choo choo!', 'cmd-success');
        }

        function cmdLolcat(text) {
            const colors = ['#FF0000', '#FF7700', '#FFFF00', '#00FF00', '#0077FF', '#8B00FF'];
            const div = document.createElement('div');
            div.className = 'cmd-output';
            for (let i = 0; i < text.length; i++) {
                const span = document.createElement('span');
                span.textContent = text[i];
                span.style.color = colors[i % colors.length];
                span.style.fontWeight = 'bold';
                div.appendChild(span);
            }
            body.appendChild(div);
        }

        function cmdPiano() {
            printLine('🎹 Piano — press keys to play!', 'cmd-info');
            printLine('  ┌─┬─┬┬─┬─┬─┬─┬┬─┬┬─┬─┐');
            printLine('  │ │ ││ │ │ │ ││ ││ │ │');
            printLine('  │ │█││█│ │ │█││█││█│ │');
            printLine('  │ │█││█│ │ │█││█││█│ │');
            printLine('  │ └┬┘└┬┘ │ └┬┘└┬┘└┬┘ │');
            printLine('  │ C│ D│ E│ F│ G│ A│ B│');
            printLine('  └──┴──┴──┴──┴──┴──┴──┘');
            printLine('');
            const notes = { c: 261.63, d: 293.66, e: 329.63, f: 349.23, g: 392.00, a: 440.00, b: 493.88 };
            const melody = ['c','e','g','e','c','d','f','a','g','e','c'];
            let i = 0;
            function playNext() {
                if (i >= melody.length) { printLine('♫ That was a little tune!', 'cmd-success'); createPrompt(); return; }
                const n = melody[i]; const freq = notes[n];
                try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value = freq; osc.type = 'sine'; gain.gain.value = 0.15; osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); osc.stop(ctx.currentTime + 0.35); } catch {}
                printLine(`  ♪ ${n.toUpperCase()} (${freq} Hz)`, 'cmd-info');
                body.scrollTop = body.scrollHeight; i++; setTimeout(playNext, 300);
            }
            playNext(); return;
        }

        function cmdWeather() {
            const weathers = [
                { icon: '☀️', name: 'Sunny', temp: '24°C', desc: 'Clear skies all day. Perfect for coding!' },
                { icon: '🌤', name: 'Partly Cloudy', temp: '19°C', desc: 'A few clouds, mild breeze. Nice!' },
                { icon: '🌧', name: 'Rainy', temp: '14°C', desc: 'Grab an umbrella. Perfect weather for indoor coding.' },
                { icon: '❄️', name: 'Snowy', temp: '-3°C', desc: 'Bundle up! Hot chocolate recommended.' },
                { icon: '⛈', name: 'Thunderstorm', temp: '17°C', desc: 'Stay inside. And save your work!' },
                { icon: '🌈', name: 'Rainbow', temp: '20°C', desc: 'Something magical is in the air...' },
            ];
            const w = weathers[Math.floor(Math.random() * weathers.length)];
            printLine('');
            printLine(`  ┌────────────────────────────┐`);
            printLine(`  │  ${w.icon}  ${w.name.padEnd(22)}│`);
            printLine(`  │     Temperature: ${w.temp.padEnd(10)}│`);
            printLine(`  │                            │`);
            printLine(`  │  ${w.desc.substring(0, 26).padEnd(26)}│`);
            if (w.desc.length > 26) printLine(`  │  ${w.desc.substring(26).padEnd(26)}│`);
            printLine(`  └────────────────────────────┘`);
            printLine('');
            printLine('  * Weather is randomly generated 😄', 'cmd-info');
        }

        function resolvePath(input) {
            input = input.replace(/\\/g, '/').replace(/^C:\/?/i, '').replace(/^\//, '');
            if (!input) return cwd;
            if (input.startsWith('/')) return input.slice(1);
            return cwd ? cwd + '/' + input : input;
        }
    }

    return { open };
})();
