from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models import Conversation, Message, User
from database import get_db
from dependencies import get_current_user
from schemas import Conversation as ConversationSchema, ConversationCreate, MessageCreate
from config.logger import logger

router = APIRouter()

@router.post("/", response_model=ConversationSchema)
def create_conversation(
    conversation: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Creating new conversation for user: {current_user.username}")
    db_conversation = Conversation(
        title=conversation.title,
        user_id=current_user.id
    )
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    logger.info(f"Conversation created successfully: {db_conversation.id}")
    return db_conversation

@router.get("/", response_model=List[ConversationSchema])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Fetching conversations for user: {current_user.username}")
    conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).all()
    return conversations

@router.get("/{conversation_id}", response_model=ConversationSchema)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Fetching conversation {conversation_id} for user: {current_user.username}")
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conversation:
        logger.warning(f"Conversation {conversation_id} not found for user: {current_user.username}")
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

@router.post("/{conversation_id}/messages")
def update_messages(
    conversation_id: int,
    messages: List[MessageCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Updating messages for conversation {conversation_id} by user: {current_user.username}")
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conversation:
        logger.warning(f"Conversation {conversation_id} not found for user: {current_user.username}")
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Delete old messages
    db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).delete()

    # Add new messages
    for msg in messages:
        db_message = Message(
            conversation_id=conversation_id,
            content=msg.content,
            role=msg.role
        )
        db.add(db_message)

    db.commit()
    logger.info(f"Messages updated successfully for conversation {conversation_id}")
    return {"status": "success"}

# Admin API
@router.get("/admin/all", response_model=List[ConversationSchema])
def get_all_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        logger.warning(f"Unauthorized access attempt to all conversations by: {current_user.username}")
        raise HTTPException(status_code=403, detail="Not authorized")
    
    logger.info(f"All conversations accessed by admin: {current_user.username}")
    conversations = db.query(Conversation).all()
    return conversations

@router.get("/user/{user_id}", response_model=List[ConversationSchema])
def read_user_conversations(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        logger.warning(f"Unauthorized access attempt to user conversations by: {current_user.username}")
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    logger.info(f"User conversations accessed by admin: {current_user.username}")
    return conversations 