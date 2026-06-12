# 序航 AI 部署说明

这份说明用于把本机 MVP 部署到公网：

- 前端：Vercel
- 后端：Render
- 数据库：Supabase
- AI：OpenRouter
- 支付：微信支付 Native

## 0. 当前本机状态

本机已经跑通：

```text
填写画像 -> 免费报告 -> 微信扫码付款 -> 微信回调 -> 完整报告 -> AI追问
```

部署到公网时，只是把本机地址换成正式 HTTPS 地址。

## 1. 先部署后端 Render

进入 Render 后创建 Web Service，选择本项目仓库。

如果 Render 识别到 `render.yaml`，使用 Blueprint 部署即可。

如果手动填写：

```text
Root Directory: server
Build Command: npm ci && npm run build
Start Command: npm start
Health Check Path: /health
```

后端部署成功后，会得到一个地址，类似：

```text
https://gaokao-ai-api.onrender.com
```

后面简称为：

```text
BACKEND_URL
```

## 2. Render 后端环境变量

Render 后台进入：

```text
Web Service -> Environment
```

逐项添加下面这些变量。

### 基础变量

```dotenv
NODE_ENV=production
ENABLE_DEV_PAYMENT=false
PORT=10000
FRONTEND_ORIGIN=https://你的前端域名
ADMIN_API_KEY=至少32位随机字符串
USE_MOCK_DATABASE=false
USE_MOCK_AI=false
```

`FRONTEND_ORIGIN` 等 Vercel 前端部署后再回来改。

### Supabase

```dotenv
SUPABASE_URL=你的 Supabase Project URL
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service_role key
```

注意：这里必须是 `service_role`，不是 `anon public`。

### OpenRouter

```dotenv
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=你的 OpenRouter Key
OPENROUTER_MODEL=openrouter/free
```

上线后可以换更稳定模型。

### 微信支付

```dotenv
WECHAT_PAY_ENABLED=true
REPORT_PRICE_FEN=1990
WECHAT_PAY_APP_ID=你的 AppID
WECHAT_PAY_MCH_ID=你的商户号
WECHAT_PAY_MCH_SERIAL_NO=商户 API 证书序列号
WECHAT_PAY_API_V3_KEY=你的 32 字节 APIv3 密钥
WECHAT_PAY_NOTIFY_URL=https://你的后端域名/api/payments/wechat/notify
WECHAT_PAY_PLATFORM_SERIAL_NO=微信支付平台证书序列号
```

云端推荐使用 PEM 环境变量，不用上传证书文件：

```dotenv
WECHAT_PAY_PRIVATE_KEY_PEM=商户 apiclient_key.pem 的完整内容
WECHAT_PAY_PLATFORM_PUBLIC_KEY_PEM=微信支付平台证书 pem 的完整内容
```

本地开发才使用：

```dotenv
WECHAT_PAY_PRIVATE_KEY_PATH=./certs/apiclient_key.pem
WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH=./certs/wechatpay_platform_certificate.pem
```

## 3. 部署前端 Vercel

进入 Vercel 后导入同一个项目仓库。

如果手动填写：

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

前端环境变量：

```dotenv
VITE_API_BASE_URL=https://你的后端域名
```

部署成功后，会得到一个地址，类似：

```text
https://gaokao-ai.vercel.app
```

再回 Render，把：

```dotenv
FRONTEND_ORIGIN=https://gaokao-ai.vercel.app
```

改成真实前端地址。

## 4. 微信支付回调地址

Render 后端地址确定后，微信支付回调应为：

```text
https://你的后端域名/api/payments/wechat/notify
```

把这个值填入 Render 的：

```dotenv
WECHAT_PAY_NOTIFY_URL
```

## 5. 部署后验证

先打开：

```text
https://你的后端域名/health
```

应该看到：

```json
{
  "status": "ok",
  "database": "supabase",
  "payment": "wechat_native",
  "ai": "openrouter/free"
}
```

再打开前端：

```text
https://你的前端域名
```

完整走一遍：

```text
/score -> /result -> /pay -> /report -> /chat
```

## 6. 上线前必须改的两项

测试价如果还是 1 分钱，改成正式价：

```dotenv
REPORT_PRICE_FEN=1990
```

所有曾经发到聊天里的密钥，上线前建议重新生成并替换。

