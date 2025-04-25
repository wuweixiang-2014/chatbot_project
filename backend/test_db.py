from sqlalchemy.orm import Session
from database import engine, Base
from models import User, Role
from routers.auth import verify_password, get_password_hash
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_database():
    # 创建会话
    db = Session(engine)
    try:
        # 检查表是否存在
        logger.info("检查数据库表...")
        Base.metadata.create_all(bind=engine)
        
        # 检查角色表
        logger.info("检查角色表...")
        roles = db.query(Role).all()
        logger.info(f"角色数量: {len(roles)}")
        for role in roles:
            logger.info(f"角色: {role.name} - {role.description}")
        
        # 检查用户表
        logger.info("检查用户表...")
        users = db.query(User).all()
        logger.info(f"用户数量: {len(users)}")
        for user in users:
            logger.info(f"用户: {user.username} - {user.email}")
            logger.info(f"角色: {[role.name for role in user.roles]}")
            logger.info(f"密码哈希: {user.hashed_password}")
            logger.info(f"验证密码 'admin123': {verify_password('admin123', user.hashed_password)}")
        
        # 测试密码哈希
        test_password = "admin123"
        hashed_password = get_password_hash(test_password)
        logger.info(f"测试密码哈希:")
        logger.info(f"原始密码: {test_password}")
        logger.info(f"哈希值: {hashed_password}")
        logger.info(f"验证结果: {verify_password(test_password, hashed_password)}")
        
    except Exception as e:
        logger.error(f"测试数据库时出错: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    test_database() 