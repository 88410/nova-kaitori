import hashlib
import hmac
import re
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Cookie, Depends, Header, HTTPException, Request, Response
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.models.models import Member, MemberSession, PasswordResetToken
from app.schemas.schemas import (
    MemberChangePasswordRequest,
    MemberLoginRequest,
    MemberPasswordResetConfirm,
    MemberPasswordResetRequest,
    MemberRegisterRequest,
    MemberResponse,
    MessageResponse,
    PasswordResetAvailabilityResponse,
)
from app.services.auth_security import auth_rate_limiter
from app.services.member_email import send_password_reset_email

router = APIRouter()

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PASSWORD_ITERATIONS = 600_000
SESSION_COOKIE = "nova_session"
CSRF_COOKIE = "nova_csrf"
GENERIC_LOGIN_ERROR = "Email or password is invalid"
GENERIC_RESET_MESSAGE = "If the account exists, password reset instructions will be sent"


def hash_password(password: str) -> str:
    salt = secrets.token_urlsafe(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_ITERATIONS,
    ).hex()
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt}${digest}"


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    try:
        algorithm, iterations_text, salt, expected_digest = password_hash.split("$", 3)
        iterations = int(iterations_text)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256" or iterations < 1:
        return False
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    ).hex()
    return hmac.compare_digest(digest, expected_digest)


DUMMY_PASSWORD_HASH = hash_password(secrets.token_urlsafe(24))


def password_hash_needs_upgrade(password_hash: str | None) -> bool:
    if not password_hash:
        return True
    try:
        algorithm, iterations_text, _, _ = password_hash.split("$", 3)
        return algorithm != "pbkdf2_sha256" or int(iterations_text) < PASSWORD_ITERATIONS
    except ValueError:
        return True


def normalize_password(password: str) -> str:
    if len(password) < 8 or len(password) > 128:
        raise HTTPException(status_code=422, detail="Password must be 8 to 128 characters")
    return password


def normalize_email(email: str) -> str:
    normalized = email.strip().lower()
    if len(normalized) > 255 or not EMAIL_PATTERN.match(normalized):
        raise HTTPException(status_code=422, detail="Email format is invalid")
    return normalized


def normalize_member_payload(payload: MemberRegisterRequest) -> tuple[str, str, str]:
    username = payload.username.strip()
    email = normalize_email(payload.email)
    password = normalize_password(payload.password)

    if len(username) < 2 or len(username) > 50:
        raise HTTPException(status_code=422, detail="Username must be 2 to 50 characters")
    if any(char.isspace() for char in username):
        raise HTTPException(status_code=422, detail="Username cannot contain spaces")
    return username, email, password


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        return forwarded_for.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def enforce_trusted_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    if not origin:
        return
    allowed = {item.rstrip("/") for item in settings.auth_origins_list}
    if origin.rstrip("/") not in allowed:
        raise HTTPException(status_code=403, detail="Origin is not allowed")


def check_auth_rate(request: Request, scope: str, account: str, account_limit: int) -> None:
    auth_rate_limiter.check(f"{scope}:ip", client_ip(request), account_limit * 3)
    auth_rate_limiter.check(f"{scope}:account", account, account_limit)


def set_auth_cookies(response: Response, session_token: str, csrf_token: str) -> None:
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"
    max_age = settings.auth_session_days * 24 * 60 * 60
    response.set_cookie(
        SESSION_COOKIE,
        session_token,
        max_age=max_age,
        path="/",
        secure=settings.auth_cookie_secure,
        httponly=True,
        samesite="lax",
    )
    response.set_cookie(
        CSRF_COOKIE,
        csrf_token,
        max_age=max_age,
        path="/",
        secure=settings.auth_cookie_secure,
        httponly=False,
        samesite="lax",
    )


def clear_auth_cookies(response: Response) -> None:
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"
    response.delete_cookie(SESSION_COOKIE, path="/", secure=settings.auth_cookie_secure, httponly=True, samesite="lax")
    response.delete_cookie(CSRF_COOKIE, path="/", secure=settings.auth_cookie_secure, httponly=False, samesite="lax")


def create_member_session(db: Session, member: Member, response: Response) -> None:
    now = utc_now()
    session_token = secrets.token_urlsafe(32)
    csrf_token = secrets.token_urlsafe(24)

    db.query(MemberSession).filter(
        MemberSession.member_id == member.id,
        MemberSession.expires_at <= now,
    ).delete(synchronize_session=False)

    active_sessions = db.query(MemberSession).filter(
        MemberSession.member_id == member.id,
        MemberSession.revoked_at.is_(None),
    ).order_by(MemberSession.created_at.desc()).all()
    for old_session in active_sessions[9:]:
        old_session.revoked_at = now

    db.add(MemberSession(
        member_id=member.id,
        token_hash=token_hash(session_token),
        csrf_hash=token_hash(csrf_token),
        expires_at=now + timedelta(days=settings.auth_session_days),
    ))
    db.commit()
    set_auth_cookies(response, session_token, csrf_token)


@dataclass
class AuthContext:
    member: Member
    session: MemberSession


def get_auth_context(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
    db: Session = Depends(get_db),
) -> AuthContext:
    if not session_token:
        raise HTTPException(status_code=401, detail="Authentication required")

    session = db.query(MemberSession).filter(
        MemberSession.token_hash == token_hash(session_token),
        MemberSession.revoked_at.is_(None),
        MemberSession.expires_at > utc_now(),
    ).first()
    if not session or not session.member or session.member.status != "active":
        raise HTTPException(status_code=401, detail="Authentication required")
    return AuthContext(member=session.member, session=session)


def require_csrf(
    context: AuthContext,
    csrf_cookie: str | None,
    csrf_header: str | None,
) -> None:
    if not csrf_cookie or not csrf_header:
        raise HTTPException(status_code=403, detail="CSRF validation failed")
    if not hmac.compare_digest(csrf_cookie, csrf_header):
        raise HTTPException(status_code=403, detail="CSRF validation failed")
    if not hmac.compare_digest(context.session.csrf_hash, token_hash(csrf_header)):
        raise HTTPException(status_code=403, detail="CSRF validation failed")


@router.post("/members/register", response_model=MemberResponse, status_code=201)
def register_member(
    payload: MemberRegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    enforce_trusted_origin(request)
    username, email, password = normalize_member_payload(payload)
    check_auth_rate(request, "register", email, 5)
    new_password_hash = hash_password(password)

    existing_member = db.query(Member).filter(
        (func.lower(Member.username) == username.lower()) | (Member.email == email)
    ).first()
    if existing_member:
        raise HTTPException(status_code=409, detail="Member already registered")

    member = Member(username=username, email=email, password_hash=new_password_hash)
    db.add(member)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Member already registered")

    db.refresh(member)
    create_member_session(db, member, response)
    return member


@router.post("/members/login", response_model=MemberResponse)
def login_member(
    payload: MemberLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    enforce_trusted_origin(request)
    email = normalize_email(payload.email)
    password = normalize_password(payload.password)
    check_auth_rate(request, "login", email, 10)

    member = db.query(Member).filter(Member.email == email).first()
    password_hash = member.password_hash if member else DUMMY_PASSWORD_HASH
    password_valid = verify_password(password, password_hash)
    if not member or member.status != "active" or not password_valid:
        raise HTTPException(status_code=401, detail=GENERIC_LOGIN_ERROR)

    if password_hash_needs_upgrade(member.password_hash):
        member.password_hash = hash_password(password)
        db.commit()
    create_member_session(db, member, response)
    return member


@router.get("/members/me", response_model=MemberResponse)
def get_current_member(response: Response, context: AuthContext = Depends(get_auth_context)):
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"
    return context.member


@router.post("/members/logout", response_model=MessageResponse)
def logout_member(
    request: Request,
    response: Response,
    context: AuthContext = Depends(get_auth_context),
    csrf_cookie: str | None = Cookie(default=None, alias=CSRF_COOKIE),
    csrf_header: str | None = Header(default=None, alias="X-NOVA-CSRF"),
    db: Session = Depends(get_db),
):
    enforce_trusted_origin(request)
    require_csrf(context, csrf_cookie, csrf_header)
    context.session.revoked_at = utc_now()
    db.commit()
    clear_auth_cookies(response)
    return {"message": "Logged out"}


@router.post("/members/change-password", response_model=MessageResponse)
def change_member_password(
    payload: MemberChangePasswordRequest,
    request: Request,
    response: Response,
    context: AuthContext = Depends(get_auth_context),
    csrf_cookie: str | None = Cookie(default=None, alias=CSRF_COOKIE),
    csrf_header: str | None = Header(default=None, alias="X-NOVA-CSRF"),
    db: Session = Depends(get_db),
):
    enforce_trusted_origin(request)
    require_csrf(context, csrf_cookie, csrf_header)
    check_auth_rate(request, "change-password", str(context.member.id), 5)
    current_password = normalize_password(payload.current_password)
    new_password = normalize_password(payload.new_password)
    if not verify_password(current_password, context.member.password_hash):
        raise HTTPException(status_code=401, detail="Current password is invalid")

    context.member.password_hash = hash_password(new_password)
    now = utc_now()
    db.query(MemberSession).filter(
        MemberSession.member_id == context.member.id,
        MemberSession.revoked_at.is_(None),
    ).update({MemberSession.revoked_at: now}, synchronize_session=False)
    db.commit()
    clear_auth_cookies(response)
    return {"message": "Password changed; sign in again"}


@router.get("/members/password-reset/config", response_model=PasswordResetAvailabilityResponse)
def password_reset_config():
    return {"enabled": settings.password_reset_delivery_ready}


@router.post("/members/password-reset/request", response_model=MessageResponse, status_code=202)
def request_password_reset(
    payload: MemberPasswordResetRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    enforce_trusted_origin(request)
    email = normalize_email(payload.email)
    check_auth_rate(request, "password-reset-request", email, 5)

    if not settings.password_reset_delivery_ready:
        return {"message": GENERIC_RESET_MESSAGE}

    raw_token = secrets.token_urlsafe(32)
    raw_token_hash = token_hash(raw_token)
    member = db.query(Member).filter(Member.email == email, Member.status == "active").first()
    if member:
        now = utc_now()
        db.query(PasswordResetToken).filter(
            PasswordResetToken.member_id == member.id,
            PasswordResetToken.used_at.is_(None),
        ).update({PasswordResetToken.used_at: now}, synchronize_session=False)

        db.add(PasswordResetToken(
            member_id=member.id,
            token_hash=raw_token_hash,
            expires_at=now + timedelta(minutes=settings.password_reset_token_minutes),
        ))
    db.commit()
    if member:
        background_tasks.add_task(send_password_reset_email, member.email, raw_token)

    return {"message": GENERIC_RESET_MESSAGE}


@router.post("/members/password-reset/confirm", response_model=MessageResponse)
def confirm_password_reset(
    payload: MemberPasswordResetConfirm,
    request: Request,
    db: Session = Depends(get_db),
):
    enforce_trusted_origin(request)
    check_auth_rate(request, "password-reset-confirm", client_ip(request), 10)
    password = normalize_password(payload.password)
    if len(payload.token) < 32 or len(payload.token) > 256:
        raise HTTPException(status_code=400, detail="Reset link is invalid or expired")

    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash(payload.token),
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at > utc_now(),
    ).first()
    if not reset_token or not reset_token.member or reset_token.member.status != "active":
        raise HTTPException(status_code=400, detail="Reset link is invalid or expired")

    now = utc_now()
    reset_token.member.password_hash = hash_password(password)
    reset_token.used_at = now
    db.query(MemberSession).filter(
        MemberSession.member_id == reset_token.member_id,
        MemberSession.revoked_at.is_(None),
    ).update({MemberSession.revoked_at: now}, synchronize_session=False)
    db.commit()
    return {"message": "Password updated; sign in again"}


@router.post("/members/reset-password", status_code=410)
def deprecated_reset_password():
    raise HTTPException(status_code=410, detail="Use the verified password reset flow")
