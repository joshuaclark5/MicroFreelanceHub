import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

const professions = [
  'Roofer',
  'HVAC Contractor',
  'Flooring Installer',
  'Drywall Contractor',
  'Masonry Contractor',
  'Pool Contractor',
  'Solar Installer',
  'Window Installer',
  'Deck Builder',
  'Excavation Contractor',
  'Kitchen Remodeler',
  'Bathroom Remodeler',
  'Fence Installer',
  'Tile Installer',
  'Garage Door Installer',
];

async function seedBatch19() {
  console.log('Planting seeds for Batch 19 (Deposit Agreements)...');

  const rowsToInsert = professions.map((job) => {
    const baseSlug = job.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return {
      slug: `${baseSlug}-deposit-agreement`,
      job_title: job,
      keyword: `${job.toLowerCase()} deposit agreement template`,
      document_type: 'Deposit Agreement',
      intent: 'transactional',
      batch_label: 'Batch 19',
    };
  });

  const { data, error } = await supabase
    .from('seo_pages')
    .upsert(rowsToInsert, { onConflict: 'slug' })
    .select();

  if (error) {
    console.error('Error inserting seeds:', error);
  } else {
    console.log(`Successfully planted ${data.length} SEO pages.`);
  }
}

seedBatch19();
