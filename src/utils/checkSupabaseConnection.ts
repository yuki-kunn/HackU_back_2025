import * as dotenv from 'dotenv';
import { supabase } from './supabase.ts';

dotenv.config();

// Supabaseへの接続テスト関数
const testSupabaseConnection = async () => {
  try {
    console.log('Supabase URL:', process.env.SUPABASE_URL);
    console.log('Testing connection to Supabase...');
    
    // サーバーの時間を取得するシンプルなクエリを実行
    const { data, error } = await supabase.rpc('get_server_time');
    
    if (error) {
      console.error('Connection error:', error);
    } else {
      console.log('Connection successful!');
      console.log('Server time:', data);
    }
    
    // テーブル情報を取得
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
    } else {
      console.log('Available tables:', tables);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

// テスト実行
testSupabaseConnection().catch(console.error);
