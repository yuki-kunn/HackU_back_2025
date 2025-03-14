CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.landmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  genre_code TEXT,
  genre_name TEXT,
  tel TEXT,
  detail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(latitude, longitude)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS landmarks_location_idx 
ON public.landmarks (latitude, longitude);

CREATE INDEX IF NOT EXISTS landmarks_genre_idx 
ON public.landmarks (genre_code);

-- 行レベルのセキュリティポリシーの設定
ALTER TABLE public.landmarks ENABLE ROW LEVEL SECURITY;

-- 全ての操作を許可するポリシー
CREATE POLICY "Allow full access" ON public.landmarks
  USING (true)
  WITH CHECK (true);
