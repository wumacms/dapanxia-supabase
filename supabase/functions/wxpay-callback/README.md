# 蓝兔支付回调 Edge Function 部署指南

## 功能说明

此 Edge Function 用于接收蓝兔支付的回调通知，自动完成：
- 订单状态更新（pending → paid）
- 创建购买记录
- 保存资源链接到订单

## 部署步骤

### 方式一：使用 Supabase CLI

```bash
# 1. 安装 Supabase CLI（如果还没安装）
npm install -g supabase

# 2. 登录 Supabase
supabase login

# 3. 链接本地项目到 Supabase 项目
cd supabase-functions-demo
supabase link --project-ref <your-project-ref>

# 4. 部署 Edge Function
supabase functions deploy wxpay-callback

# 5. 设置环境变量（API 密钥）
supabase secrets set LANTUZ_API_KEY=<your-lantuz-api-key>

# 6. 获取回调地址
echo "回调地址: https://<project-ref>.supabase.co/functions/v1/wxpay-callback"
```

### 方式二：使用 Supabase Dashboard

1. 进入 Supabase Dashboard → SQL Editor
2. 执行 `supabase/functions/wxpay-callback/index.ts` 中的代码
3. 在 Settings → Edge Functions 中设置环境变量 `LANTUZ_API_KEY`

## 获取回调地址

部署成功后，回调地址为：
```
https://<project-ref>.supabase.co/functions/v1/wxpay-callback
```

将这个地址填入蓝兔支付后台的回调地址设置中。

## 环境变量

需要在 Supabase 中设置以下环境变量：

| 变量名 | 说明 | 来源 |
|--------|------|------|
| LANTUZ_API_KEY | 蓝兔支付 API 密钥 | 蓝兔支付后台获取 |

> 注意：不需要设置 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`，这些会自动可用。

## 测试回调

部署后，可以使用以下命令测试（需要先获取访问令牌）：

```bash
# 生成测试回调请求
curl -X POST https://<project-ref>.supabase.co/functions/v1/wxpay-callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "trade_state=SUCCESS&out_trade_no=ORD1234567890&transaction_id=WX123456&time_end=20240101120000&attach={}&sign=xxx"
```

## 注意事项

1. Edge Function 使用服务角色密钥，可以绕过 RLS 策略
2. 确保 `orders` 表有 `resource_url` 列
3. 确保 `user_purchases` 表存在
4. `increment_purchase_count` 函数如果不存在可以忽略，不会影响核心功能
