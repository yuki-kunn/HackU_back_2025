import { Hono } from 'hono';
import { supabase } from '../utils/supabase.ts';

const app = new Hono();

// ユーザー位置情報を受け取って保存するエンドポイント
app.post('/', async (c) => {
  try {
    const { user_id, latitude, longitude } = await c.req.json();

    // バリデーション
    if (!latitude || !longitude) {
      return c.json({ error: 'Latitude and longitude are required' }, 400);
    }

    console.log(`Received location update: lat=${latitude}, lng=${longitude}, user=${user_id || 'anonymous'}`);

    // user_idがある場合はユーザーと紐づけて保存、ない場合は匿名ユーザーとして扱う
    const locationData = {
      user_id: user_id || 'anonymous',
      latitude,
      longitude,
      recorded_at: new Date().toISOString()
    };

    // user_locationsテーブルに位置情報を保存
    const { data, error } = await supabase
      .from('user_locations')
      .insert([locationData]);

    if (error) {
      console.error('Error saving user location:', error);
      return c.json({ error: 'Failed to save location data' }, 500);
    }

    return c.json({ success: true, message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error in updateUserLocation:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// レスポンスに全てのランドマークを含めるバージョン
app.post('/with-landmarks', async (c) => {
  try {
    const { user_id, latitude, longitude } = await c.req.json();

    // バリデーション
    if (!latitude || !longitude) {
      return c.json({ error: 'Latitude and longitude are required' }, 400);
    }

    console.log(`Received location update: lat=${latitude}, lng=${longitude}, user=${user_id || 'anonymous'}`);

    // 位置情報を保存
    const locationData = {
      user_id: user_id || 'anonymous',
      latitude,
      longitude,
      recorded_at: new Date().toISOString()
    };

    // user_locationsテーブルに位置情報を保存
    const { error: locationError } = await supabase
      .from('user_locations')
      .insert([locationData]);

    if (locationError) {
      console.error('Error saving user location:', locationError);
      // エラーがあっても処理を続行
    }

    // すべてのランドマークを取得
    const { data: landmarks, error: landmarksError } = await supabase
      .from('landmarks')
      .select('*');

    if (landmarksError) {
      console.error('Error fetching landmarks:', landmarksError);
      return c.json({ error: 'Failed to fetch landmarks' }, 500);
    }

    // 成功レスポンスを返す（ランドマーク情報を含む）
    return c.json({ 
      success: true, 
      message: 'Location updated successfully',
      landmarks: landmarks || [] 
    });
  } catch (error) {
    console.error('Error in updateUserLocation:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// デフォルトエクスポートを追加
export default app;
