import CryptoJS from 'crypto-js'
import type { PaymentCallbackData, Order, LantuzPayConfig } from '../types/resources'

export class LantuzPayService {
  private config: LantuzPayConfig

  constructor(config: LantuzPayConfig) {
    this.config = config
  }

  /**
   * 生成签名
   */
  private generateSign(params: Record<string, any>): string {
    // 移除sign字段（如果存在）
    const { sign, ...signParams } = params

    // 按ASCII码从小到大排序
    const sortedKeys = Object.keys(signParams).sort()

    // 拼接字符串
    const stringA = sortedKeys
      .filter(key => signParams[key] !== undefined && signParams[key] !== null && signParams[key] !== '')
      .map(key => `${key}=${signParams[key]}`)
      .join('&')

    // 拼接API密钥
    const stringSignTemp = stringA + `&key=${this.config.api_key}`

    // MD5加密并转为大写
    return CryptoJS.MD5(stringSignTemp).toString().toUpperCase()
  }

  /**
   * 验证签名
   */
  verifySign(params: Record<string, any>): boolean {
    const { sign, ...signParams } = params
    const calculatedSign = this.generateSign(signParams)
    return calculatedSign === sign
  }

  /**
   * 创建扫码支付订单
   */
  async createNativePayment(order: Order): Promise<{
    qr_code_url: string
    code_url: string
  }> {
    const {
      order_no,
      amount,
      attach
    } = order

    // 构建请求参数
    const params: Record<string, string> = {
      mch_id: this.config.mch_id,
      out_trade_no: order_no,
      total_fee: amount.toFixed(2),
      body: '网盘资源购买',
      timestamp: Math.floor(Date.now() / 1000).toString(),
      notify_url: this.config.notify_url,
      attach: attach || '',
      time_expire: '30m' // 30分钟过期
    }

    // 生成签名
    const sign = this.generateSign(params)
    params.sign = sign

    try {
      const response = await fetch(`${this.config.api_url}/wxpay/native`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString()
      })

      const result = await response.json()

      if (result.code !== 0) {
        throw new Error(result.msg || '创建支付订单失败')
      }

      return {
        qr_code_url: result.data.QRcode_url,
        code_url: result.data.code_url
      }
    } catch (error: any) {
      console.error('Error creating native payment:', error)
      throw new Error(error.message || '创建支付订单失败')
    }
  }

  /**
   * 查询订单状态
   */
  async queryOrder(outTradeNo: string): Promise<{
    pay_status: 0 | 1  // 0-未支付，1-已支付
    pay_no?: string    // 支付订单号
    success_time?: string // 支付成功时间
    openid?: string    // 支付者openid
  }> {
    const params: Record<string, string> = {
      mch_id: this.config.mch_id,
      out_trade_no: outTradeNo,
      timestamp: Math.floor(Date.now() / 1000).toString()
    }

    // 生成签名
    const sign = this.generateSign(params)
    params.sign = sign

    try {
      const response = await fetch(`${this.config.api_url}/wxpay/get_pay_order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString()
      })

      const result = await response.json()

      if (result.code !== 0) {
        throw new Error(result.msg || '查询订单失败')
      }

      return {
        pay_status: result.data.pay_status,
        pay_no: result.data.pay_no,
        success_time: result.data.success_time,
        openid: result.data.openid
      }
    } catch (error: any) {
      console.error('Error querying order:', error)
      throw new Error(error.message || '查询订单失败')
    }
  }

  /**
   * 处理支付回调
   */
  handlePaymentCallback(data: PaymentCallbackData): {
    success: boolean
    orderId?: string
    userId?: string
    resourceId?: string
    message?: string
  } {
    try {
      // 验证签名
      if (!this.verifySign(data)) {
        return {
          success: false,
          message: '签名验证失败'
        }
      }

      // 验证支付结果
      if (data.code !== 0) {
        return {
          success: false,
          message: `支付失败: ${data.code}`
        }
      }

      // 解析附加数据
      let attachData: any = {}
      if (data.attach) {
        try {
          attachData = JSON.parse(data.attach)
        } catch (error) {
          console.error('Error parsing attach data:', error)
        }
      }

      return {
        success: true,
        orderId: data.out_trade_no,
        userId: attachData.user_id,
        resourceId: attachData.resource_id,
        message: '支付成功'
      }
    } catch (error: any) {
      console.error('Error handling payment callback:', error)
      return {
        success: false,
        message: error.message || '处理支付回调失败'
      }
    }
  }

  /**
   * 发起退款
   */
  async refundOrder(
    outTradeNo: string,
    outRefundNo: string,
    refundFee: number,
    refundDesc?: string
  ): Promise<{
    order_no: string
    out_refund_no: string
    pay_refund_no: string
  }> {
    const params: Record<string, string> = {
      mch_id: this.config.mch_id,
      out_trade_no: outTradeNo,
      out_refund_no: outRefundNo,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      refund_fee: refundFee.toFixed(2),
      refund_desc: refundDesc || '',
      notify_url: this.config.notify_url.replace('pay', 'refund')
    }

    // 生成签名
    const sign = this.generateSign(params)
    params.sign = sign

    try {
      const response = await fetch(`${this.config.api_url}/wxpay/refund_order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString()
      })

      const result = await response.json()

      if (result.code !== 0) {
        throw new Error(result.msg || '发起退款失败')
      }

      return {
        order_no: result.data.order_no,
        out_refund_no: result.data.out_refund_no,
        pay_refund_no: result.data.pay_refund_no
      }
    } catch (error: any) {
      console.error('Error refunding order:', error)
      throw new Error(error.message || '发起退款失败')
    }
  }

  /**
   * 查询退款结果
   */
  async queryRefund(outRefundNo: string): Promise<{
    refund_status: 0 | 1 | -1  // 0-退款中，1-退款成功，-1-退款失败
    refund_fee: string
    success_time?: string
  }> {
    const params: Record<string, string> = {
      mch_id: this.config.mch_id,
      out_refund_no: outRefundNo,
      timestamp: Math.floor(Date.now() / 1000).toString()
    }

    // 生成签名
    const sign = this.generateSign(params)
    params.sign = sign

    try {
      const response = await fetch(`${this.config.api_url}/wxpay/get_refund_order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString()
      })

      const result = await response.json()

      if (result.code !== 0) {
        throw new Error(result.msg || '查询退款结果失败')
      }

      return {
        refund_status: result.data.refund_status,
        refund_fee: result.data.refund_fee,
        success_time: result.data.success_time
      }
    } catch (error: any) {
      console.error('Error querying refund:', error)
      throw new Error(error.message || '查询退款结果失败')
    }
  }

  /**
   * 获取微信授权链接
   */
  async getWechatAuthLink(callbackUrl: string, attach?: string): Promise<string> {
    const params: Record<string, string> = {
      mch_id: this.config.mch_id,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      callback_url: callbackUrl,
      attach: attach || ''
    }

    // 生成签名
    const sign = this.generateSign(params)
    params.sign = sign

    try {
      const response = await fetch(`${this.config.api_url}/wxpay/get_wechat_openid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString()
      })

      const result = await response.json()

      if (result.code !== 0) {
        throw new Error(result.msg || '获取授权链接失败')
      }

      return result.data
    } catch (error: any) {
      console.error('Error getting wechat auth link:', error)
      throw new Error(error.message || '获取授权链接失败')
    }
  }

  /**
   * 轮询订单支付状态
   */
  async pollOrderStatus(outTradeNo: string, timeout: number = 300000): Promise<boolean> {
    const startTime = Date.now()
    const pollInterval = 3000 // 3秒轮询一次

    return new Promise((resolve) => {
      const poll = async () => {
        try {
          const result = await this.queryOrder(outTradeNo)
          
          if (result.pay_status === 1) {
            resolve(true)
            return
          }

          // 检查是否超时
          if (Date.now() - startTime > timeout) {
            resolve(false)
            return
          }

          // 继续轮询
          setTimeout(poll, pollInterval)
        } catch (error) {
          console.error('Error polling order status:', error)
          
          // 检查是否超时
          if (Date.now() - startTime > timeout) {
            resolve(false)
            return
          }

          // 继续轮询
          setTimeout(poll, pollInterval)
        }
      }

      poll()
    })
  }
}

// 创建默认实例
const lantuzPayConfig: LantuzPayConfig = {
  mch_id: import.meta.env.VITE_LANTUZ_MCH_ID || '',
  api_key: import.meta.env.VITE_LANTUZ_API_KEY || '',
  api_url: import.meta.env.VITE_LANTUZ_API_URL || 'https://api.ltzf.cn/api',
  notify_url: import.meta.env.VITE_LANTUZ_NOTIFY_URL || ''
}

export const lantuzPayService = new LantuzPayService(lantuzPayConfig)