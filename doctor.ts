import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// --- CONFIG ---
config({ path: '.env.local' });
const BASE_URL = 'http://localhost:3000';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('MISSING: SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runAdvancedAudit() {
  console.log('🕵️ STARTING DEEP DIVE AUDIT...\n');
  let warnings = 0;

  // --- 1. SEO & RANKING POTENTIAL ---
  console.log('📈 Analyzing SEO Potential...');
  const { data: seoPages } = await supabase.from('seo_pages').select('*');
  
  if (seoPages && seoPages.length > 0) {
      console.log(`   • Scanning ${seoPages.length} SEO Pages...`);
      
      // Check Content Depth (Thin Content Penalty)
      const thinContent = seoPages.filter(p => (p.pain_point_hook?.length || 0) < 100);
      if (thinContent.length > 0) {
          console.log(`   ⚠️  SEO WARNING: ${thinContent.length} pages have "Thin Content" (< 100 chars in hook). Google hates this.`);
          warnings++;
      } else {
          console.log('   ✅ Content Depth: Healthy (Hooks are robust).');
      }

      // Check Keyword Cannibalization (Duplicate Job Titles)
      const titles = seoPages.map(p => p.job_title);
      const duplicates = titles.filter((item, index) => titles.indexOf(item) !== index);
      if (duplicates.length > 0) {
          console.log(`   ⚠️  SEO WARNING: Duplicate Keywords found: ${[...new Set(duplicates)].join(', ')}`);
          warnings++;
      }
  }

  // --- 2. CONVERSION & FUNNEL HEALTH ---
  console.log('\n💰 Analyzing Conversion Funnel...');
  const { data: drafts } = await supabase
    .from('sow_documents')
    .select('created_at')
    .eq('status', 'Draft');

  if (drafts) {
      const oldDrafts = drafts.filter(d => {
          const daysOld = (new Date().getTime() - new Date(d.created_at).getTime()) / (1000 * 3600 * 24);
          return daysOld > 30;
      });

      if (oldDrafts.length > 0) {
          console.log(`   ⚠️  CONVERSION ALERT: ${oldDrafts.length} contracts have been stuck in "Draft" for >30 days.`);
          console.log(`      -> Action: Consider sending a "Finish your contract" email campaign.`);
          warnings++;
      } else {
          console.log('   ✅ Funnel Velocity: Healthy (Drafts are converting or being deleted).');
      }
  }

  // --- 3. INTERLINKING CHECK (The Silo Test) ---
  console.log('\n🔗 Checking Interlinking Structure...');
  // We check if we have enough related pages to form a "Cluster"
  // e.g. If we have "Plumber", do we have "Handyman" or "HVAC"?
  const clusters: Record<string, number> = {};
  seoPages?.forEach(p => {
      const firstWord = p.job_title?.split(' ')[0] || 'Other';
      clusters[firstWord] = (clusters[firstWord] || 0) + 1;
  });

  const weakClusters = Object.entries(clusters).filter(([key, count]) => count < 3);
  if (weakClusters.length > 0) {
      console.log(`   ⚠️  ISOLATED CONTENT: The following topics have very few related pages (Hard to rank):`);
      console.log(`      -> ${weakClusters.map(c => c[0]).join(', ')}`);
      console.log(`      -> Advice: Generate more pages for these topics to create a strong "SEO Silo".`);
      warnings++;
  } else {
      console.log('   ✅ Site Structure: Good clustering found.');
  }

  console.log('\n---------------------------------------');
  if (warnings === 0) console.log('🏆 SCORE: 100/100 - Ready for Scale!');
  else console.log(`📋 AUDIT COMPLETE: Found ${warnings} strategic improvements.`);
}

runAdvancedAudit();