# 在 Supabase Dashboard 中自定义邮件模板

创建一个专业的中文邮件模板，包含：
1. 确认注册的模板
2. 重置密码的模板（可能也需要）

## 可用的模板变量

| 变量 | 说明 |
|------|------|
| `{{ .ConfirmationURL }}` | 完整的确认链接 |
| `{{ .Token }}` | 6位数字验证码 |
| `{{ .TokenHash }}` | Token 哈希值（用于自定义链接） |
| `{{ .SiteURL }}` | 网站 URL（在项目设置中配置） |
| `{{ .Email }}` | 用户邮箱 |
| `{{ .NewEmail }}` | 新邮箱地址（仅适用于邮箱更改模板） |
| `{{ .OldEmail }}` | 旧邮箱地址（仅适用于邮箱更改通知模板） |

## 模板一：确认注册 (Confirm signup)

复制以下代码到 Supabase Dashboard → **Authentication** → **Email Templates** → **Confirm signup**：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>邮箱验证</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif; background-color: #f5f5f5;">
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 40px 40px 20px 40px;">
        <h2 style="margin: 0 0 30px 0; font-size: 22px; font-weight: 600; color: #333333; text-align: center;">
          {{ .SiteURL }}
        </h2>
        
        <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 500; color: #333333; text-align: center;">
          验证您的邮箱地址
        </h2>
        
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #666666; line-height: 1.6;">
          尊敬的用户，您好！
        </p>
        
        <p style="margin: 0 0 30px 0; font-size: 16px; color: #666666; line-height: 1.6;">
          感谢您注册，请点击下方按钮验证您的邮箱地址，以完成账户激活。
        </p>
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align: center; padding: 30px 0;">
              <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 14px 40px; font-size: 16px; font-weight: 500; color: #ffffff; background-color: #4CAF50; border-radius: 6px; text-decoration: none;">
                验证邮箱
              </a>
            </td>
          </tr>
        </table>
        
        <p style="margin: 20px 0; font-size: 14px; color: #999999; line-height: 1.6;">
          如果按钮无法点击，请复制以下链接到浏览器地址栏打开：
        </p>
        <p style="margin: 0 0 30px 0; font-size: 13px; color: #4CAF50; word-break: break-all;">
          <a href="{{ .ConfirmationURL }}" style="color: #4CAF50; text-decoration: none;">{{ .ConfirmationURL }}</a>
        </p>
        
        <div style="background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 16px 20px; margin: 20px 0; border-radius: 0 4px 4px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 500; color: #333333;">
            安全提示
          </p>
          <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.6;">
            此链接仅对本次注册有效，请在 24 小时内完成验证。如果您并未注册我们的服务，请忽略此邮件。
          </p>
        </div>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #eeeeee; border-radius: 0 0 8px 8px;">
        <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
          此邮件由系统自动发送，请勿回复。
        </p>
      </td>
    </tr>
  </table>

</body>
</html>
```

---

## 模板二：重置密码 (Reset password)

复制以下代码到 **Reset password** 模板：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>重置密码</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif; background-color: #f5f5f5;">
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 40px 40px 20px 40px;">
        <h2 style="margin: 0 0 30px 0; font-size: 22px; font-weight: 600; color: #333333; text-align: center;">
          {{ .SiteURL }}
        </h2>
        
        <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 500; color: #333333; text-align: center;">
          重置您的密码
        </h2>
        
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #666666; line-height: 1.6;">
          尊敬的用户，您好！
        </p>
        
        <p style="margin: 0 0 30px 0; font-size: 16px; color: #666666; line-height: 1.6;">
          我们收到了您的密码重置请求，请点击下方按钮设置新密码。
        </p>
        
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align: center; padding: 30px 0;">
              <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 14px 40px; font-size: 16px; font-weight: 500; color: #ffffff; background-color: #FF9800; border-radius: 6px; text-decoration: none;">
                重置密码
              </a>
            </td>
          </tr>
        </table>
        
        <p style="margin: 20px 0; font-size: 14px; color: #999999; line-height: 1.6;">
          如果按钮无法点击，请复制以下链接到浏览器地址栏打开：
        </p>
        <p style="margin: 0 0 30px 0; font-size: 13px; color: #FF9800; word-break: break-all;">
          <a href="{{ .ConfirmationURL }}" style="color: #FF9800; text-decoration: none;">{{ .ConfirmationURL }}</a>
        </p>
        
        <div style="background-color: #fff3e0; border-left: 4px solid #FF9800; padding: 16px 20px; margin: 20px 0; border-radius: 0 4px 4px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 500; color: #333333;">
            安全提示
          </p>
          <p style="margin: 0; font-size: 13px; color: #666666; line-height: 1.6;">
            此链接仅在 60 分钟内有效。如果您并未申请重置密码，请忽略此邮件，您的账户安全不会受到影响。
          </p>
        </div>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #eeeeee; border-radius: 0 0 8px 8px;">
        <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
          此邮件由系统自动发送，请勿回复。
        </p>
      </td>
    </tr>
  </table>

</body>
</html>
```

---

## 使用步骤

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入项目 → **Authentication** → **Email Templates**
3. 点击 **Confirm signup** 模板 → 粘贴第一个模板代码
4. 点击 **Reset password** 模板 → 粘贴第二个模板代码
5. 点击保存

## 注意事项

1. **Site URL 配置**：确保已在 **Authentication** → **URL Configuration** 中正确配置 Site URL
2. **使用 HTTPS**：Site URL 必须是 HTTPS 地址
3. **自定义 SMTP**：如果使用了第三方 SMTP 服务（如 Resend、SendGrid），邮件模板的修改不会生效，需要在第三方服务中配置模板
4. **测试建议**：使用一个全新的邮箱地址进行测试，避免缓存问题
