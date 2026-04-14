from datetime import datetime, date

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Date, DateTime, Float,
    create_engine, event,
)
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import DATABASE_URL


class Base(DeclarativeBase):
    pass


class Profile(Base):
    __tablename__ = "profile"
    id = Column(Integer, primary_key=True, default=1)
    name = Column(String(200), nullable=False, default="John Doe")
    title = Column(String(300), nullable=False, default="Software Engineer")
    bio = Column(Text, default="")
    photo_url = Column(String(500), default="")
    email = Column(String(200), default="")
    github = Column(String(200), default="")
    linkedin = Column(String(300), default="")
    telegram = Column(String(200), default="")
    website = Column(String(300), default="")
    location = Column(String(200), default="")


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, default="")
    url = Column(String(500), default="")
    github_url = Column(String(500), default="")
    tags = Column(String(500), default="")
    icon = Column(String(50), default="app")
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class BlogPost(Base):
    __tablename__ = "blog_posts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    slug = Column(String(300), unique=True, nullable=False)
    title = Column(String(500), nullable=False)
    content = Column(Text, default="")
    excerpt = Column(String(1000), default="")
    cover_image = Column(String(500), default="")
    tags = Column(String(500), default="")
    published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WorkExperience(Base):
    __tablename__ = "work_experience"
    id = Column(Integer, primary_key=True, autoincrement=True)
    company = Column(String(300), nullable=False)
    role = Column(String(300), nullable=False)
    description = Column(Text, default="")
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), default="Present")
    sort_order = Column(Integer, default=0)


class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    category = Column(String(200), default="General")
    level = Column(Integer, default=50)


engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        from sqlalchemy import select
        result = await session.execute(select(Profile))
        if not result.scalar_one_or_none():
            session.add(Profile(
                name="John Doe",
                title="Full-Stack Developer",
                bio="Passionate developer who loves building things.",
                email="hello@example.com",
                github="johndoe",
                location="Internet",
            ))
            await session.commit()


async def get_session():
    async with async_session() as session:
        yield session
