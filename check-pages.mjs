// check-pages.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL = 'http://localhost:3000'; // Make sure your local server is running!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase keys in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkPages() {
  console.log('🚀 Fetching pages from database...');
  
  const { data: pages, error } = await supabase
    .from('seo_pages')
    .select('slug');

  if (error) {
    console.error('❌ Database Error:', error.message);
    return;
  }

  console.log(`📋 Found ${pages.length} pages. Checking URLs...`);

  let successCount = 0;
  let errorCount = 0;

  for (const page of pages) {
    const url = `${BASE_URL}/hire/${page.slug}`;
    try {
      const res = await fetch(url);
      if (res.status === 200) {
        console.log(`✅ [200] ${page.slug}`);
        successCount++;
      } else {
        console.error(`❌ [${res.status}] ${page.slug} - ${url}`);
        errorCount++;
      }
    } catch (err) {
      console.error(`❌ [FETCH ERROR] ${page.slug}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n--- REPORT ---');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors:  ${errorCount}`);
}

checkPages();