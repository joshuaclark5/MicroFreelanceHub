import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ Missing Environment Variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const competitors = [
  // --- General Freelance / Creative ---
  "HoneyBook",
  "Dubsado",
  "Bonsai",
  "Fiverr",
  "Upwork",
  "Contra",
  "Lano",
  "Moxie",
  
  // --- Trades & Field Service ---
  "Jobber",
  "Housecall Pro",
  "ServiceTitan",
  "Thumbtack",
  "Angi",
  "Joist",
  "Tradify",
  "Invoice2go",
  
  // --- Payments & Legal ---
  "DocuSign",
  "PandaDoc",
  "Stripe Invoicing",
  "PayPal Invoicing",
  "Square Invoicing",
  "Escrow.com",
  "QuickBooks Online",
  "FreshBooks"
];

const competitorBatch = competitors.map(comp => {
  const slug = `alternative-to-${comp.toLowerCase().replace(/[\s\.]+/g, '-')}`;
  return {
    job_title: comp, // Using job_title column temporarily to hold the competitor name
    slug: slug,
    document_type: "Comparison", // New type!
    keyword: `${comp} alternative`,
    intent: 'commercial', // New intent!
    seo_title: `Best ${comp} Alternative for Freelancers (2026)`,
    seo_desc: `Tired of ${comp}'s high fees and complex software? See why freelancers are switching to MicroFreelanceHub for simple contracts and instant payments.`,
    batch_label: 'batch_8_competitors'
  };
});

async function seedBatch8() {
  console.log('🚀 Starting Batch 8: COMPETITOR Pages...');
  
  for (const page of competitorBatch) {
    const { data: existing } = await supabase
      .from('seo_pages')
      .select('id')
      .eq('slug', page.slug)
      .single();

    if (existing) {
      console.log(`   ⏭️  Skipping (Exists): ${page.slug}`);
    } else {
      const { error } = await supabase
        .from('seo_pages')
        .insert(page);

      if (error) console.error(`   ❌ Error: ${page.slug}`, error.message);
      else console.log(`   ✅ Created: ${page.slug}`);
    }
  }
  
  console.log('🏁 Batch 8 Complete. Next step: Create the AI script to analyze them!');
}

seedBatch8();