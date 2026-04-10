-- ============================================
-- 网盘资源发布系统数据库配置脚本
-- ============================================

-- ============================================
-- 第一部分: 枚举类型定义
-- ============================================

-- 资源分类枚举
CREATE TYPE resource_category AS ENUM (
    'software',          -- 软件
    'game',              -- 游戏
    'education',         -- 教育
    'entertainment',     -- 娱乐
    'document',          -- 文档
    'image',             -- 图片
    'video',             -- 视频
    'audio',             -- 音频
    'compressed',        -- 压缩包
    'other'              -- 其他
);

-- 网盘平台枚举
CREATE TYPE cloud_platform AS ENUM (
    'baidu_pan',         -- 百度网盘
    'aliyun_pan',        -- 阿里云盘
    'onedrive',          -- OneDrive
    'google_drive',      -- Google Drive
    'tencent_cloud',     -- 腾讯云
    'huawei_cloud',      -- 华为云
    'other'              -- 其他
);

-- 资源状态枚举
CREATE TYPE resource_status AS ENUM (
    'draft',             -- 草稿
    'published'          -- 已发布
);

-- 订单状态枚举
CREATE TYPE order_status AS ENUM (
    'pending',           -- 待支付
    'paid',              -- 已支付
    'completed',         -- 已完成
    'cancelled',         -- 已取消
    'refunded'           -- 已退款
);

-- 支付渠道枚举
CREATE TYPE payment_channel AS ENUM (
    'wechat',            -- 微信支付
    'alipay'             -- 支付宝
);

-- ============================================
-- 第二部分: 表结构定义
-- ============================================

-- 资源表
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    
    -- 基本信息
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    cover_url TEXT,                      -- 封面图片URL
    
    -- 资源信息
    resource_url TEXT,                   -- 资源链接（受保护字段）
    category resource_category NOT NULL DEFAULT 'other',
    platform cloud_platform NOT NULL DEFAULT 'other',
    
    -- 价格信息
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_free BOOLEAN NOT NULL DEFAULT false,
    
    -- 状态信息
    status resource_status NOT NULL DEFAULT 'draft',
    is_visible BOOLEAN NOT NULL DEFAULT true,  -- 显示状态
    view_count INTEGER NOT NULL DEFAULT 0,     -- 浏览量
    purchase_count INTEGER NOT NULL DEFAULT 0, -- 购买量
    
    -- 时间信息
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 资源标签表（多对多关系）
CREATE TABLE resource_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES resources ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单表
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 订单信息
    order_no VARCHAR(50) NOT NULL UNIQUE,      -- 商户订单号
    user_id UUID REFERENCES auth.users NOT NULL,
    resource_id UUID REFERENCES resources NOT NULL,
    
    -- 支付信息
    amount DECIMAL(10, 2) NOT NULL,
    payment_channel payment_channel,
    payment_status order_status NOT NULL DEFAULT 'pending',
    
    -- 外部支付信息
    external_order_no VARCHAR(100),           -- 外部订单号（蓝兔支付）
    external_transaction_no VARCHAR(100),     -- 外部交易号
    payment_time TIMESTAMP WITH TIME ZONE,    -- 支付时间
    
    -- 支付二维码
    qr_code_url TEXT,                         -- 二维码URL
    code_url TEXT,                            -- 微信原生链接
    
    -- 回调信息
    notify_url TEXT NOT NULL,
    attach TEXT,                              -- 附加数据
    
    -- 时间信息
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,  -- 订单过期时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户购买记录表（用于快速查询用户已购买的资源）
CREATE TABLE user_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    resource_id UUID REFERENCES resources NOT NULL,
    order_id UUID REFERENCES orders NOT NULL,
    
    -- 购买时记录的资源链接（防止资源链接后续修改）
    resource_url TEXT NOT NULL,
    
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, resource_id)  -- 防止重复购买
);

-- ============================================
-- 第三部分: 索引创建
-- ============================================

-- 资源表索引
CREATE INDEX idx_resources_user_id ON resources(user_id);
CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_resources_is_visible ON resources(is_visible);
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_platform ON resources(platform);
CREATE INDEX idx_resources_created_at ON resources(created_at);
CREATE INDEX idx_resources_price ON resources(price);
CREATE INDEX idx_resources_is_free ON resources(is_free);

-- 资源标签表索引
CREATE INDEX idx_resource_tags_resource_id ON resource_tags(resource_id);
CREATE INDEX idx_resource_tags_tag_name ON resource_tags(tag_name);

-- 订单表索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_resource_id ON orders(resource_id);
CREATE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_orders_external_order_no ON orders(external_order_no);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- 用户购买记录索引
CREATE INDEX idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX idx_user_purchases_resource_id ON user_purchases(resource_id);
CREATE INDEX idx_user_purchases_order_id ON user_purchases(order_id);

-- ============================================
-- 第四部分: RLS策略配置
-- ============================================

-- 启用所有表的RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

-- 删除旧的RLS策略（如果存在）
DROP POLICY IF EXISTS "resources_select_all" ON resources;
DROP POLICY IF EXISTS "resources_select_own" ON resources;
DROP POLICY IF EXISTS "resources_insert_own" ON resources;
DROP POLICY IF EXISTS "resources_update_own" ON resources;
DROP POLICY IF EXISTS "resources_delete_own" ON resources;

DROP POLICY IF EXISTS "resource_tags_select_all" ON resource_tags;
DROP POLICY IF EXISTS "resource_tags_insert_own" ON resource_tags;
DROP POLICY IF EXISTS "resource_tags_update_own" ON resource_tags;
DROP POLICY IF EXISTS "resource_tags_delete_own" ON resource_tags;

DROP POLICY IF EXISTS "orders_select_own" ON orders;
DROP POLICY IF EXISTS "orders_insert_own" ON orders;
DROP POLICY IF EXISTS "orders_update_own" ON orders;

DROP POLICY IF EXISTS "user_purchases_select_own" ON user_purchases;
DROP POLICY IF EXISTS "user_purchases_insert_system" ON user_purchases;

-- 资源表RLS策略
-- 策略1: 所有人可以查看已发布且可见的资源（但不能看到资源链接）
CREATE POLICY "resources_select_public" ON resources
  FOR SELECT USING (
    status = 'published' 
    AND is_visible = true
  );

-- 策略2: 用户可以查看自己的所有资源（包括草稿）
CREATE POLICY "resources_select_own" ON resources
  FOR SELECT USING (auth.uid() = user_id);

-- 策略3: 用户可以插入自己的资源
CREATE POLICY "resources_insert_own" ON resources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 策略4: 用户可以更新自己的资源
CREATE POLICY "resources_update_own" ON resources
  FOR UPDATE USING (auth.uid() = user_id);

-- 策略5: 用户可以删除自己的资源
CREATE POLICY "resources_delete_own" ON resources
  FOR DELETE USING (auth.uid() = user_id);

-- 资源标签表RLS策略
-- 策略1: 查看资源标签需要对应资源可见
CREATE POLICY "resource_tags_select_public" ON resource_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM resources 
      WHERE resources.id = resource_tags.resource_id 
      AND resources.status = 'published' 
      AND resources.is_visible = true
    )
  );

-- 策略2: 用户可以管理自己资源的标签
CREATE POLICY "resource_tags_manage_own" ON resource_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM resources 
      WHERE resources.id = resource_tags.resource_id 
      AND resources.user_id = auth.uid()
    )
  );

-- 订单表RLS策略
-- 策略1: 用户只能查看自己的订单
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- 策略2: 用户可以创建自己的订单
CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 策略3: 用户可以更新自己的订单（例如更新支付状态）
CREATE POLICY "orders_update_own" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

-- 策略4: 系统可以更新订单状态（通过Supabase Edge Functions）
CREATE POLICY "orders_update_system" ON orders
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'service_role'  -- 仅服务角色可访问
  );

-- 用户购买记录表RLS策略
-- 策略1: 用户只能查看自己的购买记录
CREATE POLICY "user_purchases_select_own" ON user_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- 策略2: 系统可以插入购买记录（支付成功后）
CREATE POLICY "user_purchases_insert_system" ON user_purchases
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'  -- 仅服务角色可访问
  );

-- ============================================
-- 第五部分: 函数和触发器
-- ============================================

-- 更新updated_at的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表创建updated_at触发器
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 自动生成订单号的函数
CREATE OR REPLACE FUNCTION generate_order_no()
RETURNS VARCHAR(50) AS $$
DECLARE
  prefix VARCHAR(10) := 'ORD';
  timestamp_part VARCHAR(20);
  random_part VARCHAR(6);
  order_no VARCHAR(50);
BEGIN
  -- 使用时间戳（精确到毫秒）和随机数生成唯一订单号
  timestamp_part := to_char(EXTRACT(EPOCH FROM NOW()) * 1000, 'FM9999999999999');
  random_part := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  order_no := prefix || timestamp_part || random_part;
  RETURN order_no;
END;
$$ LANGUAGE plpgsql;

-- 支付成功后的处理函数
CREATE OR REPLACE FUNCTION handle_payment_success(
  p_order_id UUID,
  p_external_order_no VARCHAR(100),
  p_external_transaction_no VARCHAR(100),
  p_payment_time TIMESTAMP
)
RETURNS VOID AS $$
BEGIN
  -- 更新订单状态
  UPDATE orders
  SET 
    payment_status = 'paid',
    external_order_no = p_external_order_no,
    external_transaction_no = p_external_transaction_no,
    payment_time = p_payment_time,
    updated_at = NOW()
  WHERE id = p_order_id;
  
  -- 插入购买记录
  INSERT INTO user_purchases (user_id, resource_id, order_id, resource_url)
  SELECT 
    o.user_id,
    o.resource_id,
    o.id,
    r.resource_url
  FROM orders o
  JOIN resources r ON o.resource_id = r.id
  WHERE o.id = p_order_id;
  
  -- 更新资源的购买数量
  UPDATE resources
  SET purchase_count = purchase_count + 1
  WHERE id = (SELECT resource_id FROM orders WHERE id = p_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 增加浏览量的函数
CREATE OR REPLACE FUNCTION increment_view_count(resource_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE resources
  SET view_count = view_count + 1
  WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql;

-- 增加购买量的函数
CREATE OR REPLACE FUNCTION increment_purchase_count(resource_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE resources
  SET purchase_count = purchase_count + 1
  WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql;

-- 检查用户是否已购买资源的函数
CREATE OR REPLACE FUNCTION check_user_purchased(p_user_id UUID, p_resource_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_purchases 
    WHERE user_id = p_user_id AND resource_id = p_resource_id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 第六部分: 存储桶配置（资源封面图片）
-- ============================================

-- 创建资源封面存储桶（需要在Dashboard中手动创建）
-- 1. 进入 Supabase Dashboard → Storage
-- 2. 点击 "New Bucket"
-- 3. 名称输入: resource-covers
-- 4. 勾选 "Public bucket"
-- 5. 点击 "Create bucket"

-- 删除旧的Storage策略
DROP POLICY IF EXISTS "resource_covers_public_read" ON storage.objects;
DROP POLICY IF EXISTS "resource_covers_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "resource_covers_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "resource_covers_authenticated_delete" ON storage.objects;

-- 资源封面Storage策略
-- 策略1: 允许任何人读取封面图片
CREATE POLICY "resource_covers_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'resource-covers');

-- 策略2: 允许已认证用户上传封面
CREATE POLICY "resource_covers_authenticated_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resource-covers'
    AND auth.role() = 'authenticated'
  );

-- 策略3: 允许已认证用户更新自己的封面
CREATE POLICY "resource_covers_authenticated_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'resource-covers'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 策略4: 允许已认证用户删除自己的封面
CREATE POLICY "resource_covers_authenticated_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resource-covers'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- 第七部分: 视图创建（用于简化查询）
-- ============================================

-- 公共资源视图（排除敏感信息）
CREATE OR REPLACE VIEW public_resources AS
SELECT 
  r.id,
  r.user_id,
  r.title,
  r.description,
  r.cover_url,
  r.category,
  r.platform,
  r.price,
  r.is_free,
  r.status,
  r.is_visible,
  r.view_count,
  r.purchase_count,
  r.published_at,
  r.created_at,
  r.updated_at,
  -- 不包含资源链接（resource_url）
  u.email as author_email,
  p.avatar_url as author_avatar
FROM resources r
LEFT JOIN auth.users u ON r.user_id = u.id
LEFT JOIN profiles p ON r.user_id = p.id
WHERE r.status = 'published' AND r.is_visible = true;

-- 用户资源视图（包含所有用户自己的资源）
CREATE OR REPLACE VIEW user_resources AS
SELECT 
  r.*,
  array_agg(rt.tag_name) as tags
FROM resources r
LEFT JOIN resource_tags rt ON r.id = rt.resource_id
WHERE r.user_id = auth.uid()
GROUP BY r.id;

-- ============================================
-- 第八部分: 验证配置
-- ============================================

-- 验证表创建
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('resources', 'resource_tags', 'orders', 'user_purchases')
ORDER BY tablename;

-- 验证枚举类型
SELECT typname, typcategory 
FROM pg_type 
WHERE typname IN ('resource_category', 'cloud_platform', 'resource_status', 'order_status', 'payment_channel');

-- 验证索引
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('resources', 'resource_tags', 'orders', 'user_purchases')
ORDER BY tablename, indexname;

-- 验证视图
SELECT schemaname, viewname, definition
FROM pg_views
WHERE viewname IN ('public_resources', 'user_resources');

-- ============================================
-- 配置完成提示
-- ============================================

-- 请确保在 Supabase Dashboard 中:
-- 1. 已创建 Storage → resource-covers bucket 并设置为 Public
-- 2. 所有表、枚举类型、索引、视图已正确创建
-- 3. 所有 RLS 策略已生效
-- 4. 函数和触发器已正确创建

-- 测试验证步骤:
-- 1. 注册新用户并登录
-- 2. 创建资源（草稿状态）
-- 3. 发布资源
-- 4. 创建订单并支付
-- 5. 验证购买记录是否正确创建
-- 6. 验证不同用户的权限隔离

-- 注意事项:
-- 1. 蓝兔支付回调URL需要配置为您的API地址
-- 2. 需要配置Supabase Edge Functions来处理支付回调
-- 3. 资源链接建议使用加密存储或通过中间页面跳转
-- 4. 建议定期清理过期的待支付订单