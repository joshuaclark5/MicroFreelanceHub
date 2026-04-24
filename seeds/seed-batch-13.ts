import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

// Target high-ticket professions where scope creep and ongoing work are common
const professions = [
  'Web Developer', 'Graphic Designer', 'SEO Consultant', 'Freelance Copywriter',
  'Video Editor', 'Machinist', 'Freelance Photographer', 'Social Media Manager',
  'IT Consultant', 'Landscaper', 'House Cleaner', 'General Contractor',
  'Painter', 'Plumber', 'Electrician', 'App Developer', 'UI UX Designer',
  'UGC Creator', 'Wedding Planner', 'Caterer', 'Event DJ', 
  'Personal Trainer', 'Interior Designer', 'Virtual Assistant', 'PR Consultant'
];

async function seedChangeOrdersAndRetainers() {
  console.log('🌱 Planting seeds for Batch 13 (Change Orders & Retainers)...');

  const rowsToInsert: any[] = [];

  professions.forEach((job) => {
    const baseSlug = job.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // 1. Create the Change Order Page
    rowsToInsert.push({
      slug: `${baseSlug}-change-order-template`,
      job_title: job,
      keyword: `${job.toLowerCase()} change order template`,
      document_type: 'Change Order',
      intent: 'transactional',
      batch_label: 'Batch 13'
    });

    // 2. Create the Retainer Agreement Page
    rowsToInsert.push({
      slug: `${baseSlug}-retainer-agreement`,
      job_title: job,
      keyword: `${job.toLowerCase()} retainer agreement`,
      document_type: 'Retainer',
      intent: 'transactional',
      batch_label: 'Batch 13'
    });
  });

  const { data, error } = await supabase
    .from('seo_pages')
    .upsert(rowsToInsert, { onConflict: 'slug' })
    .select();

  if (error) {
    console.error('❌ Error inserting seeds:', error);
  } else {
    console.log(`✅ Successfully planted ${data.length} SEO pages!`);
  }
}

seedChangeOrdersAndRetainers();