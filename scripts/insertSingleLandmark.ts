import * as dotenv from 'dotenv';
import { supabase } from '../src/utils/supabase.ts';

dotenv.config();

/**
 * サンプルランドマークを挿入するテスト
 */
const insertSample = async () => {
  try {
    const sampleLandmark = {
      name: "大阪城",
      address: "大阪府大阪市中央区大阪城1-1",
      latitude: 34.6873,
      longitude: 135.5262,
      genre_code: "0304",
      genre_name: "史跡・名所",
      created_at: new Date().toISOString()
    };

    console.log("Inserting sample landmark...");
    
    const { data, error } = await supabase
      .from('landmarks')
      .insert([sampleLandmark]);
      
    if (error) {
      console.error("Error inserting sample:", error);
    } else {
      console.log("Sample inserted successfully!");
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
};

insertSample()
  .catch(console.error)
  .finally(() => {
    console.log("Test completed");
  });
