import { Hono } from 'hono';
import { supabase } from '../utils/supabase.ts';

const app = new Hono();

app.get('/:userId', async (c) => {
  const userId = c.req.param('userId');

  const { data, error } = await supabase
    .from('quests')
    .select(`
      id,
      status,
      created_at,
      landmarks (
        id,
        name,
        description,
        latitude,
        longitude
      )
    `)
    .eq('user_id', userId);

  if (error) return c.json({ error: error.message }, 500);

  return c.json(data);
});

export default app;
