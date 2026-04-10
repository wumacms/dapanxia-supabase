// 资源分类枚举
export enum ResourceCategory {
  SOFTWARE = 'software',          // 软件
  GAME = 'game',                  // 游戏
  EDUCATION = 'education',        // 教育
  ENTERTAINMENT = 'entertainment', // 娱乐
  DOCUMENT = 'document',          // 文档
  IMAGE = 'image',                // 图片
  VIDEO = 'video',                // 视频
  AUDIO = 'audio',                // 音频
  COMPRESSED = 'compressed',      // 压缩包
  OTHER = 'other'                 // 其他
}

// 资源分类显示名称映射
export const ResourceCategoryLabels: Record<ResourceCategory, string> = {
  [ResourceCategory.SOFTWARE]: '软件',
  [ResourceCategory.GAME]: '游戏',
  [ResourceCategory.EDUCATION]: '教育',
  [ResourceCategory.ENTERTAINMENT]: '娱乐',
  [ResourceCategory.DOCUMENT]: '文档',
  [ResourceCategory.IMAGE]: '图片',
  [ResourceCategory.VIDEO]: '视频',
  [ResourceCategory.AUDIO]: '音频',
  [ResourceCategory.COMPRESSED]: '压缩包',
  [ResourceCategory.OTHER]: '其他'
};

// 网盘平台枚举
export enum CloudPlatform {
  BAIDU_PAN = 'baidu_pan',        // 百度网盘
  ALIYUN_PAN = 'aliyun_pan',      // 阿里云盘
  ONEDRIVE = 'onedrive',          // OneDrive
  GOOGLE_DRIVE = 'google_drive',  // Google Drive
  TENCENT_CLOUD = 'tencent_cloud', // 腾讯云
  HUAWEI_CLOUD = 'huawei_cloud',  // 华为云
  OTHER = 'other'                 // 其他
}

// 网盘平台显示名称映射
export const CloudPlatformLabels: Record<CloudPlatform, string> = {
  [CloudPlatform.BAIDU_PAN]: '百度网盘',
  [CloudPlatform.ALIYUN_PAN]: '阿里云盘',
  [CloudPlatform.ONEDRIVE]: 'OneDrive',
  [CloudPlatform.GOOGLE_DRIVE]: 'Google Drive',
  [CloudPlatform.TENCENT_CLOUD]: '腾讯云',
  [CloudPlatform.HUAWEI_CLOUD]: '华为云',
  [CloudPlatform.OTHER]: '其他'
};

// 资源状态枚举
export enum ResourceStatus {
  DRAFT = 'draft',       // 草稿
  PUBLISHED = 'published' // 已发布
}

// 资源状态显示名称映射
export const ResourceStatusLabels: Record<ResourceStatus, string> = {
  [ResourceStatus.DRAFT]: '草稿',
  [ResourceStatus.PUBLISHED]: '已发布'
};

// 订单状态枚举
export enum OrderStatus {
  PENDING = 'pending',   // 待支付
  PAID = 'paid',         // 已支付
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
  REFUNDED = 'refunded'  // 已退款
}

// 订单状态显示名称映射
export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '待支付',
  [OrderStatus.PAID]: '已支付',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.REFUNDED]: '已退款'
};

// 订单状态颜色映射
export const OrderStatusColors: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'warning',
  [OrderStatus.PAID]: 'success',
  [OrderStatus.COMPLETED]: 'info',
  [OrderStatus.CANCELLED]: 'danger',
  [OrderStatus.REFUNDED]: 'info'
};

// 支付渠道枚举
export enum PaymentChannel {
  WECHAT = 'wechat',     // 微信支付
  ALIPAY = 'alipay'      // 支付宝
}

// 支付渠道显示名称映射
export const PaymentChannelLabels: Record<PaymentChannel, string> = {
  [PaymentChannel.WECHAT]: '微信支付',
  [PaymentChannel.ALIPAY]: '支付宝'
};

// 资源标签接口
export interface ResourceTag {
  id: string;
  resource_id: string;
  tag_name: string;
  created_at: string;
}

// 资源接口
export interface Resource {
  id: string;
  user_id: string;
  
  // 基本信息
  title: string;
  description: string;
  cover_url: string | null;
  
  // 资源信息
  resource_url: string | null;          // 仅资源所有者或已购买用户可见
  category: ResourceCategory;
  platform: CloudPlatform;
  
  // 价格信息
  price: number;
  is_free: boolean;
  
  // 状态信息
  status: ResourceStatus;
  is_visible: boolean;
  view_count: number;
  purchase_count: number;
  
  // 时间信息
  published_at: string | null;
  created_at: string;
  updated_at: string;
  
  // 关联信息
  tags?: string[];
  author_email?: string;
  author_avatar?: string | null;
  
  // 客户端计算字段
  has_purchased?: boolean;              // 当前用户是否已购买
  can_edit?: boolean;                   // 当前用户是否可以编辑
}

// 创建资源请求接口
export interface CreateResourceRequest {
  title: string;
  description: string;
  cover_url?: string;
  resource_url: string;
  category: ResourceCategory;
  platform: CloudPlatform;
  price: number;
  is_free: boolean;
  status: ResourceStatus;
  is_visible: boolean;
  tags?: string[];
}

// 更新资源请求接口
export interface UpdateResourceRequest {
  title?: string;
  description?: string;
  cover_url?: string | null;
  resource_url?: string;
  category?: ResourceCategory;
  platform?: CloudPlatform;
  price?: number;
  is_free?: boolean;
  status?: ResourceStatus;
  is_visible?: boolean;
  tags?: string[];
}

// 资源查询参数接口
export interface ResourceQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: ResourceCategory | 'all';
  platform?: CloudPlatform | 'all';
  min_price?: number;
  max_price?: number;
  is_free?: boolean;
  status?: ResourceStatus;
  sort_by?: 'created_at' | 'price' | 'view_count' | 'purchase_count';
  sort_order?: 'asc' | 'desc';
  user_id?: string;  // 指定用户ID
}

// 订单接口
export interface Order {
  id: string;
  order_no: string;
  user_id: string;
  resource_id: string;
  
  // 支付信息
  amount: number;
  payment_channel: PaymentChannel | null;
  payment_status: OrderStatus;
  
  // 外部支付信息
  external_order_no: string | null;
  external_transaction_no: string | null;
  payment_time: string | null;
  
  // 支付二维码
  qr_code_url: string | null;
  code_url: string | null;
  
  // 回调信息
  notify_url: string;
  attach: string | null;
  
  // 时间信息
  expires_at: string;
  created_at: string;
  updated_at: string;
  
  // 关联信息
  resource?: Resource;
}

// 创建订单请求接口
export interface CreateOrderRequest {
  resource_id: string;
  payment_channel: PaymentChannel;
}

// 支付回调接口
export interface PaymentCallbackData {
  code: number;           // 支付结果：0-成功，1-失败
  timestamp: string;      // 时间戳
  mch_id: string;         // 商户号
  order_no: string;       // 系统订单号
  out_trade_no: string;   // 商户订单号
  pay_no: string;         // 支付宝或微信支付订单号
  total_fee: string;      // 支付金额
  sign: string;           // 签名
  pay_channel?: string;   // 支付渠道
  trade_type?: string;    // 支付类型
  success_time?: string;  // 支付完成时间
  attach?: string;        // 附加数据
  openid?: string;        // 支付者信息
}

// 用户购买记录接口
export interface UserPurchase {
  id: string;
  user_id: string;
  resource_id: string;
  order_id: string;
  resource_url: string;
  purchased_at: string;
  created_at: string;
  
  // 关联信息
  resource?: Resource;
  order?: Order;
}

// 资源统计接口
export interface ResourceStats {
  total_resources: number;
  total_views: number;
  total_purchases: number;
  total_revenue: number;
  resources_by_category: Record<ResourceCategory, number>;
  resources_by_platform: Record<CloudPlatform, number>;
  resources_by_status: Record<ResourceStatus, number>;
}

// 用户资源统计接口
export interface UserResourceStats {
  total_resources: number;
  published_resources: number;
  draft_resources: number;
  total_views: number;
  total_purchases: number;
  total_revenue: number;
}

// 蓝兔支付配置接口
export interface LantuzPayConfig {
  mch_id: string;           // 商户号
  api_key: string;          // API密钥
  api_url: string;          // API地址
  notify_url: string;       // 回调地址
}

// 文件上传响应接口
export interface UploadResponse {
  url: string;              // 文件URL
  path: string;             // 文件路径
  size: number;             // 文件大小
}

// 分页响应接口
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}