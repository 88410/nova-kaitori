import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.database import Base, get_db
from app.routers import members
from app.services.auth_security import auth_rate_limiter


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI()
app.include_router(members.router, prefix="/api/v1")
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_security_state(monkeypatch):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    auth_rate_limiter.reset_for_tests()
    monkeypatch.setattr(settings, "redis_url", "")
    monkeypatch.setattr(settings, "auth_cookie_secure", True)
    monkeypatch.setattr(settings, "auth_session_days", 7)
    monkeypatch.setattr(settings, "password_reset_email_enabled", False)
    monkeypatch.setattr(settings, "smtp_host", "")
    monkeypatch.setattr(settings, "smtp_from_email", "")
    monkeypatch.setattr(settings, "public_app_url", "https://testserver")


@pytest.fixture
def client():
    with TestClient(app, base_url="https://testserver") as test_client:
        yield test_client


def register(client: TestClient, email: str = "member@example.com"):
    return client.post(
        "/api/v1/members/register",
        json={"username": "nova-user", "email": email, "password": "StrongPass123"},
    )


def test_registration_creates_secure_server_session(client):
    response = register(client)

    assert response.status_code == 201
    set_cookie = response.headers.get_list("set-cookie")
    session_cookie = next(value for value in set_cookie if value.startswith("nova_session="))
    assert "HttpOnly" in session_cookie
    assert "Secure" in session_cookie
    assert "SameSite=lax" in session_cookie

    me = client.get("/api/v1/members/me")
    assert me.status_code == 200
    assert me.json()["email"] == "member@example.com"
    assert me.headers["cache-control"] == "no-store"


def test_logout_requires_csrf_and_revokes_session(client):
    assert register(client).status_code == 201

    missing_csrf = client.post("/api/v1/members/logout")
    assert missing_csrf.status_code == 403

    csrf_token = client.cookies.get("nova_csrf")
    logged_out = client.post(
        "/api/v1/members/logout",
        headers={"X-NOVA-CSRF": csrf_token},
    )
    assert logged_out.status_code == 200
    assert client.get("/api/v1/members/me").status_code == 401


def test_login_uses_same_error_for_unknown_email_and_wrong_password(client):
    assert register(client).status_code == 201

    wrong_password = client.post(
        "/api/v1/members/login",
        json={"email": "member@example.com", "password": "WrongPass123"},
    )
    unknown_email = client.post(
        "/api/v1/members/login",
        json={"email": "unknown@example.com", "password": "WrongPass123"},
    )

    assert wrong_password.status_code == 401
    assert unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()


def test_legacy_direct_password_reset_is_gone(client):
    assert register(client).status_code == 201

    response = client.post(
        "/api/v1/members/reset-password",
        json={"email": "member@example.com", "password": "AttackerPass123"},
    )
    assert response.status_code == 410

    login = client.post(
        "/api/v1/members/login",
        json={"email": "member@example.com", "password": "StrongPass123"},
    )
    assert login.status_code == 200


def test_password_reset_is_single_use_and_revokes_sessions(client, monkeypatch):
    assert register(client).status_code == 201
    captured: dict[str, str] = {}

    def capture_reset_email(recipient: str, token: str):
        captured["recipient"] = recipient
        captured["token"] = token

    monkeypatch.setattr(settings, "password_reset_email_enabled", True)
    monkeypatch.setattr(settings, "smtp_host", "smtp.example.com")
    monkeypatch.setattr(settings, "smtp_from_email", "noreply@example.com")
    monkeypatch.setattr(members, "send_password_reset_email", capture_reset_email)

    known = client.post(
        "/api/v1/members/password-reset/request",
        json={"email": "member@example.com"},
    )
    unknown = client.post(
        "/api/v1/members/password-reset/request",
        json={"email": "unknown@example.com"},
    )
    assert known.status_code == 202
    assert unknown.status_code == 202
    assert known.json() == unknown.json()
    assert captured["recipient"] == "member@example.com"

    confirmed = client.post(
        "/api/v1/members/password-reset/confirm",
        json={"token": captured["token"], "password": "NewStrongPass123"},
    )
    assert confirmed.status_code == 200
    assert client.get("/api/v1/members/me").status_code == 401

    reused = client.post(
        "/api/v1/members/password-reset/confirm",
        json={"token": captured["token"], "password": "AnotherPass123"},
    )
    assert reused.status_code == 400

    old_login = client.post(
        "/api/v1/members/login",
        json={"email": "member@example.com", "password": "StrongPass123"},
    )
    new_login = client.post(
        "/api/v1/members/login",
        json={"email": "member@example.com", "password": "NewStrongPass123"},
    )
    assert old_login.status_code == 401
    assert new_login.status_code == 200


def test_password_reset_config_is_disabled_without_smtp(client):
    response = client.get("/api/v1/members/password-reset/config")
    assert response.status_code == 200
    assert response.json() == {"enabled": False}


def test_login_rate_limit_returns_retry_after(client):
    for _ in range(10):
        response = client.post(
            "/api/v1/members/login",
            json={"email": "rate-limit@example.com", "password": "WrongPass123"},
        )
        assert response.status_code == 401

    blocked = client.post(
        "/api/v1/members/login",
        json={"email": "rate-limit@example.com", "password": "WrongPass123"},
    )
    assert blocked.status_code == 429
    assert blocked.headers["retry-after"] == str(settings.auth_rate_limit_window_seconds)


def test_browser_auth_rejects_untrusted_origin(client):
    response = client.post(
        "/api/v1/members/login",
        headers={"Origin": "https://attacker.example"},
        json={"email": "member@example.com", "password": "StrongPass123"},
    )
    assert response.status_code == 403
