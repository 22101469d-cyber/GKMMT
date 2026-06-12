# 序航 AI - 高考志愿未来方向分析 MVP

面向高考学生和家长的渐进式 AI 志愿方向分析网站。

当前 MVP 已包含：

- React + Vite + TypeScript 前端
- Express + TypeScript 后端
- Supabase 持久化数据
- OpenRouter / OpenAI / Gemini / Mock AI 提供商切换
- 微信支付 API v3 Native 扫码支付
- 付款后解锁完整报告
- 20 次 AI 追问额度

## 本地运行

前端：

```bash
npm install
npm run dev
```

后端：

```bash
cd server
npm install
npm run dev
```

本地地址：

```text
前端：http://127.0.0.1:5173
后端：http://localhost:3001/health
```

## 页面

- `/` 首页
- `/start` 未来方向选择
- `/steps` 渐进式偏好判断
- `/score` 分数与位次信息
- `/result` 免费初步分析
- `/pay` 微信扫码支付
- `/report` 完整报告
- `/chat/:chatSessionId` AI 追问
- `/disclaimer` 使用边界与免责声明

## 部署

部署说明见：

[DEPLOYMENT.md](./DEPLOYMENT.md)

推荐：

- 前端部署到 Vercel
- 后端部署到 Render
- 数据库继续使用 Supabase
- 微信支付回调使用后端 HTTPS 地址

## 安全提醒

- 不要提交 `.env`
- 不要提交 `server/certs/`
- 不要把 `SUPABASE_SERVICE_ROLE_KEY` 放到前端
- 不要把 AI API Key 放到前端
- 生产环境必须关闭 `ENABLE_DEV_PAYMENT`
- 上线前请更换曾经泄露过的密钥

