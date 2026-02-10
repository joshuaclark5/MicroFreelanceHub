import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// --- CONFIG ---
config({ path: '.env.local' });
const BASE_URL = 'http://localhost:3000'; // Test against your local running server

// --- INIT SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAllPages() {
  console.log('🕵️‍♂️ Starting Quality Control Check...');

  // 1. Get ALL slugs from the database
  const { data: pages, error } = await supabase
    .from('seo_pages')
    .select('slug, job_title');

  if (error) throw error;
  if (!pages || pages.length === 0) {
    console.log('❌ No pages found in DB!');
    return;
  }

  console.log(`📋 Found ${pages.length} pages to test. Connecting to ${BASE_URL}...`);

  let successCount = 0;
  let failCount = 0;
  const failedUrls = [];

  // 2. Loop through and "ping" each one
  for (const [index, page] of pages.entries()) {
    const url = `${BASE_URL}/templates/${page.slug}`;
    
    try {
      const start = Date.now();
      const res = await fetch(url);
      const duration = Date.now() - start;

      if (res.status === 200) {
        successCount++;
        // Print every 10th success just to show life, or if it's slow
        if (index % 10 === 0) console.log(`   ✅ [${index + 1}/${pages.length}] 200 OK: ${page.job_title} (${duration}ms)`);
      } else {
        failCount++;
        console.error(`   ❌ [${res.status}] FAILED: ${page.job_title} -> ${url}`);
        failedUrls.push(url);
      }
    } catch (err) {
      failCount++;
      console.error(`   💀 NETWORK ERROR: ${url}`);
      failedUrls.push(url);
    }
  }

  // 3. Final Report
  console.log('\n--- 🏁 QC REPORT ---');
  console.log(`✅ Passed: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  
  if (failCount > 0) {
    console.log('\n👇 Fix these broken pages:');
    failedUrls.forEach(u => console.log(u));
  } else {
    console.log('\n✨ PERFECT SCORE! All pages are accessible.');
  }
}

checkAllPages();