import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('MISSING: SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkProgress() {
  console.log('🔍 Checking database status...\n');

  // 1. Count ALL valid templates (ignoring the Competitor Comparison pages)
  const { count: totalTemplates, error: err1 } = await supabase
    .from('seo_pages')
    .select('*', { count: 'exact', head: true })
    .neq('document_type', 'Comparison');

  // 2. Count how many are MISSING the 10/10 update
  const { count: missingUpdate, error: err2 } = await supabase
    .from('seo_pages')
    .select('*', { count: 'exact', head: true })
    .neq('document_type', 'Comparison')
    .or('why_it_matters.is.null,why_it_matters.eq.""');

  if (err1 || err2) {
    console.error('❌ Error checking database:', err1 || err2);
    return;
  }

  const total = totalTemplates || 0;
  const missing = missingUpdate || 0;
  const completed = total - missing;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  console.log('📊 --- MICROFREELANCE SEO PROGRESS --- 📊');
  console.log(`Total Templates (Excluding Comparisons): ${total}`);
  console.log(`✅ Fully Upgraded (10/10 Layout):      ${completed}`);
  console.log(`⏳ Still Waiting for Update:           ${missing}`);
  console.log(`\n🚀 Completion: ${percentage}%\n`);

  if (missing === 0) {
    console.log('🎉 YOU ARE 100% DONE! Go get some users!');
  } else {
    console.log(`👉 You still have ${missing} pages left. Run 'npx tsx run-seo.ts' to finish them.`);
  }
}

checkProgress();