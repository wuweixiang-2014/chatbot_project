#!/bin/bash

# 设置系统限制
ulimit -n 65535

# 启动后端（使用gunicorn，限制内存使用）
cd backend
gunicorn main:app --workers 1 --threads 1 --bind 0.0.0.0:8000 --timeout 120 --max-requests 1000 --max-requests-jitter 50 &

# 构建并启动前端（生产环境）
cd ../frontend
npm run build
serve -s build -l 3000 & 