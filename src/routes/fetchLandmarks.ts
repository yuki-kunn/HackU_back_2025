import { Hono } from 'hono';
import { supabase } from '../utils/supabase.ts';

const app = new Hono();

app.get('/', async (c) => {
  const { data, error } = await supabase.from('landmarks').select('*');
  if (error) return c.json({ error: error.message }, 500);

  return c.json(data);
});

export default app;