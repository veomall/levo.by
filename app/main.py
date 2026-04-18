import logging
import shutil
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
import markdown
from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import ADMIN_PASSWORD, ADMIN_PASSWORD_HASH, GITHUB_USERNAME
from app.database import init_db, get_session, Profile, Project, BlogPost, WorkExperience, Skill
from app.auth import create_access_token, require_admin, verify_admin_login
from app.slugify import normalize_blog_slug

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "static" / "uploads"


log = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(application: FastAPI):
    if not (ADMIN_PASSWORD_HASH or ADMIN_PASSWORD):
        log.warning(
            "Admin login is disabled: set ADMIN_PASSWORD_HASH (recommended) or ADMIN_PASSWORD "
            "and ADMIN_USERNAME in the environment / .env"
        )
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    await init_db()
    yield


app = FastAPI(title="Veomall OS", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

MD_EXTENSIONS = ["fenced_code", "codehilite", "tables", "toc", "nl2br"]
MD_EXTENSION_CONFIGS = {
    "codehilite": {
        "pygments_style": "dracula",
        "noclasses": True,
        "guess_lang": True,
    },
}


def md_to_html(text: str) -> str:
    return markdown.markdown(
        text,
        extensions=MD_EXTENSIONS,
        extension_configs=MD_EXTENSION_CONFIGS,
    )


# --------------- Pages ---------------

@app.get("/", response_class=HTMLResponse)
async def desktop_page(request: Request):
    return templates.TemplateResponse(request, "desktop.html")


@app.get("/blog", response_class=HTMLResponse)
async def blog_page(request: Request, session: AsyncSession = Depends(get_session)):
    rows = await session.execute(
        select(BlogPost).where(BlogPost.published == True).order_by(BlogPost.created_at.desc())
    )
    posts = rows.scalars().all()
    all_tags = set()
    for p in posts:
        if p.tags:
            for t in p.tags.split(","):
                t = t.strip()
                if t:
                    all_tags.add(t)
    return templates.TemplateResponse(request, "blog.html", {
        "posts": posts, "post": None, "all_tags": sorted(all_tags),
    })


@app.get("/blog/{slug}", response_class=HTMLResponse)
async def blog_post_page(request: Request, slug: str, session: AsyncSession = Depends(get_session)):
    row = await session.execute(select(BlogPost).where(BlogPost.slug == slug))
    post = row.scalar_one_or_none()
    if not post:
        raise HTTPException(404, "Post not found")
    rows = await session.execute(
        select(BlogPost).where(BlogPost.published == True).order_by(BlogPost.created_at.desc())
    )
    posts = rows.scalars().all()
    html_content = md_to_html(post.content)
    return templates.TemplateResponse(request, "blog.html", {
        "posts": posts, "post": post, "html_content": html_content, "all_tags": [],
    })


@app.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request):
    return templates.TemplateResponse(request, "admin.html")


# --------------- API: Public ---------------

@app.get("/api/profile")
async def api_profile(session: AsyncSession = Depends(get_session)):
    row = await session.execute(select(Profile))
    p = row.scalar_one_or_none()
    if not p:
        return {}
    return {
        "name": p.name, "title": p.title, "bio": p.bio, "photo_url": p.photo_url,
        "email": p.email, "github": p.github, "linkedin": p.linkedin,
        "telegram": p.telegram, "website": p.website, "location": p.location,
    }


@app.get("/api/projects")
async def api_projects(session: AsyncSession = Depends(get_session)):
    rows = await session.execute(select(Project).order_by(Project.sort_order, Project.id))
    return [
        {"id": p.id, "title": p.title, "description": p.description,
         "url": p.url, "github_url": p.github_url, "tags": p.tags,
         "icon": p.icon, "created_at": str(p.created_at)}
        for p in rows.scalars().all()
    ]


@app.get("/api/blog")
async def api_blog(session: AsyncSession = Depends(get_session)):
    rows = await session.execute(
        select(BlogPost).where(BlogPost.published == True).order_by(BlogPost.created_at.desc())
    )
    return [
        {"id": p.id, "slug": p.slug, "title": p.title, "excerpt": p.excerpt,
         "cover_image": p.cover_image, "tags": p.tags, "created_at": str(p.created_at)}
        for p in rows.scalars().all()
    ]


@app.get("/api/blog/{slug}")
async def api_blog_detail(slug: str, session: AsyncSession = Depends(get_session)):
    row = await session.execute(select(BlogPost).where(BlogPost.slug == slug))
    p = row.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Not found")
    html = md_to_html(p.content)
    return {
        "id": p.id, "slug": p.slug, "title": p.title, "content": p.content,
        "html": html, "excerpt": p.excerpt, "cover_image": p.cover_image, "tags": p.tags,
        "published": p.published, "created_at": str(p.created_at), "updated_at": str(p.updated_at),
    }


@app.get("/api/experience")
async def api_experience(session: AsyncSession = Depends(get_session)):
    rows = await session.execute(select(WorkExperience).order_by(WorkExperience.id.desc()))
    return [
        {"id": e.id, "company": e.company, "role": e.role, "description": e.description,
         "start_date": e.start_date, "end_date": e.end_date}
        for e in rows.scalars().all()
    ]


@app.get("/api/skills")
async def api_skills(session: AsyncSession = Depends(get_session)):
    rows = await session.execute(select(Skill).order_by(Skill.category, Skill.name))
    return [
        {"id": s.id, "name": s.name, "category": s.category, "level": s.level}
        for s in rows.scalars().all()
    ]


@app.get("/api/github-stats")
async def api_github_stats(session: AsyncSession = Depends(get_session)):
    row = await session.execute(select(Profile))
    p = row.scalar_one_or_none()
    username = p.github if p and p.github else GITHUB_USERNAME
    if not username:
        return {"error": "No GitHub username configured"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            user_resp = await client.get(f"https://api.github.com/users/{username}")
            repos_resp = await client.get(
                f"https://api.github.com/users/{username}/repos",
                params={"per_page": 100, "sort": "updated"},
            )
        if user_resp.status_code != 200:
            return {"error": "GitHub user not found"}
        user = user_resp.json()
        repos = repos_resp.json() if repos_resp.status_code == 200 else []
        languages = {}
        total_stars = 0
        for r in repos:
            if r.get("language"):
                languages[r["language"]] = languages.get(r["language"], 0) + 1
            total_stars += r.get("stargazers_count", 0)
        return {
            "username": username,
            "avatar": user.get("avatar_url", ""),
            "public_repos": user.get("public_repos", 0),
            "followers": user.get("followers", 0),
            "following": user.get("following", 0),
            "total_stars": total_stars,
            "languages": dict(sorted(languages.items(), key=lambda x: -x[1])),
            "top_repos": [
                {"name": r["name"], "description": r.get("description", ""),
                 "stars": r.get("stargazers_count", 0), "language": r.get("language", ""),
                 "url": r.get("html_url", "")}
                for r in sorted(repos, key=lambda x: -x.get("stargazers_count", 0))[:8]
            ],
        }
    except Exception:
        return {"error": "Failed to fetch GitHub data"}


@app.get("/api/fs/{path:path}")
async def api_filesystem(path: str, session: AsyncSession = Depends(get_session)):
    path = path.strip("/") or ""
    segments = [s for s in path.split("/") if s]

    if not segments:
        return {"type": "dir", "name": "C:\\", "path": "", "children": [
            {"type": "dir", "name": "About"},
            {"type": "dir", "name": "Projects"},
            {"type": "dir", "name": "Blog"},
            {"type": "dir", "name": "Career"},
            {"type": "file", "name": "README.TXT"},
        ]}

    root = segments[0].lower()

    if root == "readme.txt" and len(segments) == 1:
        row = await session.execute(select(Profile))
        p = row.scalar_one_or_none()
        name = p.name if p else "User"
        return {"type": "file", "name": "README.TXT", "content":
            f"Welcome to {name}'s Veomall OS!\n\nNavigate the filesystem to learn about me.\n"
            "Directories:\n  About/    - Personal information\n  Projects/ - My projects\n"
            "  Blog/     - Blog posts\n  Career/   - Work experience"}

    if root == "about":
        if len(segments) == 1:
            return {"type": "dir", "name": "About", "path": "About", "children": [
                {"type": "file", "name": "PROFILE.TXT"},
                {"type": "file", "name": "SKILLS.TXT"},
                {"type": "file", "name": "CONTACTS.TXT"},
            ]}
        row = await session.execute(select(Profile))
        p = row.scalar_one_or_none()
        fname = segments[1].lower()
        if fname == "profile.txt":
            return {"type": "file", "name": "PROFILE.TXT", "content":
                f"Name: {p.name}\nTitle: {p.title}\nLocation: {p.location}\n\n{p.bio}" if p else "No profile."}
        if fname == "skills.txt":
            rows = await session.execute(select(Skill).order_by(Skill.category))
            skills = rows.scalars().all()
            lines = []
            cat = ""
            for s in skills:
                if s.category != cat:
                    cat = s.category
                    lines.append(f"\n[{cat}]")
                bar = "█" * (s.level // 10) + "░" * (10 - s.level // 10)
                lines.append(f"  {s.name:<20} {bar} {s.level}%")
            return {"type": "file", "name": "SKILLS.TXT",
                    "content": "Skills\n" + "=" * 40 + "\n".join(lines) if lines else "No skills listed yet."}
        if fname == "contacts.txt":
            return {"type": "file", "name": "CONTACTS.TXT", "content":
                f"Email:    {p.email}\nGitHub:   {p.github}\nLinkedIn: {p.linkedin}\nTelegram: {p.telegram}\nWebsite:  {p.website}" if p else "No contacts."}

    if root == "projects":
        rows = await session.execute(select(Project).order_by(Project.sort_order, Project.id))
        projects = rows.scalars().all()
        if len(segments) == 1:
            return {"type": "dir", "name": "Projects", "path": "Projects", "children": [
                {"type": "file", "name": f"{pr.title.replace(' ', '_').upper()}.TXT"} for pr in projects
            ]}
        fname = segments[1].lower().replace(".txt", "")
        for pr in projects:
            if pr.title.replace(" ", "_").lower() == fname:
                return {"type": "file", "name": f"{pr.title}.TXT", "content":
                    f"{pr.title}\n{'=' * len(pr.title)}\n\n{pr.description}\n\nURL: {pr.url}\nGitHub: {pr.github_url}\nTags: {pr.tags}"}

    if root == "blog":
        rows = await session.execute(select(BlogPost).where(BlogPost.published == True).order_by(BlogPost.created_at.desc()))
        posts = rows.scalars().all()
        if len(segments) == 1:
            return {"type": "dir", "name": "Blog", "path": "Blog", "children": [
                {"type": "file", "name": f"{bp.slug}.MD"} for bp in posts
            ]}
        slug = segments[1].lower().replace(".md", "")
        for bp in posts:
            if bp.slug == slug:
                return {"type": "file", "name": f"{bp.slug}.MD", "content":
                    f"# {bp.title}\nDate: {bp.created_at}\nTags: {bp.tags}\n\n{bp.content}"}

    if root == "career":
        rows = await session.execute(select(WorkExperience).order_by(WorkExperience.sort_order, WorkExperience.id.desc()))
        exps = rows.scalars().all()
        if len(segments) == 1:
            return {"type": "dir", "name": "Career", "path": "Career", "children": [
                {"type": "file", "name": f"{e.company.replace(' ', '_').upper()}.TXT"} for e in exps
            ]}
        fname = segments[1].lower().replace(".txt", "")
        for e in exps:
            if e.company.replace(" ", "_").lower() == fname:
                return {"type": "file", "name": f"{e.company}.TXT", "content":
                    f"{e.role} @ {e.company}\n{e.start_date} - {e.end_date}\n\n{e.description}"}

    raise HTTPException(404, "Path not found")


# --------------- API: Auth ---------------

class LoginRequest(BaseModel):
    username: str
    password: str

class ProfileUpdate(BaseModel):
    name: str | None = None
    title: str | None = None
    bio: str | None = None
    photo_url: str | None = None
    email: str | None = None
    github: str | None = None
    linkedin: str | None = None
    telegram: str | None = None
    website: str | None = None
    location: str | None = None

class ProjectCreate(BaseModel):
    title: str
    description: str = ""
    url: str = ""
    github_url: str = ""
    tags: str = ""
    icon: str = "app"
    sort_order: int = 0

class BlogPostCreate(BaseModel):
    slug: str
    title: str
    content: str = ""
    excerpt: str = ""
    cover_image: str = ""
    tags: str = ""
    published: bool = False

class ExperienceCreate(BaseModel):
    company: str
    role: str
    description: str = ""
    start_date: str = ""
    end_date: str = "Present"
    sort_order: int = 0

class SkillCreate(BaseModel):
    name: str
    category: str = "General"
    level: int = 50


@app.post("/api/auth/login")
async def login(body: LoginRequest):
    if not verify_admin_login(body.username, body.password):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": body.username, "role": "admin"})
    return {"access_token": token, "token_type": "bearer"}


# --------------- Image Upload ---------------

@app.post("/api/admin/upload")
async def upload_image(file: UploadFile = File(...), _=Depends(require_admin)):
    ext = Path(file.filename or "img.png").suffix.lower()
    if ext not in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}:
        raise HTTPException(400, "Unsupported file type")
    name = f"{uuid.uuid4().hex[:12]}{ext}"
    path = UPLOADS_DIR / name
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"url": f"/static/uploads/{name}"}


# --------------- Markdown Preview ---------------

class MarkdownPreview(BaseModel):
    content: str

@app.post("/api/admin/preview-markdown")
async def preview_markdown(body: MarkdownPreview, _=Depends(require_admin)):
    html = md_to_html(body.content)
    return {"html": html}


# --------------- Admin: Profile ---------------

@app.put("/api/admin/profile")
async def update_profile(body: ProfileUpdate, _=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    row = await session.execute(select(Profile))
    p = row.scalar_one_or_none()
    if not p:
        p = Profile()
        session.add(p)
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(p, field, val)
    await session.commit()
    return {"ok": True}


# --------------- Admin: Projects ---------------

@app.get("/api/admin/projects")
async def admin_list_projects(_=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    rows = await session.execute(select(Project).order_by(Project.sort_order, Project.id))
    return [{"id": p.id, "title": p.title, "description": p.description, "url": p.url,
             "github_url": p.github_url, "tags": p.tags, "icon": p.icon, "sort_order": p.sort_order}
            for p in rows.scalars().all()]


@app.post("/api/admin/projects")
async def create_project(body: ProjectCreate, _=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    p = Project(**body.model_dump())
    session.add(p)
    await session.commit()
    return {"id": p.id}


@app.put("/api/admin/projects/{pid}")
async def update_project(pid: int, body: ProjectCreate, _=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    row = await session.execute(select(Project).where(Project.id == pid))
    p = row.scalar_one_or_none()
    if not p:
        raise HTTPException(404)
    for field, val in body.model_dump().items():
        setattr(p, field, val)
    await session.commit()
    return {"ok": True}


@app.delete("/api/admin/projects/{pid}")
async def delete_project(pid: int, _=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    await session.execute(delete(Project).where(Project.id == pid))
    await session.commit()
    return {"ok": True}


# --------------- Admin: Blog ---------------

@app.get("/api/admin/blog")
async def admin_list_blog(_=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    rows = await session.execute(select(BlogPost).order_by(BlogPost.created_at.desc()))
    return [{"id": p.id, "slug": p.slug, "title": p.title, "excerpt": p.excerpt,
             "cover_image": p.cover_image, "tags": p.tags, "published": p.published,
             "created_at": str(p.created_at)}
            for p in rows.scalars().all()]


@app.post("/api/admin/blog")
async def create_blog_post(body: BlogPostCreate, _=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    data = body.model_dump()
    data["slug"] = normalize_blog_slug(data.get("slug") or data.get("title") or "")
    if not data["slug"]:
        raise HTTPException(400, "Could not build slug from title")
    p = BlogPost(**data)
    session.add(p)
    await session.commit()
    return {"id": p.id}


@app.put("/api/admin/blog/{pid}")
async def update_blog_post(pid: int, body: BlogPostCreate, _=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    row = await session.execute(select(BlogPost).where(BlogPost.id == pid))
    p = row.scalar_one_or_none()
    if not p:
        raise HTTPException(404)
    data = body.model_dump()
    data["slug"] = normalize_blog_slug(data.get("slug") or data.get("title") or "")
    if not data["slug"]:
        raise HTTPException(400, "Could not build slug from title")
    for field, val in data.items():
        setattr(p, field, val)
    await session.commit()
    return {"ok": True}


@app.delete("/api/admin/blog/{pid}")
async def delete_blog_post(pid: int, _=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    await session.execute(delete(BlogPost).where(BlogPost.id == pid))
    await session.commit()
    return {"ok": True}


# --------------- Admin: Experience ---------------

@app.get("/api/admin/experience")
async def admin_list_exp(_=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    rows = await session.execute(select(WorkExperience).order_by(WorkExperience.id.desc()))
    return [{"id": e.id, "company": e.company, "role": e.role, "description": e.description,
             "start_date": e.start_date, "end_date": e.end_date}
            for e in rows.scalars().all()]


@app.post("/api/admin/experience")
async def create_exp(body: ExperienceCreate, _=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    e = WorkExperience(**body.model_dump())
    session.add(e)
    await session.commit()
    return {"id": e.id}


@app.put("/api/admin/experience/{eid}")
async def update_exp(eid: int, body: ExperienceCreate, _=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    row = await session.execute(select(WorkExperience).where(WorkExperience.id == eid))
    e = row.scalar_one_or_none()
    if not e:
        raise HTTPException(404)
    for field, val in body.model_dump().items():
        setattr(e, field, val)
    await session.commit()
    return {"ok": True}


@app.delete("/api/admin/experience/{eid}")
async def delete_exp(eid: int, _=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    await session.execute(delete(WorkExperience).where(WorkExperience.id == eid))
    await session.commit()
    return {"ok": True}


# --------------- Admin: Skills ---------------

@app.get("/api/admin/skills")
async def admin_list_skills(_=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    rows = await session.execute(select(Skill).order_by(Skill.category, Skill.name))
    return [{"id": s.id, "name": s.name, "category": s.category, "level": s.level}
            for s in rows.scalars().all()]


@app.post("/api/admin/skills")
async def create_skill(body: SkillCreate, _=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    s = Skill(**body.model_dump())
    session.add(s)
    await session.commit()
    return {"id": s.id}


@app.put("/api/admin/skills/{sid}")
async def update_skill(sid: int, body: SkillCreate, _=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    row = await session.execute(select(Skill).where(Skill.id == sid))
    s = row.scalar_one_or_none()
    if not s:
        raise HTTPException(404)
    for field, val in body.model_dump().items():
        setattr(s, field, val)
    await session.commit()
    return {"ok": True}


@app.delete("/api/admin/skills/{sid}")
async def delete_skill(sid: int, _=Depends(require_admin), session: AsyncSession = Depends(get_session)):
    await session.execute(delete(Skill).where(Skill.id == sid))
    await session.commit()
    return {"ok": True}
