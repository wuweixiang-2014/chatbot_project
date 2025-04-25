from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from passlib.context import CryptContext
from config.logger import logger

from database import get_db
from models import User, Role
from schemas import User as UserSchema, UserCreate, UserUpdate
from dependencies import get_current_user
from routers.auth import get_password_hash

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.get("/me", response_model=UserSchema)
def read_users_me(current_user: User = Depends(get_current_user)):
    logger.info(f"User profile accessed: {current_user.username}")
    return current_user

@router.get("/", response_model=List[UserSchema])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        logger.warning(f"Unauthorized access attempt to user list by: {current_user.username}")
        raise HTTPException(status_code=403, detail="Not authorized")
    
    logger.info(f"User list accessed by admin: {current_user.username}")
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserSchema)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        logger.warning(f"Unauthorized access attempt to user details by: {current_user.username}")
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    logger.info(f"User details accessed by admin: {current_user.username}")
    return user

@router.post("/", response_model=UserSchema)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        logger.warning(f"Unauthorized user creation attempt by: {current_user.username}")
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if username exists
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        logger.warning(f"User creation failed: Username already exists - {user.username}")
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        logger.warning(f"User creation failed: Email already exists - {user.email}")
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create new user with hashed password
    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    logger.info(f"New user created by admin {current_user.username}: {user.username}")
    return db_user

@router.put("/{user_id}", response_model=UserSchema)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        logger.warning(f"Unauthorized user update attempt by: {current_user.username}")
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user fields
    update_data = user_update.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = pwd_context.hash(update_data.pop("password"))
    
    # Update roles if provided
    if "role_ids" in update_data:
        roles = db.query(Role).filter(Role.id.in_(update_data["role_ids"])).all()
        db_user.roles = roles
        del update_data["role_ids"]
    
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    
    logger.info(f"User updated by admin {current_user.username}: {db_user.username}")
    return db_user

@router.post("/bulk", response_model=dict)
async def bulk_create_users(
    users_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admin can create users in bulk")

    success = []
    failed = []

    for user_data in users_data["users"]:
        try:
            # Check if username already exists
            if db.query(User).filter(User.username == user_data["username"]).first():
                failed.append({
                    "user": user_data,
                    "error": "Username already exists"
                })
                continue

            # Get default user role
            user_role = db.query(Role).filter(Role.name == "user").first()
            if not user_role:
                failed.append({
                    "user": user_data,
                    "error": "Default user role not found"
                })
                continue

            # Create new user
            hashed_password = get_password_hash(user_data["password"])
            new_user = User(
                username=user_data["username"],
                hashed_password=hashed_password,
                is_admin=user_data.get("is_admin", False)
            )
            new_user.roles.append(user_role)

            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            success.append(user_data)
        except Exception as e:
            failed.append({
                "user": user_data,
                "error": str(e)
            })

    return {
        "success": success,
        "failed": failed
    } 