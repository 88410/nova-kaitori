# NOVA買取サイト

日本のiPhone買取価格比較サイト - AI予測で最適な売却タイミングを提供

## 🌐 网站地址

**https://novakai.net**

## 📋 项目进度

### ✅ 已完成

- [x] **后端**: FastAPI + PostgreSQL + Celery 架构
- [x] **前端**: React + TypeScript + Tailwind CSS + Vite
- [x] **数据**: Google Sheets CSV导入 (24产品 × 23店铺 × ~900价格)
- [x] **部署**: Docker Compose + Nginx 反向代理
- [x] **SSL**: Let's Encrypt HTTPS证书
- [x] **域名**: novakai.net 已配置
- [x] **移动端适配**: 响应式设计，手机端2列布局
- [x] **AI预测区域**: 显示最佳卖出机型和最高价格店铺
- [x] **店铺链接**: 所有店铺链接已验证并配置

### 📊 数据概况

| 项目 | 数量 |
|------|------|
| iPhone产品 | 24款 (16/17系列) |
| 買取店舗 | 23店 |
| 价格数据 | ~900条 |

### 🏗️ 技术栈

**Backend:**
- FastAPI (Python)
- PostgreSQL
- Celery + Redis (任务队列)
- SQLAlchemy (ORM)

**Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- Vite
- TanStack Query
- Axios

**Infra:**
- Docker & Docker Compose
- Nginx (反向代理 + SSL)
- Let's Encrypt

### 📁 项目结构

```
nova-kaitori/
├── backend/           # FastAPI后端
│   ├── app/
│   │   ├── api/      # API路由
│   │   ├── models/   # 数据库模型
│   │   └── services/ # 业务逻辑
│   └── Dockerfile
├── frontend/          # React前端
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   └── Dockerfile
├── docker-compose.yml # 本地开发配置
├── docker-compose.prod.yml # 生产配置
└── README.md
```

### 🔧 关键配置

**服务器:**
- IP: 43.167.223.87
- Domain: novakai.net

**API端点:**
- https://novakai.net/api/v1/prices
- https://novakai.net/api/v1/stats

### 📝 最近更新

- 2026-02-05: 移动端UI优化，价格显示改为"万"单位
- 2026-02-05: 修复API路径问题，数据正常显示
- 2026-02-05: 更新版权年份为2026，添加公司名称

## 🚀 启动命令

```bash
# 生产环境
docker compose -f docker-compose.prod.yml up -d

# 本地开发
docker compose up -d
```

## 📄 License

MIT
