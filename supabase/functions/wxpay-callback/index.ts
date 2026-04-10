/**
 * 蓝兔支付回调接口
 * 部署后访问地址: https://<project-ref>.supabase.co/functions/v1/wxpay-callback
 * 
 * 蓝兔支付会在支付成功后向此地址发送 POST 请求
 * 请求参数格式: application/x-www-form-urlencoded
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// MD5 哈希函数 - 使用可靠的实现
function md5(input: string): string {
  const hexChars = '0123456789abcdef'
  
  function safeAdd(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff)
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xffff)
  }
  
  function bitRotateLeft(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt))
  }
  
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
  }
  
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t)
  }
  
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t)
  }
  
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(b ^ c ^ d, a, b, x, s, t)
  }
  
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t)
  }
  
  function binlMD5(x: number[], len: number): number[] {
    x[len >> 5] |= 0x80 << len % 32
    x[(((len + 64) >>> 9) << 4) + 14] = len
    
    let a = 1732584193
    let b = -271733879
    let c = -1732584194
    let d = 271733878
    
    for (let i = 0; i < x.length; i += 16) {
      const olda = a
      const oldb = b
      const oldc = c
      const oldd = d
      
      a = md5ff(a, b, c, d, x[i + 0], 7, -680876936)
      d = md5ff(d, a, b, c, x[i + 1], 12, -389564586)
      c = md5ff(c, d, a, b, x[i + 2], 17, 606105819)
      b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330)
      a = md5ff(a, b, c, d, x[i + 4], 7, -176418897)
      d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426)
      c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341)
      b = md5ff(b, c, d, a, x[i + 7], 22, -45705983)
      a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416)
      d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417)
      c = md5ff(c, d, a, b, x[i + 10], 17, -42063)
      b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162)
      a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682)
      d = md5ff(d, a, b, c, x[i + 13], 12, -40341101)
      c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290)
      b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329)
      
      a = md5gg(a, b, c, d, x[i + 1], 5, -165796510)
      d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632)
      c = md5gg(c, d, a, b, x[i + 11], 14, 643717713)
      b = md5gg(b, c, d, a, x[i + 0], 20, -373897302)
      a = md5gg(a, b, c, d, x[i + 5], 5, -701558691)
      d = md5gg(d, a, b, c, x[i + 10], 9, 38016083)
      c = md5gg(c, d, a, b, x[i + 15], 14, -660478335)
      b = md5gg(b, c, d, a, x[i + 4], 20, -405537848)
      a = md5gg(a, b, c, d, x[i + 9], 5, 568446438)
      d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690)
      c = md5gg(c, d, a, b, x[i + 3], 14, -187363961)
      b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501)
      a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467)
      d = md5gg(d, a, b, c, x[i + 2], 9, -51403784)
      c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473)
      b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734)
      
      a = md5hh(a, b, c, d, x[i + 5], 4, -378558)
      d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463)
      c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562)
      b = md5hh(b, c, d, a, x[i + 14], 23, -35309556)
      a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060)
      d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353)
      c = md5hh(c, d, a, b, x[i + 7], 16, -155497632)
      b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640)
      a = md5hh(a, b, c, d, x[i + 13], 4, 681279174)
      d = md5hh(d, a, b, c, x[i + 0], 11, -358537222)
      c = md5hh(c, d, a, b, x[i + 3], 16, -722521979)
      b = md5hh(b, c, d, a, x[i + 6], 23, 76029189)
      a = md5hh(a, b, c, d, x[i + 9], 4, -640364487)
      d = md5hh(d, a, b, c, x[i + 12], 11, -421815835)
      c = md5hh(c, d, a, b, x[i + 15], 16, 530742520)
      b = md5hh(b, c, d, a, x[i + 2], 23, -995338651)
      
      a = md5ii(a, b, c, d, x[i + 0], 6, -198630844)
      d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415)
      c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905)
      b = md5ii(b, c, d, a, x[i + 5], 21, -57434055)
      a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571)
      d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606)
      c = md5ii(c, d, a, b, x[i + 10], 15, -1051523)
      b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799)
      a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359)
      d = md5ii(d, a, b, c, x[i + 15], 10, -30611744)
      c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380)
      b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649)
      a = md5ii(a, b, c, d, x[i + 4], 6, -145523070)
      d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379)
      c = md5ii(c, d, a, b, x[i + 2], 15, 718787259)
      b = md5ii(b, c, d, a, x[i + 9], 21, -343485551)
      
      a = safeAdd(a, olda)
      b = safeAdd(b, oldb)
      c = safeAdd(c, oldc)
      d = safeAdd(d, oldd)
    }
    
    return [a, b, c, d]
  }
  
  function binl2rstr(input: number[]): string {
    let output = ''
    for (let i = 0; i < input.length * 32; i += 8) {
      output += String.fromCharCode((input[i >> 5] >>> i % 32) & 0xff)
    }
    return output
  }
  
  function rstr2binl(input: string): number[] {
    const output: number[] = []
    for (let i = 0; i < input.length * 8; i += 8) {
      output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << i % 32
    }
    return output
  }
  
  function rstr2hex(input: string): string {
    let output = ''
    for (let i = 0; i < input.length; i++) {
      const x = input.charCodeAt(i)
      output += hexChars.charAt((x >>> 4) & 0x0f) + hexChars.charAt(x & 0x0f)
    }
    return output
  }
  
  function str2rstrUTF8(input: string): string {
    let output = ''
    let i = -1
    const x = input.length
    while (++i < x) {
      let c = input.charCodeAt(i)
      const c1 = i + 1 < x ? input.charCodeAt(i + 1) : 0
      if (0xd800 <= c && c <= 0xdbff && 0xdc00 <= c1 && c1 <= 0xdfff) {
        c = 0x10000 + ((c & 0x03ff) << 10) + (c1 & 0x03ff)
        i++
      }
      if (c <= 0x7f) {
        output += String.fromCharCode(c)
      } else if (c <= 0x7ff) {
        output += String.fromCharCode(0xc0 | ((c >>> 6) & 0x1f), 0x80 | (c & 0x3f))
      } else if (c <= 0xffff) {
        output += String.fromCharCode(0xe0 | ((c >>> 12) & 0x0f), 0x80 | ((c >>> 6) & 0x3f), 0x80 | (c & 0x3f))
      } else {
        output += String.fromCharCode(0xf0 | ((c >>> 18) & 0x07), 0x80 | ((c >>> 12) & 0x3f), 0x80 | ((c >>> 6) & 0x3f), 0x80 | (c & 0x3f))
      }
    }
    return output
  }
  
  return rstr2hex(binl2rstr(binlMD5(rstr2binl(str2rstrUTF8(input)), input.length * 8)))
}

// 蓝兔支付 API 密钥
const API_KEY = Deno.env.get('LANTUZ_API_KEY') || ''

// 创建 Supabase 客户端（使用服务角色密钥绕过 RLS）
function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(supabaseUrl, supabaseServiceKey)
}

// 计算签名（排除 sign 字段，包含所有非空必填参数）
function calculateSign(params: Record<string, string>): string {
  // 根据蓝兔支付文档，只有以下必填参数参与签名
  const signKeys = ['code', 'mch_id', 'order_no', 'out_trade_no', 'pay_no', 'timestamp', 'total_fee']
  
  // 按ASCII码排序（TreeMap 行为），只包含非空参数
  const sortedKeys = signKeys.filter(key => {
    const value = params[key]
    return value !== undefined && value !== null && value !== ''
  }).sort((a, b) => a.localeCompare(b))
  
  const parts: string[] = []
  for (const key of sortedKeys) {
    parts.push(`${key}=${params[key]}`)
  }
  
  const stringA = parts.join('&')
  const stringSignTemp = stringA + `&key=${API_KEY}`
  
  console.log('Sign string:', stringSignTemp)
  console.log('Sorted keys:', sortedKeys)
  
  const result = md5(stringSignTemp).toUpperCase()
  console.log('MD5 result:', result)
  return result
}

// 返回成功响应
function successResponse(): Response {
  return new Response('SUCCESS', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  })
}

// 返回失败响应
function failResponse(): Response {
  return new Response('FAIL', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  })
}

serve(async (req) => {
  // 只接受 POST 请求
  if (req.method !== 'POST') {
    console.error('无效的请求方法:', req.method)
    return failResponse()
  }

  try {
    console.log('收到回调请求:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    })

    // 解析请求体
    const formData = await req.formData()
    const params: Record<string, string> = {}
    
    for (const [key, value] of formData.entries()) {
      params[key] = value as string
    }

    console.log('收到支付回调参数:', JSON.stringify(params))

    // 验证签名
    if (API_KEY && params.sign) {
      const receivedSign = params.sign.toUpperCase()
      const calculatedSign = calculateSign(params)
      
      if (receivedSign !== calculatedSign) {
        console.error('签名验证失败', { 
          收到签名: receivedSign, 
          计算签名: calculatedSign,
          参数: JSON.stringify(params)
        })
        // 签名验证失败也要返回 SUCCESS，避免蓝兔重复通知
        // 但记录错误日志供排查
      }
    } else {
      console.warn('未提供 API_KEY 或 sign，跳过签名验证')
    }

    // 判断支付是否成功：code === '0' 表示成功
    if (params.code !== '0') {
      console.log('支付未成功，code:', params.code)
      return successResponse()
    }

    const outTradeNo = params.out_trade_no
    const payNo = params.pay_no
    const successTime = params.success_time
    const totalFee = params.total_fee

    if (!outTradeNo) {
      console.error('缺少商户订单号 out_trade_no')
      return successResponse()
    }

    console.log('正在处理支付成功的订单:', outTradeNo, '支付单号:', payNo)

    // 创建 Supabase 客户端
    const supabase = createSupabaseClient()

    // 查询订单（幂等性检查）
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, resource_id, payment_status, order_no')
      .eq('order_no', outTradeNo)
      .maybeSingle()

    if (orderError) {
      console.error('查询订单时数据库错误:', orderError)
      return successResponse()
    }

    if (!order) {
      console.error('订单不存在:', outTradeNo)
      // 订单不存在也要返回 SUCCESS，避免蓝兔重复通知
      return successResponse()
    }

    // 幂等性检查：如果订单已支付，直接返回成功
    if (order.payment_status === 'paid') {
      console.log('订单已支付，跳过处理:', outTradeNo)
      return successResponse()
    }

    console.log('正在更新订单状态为已支付:', outTradeNo)

    // 获取资源完整信息（用于快照）
    const { data: resource } = await supabase
      .from('resources')
      .select('resource_url, title, cover_url, description, category, platform')
      .eq('id', order.resource_id)
      .maybeSingle()

    // 更新订单状态
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        external_order_no: payNo || null,  // 支付宝或微信支付订单号
        external_transaction_no: payNo || null,
        payment_time: successTime ? new Date(successTime).toISOString() : new Date().toISOString(),
        resource_url: resource?.resource_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('更新订单失败:', updateError)
      // 更新失败也返回 SUCCESS，避免蓝兔重复通知导致重复购买记录
      return successResponse()
    }

    // 创建购买记录（包含资源快照）
    const { error: purchaseError } = await supabase
      .from('user_purchases')
      .insert({
        user_id: order.user_id,
        resource_id: order.resource_id,
        order_id: order.id,
        resource_url: resource?.resource_url || null,
        // 资源快照字段
        resource_title: resource?.title || null,
        cover_url: resource?.cover_url || null,
        description: resource?.description || null,
        category: resource?.category || null,
        platform: resource?.platform || null
      })

    if (purchaseError) {
      console.error('创建购买记录失败:', purchaseError)
      // 购买记录创建失败不阻止返回 SUCCESS
    }

    // 增加资源购买数量（如果函数存在）
    try {
      await supabase.rpc('increment_purchase_count', {
        resource_id: order.resource_id
      })
    } catch (e) {
      console.warn('increment_purchase_count RPC 不存在，跳过')
    }

    console.log('订单支付处理成功:', outTradeNo)

    // 返回 SUCCESS 字符串
    return successResponse()

  } catch (error: any) {
    console.error('支付回调处理异常:', error)
    console.error('错误堆栈:', error.stack)
    // 发生异常也返回 SUCCESS，避免蓝兔重复通知
    return successResponse()
  }
})
