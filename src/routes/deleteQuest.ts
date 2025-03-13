import { Hono } from 'hono';
import { supabase } from '../utils/supabase.ts';

const app = new Hono();

app.delete('/:questId', async (c) => {
  const questId = c.req.param('questId');

  const { error } = await supabase.from('quests').delete().eq('id', questId);

  if (error) return c.json({ error: error.message }, 500);

  return c.json({ message: 'Quest deleted successfully' });
});

export default app;
