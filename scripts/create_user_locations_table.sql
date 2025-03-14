-- ユーザー位置情報を保存するテーブル
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  latitude NUMERIC(10,6) NOT NULL,
  longitude NUMERIC(10,6) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS user_locations_user_id_idx 
ON public.user_locations (user_id);

CREATE INDEX IF NOT EXISTS user_locations_recorded_at_idx 
ON public.user_locations (recorded_at);

-- 行レベルのセキュリティポリシーの設定
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- すべてのアクセスを許可するポリシー
CREATE POLICY "Allow full access to user_locations" ON public.user_locations
  USING (true)
  WITH CHECK (true);
