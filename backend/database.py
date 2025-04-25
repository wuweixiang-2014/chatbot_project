from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config.logger import logger

# PostgreSQL connection string
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:951025@localhost:5432/chatbot_db"

try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    logger.info("Successfully connected to PostgreSQL database")
except Exception as e:
    logger.error(f"Failed to connect to PostgreSQL database: {str(e)}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 数据库依赖
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()