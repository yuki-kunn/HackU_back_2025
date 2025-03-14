-- この内容をSupabaseダッシュボードのSQLエディタにコピー＆ペーストして実行してください
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.landmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC(10,6) NOT NULL,
  longitude NUMERIC(10,6) NOT NULL,
  genre_code TEXT,
  genre_name TEXT,
  tel TEXT,
  detail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_location UNIQUE(latitude, longitude)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS landmarks_location_idx 
ON public.landmarks (latitude, longitude);

CREATE INDEX IF NOT EXISTS landmarks_genre_idx 
ON public.landmarks (genre_code);

-- 行レベルのセキュリティポリシーの設定
ALTER TABLE public.landmarks ENABLE ROW LEVEL SECURITY;

-- すべてのアクセスを許可するポリシー
CREATE POLICY "Allow full access" ON public.landmarks
  USING (true)
  WITH CHECK (true);
  
-- テスト用データの挿入
INSERT INTO public.landmarks (name, address, latitude, longitude, genre_code, genre_name)
VALUES ('大阪城', '大阪府大阪市中央区大阪城1-1', 34.687300, 135.526200, '0304', '史跡・名所')
ON CONFLICT (latitude, longitude) DO NOTHING;
