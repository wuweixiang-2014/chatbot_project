from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from config.logger import logger

from database import get_db
from models import Role, User
from schemas import Role as RoleSchema
from dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[RoleSchema])
def read_roles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        logger.warning(f"Unauthorized access attempt to role list by: {current_user.username}")
        raise HTTPException(status_code=403, detail="Not authorized")
    
    logger.info(f"Role list accessed by admin: {current_user.username}")
    roles = db.query(Role).offset(skip).limit(limit).all()
    return roles 