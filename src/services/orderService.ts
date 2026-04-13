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

    // 检查是否有待支付的订单，如果有则直接返回
    const { data: pendingOrder } = await supabase
      .from('orders')
      .select('id, order_no, created_at, expires_at')
      .eq('user_id', userId)
      .eq('resource_id', resourceId)
      .eq('payment_status', OrderStatus.PENDING)
      .maybeSingle()

    if (pendingOrder) {
      // 检查订单是否过期
      const expiresAt = new Date(pendingOrder.expires_at)
      if (expiresAt > new Date()) {
        // 订单未过期，返回现有订单
        return this.getOrder(pendingOrder.id, userId) as Promise<Order>
      } else {
        // 订单已过期，删除它
        await supabase.from('orders').delete().eq('id', pendingOrder.id)
      }
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
        resource_title: resource.title,  // 保存资源名称
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
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
      throw error
    }

    // 如果订单已支付，从 user_purchases 表获取资源快照和下载链接
    if (data.payment_status === 'paid' || data.payment_status === 'completed') {
      const { data: purchase } = await supabase
        .from('user_purchases')
        .select('resource_url, resource_title, cover_url, description, category, platform')
        .eq('order_id', id)
        .maybeSingle()
      
      if (purchase) {
        // 优先使用快照数据
        data.resource_url = purchase.resource_url
        ;(data as any).purchase_snapshot = purchase
      }
    } else {
      // 待支付订单，关联查询资源表获取基本信息
      const { data: resource } = await supabase
        .from('resources')
        .select('id, title, description, cover_url, category, platform')
        .eq('id', data.resource_id)
        .single()
      
      if (resource) {
        data.resource = resource
      }
    }

    return data
  }

  /**
   * 获取用户订单列表
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @param options 筛选选项
   */
  static async getUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 20,
    options?: {
      status?: string
      startDate?: string
      endDate?: string
      search?: string
    }
  ): Promise<PaginatedResponse<Order>> {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    // 状态筛选
    if (options?.status && options.status !== 'all') {
      query = query.eq('payment_status', options.status)
    }

    // 时间范围筛选
    if (options?.startDate) {
      query = query.gte('created_at', options.startDate)
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate + 'T23:59:59')
    }

    // 关键词搜索（在数据库层面处理）
    if (options?.search && options.search.trim()) {
      query = query.or(`order_no.ilike.%${options.search}%,resource_title.ilike.%${options.search}%`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching user orders:', error)
      throw error
    }

    // 获取所有订单ID
    const orderIds = (data || []).map(o => o.id)
    
    // 批量查询已支付订单的购买快照
    if (orderIds.length > 0) {
      const { data: purchases } = await supabase
        .from('user_purchases')
        .select('order_id, resource_url, resource_title, cover_url, category, platform')
        .in('order_id', orderIds)
      
      const purchaseMap = new Map()
      purchases?.forEach(p => purchaseMap.set(p.order_id, p))

      // 为已支付订单附加快照数据，为待支付订单附加资源基本信息
      for (const order of data || []) {
        const purchase = purchaseMap.get(order.id)
        
        if (purchase) {
          // 已支付订单：使用快照数据
          order.resource_url = purchase.resource_url
          // 设置 resource 以便模板中 order.resource?.cover_url 能正常工作
          order.resource = {
            id: order.resource_id,
            title: purchase.resource_title,
            cover_url: purchase.cover_url,
            category: purchase.category,
            platform: purchase.platform
          }
          ;(order as any).purchase_snapshot = purchase
        } else if (order.payment_status === 'pending') {
          // 待支付订单：查询资源基本信息
          const { data: resource } = await supabase
            .from('resources')
            .select('id, title, cover_url, category, platform')
            .eq('id', order.resource_id)
            .single()
          
          if (resource) {
            order.resource = resource
          }
        }
      }
    }

    const total = count || 0
    const total_pages = Math.ceil(total / limit)

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: total,
        total_pages: total_pages,
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
   * 删除订单
   */
  static async deleteOrder(orderId: string, userId: string): Promise<void> {
    // 检查订单是否存在且属于该用户
    const order = await this.getOrder(orderId, userId)
    if (!order) {
      throw new Error('订单不存在')
    }

    // 只能删除已取消的订单
    if (order.payment_status !== OrderStatus.CANCELLED) {
      throw new Error('只能删除已取消的订单')
    }

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting order:', error)
      throw new Error('删除订单失败')
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

    // 如果支付成功，同时保存资源链接到订单表
    if (status === OrderStatus.PAID) {
      const { data: order } = await supabase
        .from('orders')
        .select('resource_id')
        .eq('id', orderId)
        .single()
      
      if (order?.resource_id) {
        const { data: resource } = await supabase
          .from('resources')
          .select('resource_url')
          .eq('id', order.resource_id)
          .single()
        
        if (resource?.resource_url) {
          updateData.resource_url = resource.resource_url
        }
      }
    }

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
   * 如果记录已存在（唯一约束冲突），则忽略错误
   */
  private static async createPurchaseRecord(orderId: string): Promise<void> {
    // 获取订单和资源信息
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, resources!inner(*)')
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('Error fetching order for purchase record:', orderError)
      throw orderError
    }

    // 创建购买记录（保存资源快照）
    // 使用 upsert + ON CONFLICT DO NOTHING 处理重复购买的情况
    const { error } = await supabase
      .from('user_purchases')
      .upsert({
        user_id: order.user_id,
        resource_id: order.resource_id,
        order_id: order.id,
        resource_url: order.resources.resource_url,
        // 保存资源快照
        resource_title: order.resources.title,
        cover_url: order.resources.cover_url,
        description: order.resources.description,
        category: order.resources.category,
        platform: order.resources.platform
      }, {
        onConflict: 'user_id,resource_id',  // 唯一约束列
        ignoreDuplicates: true  // 冲突时忽略
      })

    // 忽略唯一约束冲突错误（code: 23505）
    // 其他错误仍然抛出
    if (error && error.code !== '23505') {
      console.error('Error creating purchase record:', error)
      throw error
    }

    // 增加资源的购买数量（忽略可能的重复错误）
    try {
      await supabase.rpc('increment_purchase_count', {
        resource_id: order.resource_id
      })
    } catch (e) {
      // increment_purchase_count RPC 失败，静默处理
    }
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