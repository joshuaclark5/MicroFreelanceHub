import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// --- CONFIG ---
config({ path: '.env.local' });
// ⚠️ TIP: You can swap this to 'https://www.microfreelancehub.com' to test production!
const BASE_URL = process.env.SITE_URL || 'http://localhost:3000'; 

// --- INIT SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAllPages() {
  console.log(`🏥 Starting Health Check on: ${BASE_URL}`);

  // 1. Get ALL slugs (and document_type for fancy logging)
  const { data: pages, error } = await supabase
    .from('seo_pages')
    .select('slug, job_title, document_type')
    .order('created_at', { ascending: false }); // Check newest (Invoices) first

  if (error) throw error;
  if (!pages || pages.length === 0) {
    console.log('❌ No pages found in DB!');
    return;
  }

  console.log(`📋 Found ${pages.length} pages. Batched pinging starting...`);

  let successCount = 0;
  let failCount = 0;
  const failedUrls: string[] = [];

  // 2. BATCH PROCESSING (Process 20 at a time for speed)
  const BATCH_SIZE = 20;
  
  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batch = pages.slice(i, i + BATCH_SIZE);
    
    // Run these 20 in parallel
    await Promise.all(batch.map(async (page) => {
      const url = `${BASE_URL}/templates/${page.slug}`;
      const isInvoice = page.document_type === 'Invoice';
      const icon = isInvoice ? '💸' : '🛡️ '; // Visual indicator

      try {
        const start = Date.now();
        const res = await fetch(url);
        const duration = Date.now() - start;

        if (res.status === 200) {
          successCount++;
          // Only log every few successes to keep console clean, OR log all if you want to see the stream
          // Currently logging everything to show you the "Invoice" labels working
          console.log(`   ✅ [${res.status}] ${icon} ${page.job_title} (${duration}ms)`);
        } else {
          failCount++;
          console.error(`   ❌ [${res.status}] ${icon} FAILED: ${page.job_title} -> ${url}`);
          failedUrls.push(url);
        }
      } catch (err: any) {
        failCount++;
        console.error(`   💀 NETWORK ERROR: ${url} - ${err.message}`);
        failedUrls.push(url);
      }
    }));
  }

  // 3. Final Report
  console.log('\n--- 🏁 QC REPORT ---');
  console.log(`✅ Alive: ${successCount}`);
  console.log(`❌ Dead:  ${failCount}`);
  
  if (failCount > 0) {
    console.log('\n👇 Fix these broken pages:');
    failedUrls.forEach(u => console.log(u));
  } else {
    console.log('\n✨ PERFECT SCORE! All pages are accessible.');
  }
}

checkAllPages();