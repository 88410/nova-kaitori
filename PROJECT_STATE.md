# NOVA買取サイト - 项目存档

## 📅 存档日期
2026-02-06 09:22 GMT+8

## 🌐 网站信息
- **网址**: https://novakai.net
- **服务器IP**: 43.167.223.87
- **状态**: ✅ 正常运行

## 📊 当前数据状态

### 数据库统计
```
总产品数: 27
店铺数: 23
今日更新: 293
24小时变动: 113
最后更新: 2026-02-06T01:02:39 (北京时间 09:02)
```

### 数据来源
- **Google Sheets**: https://docs.google.com/spreadsheets/d/1-Eq4q3QTTQIXrxZl0bvAnGiOtelj2JOWeEQeKaTA4iE
- **更新频率**: 每小时自动抓取
- **抓取方式**: gviz API (公开表格)

## 🏗️ 技术架构

### 后端 (Backend)
- **框架**: FastAPI (Python 3.11)
- **数据库**: PostgreSQL 15
- **任务队列**: Celery + Redis
- **自动更新**: Celery Beat (每小时)

### 前端 (Frontend)
- **框架**: React 18 + TypeScript
- **样式**: Tailwind CSS
- **构建**: Vite
- **数据获取**: TanStack Query + Axios

### 部署
- **容器**: Docker + Docker Compose
- **反向代理**: Nginx
- **SSL**: Let's Encrypt
- **域名**: novakai.net

## 📁 项目结构

```
nova-kaitori/
├── backend/
│   ├── app/
│   │   ├── api/          # API路由
│   │   ├── models/       # 数据库模型
│   │   ├── services/     # 业务逻辑
│   │   │   └── sheet_scraper.py  # Google Sheets抓取
│   │   └── celery_app.py # Celery配置
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PriceTable.tsx    # 价格表格
│   │   │   ├── Stats.tsx         # 统计卡片
│   │   │   └── Header.tsx        # 头部导航
│   │   └── App.tsx
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## ✅ 已实现功能

### 核心功能
- [x] iPhone 16/17系列价格展示
- [x] 23家買取店舗价格比较
- [x] AI予測分析区域
- [x] 每小时自动更新
- [x] 移动端适配 (2列布局)
- [x] 更新时间显示

### 数据功能
- [x] Google Sheets自动抓取
- [x] 价格历史记录
- [x] 最高价格标记
- [x] 利润计算 (買取価格 - 公式価格)
- [x] 店铺链接跳转

### UI功能
- [x] 响应式设计
- [x] 展开/收起全部店铺
- [x] 价格完整显示 (¥208,000)
- [x] AI预测文案轮换 (6种模板)

## 🔧 常用命令

### 查看服务状态
```bash
cd /home/ubuntu/.openclaw/workspace/nova-kaitori
sudo docker compose ps
```

### 手动更新数据
```bash
sudo docker compose exec backend python -c "from app.services.sheet_scraper import scrape_from_sheet; scrape_from_sheet()"
```

### 查看日志
```bash
# Celery调度日志
sudo docker compose logs celery-beat --tail 20

# Celery任务日志
sudo docker compose logs celery --tail 20

# 后端API日志
sudo docker compose logs backend --tail 20
```

### 重启服务
```bash
sudo docker compose restart backend celery celery-beat
```

### 数据库查询
```bash
sudo docker compose exec db psql -U nova -d nova_kaitori -c "SELECT MAX(scraped_at) FROM prices;"
```

## 📦 GitHub 仓库

- **地址**: https://github.com/88410/nova-kaitori
- **类型**: 私有仓库
- **分支**: main
- **最新提交**: fix: Google Sheets column matching and timestamp

### 推送更新到GitHub
```bash
cd /home/ubuntu/.openclaw/workspace/nova-kaitori
git add -A
git commit -m "描述更新内容"
git push origin main
# 输入用户名: 88410
# 输入密码: [Personal Access Token]
```

## 🚀 快速恢复指南

如果从存档恢复，执行以下步骤：

### 1. 克隆仓库
```bash
git clone https://github.com/88410/nova-kaitori.git
cd nova-kaitori
```

### 2. 启动服务
```bash
sudo docker compose -f docker-compose.prod.yml up -d
```

### 3. 验证运行
```bash
curl https://novakai.net/api/v1/stats
```

## 📋 待办事项 / 未来改进

### 已知问题
- [ ] 价格数据列可能随Google Sheets结构变化
- [ ] 需要监控自动更新是否正常

### 建议改进
- [ ] 添加价格变动通知
- [ ] 添加更多iPhone型号
- [ ] 添加图表展示价格趋势
- [ ] 添加用户收藏功能
- [ ] 添加邮件订阅价格提醒

## 🔐 重要凭证

### GitHub Token
- **用途**: 推送代码到GitHub
- **Token**: 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
- **注意**: 此Token可能需要定期更换

### 服务器访问
- **用户**: ubuntu
- **项目路径**: /home/ubuntu/.openclaw/workspace/nova-kaitori
- **需要sudo权限**: 是

## 📞 联系信息

- **管理员**: しょうし (@eth410)
- **Telegram ID**: 5092242435

---

**最后更新**: 2026-02-06 09:22 GMT+8
**版本**: v1.0.1
**状态**: ✅ 生产环境运行中
