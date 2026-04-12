import { supabase } from '../utils/supabase'
import { 
  Resource, 
  CreateResourceRequest, 
  UpdateResourceRequest, 
  ResourceQueryParams, 
  PaginatedResponse, 
  ResourceStatus,
  ResourceTag,
  UserPurchase,
  UserResourceStats
} from '../types/resources'

export class ResourceService {
  /**
   * 获取资源列表（公开访问）
   */
  static async getResources(params: ResourceQueryParams = {}): Promise<PaginatedResponse<Resource>> {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = 'all',
      platform = 'all',
      min_price = 0,
      max_price = undefined,
      is_free = undefined,
      status = ResourceStatus.PUBLISHED,
      sort_by = 'created_at',
      sort_order = 'desc',
      user_id = undefined,
      include_hidden = false
    } = params

    // 确定使用哪个表/视图
    // 如果查询公开资源（已发布且可见），使用 public_resources 视图
    // 否则使用 resources 表
    const usePublicView = status === ResourceStatus.PUBLISHED && !user_id
    const tableName = usePublicView ? 'public_resources' : 'resources'
    
    // 构建查询
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact' })

    // 搜索条件
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // 分类筛选
    if (category !== 'all') {
      query = query.eq('category', category)
    }

    // 平台筛选
    if (platform !== 'all') {
      query = query.eq('platform', platform)
    }

    // 价格筛选
    if (min_price > 0) {
      query = query.gte('price', min_price)
    }
    if (max_price !== undefined) {
      query = query.lte('price', max_price)
    }

    // 免费筛选
    if (is_free !== undefined) {
      query = query.eq('is_free', is_free)
    }

    // 状态筛选（默认只显示已发布的）
    if (status) {
      query = query.eq('status', status)
      
      // 显示状态筛选（仅已发布资源可以设置可见性）
      // 只有在公开查询（且未指定 user_id）时才过滤隐藏资源
      // "我的资源"页面通过 include_hidden=true 来显示隐藏的资源
      if (status === ResourceStatus.PUBLISHED && !include_hidden) {
        query = query.eq('is_visible', true)
      }
    }

    // 用户ID筛选
    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    // 排序
    query = query.order(sort_by, { ascending: sort_order === 'asc' })

    // 分页
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching resources:', error)
      throw error
    }

    // 获取每个资源的标签和头像
    const resourcesWithTags = await Promise.all(
      (data || []).map(async (resource) => {
        const tags = await this.getResourceTags(resource.id)
        
        // 如果使用 resources 表，需要获取用户头像 - 优雅处理 RLS 限制
        let author_avatar = resource.author_avatar || null
        if (tableName === 'resources') {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('avatar_url')
              .eq('id', resource.user_id)
              .maybeSingle()
            
            if (profileError) {
              // 可能是 RLS 策略限制，静默处理
            } else if (profile) {
              author_avatar = profile.avatar_url
            }
          } catch (profileError) {
            // 继续处理，头像可为空
          }
        }
        
        return {
          ...resource,
          tags: tags.map(tag => tag.tag_name),
          author_avatar: author_avatar
        }
      })
    )

    const total = count || 0
    const total_pages = Math.ceil(total / limit)

    return {
      data: resourcesWithTags,
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
   * 获取单个资源详情
   */
  static async getResource(id: string, userId?: string): Promise<Resource | null> {
    // 首先获取资源基本信息
    const { data: resource, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching resource:', error)
      throw error
    }

    if (!resource) {
      return null
    }

    // 获取用户头像 - 优雅处理 RLS 限制
    let author_avatar = null
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', resource.user_id)
        .maybeSingle()
      
      if (profileError) {
        // 可能是 RLS 策略限制，静默处理
      } else if (profile) {
        author_avatar = profile.avatar_url
      }
    } catch (profileError) {
      // 继续处理，头像可为空
    }

    // 获取资源标签
    const tags = await this.getResourceTags(id)

    // 检查用户是否已购买该资源
    let hasPurchased = false
    let purchasedResourceUrl: string | null = null
    if (userId) {
      const result = await this.checkUserPurchased(userId, id)
      hasPurchased = result.purchased
      purchasedResourceUrl = result.resourceUrl || null
    }

    // 检查用户是否有编辑权限
    const canEdit = userId === resource.user_id

    // 增加浏览量
    if (resource.status === ResourceStatus.PUBLISHED && resource.is_visible) {
      await this.incrementViewCount(id)
    }

    // 如果资源已发布且可见，或者用户已购买，或者用户有编辑权限，则返回完整信息
    if (
      (resource.status === ResourceStatus.PUBLISHED && resource.is_visible) ||
      hasPurchased ||
      canEdit
    ) {
      // 如果用户已购买且资源链接为空，使用购买快照中的链接
      const finalResourceUrl = hasPurchased && !resource.resource_url && purchasedResourceUrl 
        ? purchasedResourceUrl 
        : resource.resource_url

      return {
        ...resource,
        resource_url: finalResourceUrl,
        tags: tags.map(tag => tag.tag_name),
        has_purchased: hasPurchased,
        can_edit: canEdit,
        author_avatar: author_avatar
      }
    }

    // 否则只返回基本信息（不包含资源链接）
    return {
      ...resource,
      resource_url: null,  // 隐藏资源链接
      tags: tags.map(tag => tag.tag_name),
      has_purchased: hasPurchased,
      can_edit: canEdit,
      author_avatar: author_avatar
    }
  }

  /**
   * 创建资源
   */
  static async createResource(request: CreateResourceRequest, userId: string): Promise<Resource> {
    const {
      title,
      description,
      cover_url,
      resource_url,
      category,
      platform,
      price,
      is_free,
      status,
      is_visible,
      tags = []
    } = request

    // 验证付费资源价格
    if (!is_free && price <= 0) {
      throw new Error('付费资源的价格必须大于0元')
    }

    // 创建资源记录
    const { data: resource, error } = await supabase
      .from('resources')
      .insert({
        user_id: userId,
        title,
        description,
        cover_url: cover_url || null,
        resource_url,
        category,
        platform,
        price: is_free ? 0 : price,
        is_free,
        status,
        is_visible,
        published_at: status === ResourceStatus.PUBLISHED ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating resource:', error)
      throw error
    }

    // 添加标签
    if (tags.length > 0) {
      await this.addResourceTags(resource.id, tags)
    }

    // 获取完整资源信息
    const fullResource = await this.getResource(resource.id, userId)
    if (!fullResource) {
      throw new Error('Failed to create resource')
    }

    return fullResource
  }

  /**
   * 更新资源
   */
  static async updateResource(id: string, request: UpdateResourceRequest, userId: string): Promise<Resource> {
    // 首先检查资源是否存在且用户有权限
    const resource = await this.getResource(id, userId)
    if (!resource) {
      throw new Error('Resource not found')
    }

    if (!resource.can_edit) {
      throw new Error('You do not have permission to edit this resource')
    }

    // 验证付费资源价格
    if (request.price !== undefined && !request.is_free && request.price <= 0) {
      throw new Error('付费资源的价格必须大于0元')
    }

    // 构建更新数据
    const updateData: any = {}
    if (request.title !== undefined) updateData.title = request.title
    if (request.description !== undefined) updateData.description = request.description
    if (request.cover_url !== undefined) updateData.cover_url = request.cover_url
    if (request.resource_url !== undefined) updateData.resource_url = request.resource_url
    if (request.category !== undefined) updateData.category = request.category
    if (request.platform !== undefined) updateData.platform = request.platform
    if (request.price !== undefined) updateData.price = request.price
    if (request.is_free !== undefined) updateData.is_free = request.is_free
    if (request.status !== undefined) {
      updateData.status = request.status
      // 如果是发布状态且之前是草稿，设置发布时间
      if (request.status === ResourceStatus.PUBLISHED && resource.status === ResourceStatus.DRAFT) {
        updateData.published_at = new Date().toISOString()
      }
    }
    if (request.is_visible !== undefined) updateData.is_visible = request.is_visible

    // 更新资源记录
    const { error } = await supabase
      .from('resources')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating resource:', error)
      throw error
    }

    // 更新标签
    if (request.tags !== undefined) {
      // 先删除所有现有标签
      await this.deleteResourceTags(id)
      // 添加新标签
      if (request.tags.length > 0) {
        await this.addResourceTags(id, request.tags)
      }
    }

    // 获取更新后的资源信息
    const updatedResource = await this.getResource(id, userId)
    if (!updatedResource) {
      throw new Error('Failed to update resource')
    }

    return updatedResource
  }

  /**
   * 删除资源
   */
  static async deleteResource(id: string, userId: string): Promise<void> {
    // 首先检查资源是否存在且用户有权限
    const resource = await this.getResource(id, userId)
    if (!resource) {
      throw new Error('Resource not found')
    }

    if (!resource.can_edit) {
      throw new Error('You do not have permission to delete this resource')
    }

    // 删除资源标签
    await this.deleteResourceTags(id)

    // 删除资源记录
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting resource:', error)
      throw error
    }
  }

  /**
   * 获取用户自己的资源列表
   */
  static async getUserResources(userId: string, params: ResourceQueryParams = {}): Promise<PaginatedResponse<Resource>> {
    const queryParams: ResourceQueryParams = {
      ...params,
      user_id: userId,
      include_hidden: true  // 我的资源页面需要显示所有资源，包括隐藏的
    }
    
    // 如果 status 是 'all' 或 undefined，则移除 status 筛选，让用户可以查看所有状态的资源
    if (params.status === 'all' as any || params.status === undefined) {
      delete queryParams.status
    }
    
    return this.getResources(queryParams)
  }

  /**
   * 获取资源标签
   */
  static async getResourceTags(resourceId: string): Promise<ResourceTag[]> {
    const { data, error } = await supabase
      .from('resource_tags')
      .select('*')
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching resource tags:', error)
      throw error
    }

    return data || []
  }

  /**
   * 添加资源标签
   */
  static async addResourceTags(resourceId: string, tags: string[]): Promise<void> {
    const tagRecords = tags.map(tag_name => ({
      resource_id: resourceId,
      tag_name
    }))

    const { error } = await supabase
      .from('resource_tags')
      .insert(tagRecords)

    if (error) {
      console.error('Error adding resource tags:', error)
      throw error
    }
  }

  /**
   * 删除资源标签
   */
  static async deleteResourceTags(resourceId: string): Promise<void> {
    const { error } = await supabase
      .from('resource_tags')
      .delete()
      .eq('resource_id', resourceId)

    if (error) {
      console.error('Error deleting resource tags:', error)
      throw error
    }
  }

  /**
   * 增加资源浏览量
   */
  static async incrementViewCount(resourceId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_view_count', {
      resource_id: resourceId
    })

    if (error) {
      console.error('Error incrementing view count:', error)
      // 如果RPC函数不存在，先获取当前值再更新
      const { data } = await supabase
        .from('resources')
        .select('view_count')
        .eq('id', resourceId)
        .single()
      
      if (data) {
        await supabase
          .from('resources')
          .update({ view_count: data.view_count + 1 })
          .eq('id', resourceId)
      }
    }
  }

  /**
   * 检查用户是否已购买资源，并返回购买快照
   */
  static async checkUserPurchased(userId: string, resourceId: string): Promise<{ purchased: boolean; resourceUrl?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select('id, resource_url')
        .eq('user_id', userId)
        .eq('resource_id', resourceId)
        .limit(1)

      if (error) {
        console.error('Error checking user purchase:', error)
        return { purchased: false }
      }

      if (data && data.length > 0) {
        return { 
          purchased: true, 
          resourceUrl: data[0].resource_url 
        }
      }

      return { purchased: false }
    } catch (err) {
      console.error('Error checking user purchase:', err)
      return { purchased: false }
    }
  }

  /**
   * 获取用户购买记录
   */
  static async getUserPurchases(userId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<UserPurchase>> {
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 首先获取购买记录
    const { data: purchases, error, count } = await supabase
      .from('user_purchases')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching user purchases:', error)
      throw error
    }

    if (!purchases || purchases.length === 0) {
      const total = count || 0
      const total_pages = Math.ceil(total / limit)
      return {
        data: [],
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

    // 获取相关的资源和订单信息
    const enrichedPurchases = await Promise.all(
      purchases.map(async (purchase) => {
        // 获取资源信息
        const { data: resource } = await supabase
          .from('resources')
          .select('*')
          .eq('id', purchase.resource_id)
          .single()

        // 获取资源作者头像 - 优雅处理 RLS 限制
        let author_avatar = null
        if (resource) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('avatar_url')
              .eq('id', resource.user_id)
              .maybeSingle()
            
            if (profileError) {
              // 静默处理
            } else if (profile) {
              author_avatar = profile.avatar_url
            }
          } catch (profileError) {
            // 静默处理
          }
        }

        // 获取订单信息
        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('id', purchase.order_id)
          .single()

        return {
          ...purchase,
          resource: resource ? {
            ...resource,
            author_avatar: author_avatar
          } : undefined,
          order: order || undefined
        } as UserPurchase
      })
    )

    const total = count || 0
    const total_pages = Math.ceil(total / limit)

    return {
      data: enrichedPurchases,
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
   * 获取用户资源统计
   */
  static async getUserResourceStats(userId: string): Promise<UserResourceStats> {
    const { data, error } = await supabase
      .from('resources')
      .select('status, price, view_count, purchase_count')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user resource stats:', error)
      throw error
    }

    let total_resources = 0
    let published_resources = 0
    let draft_resources = 0
    let total_views = 0
    let total_purchases = 0
    let total_revenue = 0

    data.forEach(resource => {
      total_resources++
      if (resource.status === ResourceStatus.PUBLISHED) {
        published_resources++
      } else {
        draft_resources++
      }
      total_views += resource.view_count || 0
      total_purchases += resource.purchase_count || 0
      
      // 只计算已发布资源的收入
      if (resource.status === ResourceStatus.PUBLISHED && resource.price > 0) {
        total_revenue += (resource.price || 0) * (resource.purchase_count || 0)
      }
    })

    return {
      total_resources,
      published_resources,
      draft_resources,
      total_views,
      total_purchases,
      total_revenue
    }
  }

  /**
   * 获取热门资源
   */
  static async getHotResources(limit: number = 10): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('public_resources')
      .select('*')
      .order('purchase_count', { ascending: false })
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching hot resources:', error)
      throw error
    }

    return data || []
  }

  /**
   * 获取最新资源
   */
  static async getNewResources(limit: number = 10): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('public_resources')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching new resources:', error)
      throw error
    }

    return data || []
  }

  /**
   * 上传封面图片
   */
  static async uploadCoverImage(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    const { error } = await supabase.storage
      .from('resource-covers')
      .upload(fileName, file)

    if (error) {
      console.error('Error uploading cover image:', error)
      throw error
    }

    const { data } = supabase.storage
      .from('resource-covers')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  /**
   * 删除封面图片
   */
  static async deleteCoverImage(url: string, userId: string): Promise<void> {
    // 从URL中提取文件名
    const urlParts = url.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const fullPath = `${userId}/${fileName}`

    const { error } = await supabase.storage
      .from('resource-covers')
      .remove([fullPath])

    if (error) {
      console.error('Error deleting cover image:', error)
      throw error
    }
  }
}