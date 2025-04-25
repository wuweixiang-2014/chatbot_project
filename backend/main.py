from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, conversations, chat, roles, users
import uvicorn
from config.logger import logger
from database import engine, Base
from models import User, Role, Permission, Conversation, Message
from sqlalchemy.orm import Session
from database import get_db

app = FastAPI()

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["conversations"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(roles.router, prefix="/api/roles", tags=["roles"])
app.include_router(users.router, prefix="/api/users", tags=["users"])

@app.on_event("startup")
async def startup_event():
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    
    # 检查并创建默认角色
    db = next(get_db())
    try:
        # 检查admin角色是否存在
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin", description="Administrator role")
            db.add(admin_role)
            logger.info("Created admin role")
        
        # 检查user角色是否存在
        user_role = db.query(Role).filter(Role.name == "user").first()
        if not user_role:
            user_role = Role(name="user", description="Regular user role")
            db.add(user_role)
            logger.info("Created user role")
        
        db.commit()
        
        # 检查admin用户是否存在
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            from auth import get_password_hash
            admin_user = User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                is_admin=True
            )
            admin_user.roles.append(admin_role)
            db.add(admin_user)
            db.commit()
            logger.info("Created admin user")
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "欢迎使用聊天机器人API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 