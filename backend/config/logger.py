import logging
import sys
from logging.handlers import RotatingFileHandler
import os

# Create logs directory if it doesn't exist
os.makedirs('logs', exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('logs/app.log', maxBytes=10485760, backupCount=5),  # 10MB per file, keep 5 files
        logging.StreamHandler(sys.stdout)
    ]
)

# Create logger
logger = logging.getLogger('chatbot')
logger.setLevel(logging.INFO) 