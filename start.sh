#!/bin/bash

# 设置系统限制
ulimit -n 65535

# 安装Python依赖
cd backend
python -m pip install -r requirements.txt

# 启动后端（使用gunicorn，限制内存使用）
gunicorn main:app --workers 1 --threads 1 --bind 0.0.0.0:8000 --timeout 120 --max-requests 1000 --max-requests-jitter 50 &

# 安装Node依赖并构建前端
cd ../frontend
npm install
npm run build
serve -s build -l 3000 & 