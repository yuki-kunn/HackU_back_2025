import * as dotenv from 'dotenv';
import { supabase } from '../src/utils/supabase';

dotenv.config();

const createTable = async () => {
  try {
    // supabase-jsではSQLの実行が限定的なので、RPC関数を使用
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: `
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
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      return;
    }

    console.log('Table created or already exists');
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

// もしSupabaseがRPC関数をサポートしていない場合は、
// Supabase Dashboardの「SQL Editor」から上記のSQLを実行してください

createTable()
  .catch(console.error)
  .finally(() => {
    console.log('Table creation process completed');
  });
