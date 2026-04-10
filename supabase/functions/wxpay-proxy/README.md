# 蓝兔支付代理 Edge Function 部署指南

## 解决的问题

当网站部署到生产环境（如 `https://net10010.cn`）后，前端直接调用第三方支付API（如 `https://api.ltzf.cn`）会触发浏览器的 CORS 跨域限制，导致支付失败。

本 Edge Function 作为代理，前端调用同源的 Supabase Edge Function，函数再转发请求到第三方支付API，完全避免 CORS 问题。

## 部署步骤

### 1. 登录 Supabase CLI

```bash
supabase login
```

### 2. 关联项目

```bash
cd supabase
supabase link --project-ref <your-project-ref>
```

### 3. 部署 Edge Function

```bash
supabase functions deploy wxpay-proxy
```

### 4. 设置环境变量（可选，推荐）

为安全起见，建议设置允许的商户ID：

```bash
supabase secrets set ALLOWED_MCH_IDS=你的商户ID1,你的商户ID2
```

### 5. 验证部署

部署成功后，Edge Function 访问地址为：
```
https://<project-ref>.supabase.co/functions/v1/wxpay-proxy
```

## 前端配置

前端需要设置 `VITE_SUPABASE_URL` 环境变量：

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
```

构建时前端会自动使用 Edge Function 代理：
- 开发环境：使用 Vite 代理（`/api/wxpay`）
- 生产环境：使用 Supabase Edge Function 代理

## 测试

1. 部署后访问支付页面
2. 打开浏览器开发者工具 → Network 面板
3. 发起支付，观察请求是否发送到 `wxpay-proxy` 而不是 `api.ltzf.cn`

## 代理支持的接口

| 接口 | action 参数 | 说明 |
|------|-------------|------|
| 创建扫码支付 | `native` | 生成支付二维码 |
| 查询订单状态 | `get_pay_order` | 轮询支付结果 |
| 发起退款 | `refund_order` | 申请退款 |
| 查询退款结果 | `get_refund_order` | 查询退款状态 |
| 获取微信授权 | `get_wechat_openid` | 微信OAuth |

## 注意事项

1. **回调地址不变**：支付回调仍然发送到原来的 `VITE_LANTUZ_NOTIFY_URL`
2. **密钥安全**：前端只需要商户ID，不需要API密钥（密钥已在Edge Function环境变量中）
3. **CORS头**：Edge Function 已配置 `Access-Control-Allow-Origin: *`
