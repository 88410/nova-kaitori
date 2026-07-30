import re
import hashlib
import hmac
import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Member
from app.schemas.schemas import (
    MemberLoginRequest,
    MemberRegisterRequest,
    MemberResetPasswordRequest,
    MemberResponse,
)

router = APIRouter()

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PASSWORD_ITERATIONS = 120_000


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
    if algorithm != "pbkdf2_sha256":
        return False
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    ).hex()
    return hmac.compare_digest(digest, expected_digest)


def normalize_password(password: str) -> str:
    if len(password) < 8 or len(password) > 128:
        raise HTTPException(status_code=422, detail="Password must be 8 to 128 characters")
    return password


def normalize_member_payload(payload: MemberRegisterRequest) -> tuple[str, str, str]:
    username = payload.username.strip()
    email = payload.email.strip().lower()
    password = normalize_password(payload.password)

    if len(username) < 2 or len(username) > 50:
        raise HTTPException(status_code=422, detail="Username must be 2 to 50 characters")
    if any(char.isspace() for char in username):
        raise HTTPException(status_code=422, detail="Username cannot contain spaces")
    if len(email) > 255 or not EMAIL_PATTERN.match(email):
        raise HTTPException(status_code=422, detail="Email format is invalid")

    return username, email, password


def normalize_member_login_payload(payload: MemberLoginRequest) -> tuple[str, str]:
    email = payload.email.strip().lower()
    if len(email) > 255 or not EMAIL_PATTERN.match(email):
        raise HTTPException(status_code=422, detail="Email format is invalid")
    password = normalize_password(payload.password)
    return email, password


def normalize_member_reset_payload(payload: MemberResetPasswordRequest) -> tuple[str, str]:
    email = payload.email.strip().lower()
    if len(email) > 255 or not EMAIL_PATTERN.match(email):
        raise HTTPException(status_code=422, detail="Email format is invalid")
    password = normalize_password(payload.password)
    return email, password


# Members
@router.post("/members/register", response_model=MemberResponse, status_code=201)
def register_member(payload: MemberRegisterRequest, db: Session = Depends(get_db)):
    username, email, password = normalize_member_payload(payload)

    existing_member = db.query(Member).filter(
        (func.lower(Member.username) == username.lower()) | (Member.email == email)
    ).first()
    if existing_member:
        if existing_member.email == email:
            raise HTTPException(status_code=409, detail="Email already registered")
        raise HTTPException(status_code=409, detail="Username already registered")

    member = Member(username=username, email=email, password_hash=hash_password(password))
    db.add(member)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Member already registered")

    db.refresh(member)
    return member


@router.post("/members/login", response_model=MemberResponse)
def login_member(payload: MemberLoginRequest, db: Session = Depends(get_db)):
    email, password = normalize_member_login_payload(payload)
    member = db.query(Member).filter(Member.email == email).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if not member.password_hash:
        raise HTTPException(status_code=409, detail="Password is not set")
    if not verify_password(password, member.password_hash):
        raise HTTPException(status_code=401, detail="Invalid password")
    return member


@router.post("/members/reset-password", response_model=MemberResponse)
def reset_member_password(payload: MemberResetPasswordRequest, db: Session = Depends(get_db)):
    email, password = normalize_member_reset_payload(payload)
    member = db.query(Member).filter(Member.email == email).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.password_hash = hash_password(password)
    db.commit()
    db.refresh(member)
    return member
