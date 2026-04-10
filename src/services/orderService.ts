import { supabase } from '../utils/supabase'
import { 
  Order, 
  OrderStatus, 
  PaymentChannel,
  PaginatedResponse
} from '../types/resources'

export class OrderService {
  /**
   * 创建订单
   */
  static async createOrder(resourceId: string, userId: string, paymentChannel: PaymentChannel = PaymentChannel.WECHAT): Promise<Order> {
    // 获取资源信息
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .single()

    if (resourceError) {
      console.error('Error fetching resource:', resourceError)
      throw new Error('资源不存在')
    }

    // 检查资源是否免费
    if (resource.is_free) {
      throw new Error('免费资源无需购买')
    }

    // 检查用户是否已购买该资源
    const { data: purchase } = await supabase
      .from('user_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('resource_id', resourceId)
      .limit(1)

    if (purchase && purchase.length > 0) {
      throw new Error('您已购买此资源')
    }

    // 生成订单号
    const orderNo = this.generateOrderNo()
    
    // 订单过期时间（30分钟后）
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    // 创建订单
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo,
        user_id: userId,
        resource_id: resourceId,
        amount: resource.price,
        payment_channel: paymentChannel,
        payment_status: OrderStatus.PENDING,
        notify_url: `${window.location.origin}/api/payment/callback`,
        attach: JSON.stringify({ resource_id: resourceId, user_id: userId }),
        expires_at: expiresAt
      })
      .select('*, resources(*)')
      .single()

    if (error) {
      console.error('Error creating order:', error)
      throw new Error('创建订单失败')
    }

    return order
  }

  /**
   * 获取订单详情
   */
  static async getOrder(id: string, userId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, resources(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
      throw error
    }

    return data
  }

  /**
   * 获取用户订单列表
   */
  static async getUserOrders(userId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<Order>> {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('orders')
      .select('*, resources(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching user orders:', error)
      throw error
    }

    const total = count || 0
    const total_pages = Math.ceil(total / limit)

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        total_pages,
        has_next: page < total_pages,
        has_prev: page > 1
      }
    }
  }

  /**
   * 取消订单
   */
  static async cancelOrder(orderId: string, userId: string): Promise<void> {
    // 检查订单是否存在且属于该用户
    const order = await this.getOrder(orderId, userId)
    if (!order) {
      throw new Error('订单不存在')
    }

    // 只能取消待支付的订单
    if (order.payment_status !== OrderStatus.PENDING) {
      throw new Error('只能取消待支付的订单')
    }

    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: OrderStatus.CANCELLED,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (error) {
      console.error('Error cancelling order:', error)
      throw new Error('取消订单失败')
    }
  }

  /**
   * 更新订单支付信息
   */
  static async updatePaymentStatus(
    orderId: string,
    status: OrderStatus,
    externalOrderNo?: string,
    externalTransactionNo?: string,
    paymentTime?: string
  ): Promise<void> {
    const updateData: any = {
      payment_status: status,
      updated_at: new Date().toISOString()
    }

    if (externalOrderNo) updateData.external_order_no = externalOrderNo
    if (externalTransactionNo) updateData.external_transaction_no = externalTransactionNo
    if (paymentTime) updateData.payment_time = paymentTime

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (error) {
      console.error('Error updating payment status:', error)
      throw error
    }

    // 如果支付成功，创建购买记录
    if (status === OrderStatus.PAID) {
      await this.createPurchaseRecord(orderId)
    }
  }

  /**
   * 创建购买记录
   */
  private static async createPurchaseRecord(orderId: string): Promise<void> {
    // 获取订单信息
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, resources!inner(resource_url)')
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('Error fetching order for purchase record:', orderError)
      throw orderError
    }

    // 创建购买记录
    const { error } = await supabase
      .from('user_purchases')
      .insert({
        user_id: order.user_id,
        resource_id: order.resource_id,
        order_id: order.id,
        resource_url: order.resources.resource_url
      })

    if (error) {
      console.error('Error creating purchase record:', error)
      throw error
    }

    // 增加资源的购买数量
    await supabase.rpc('increment_purchase_count', {
      resource_id: order.resource_id
    })
  }

  /**
   * 检查订单是否过期
   */
  static async checkOrderExpired(orderId: string): Promise<boolean> {
    const { data: order, error } = await supabase
      .from('orders')
      .select('expires_at')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return true
    }

    const expiresAt = new Date(order.expires_at)
    const now = new Date()
    return now > expiresAt
  }

  /**
   * 生成订单号
   */
  private static generateOrderNo(): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000)
    return `ORD${timestamp}${random.toString().padStart(4, '0')}`
  }

  /**
   * 获取订单统计
   */
  static async getOrderStats(userId: string): Promise<{
    total_orders: number
    pending_orders: number
    paid_orders: number
    total_spent: number
  }> {
    const { data, error } = await supabase
      .from('orders')
      .select('payment_status, amount')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching order stats:', error)
      throw error
    }

    let total_orders = 0
    let pending_orders = 0
    let paid_orders = 0
    let total_spent = 0

    data.forEach(order => {
      total_orders++
      if (order.payment_status === OrderStatus.PENDING) {
        pending_orders++
      } else if (order.payment_status === OrderStatus.PAID) {
        paid_orders++
        total_spent += order.amount
      }
    })

    return {
      total_orders,
      pending_orders,
      paid_orders,
      total_spent
    }
  }
}