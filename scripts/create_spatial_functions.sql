-- 地理空間関数のセットアップ（Supabaseダッシュボードから実行）

-- 距離内のランドマークを取得する関数
CREATE OR REPLACE FUNCTION public.get_landmarks_within_distance(
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_distance_km NUMERIC
)
RETURNS SETOF public.landmarks
LANGUAGE plpgsql
AS $$
BEGIN
  -- 地球上の2点間の球面距離を計算し、指定距離内のランドマークを返す
  RETURN QUERY
  SELECT *
  FROM public.landmarks
  WHERE (
    -- Haversine公式を使用して距離を計算
    6371 * 2 * ASIN(
      SQRT(
        POWER(SIN((RADIANS(latitude) - RADIANS(p_latitude)) / 2), 2) +
        COS(RADIANS(p_latitude)) * COS(RADIANS(latitude)) *
        POWER(SIN((RADIANS(longitude) - RADIANS(p_longitude)) / 2), 2)
      )
    )
  ) <= p_distance_km;
END;
$$;

-- 距離内のランドマーク数を取得する関数
CREATE OR REPLACE FUNCTION public.count_landmarks_within_distance(
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_distance_km NUMERIC
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  landmark_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO landmark_count
  FROM public.landmarks
  WHERE (
    6371 * 2 * ASIN(
      SQRT(
        POWER(SIN((RADIANS(latitude) - RADIANS(p_latitude)) / 2), 2) +
        COS(RADIANS(p_latitude)) * COS(RADIANS(latitude)) *
        POWER(SIN((RADIANS(longitude) - RADIANS(p_longitude)) / 2), 2)
      )
    )
  ) <= p_distance_km;
  
  RETURN landmark_count;
END;
$$;
