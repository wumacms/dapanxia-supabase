-- ============================================
-- Supabase 完整配置脚本
-- 适用于 vite-supabase 项目
-- 执行方式: Supabase Dashboard → SQL Editor → 运行此脚本
-- ============================================

-- ============================================
-- 第一部分: profiles 表配置
-- 用于存储用户头像等扩展信息
-- ============================================

-- 创建 profiles 表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 删除旧的默认策略（如果存在）
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update all profiles" ON profiles;

-- profiles 表 RLS 策略
-- 允许用户查看自己的 profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 允许用户更新自己的 profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 允许用户插入自己的 profile
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 第二部分: Storage avatars Bucket 配置
-- 用于存储用户头像文件
-- ============================================

-- 创建 public avatars bucket（如果不存在）
-- 注意: 确保在 Supabase Dashboard → Storage 中手动创建 avatars bucket
-- 或者取消下面的注释来自动创建

-- 方式一: 使用 SQL 创建 (需要 Supabase 服务角色密钥)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO NOTHING;

-- 方式二: 在 Dashboard 中手动创建
-- 1. 进入 Supabase Dashboard → Storage
-- 2. 点击 "New Bucket"
-- 3. 名称输入: avatars
-- 4. 勾选 "Public bucket"
-- 5. 点击 "Create bucket"

-- 注意: Storage RLS 是通过为每个 bucket 创建策略来启用的（见下文）
-- 不需要单独的 ALTER STORAGE 命令

-- 删除旧的 Storage 策略（如果存在）
DROP POLICY IF EXISTS "Public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow all uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow all deletes" ON storage.objects;

-- Storage avatars RLS 策略
-- Storage RLS 默认是关闭的，需要通过策略开启

-- 策略 1: 允许任何人读取头像文件（公开访问）
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 策略 2: 允许已认证用户上传自己的头像
-- 文件路径格式: userId/avatar.{ext}
-- 确保用户只能上传到自己的文件夹
CREATE POLICY "avatars_authenticated_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND name LIKE '%.%'  -- 确保有文件扩展名
  );

-- 策略 3: 允许已认证用户更新自己的头像
CREATE POLICY "avatars_authenticated_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 策略 4: 允许已认证用户删除自己的头像
CREATE POLICY "avatars_authenticated_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- 第三部分: 自动触发器配置 (可选)
-- 用于在用户注册时自动创建 profile
-- ============================================

-- 创建更新 updated_at 的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 profiles 表创建 updated_at 触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 自动创建 profile 的函数 (可选，取消注释以启用)
-- CREATE OR REPLACE FUNCTION handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO profiles (id)
--   VALUES (NEW.id);
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建新用户时的触发器 (可选，取消注释以启用)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 第四部分: 验证配置
-- ============================================

-- 验证 profiles 表配置
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename = 'profiles';

-- 验证 RLS 策略
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'profiles';

-- 验证 Storage bucket
-- SELECT id, name, public
-- FROM storage.buckets
-- WHERE name = 'avatars';

-- 验证 Storage RLS 策略
-- SELECT policyname, cmd, qual, with_check
-- FROM storage.policies
-- WHERE bucket_id = 'avatars';

-- ============================================
-- 配置完成提示
-- ============================================

-- 请确保在 Supabase Dashboard 中:
-- 1. Storage → avatars bucket 已设置为 Public
-- 2. profiles 表已正确创建
-- 3. 所有 RLS 策略已生效

-- 测试验证:
-- 1. 注册新用户，上传头像
-- 2. 切换账号，确认头像不会混淆
-- 3. 检查不同用户的头像 URL 路径不同 (userId/avatar.xxx)
