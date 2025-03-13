import { Hono } from 'hono';
import { supabase } from '../utils/supabase.ts';

const app = new Hono();

app.post('/', async (c) => {
  const { user_id, landmark_id } = await c.req.json();

  if (!user_id || !landmark_id) {
    return c.json({ error: 'user_id and landmark_id are required' }, 400);
  }

  const { data, error } = await supabase.from('quests').insert({
    user_id,
    landmark_id,
    status: 'pending',
  });

  if (error) return c.json({ error: error.message }, 500);

  return c.json(data);
});

export default app;