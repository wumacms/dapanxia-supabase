/**
 * 蓝兔支付代理接口
 * 部署后访问地址: https://<project-ref>.supabase.co/functions/v1/wxpay-proxy
 * 
 * 此函数作为前端和蓝兔支付API之间的代理，解决CORS跨域问题
 * 前端调用此函数，函数再转发请求到蓝兔支付API
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// 蓝兔支付 API 基础URL
const LANTUZ_API_BASE = 'https://api.ltzf.cn/api'

// 允许的接口路径
const ALLOWED_ENDPOINTS = [
  '/wxpay/native',        // 创建扫码支付
  '/wxpay/get_pay_order',  // 查询订单状态
  '/wxpay/refund_order',  // 发起退款
  '/wxpay/get_refund_order', // 查询退款
  '/wxpay/get_wechat_openid', // 获取微信授权
]

// 允许的商户ID列表（用于安全校验）
const ALLOWED_MCH_IDS = (Deno.env.get('ALLOWED_MCH_IDS') || '').split(',').filter(Boolean)

serve(async (req) => {
  // 设置 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 只接受 POST 请求
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ code: -1, msg: '仅支持 POST 请求' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // 解析请求体
    const formData = await req.formData()
    const params: Record<string, string> = {}
    
    for (const [key, value] of formData.entries()) {
      params[key] = value as string
    }

    // 安全校验：检查商户ID
    if (params.mch_id && ALLOWED_MCH_IDS.length > 0) {
      if (!ALLOWED_MCH_IDS.includes(params.mch_id)) {
        console.error('未授权的商户ID:', params.mch_id)
        return new Response(
          JSON.stringify({ code: -1, msg: '未授权的商户' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 获取目标接口路径
    const action = params.action || ''
    const endpoint = `/wxpay/${action}`

    // 验证接口是否允许
    if (!ALLOWED_ENDPOINTS.includes(endpoint)) {
      console.error('未授权的操作:', action)
      return new Response(
        JSON.stringify({ code: -1, msg: '不支持的操作' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 构建目标URL
    const targetUrl = `${LANTUZ_API_BASE}${endpoint}`

    // 移除 action 参数，只保留支付API需要的参数
    const { action: _, ...apiParams } = params

    console.log('代理转发请求:', { targetUrl, params: apiParams })

    // 转发请求到蓝兔支付API
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(apiParams).toString()
    })

    // 获取响应
    const responseData = await response.json()

    console.log('蓝兔支付响应:', responseData)

    // 返回响应（添加CORS头）
    return new Response(
      JSON.stringify(responseData),
      { 
        status: response.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('代理请求失败:', error)
    
    return new Response(
      JSON.stringify({ code: -1, msg: error.message || '代理请求失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
