from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, tools, vault
from app.core.config import get_settings
from app.database import init_db
from app.utils.logging_setup import setup_logging


@asynccontextmanager
async def lifespan(_: FastAPI):
    setup_logging()
    get_settings()  # fail fast if keys are missing
    init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="SecureVault API", version="1.0.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_settings().cors_origins,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        if request.url.path.startswith("/api"):
            response.headers.setdefault("Cache-Control", "no-store")
        return response

    app.include_router(auth.router, prefix="/api")
    app.include_router(vault.router, prefix="/api")
    app.include_router(tools.router, prefix="/api")

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
