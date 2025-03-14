-- 既存のランドマークテーブルを削除して再作成
DROP TABLE IF EXISTS public.landmarks;

-- テーブルを再作成
CREATE TABLE public.landmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC(10,6) NOT NULL,  -- 精度を指定
  longitude NUMERIC(10,6) NOT NULL, -- 精度を指定
  genre_code TEXT,
  genre_name TEXT,
  tel TEXT,
  detail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_location UNIQUE(latitude, longitude)
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS landmarks_location_idx 
ON public.landmarks (latitude, longitude);

CREATE INDEX IF NOT EXISTS landmarks_genre_idx 
ON public.landmarks (genre_code);

-- セキュリティ設定
ALTER TABLE public.landmarks ENABLE ROW LEVEL SECURITY;

-- すべてのアクセスを許可
CREATE POLICY "Allow full access" ON public.landmarks 
FOR ALL
USING (true)
WITH CHECK (true);
