-- ============================================
-- Supabase 数据库完整配置脚本
-- 项目: vite-supabase 网盘资源发布系统
-- 版本: 1.0.0
-- 更新: 2026-04-10
-- 说明: 新项目初始化或完整重建时执行此脚本
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
    'published'         -- 已发布
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

-- Profiles 表（用户扩展信息）
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    nickname TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 资源表
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,

    -- 基本信息
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    cover_url TEXT,

    -- 资源信息
    resource_url TEXT,
    category resource_category NOT NULL DEFAULT 'other',
    platform cloud_platform NOT NULL DEFAULT 'other',

    -- 价格信息
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_free BOOLEAN NOT NULL DEFAULT false,

    -- 状态信息
    status resource_status NOT NULL DEFAULT 'draft',
    is_visible BOOLEAN NOT NULL DEFAULT true,
    view_count INTEGER NOT NULL DEFAULT 0,
    purchase_count INTEGER NOT NULL DEFAULT 0,

    -- 时间信息
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 资源标签表
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
    order_no VARCHAR(50) NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users NOT NULL,
    resource_id UUID REFERENCES resources NOT NULL,

    -- 资源名称（购买时的快照）
    resource_title VARCHAR(255),

    -- 支付信息
    amount DECIMAL(10, 2) NOT NULL,
    payment_channel payment_channel,
    payment_status order_status NOT NULL DEFAULT 'pending',

    -- 外部支付信息
    external_order_no VARCHAR(100),
    external_transaction_no VARCHAR(100),
    payment_time TIMESTAMP WITH TIME ZONE,

    -- 支付二维码
    qr_code_url TEXT,
    code_url TEXT,

    -- 资源链接（支付成功后存储）
    resource_url TEXT,

    -- 回调信息
    notify_url TEXT NOT NULL,
    attach TEXT,

    -- 时间信息
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户购买记录表
CREATE TABLE user_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    resource_id UUID REFERENCES resources NOT NULL,
    order_id UUID REFERENCES orders NOT NULL,

    -- 资源链接（购买时的快照）
    resource_url TEXT NOT NULL,

    -- 资源快照字段
    resource_title VARCHAR(255),
    cover_url TEXT,
    description TEXT,
    category VARCHAR(50),
    platform VARCHAR(50),

    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, resource_id)
);

-- ============================================
-- 第三部分: 索引创建
-- ============================================

-- Profiles 表索引
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);

-- 资源表索引
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_is_visible ON resources(is_visible);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_platform ON resources(platform);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at);
CREATE INDEX IF NOT EXISTS idx_resources_price ON resources(price);
CREATE INDEX IF NOT EXISTS idx_resources_is_free ON resources(is_free);

-- 资源标签表索引
CREATE INDEX IF NOT EXISTS idx_resource_tags_resource_id ON resource_tags(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_tags_tag_name ON resource_tags(tag_name);

-- 订单表索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_resource_id ON orders(resource_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_external_order_no ON orders(external_order_no);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 用户购买记录索引
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_resource_id ON user_purchases(resource_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_order_id ON user_purchases(order_id);

-- ============================================
-- 第四部分: RLS 策略配置
-- ============================================

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

-- 删除所有旧策略（幂等性）
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_public_read_avatar" ON profiles;

DROP POLICY IF EXISTS "resources_select_all" ON resources;
DROP POLICY IF EXISTS "resources_select_public" ON resources;
DROP POLICY IF EXISTS "resources_select_own" ON resources;
DROP POLICY IF EXISTS "resources_insert_own" ON resources;
DROP POLICY IF EXISTS "resources_update_own" ON resources;
DROP POLICY IF EXISTS "resources_delete_own" ON resources;
DROP POLICY IF EXISTS "resources_auth_read" ON resources;

DROP POLICY IF EXISTS "resource_tags_select_all" ON resource_tags;
DROP POLICY IF EXISTS "resource_tags_select_public" ON resource_tags;
DROP POLICY IF EXISTS "resource_tags_manage_own" ON resource_tags;

DROP POLICY IF EXISTS "orders_select_own" ON orders;
DROP POLICY IF EXISTS "orders_insert_own" ON orders;
DROP POLICY IF EXISTS "orders_update_own" ON orders;
DROP POLICY IF EXISTS "orders_update_system" ON orders;

DROP POLICY IF EXISTS "user_purchases_select_own" ON user_purchases;
DROP POLICY IF EXISTS "user_purchases_insert_system" ON user_purchases;
DROP POLICY IF EXISTS "user_purchases_insert_own" ON user_purchases;

-- Profiles RLS 策略
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_public_read_avatar" ON profiles
  FOR SELECT USING (true);

-- 资源表 RLS 策略
CREATE POLICY "resources_select_public" ON resources
  FOR SELECT USING (status = 'published' AND is_visible = true);

CREATE POLICY "resources_select_own" ON resources
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "resources_insert_own" ON resources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resources_update_own" ON resources
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "resources_delete_own" ON resources
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "resources_auth_read" ON resources
  FOR SELECT TO authenticated USING (true);

-- 资源标签表 RLS 策略
CREATE POLICY "resource_tags_select_public" ON resource_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM resources
      WHERE resources.id = resource_tags.resource_id
      AND resources.status = 'published'
      AND resources.is_visible = true
    )
  );

CREATE POLICY "resource_tags_manage_own" ON resource_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM resources
      WHERE resources.id = resource_tags.resource_id
      AND resources.user_id = auth.uid()
    )
  );

-- 订单表 RLS 策略
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "orders_update_own" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "orders_update_system" ON orders
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "orders_delete_own" ON orders
  FOR DELETE USING (auth.uid() = user_id);

-- 用户购买记录 RLS 策略
CREATE POLICY "user_purchases_select_own" ON user_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_purchases_insert_own" ON user_purchases
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = user_purchases.order_id
      AND orders.user_id = user_purchases.user_id
      AND orders.resource_id = user_purchases.resource_id
      AND orders.payment_status = 'paid'
    )
  );

-- ============================================
-- 第五部分: 函数和触发器
-- ============================================

-- 更新 updated_at 的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表创建 updated_at 触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 增加浏览量的函数（SECURITY DEFINER 绕过 RLS，允许匿名用户增加浏览量）
CREATE OR REPLACE FUNCTION increment_view_count(resource_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE resources
  SET view_count = view_count + 1
  WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 增加购买量的函数（SECURITY DEFINER 绕过 RLS）
CREATE OR REPLACE FUNCTION increment_purchase_count(resource_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE resources
  SET purchase_count = purchase_count + 1
  WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 自动创建 profiles 记录的触发器
-- 使用邮箱前缀作为默认昵称，设置默认头像
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_nickname TEXT;
  default_avatar TEXT;
BEGIN
  -- 提取邮箱前缀作为默认昵称
  default_nickname := COALESCE(
    SPLIT_PART(NEW.email, '@', 1),
    '用户'
  );
  
  -- 使用 placehold.co 作为默认头像
  default_avatar := 'https://placehold.co/200x200/6366f1/ffffff?text=' || 
    UPPER(SUBSTRING(default_nickname FROM 1 FOR 2));

  INSERT INTO profiles (id, nickname, avatar_url, created_at, updated_at)
  VALUES (NEW.id, default_nickname, default_avatar, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 第六部分: Storage 存储桶配置
-- ============================================

-- 删除旧的 Storage 策略
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_authenticated_delete" ON storage.objects;

DROP POLICY IF EXISTS "resource_covers_public_read" ON storage.objects;
DROP POLICY IF EXISTS "resource_covers_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "resource_covers_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "resource_covers_authenticated_delete" ON storage.objects;

-- Avatars Storage RLS 策略
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_authenticated_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND name LIKE '%.%'
  );

CREATE POLICY "avatars_authenticated_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_authenticated_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 资源封面 Storage RLS 策略
CREATE POLICY "resource_covers_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'resource-covers');

CREATE POLICY "resource_covers_authenticated_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resource-covers'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "resource_covers_authenticated_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'resource-covers'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "resource_covers_authenticated_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'resource-covers'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- 第七部分: 视图创建
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
  u.email as author_email,
  p.avatar_url as author_avatar
FROM resources r
LEFT JOIN auth.users u ON r.user_id = u.id
LEFT JOIN profiles p ON r.user_id = p.id
WHERE r.status = 'published' AND r.is_visible = true;

-- ============================================
-- 第八部分: 手动创建存储桶（可选）
-- ============================================

-- 注意: 以下 SQL 需要服务角色密钥执行
-- 如果使用普通密钥，请在 Dashboard 中手动创建存储桶

-- 创建 avatars 存储桶
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO NOTHING;

-- 创建 resource-covers 存储桶
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('resource-covers', 'resource-covers', true)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 配置完成
-- ============================================

-- 请确保在 Supabase Dashboard 中:
-- 1. Storage → 创建 avatars bucket (Public)
-- 2. Storage → 创建 resource-covers bucket (Public)
-- 3. Edge Functions → 部署 wxpay-callback (支付回调)

-- ============================================
-- 迁移脚本：已有用户补充 profiles 记录
-- ============================================
-- 仅在首次配置或修复时执行一次，用于为已有用户创建缺失的 profiles 记录

INSERT INTO profiles (id, nickname, avatar_url, created_at, updated_at)
SELECT
  id,
  COALESCE(SPLIT_PART(email, '@', 1), '用户'),
  'https://placehold.co/200x200/6366f1/ffffff?text=' ||
    UPPER(SUBSTRING(COALESCE(SPLIT_PART(email, '@', 1), '用户') FROM 1 FOR 2)),
  NOW(),
  NOW()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.users.id
);
