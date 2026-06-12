# 高考志愿未来方向 AI 分析后端

独立的 Express + TypeScript 后端，提供用户画像、免费/完整报告、订单权限、AI 追问、聊天记录和次数限制。

## 1. 安装与运行

```bash
cd server
npm install
cp .env.example .env
npm start
```

开发模式：

```bash
npm run dev
```

默认地址：

```text
http://localhost:3001
```

健康检查：

```bash
curl -fsS http://localhost:3001/health
```

默认配置使用内存数据库和 Mock AI，不需要 Supabase 或 OpenAI Key，可以立即测试完整流程。服务重启后内存数据会清空。

## 2. 环境变量

`server/.env`：

```dotenv
PORT=3001
NODE_ENV=development
ADMIN_API_KEY=
ENABLE_DEV_PAYMENT=true
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
AI_PROVIDER=mock
FRONTEND_ORIGIN=http://localhost:5173
USE_MOCK_DATABASE=true
USE_MOCK_AI=true
```

切换真实服务：

```dotenv
USE_MOCK_DATABASE=false
USE_MOCK_AI=false
```

AI 提供商通过 `AI_PROVIDER` 切换：

```dotenv
AI_PROVIDER=mock
AI_PROVIDER=openrouter
AI_PROVIDER=gemini
AI_PROVIDER=openai
```

免费原型测试推荐：

```dotenv
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=openrouter/free
AI_PROVIDER=openrouter
USE_MOCK_AI=false
```

`openrouter/free` 会自动选择当前可用的免费模型。模型和响应速度可能变化，适合开发测试与低流量原型，不建议直接作为稳定生产 SLA。

## 微信支付 Native 扫码支付

支付系统支持两种模式：

- `WECHAT_PAY_ENABLED=false`：本地开发付款，方便继续测试产品。
- `WECHAT_PAY_ENABLED=true`：微信支付 API v3 Native 扫码支付。

真实支付需要在 `server/.env` 配置：

```dotenv
WECHAT_PAY_ENABLED=true
WECHAT_PAY_APP_ID=与商户号绑定的AppID
WECHAT_PAY_MCH_ID=微信支付商户号
WECHAT_PAY_MCH_SERIAL_NO=商户API证书序列号
WECHAT_PAY_PRIVATE_KEY_PATH=./certs/apiclient_key.pem
WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH=./certs/wechatpay_platform_public_key.pem
WECHAT_PAY_PLATFORM_SERIAL_NO=微信支付平台公钥ID或平台证书序列号
WECHAT_PAY_API_V3_KEY=32字节APIv3密钥
WECHAT_PAY_NOTIFY_URL=https://你的后端域名/api/payments/wechat/notify
```

证书文件放在 `server/certs/`。该目录已被 Git 忽略，不得提交商户私钥。

支付流程：

1. 前端创建订单，后端向微信 Native 下单。
2. 前端把微信返回的 `code_url` 生成二维码。
3. 微信异步通知后端 HTTPS 回调地址。
4. 后端验证微信签名并解密通知。
5. 后端核对 AppID、商户号、订单号、金额和币种。
6. 订单幂等更新为 `paid`，自动创建 20 次追问额度。
7. 前端轮询订单状态，付款成功后自动生成完整报告。

本地 `localhost` 无法直接接收微信回调。真实付款测试前，需要先部署后端或使用具备固定 HTTPS 域名的安全隧道。

安全要求：

- `OPENAI_API_KEY` 只能保存在后端 `.env`。
- `SUPABASE_SERVICE_ROLE_KEY` 只能保存在后端 `.env`。
- 不要把这两个变量添加到任何 `VITE_*` 环境变量。
- `server/.env` 已加入 `.gitignore`。
- `ADMIN_API_KEY` 只允许保存在后端，生产环境至少 32 个字符。
- 生产环境必须设置 `NODE_ENV=production` 和 `ENABLE_DEV_PAYMENT=false`。
- 所有 `/api/admin/*` 接口都要求 `Authorization: Bearer <ADMIN_API_KEY>`。

## 3. 配置 Supabase

1. 创建 Supabase 项目。
2. 打开 Supabase SQL Editor。
3. 执行 [supabase/schema.sql](./supabase/schema.sql) 的完整内容。
4. 在 Supabase 项目设置中取得 Project URL 和 service role key。
5. 写入 `server/.env`，然后设置 `USE_MOCK_DATABASE=false`。

SQL 会创建：

- `user_profiles`
- `reports`
- `orders`
- `admission_data`
- `admin_logs`
- `chat_sessions`
- `chat_messages`
- `usage_limits`
- 原子次数消费函数 `consume_chat_message`
- 查询索引、状态约束、更新时间触发器和 RLS

浏览器端不直接访问这些表。后端使用 service role 操作数据库。

## 4. 配置 OpenAI

将 API Key 和模型写入 `server/.env`：

```dotenv
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4.1-mini
USE_MOCK_AI=false
```

报告调用统一位于 `src/services/aiService.ts`，使用 OpenAI Responses API 和 Zod Structured Outputs。路由层不直接调用模型。

Prompt 位于：

- `src/prompts/gaokaoDecisionSkill.ts`
- `src/prompts/freeReportPrompt.ts`
- `src/prompts/fullReportPrompt.ts`
- `src/prompts/chatPrompt.ts`

## 5. API 测试顺序

以下示例使用 `jq` 保存返回的 UUID；也可以手动复制。

### 创建用户画像

```bash
PROFILE_ID=$(curl -fsS -X POST http://localhost:3001/api/profiles \
  -H 'Content-Type: application/json' \
  -d '{
    "careerDirection":"稳定体制内",
    "priority":"稳定就业",
    "longTermStudy":"可以接受",
    "cityPreference":"希望留在本省",
    "riskPreference":"稳妥优先",
    "province":"广东",
    "subjectType":"物理+化学+生物",
    "score":"580",
    "rank":"32000"
  }' | jq -r '.profileId')
```

### 生成免费报告

```bash
REPORT_ID=$(curl -fsS -X POST http://localhost:3001/api/reports/free \
  -H 'Content-Type: application/json' \
  -d "{\"profileId\":\"$PROFILE_ID\"}" | jq -r '.reportId')
```

### 创建订单

```bash
ORDER_ID=$(curl -fsS -X POST http://localhost:3001/api/orders \
  -H 'Content-Type: application/json' \
  -d "{\"profileId\":\"$PROFILE_ID\",\"reportId\":\"$REPORT_ID\",\"amount\":1990}" \
  | jq -r '.orderId')
```

### 验证未付款完整报告返回 403

```bash
curl -i -X POST http://localhost:3001/api/reports/full \
  -H 'Content-Type: application/json' \
  -d "{\"reportId\":\"$REPORT_ID\"}"
```

### 验证未付款聊天返回 403

```bash
curl -i -X POST http://localhost:3001/api/chat/session \
  -H 'Content-Type: application/json' \
  -d "{\"reportId\":\"$REPORT_ID\"}"
```

### 开发阶段手动标记付款

```bash
curl -fsS -X POST \
  "http://localhost:3001/api/dev/orders/$ORDER_ID/mark-paid"
```

该接口会：

- 将订单更新为 `paid`
- 写入 `paid_at`
- 写入 `admin_logs`
- 创建默认 20 次聊天额度

该开发接口仅在非生产环境且 `ENABLE_DEV_PAYMENT=true` 时存在，并限制本地前端来源。
生产环境付款状态只能由支付平台回调或已鉴权的管理员接口修改。

### 生成完整报告

```bash
curl -fsS -X POST http://localhost:3001/api/reports/full \
  -H 'Content-Type: application/json' \
  -d "{\"reportId\":\"$REPORT_ID\"}"
```

### 获取报告

```bash
curl -fsS "http://localhost:3001/api/reports/$REPORT_ID"
```

未付款时 `locked=true` 且 `fullReport=null`；付款后才能返回完整报告。

### 创建聊天会话

```bash
CHAT_SESSION_ID=$(curl -fsS -X POST http://localhost:3001/api/chat/session \
  -H 'Content-Type: application/json' \
  -d "{\"reportId\":\"$REPORT_ID\"}" | jq -r '.chatSessionId')
```

### 发送聊天消息

```bash
curl -fsS -X POST http://localhost:3001/api/chat/message \
  -H 'Content-Type: application/json' \
  -d "{
    \"chatSessionId\":\"$CHAT_SESSION_ID\",
    \"message\":\"我这个分数更适合选会计还是法学？\"
  }"
```

只统计用户问题。AI 回复不占额度。

### 获取聊天历史

```bash
curl -fsS \
  "http://localhost:3001/api/chat/session/$CHAT_SESSION_ID/messages"
```

### 根据报告获取聊天会话

```bash
curl -fsS "http://localhost:3001/api/chat/by-report/$REPORT_ID"
```

### 查看管理员列表

```bash
curl -fsS http://localhost:3001/api/admin/orders \
  -H "Authorization: Bearer $ADMIN_API_KEY"

curl -fsS http://localhost:3001/api/admin/reports \
  -H "Authorization: Bearer $ADMIN_API_KEY"

管理员手动确认付款：

```bash
curl -fsS -X POST \
  "http://localhost:3001/api/admin/orders/$ORDER_ID/mark-paid" \
  -H "Authorization: Bearer $ADMIN_API_KEY"
```
```

## 6. 自动化 Smoke Test

保持后端运行，然后执行：

```bash
npm run smoke
```

脚本会验证：

- 未付款用户无法生成完整报告
- 未付款用户无法创建聊天会话
- 付款后可以生成完整报告
- 付款订单获得 20 次提问额度
- 第 20 次问题正常回答
- 第 21 次问题返回 403
- 20 组用户/AI 消息被保存

## 7. 与前端联调

前端环境变量：

```dotenv
VITE_API_BASE_URL=http://localhost:3001
```

本阶段按需求优先完成 `server/`，尚未替换前端 Mock 流程。下一阶段修改前端 `src/lib/ai.ts`，将其连接到以下接口：

- `POST /api/profiles`
- `POST /api/reports/free`
- `POST /api/orders`
- `POST /api/reports/full`
- `GET /api/reports/:id`
- `POST /api/chat/session`
- `POST /api/chat/message`
- `GET /api/chat/session/:id/messages`
- `GET /api/chat/by-report/:reportId`

后端 CORS 默认允许 `http://localhost:5173`。

## 8. 正式支付接入

目前订单使用 `manual` 支付方式和开发用 `mark-paid` 接口。

正式支付建议：

1. 后端创建支付平台订单。
2. 保存支付平台交易号。
3. 通过支付平台服务端回调确认签名。
4. 只有回调验签成功后更新 `orders.status=paid`。
5. 创建 `usage_limits`。
6. 禁止前端直接把订单标记为已支付。
7. 为管理员接口增加登录、权限和审计。

## 9. 合规处理

报告和聊天回复保存前都会经过 `complianceService` 递归清洗。系统不会承诺录取结果，并提示用户结合考试院、招生章程、当年计划和一分一段表判断。
