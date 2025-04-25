from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Message, Conversation, User
from schemas import MessageCreate, Message as MessageSchema, ConversationCreate, ConversationResponse
from dependencies import get_current_user
from openai import OpenAI
import os
from config.logger import logger
import openai
from datetime import datetime

router = APIRouter()

# 配置OpenAI客户端
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    logger.warning("OpenAI API密钥未设置，将使用模拟响应")
    client = None
else:
    try:
        client = OpenAI(api_key=api_key)
        logger.info("OpenAI客户端初始化成功")
    except Exception as e:
        logger.error(f"OpenAI客户端初始化失败: {str(e)}")
        client = None

# 配置 OpenAI API
openai.api_key = os.getenv("OPENAI_API_KEY")

def get_conversation_history(db: Session, conversation_id: int) -> List[dict]:
    """获取对话的历史消息"""
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at).all()
    
    # 将消息转换为OpenAI API所需的格式
    return [
        {"role": msg.role, "content": msg.content}
        for msg in messages
    ]

def get_mock_response(message: str) -> str:
    """当OpenAI API不可用时返回模拟响应"""
    return f"模拟响应: {message}"

@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(
    conversation: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_conversation = Conversation(
        title=conversation.title,
        user_id=current_user.id
    )
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

@router.post("/{conversation_id}/message", response_model=MessageSchema)
async def create_message(
    conversation_id: int,
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"用户 {current_user.username} 尝试在对话 {conversation_id} 中发送消息")
    
    # 检查对话是否存在且属于当前用户
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        logger.warning(f"对话 {conversation_id} 不存在或不属于用户 {current_user.username}")
        raise HTTPException(status_code=404, detail="对话不存在")
    
    try:
        # 保存用户消息
        user_message = Message(
            content=message.content,
            role="user",
            conversation_id=conversation_id
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)
        logger.info(f"用户消息已保存: {user_message.id}")
        
        # 获取对话历史
        messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at).all()
        logger.info(f"获取到 {len(messages)} 条历史消息")
        
        # 构建 OpenAI 请求
        openai_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]
        
        # 调用 OpenAI API
        response = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=openai_messages,
            temperature=0.7
        )
        
        # 保存 AI 回复
        ai_message = Message(
            content=response.choices[0].message.content,
            role="assistant",
            conversation_id=conversation_id
        )
        db.add(ai_message)
        db.commit()
        db.refresh(ai_message)
        logger.info(f"助手消息已保存: {ai_message.id}")
        
        return ai_message
    except Exception as e:
        logger.error(f"处理消息时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messages/{conversation_id}", response_model=List[MessageSchema])
def get_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    logger.info(f"用户 {current_user.username} 尝试获取对话 {conversation_id} 的消息")
    
    # 检查对话是否存在且属于当前用户
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        logger.warning(f"对话 {conversation_id} 不存在或不属于用户 {current_user.username}")
        raise HTTPException(status_code=404, detail="对话不存在")
    
    try:
        # 获取对话的所有消息
        messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at).all()
        
        logger.info(f"成功获取对话 {conversation_id} 的 {len(messages)} 条消息")
        return messages
    except Exception as e:
        logger.error(f"获取消息时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{conversation_id}/summarize")
async def summarize_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"用户 {current_user.username} 尝试总结对话 {conversation_id}")
    
    # 检查对话是否存在且属于当前用户
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        logger.warning(f"对话 {conversation_id} 不存在或不属于用户 {current_user.username}")
        raise HTTPException(status_code=404, detail="对话不存在")

    # 获取对话历史
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at).all()

    if len(messages) < 3:
        logger.info("对话长度小于3条，无法生成摘要")
        return {"title": conversation.title}

    # 构建总结提示
    conversation_text = "\n".join([
        f"{msg.role}: {msg.content}"
        for msg in messages[:5]  # 只使用前5条消息来生成标题
    ])

    try:
        # 调用 OpenAI API 生成标题
        response = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "你是一个专业的对话总结助手。请根据以下对话内容，生成一个简洁的标题（不超过10个字）。标题应该概括对话的主要主题。"},
                {"role": "user", "content": conversation_text}
            ],
            temperature=0.3
        )

        new_title = response.choices[0].message.content.strip()
        
        # 更新对话标题
        conversation.title = new_title
        db.commit()

        logger.info(f"对话摘要生成成功，新标题: {new_title}")
        return {"title": new_title}
    except Exception as e:
        logger.error(f"生成对话摘要时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 