import * as dotenv from 'dotenv';
import { supabase } from '../src/utils/supabase.ts';

dotenv.config();

const clearLandmarksTable = async () => {
  console.log('Clearing landmarks table...');
  
  const { data, error } = await supabase
    .from('landmarks')
    .delete()
    .neq('id', 'dummy'); // すべての行を削除するトリック
  
  if (error) {
    console.error('Error clearing landmarks table:', error);
    throw error;
  }
  
  console.log('Landmarks table cleared successfully!');
};

clearLandmarksTable()
  .catch(error => {
    console.error('Failed to clear landmarks table:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Clear process finished');
  });
