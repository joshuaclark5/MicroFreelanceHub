import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanBadPages() {
  console.log('🧹 Sweeping out the Frankenstein pages...');
  
  const { data, error } = await supabase
    .from('seo_pages')
    .delete()
    .like('slug', 'average-hourly-rate-%')
    .select();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log(`✅ Successfully deleted ${data?.length || 0} bad pages!`);
  }
}

cleanBadPages();