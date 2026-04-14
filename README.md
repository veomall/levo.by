# Veomall OS

A portfolio website styled as a Windows operating system, built with FastAPI and vanilla JavaScript. Code Writted by Claude Opus 4.6

## Features

- **Desktop Environment** — Windows inspired UI with draggable, resizable windows and taskbar
- **File Manager** — browse your portfolio data as a virtual filesystem
- **Terminal** — command-line interface with `ls`, `cd`, `cat`, `tree`, and more
- **About Me** — profile card with contacts and skills
- **Projects** — project showcase with descriptions and links
- **Blog** — posts viewable inside the OS and as a separate markdown reader at `/blog`
- **Career Path** — timeline of work experience
- **GitHub Stats** — live stats pulled from the GitHub API
- **Browser** — embedded iframe browser

## Tech Stack

- **Backend:** FastAPI + SQLAlchemy + SQLite (async with aiosqlite)
- **Frontend:** Vanilla JavaScript, no frameworks
- **Templates:** Jinja2
- **Auth:** JWT (python-jose)
- **Markdown:** python-markdown with code highlighting

## Blog

The blog has two views:

- **Inside the OS** — opens posts in Windows-style viewer
- **Standalone reader** — clean markdown reader at `/blog` and `/blog/{slug}`
