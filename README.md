# 聊天机器人系统

这是一个基于React和FastAPI的聊天机器人系统，具有用户管理和多机器人接口功能。

## 功能特点

- 用户认证和授权
- 实时聊天功能
- 管理员后台
- 支持多种聊天机器人接口

## 技术栈

### 前端
- React
- TypeScript
- Ant Design
- Axios

### 后端
- FastAPI
- PostgreSQL
- SQLAlchemy
- JWT认证

## 安装和运行

### 前端

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm start
```

### 后端

1. 创建并激活Python虚拟环境：
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows
```

2. 安装依赖：
```bash
pip install -r requirements.txt
```

3. 创建PostgreSQL数据库：
```sql
CREATE DATABASE chatbot_db;
```

4. 启动后端服务器：
```bash
uvicorn main:app --reload
```

## API文档

启动后端服务器后，访问 http://localhost:8000/docs 查看API文档。

## 环境变量

在生产环境中，需要设置以下环境变量：

- `SECRET_KEY`: JWT密钥
- `DATABASE_URL`: 数据库连接URL 