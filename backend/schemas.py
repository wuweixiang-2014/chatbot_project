from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[List[str]] = None

class Role(RoleBase):
    id: int

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: str  # 暂时不使用EmailStr
    is_admin: bool = False

class UserCreate(UserBase):
    password: str
    role_ids: List[int] = []  # 用户角色ID列表

class User(UserBase):
    id: int
    is_active: bool
    roles: List[Role]  # 修改为Role类型

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    role_ids: Optional[List[int]] = None

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    message: str 

class MessageBase(BaseModel):
    content: str
    role: str  # 'user' or 'assistant'

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    conversation_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    title: str

class ConversationCreate(ConversationBase):
    pass

class Conversation(ConversationBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    messages: List[Message] = []

    class Config:
        from_attributes = True

class ConversationResponse(ConversationBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True 