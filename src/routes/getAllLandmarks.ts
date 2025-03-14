import { Hono } from 'hono';
import { supabase } from '../utils/supabase.ts';

const app = new Hono();

/**
 * データベースからランドマーク一覧を取得するAPI
 * クエリパラメータ:
 * - limit: 取得する最大件数（デフォルト30件）
 * - offset: 取得開始位置（ページネーション用）
 * - genre: ジャンルコード（指定すると絞り込み）
 * - city: 都市名（指定すると絞り込み、部分一致）
 */
app.get('/', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '30');
    const offset = parseInt(c.req.query('offset') || '0');
    const genre = c.req.query('genre');
    const city = c.req.query('city');
    
    let query = supabase
      .from('landmarks')
      .select('*');
    
    // ジャンルによる絞り込み
    if (genre) {
      query = query.eq('genre_code', genre);
    }
    
    // 都市名による絞り込み
    if (city) {
      query = query.ilike('address', `%${city}%`);
    }
    
    // limit/offsetの適用
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      return c.json({ error: error.message }, 500);
    }
    
    // 総件数を取得
    const { count: totalCount, error: countError } = await supabase
      .from('landmarks')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting landmarks:', countError);
    }
    
    return c.json({ 
      landmarks: data, 
      pagination: {
        total: totalCount,
        offset,
        limit,
        hasMore: (offset + limit) < (totalCount || 0)
      }
    });
  } catch (error) {
    console.error('Error in getAllLandmarks:', error);
    return c.json({ error: 'Failed to fetch landmarks' }, 500);
  }
});

export default app;
