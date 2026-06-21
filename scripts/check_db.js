import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Check orders columns
  const { data: orderData, error: orderErr } = await supabase.from('orders').select('*').limit(1);
  console.log('Orders Columns:', orderData ? Object.keys(orderData[0] || {}) : orderErr);

  // Check buckets
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  console.log('Buckets:', buckets, bucketErr);
}

main();
