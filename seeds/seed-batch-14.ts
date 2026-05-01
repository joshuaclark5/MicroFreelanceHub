import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

// The Core 25 High-Value Professions (Duplicate-Safe)
const professions = [
  'Web Developer', 'Graphic Designer', 'SEO Consultant', 'Freelance Copywriter',
  'Video Editor', 'Machinist', 'Freelance Photographer', 'Social Media Manager',
  'IT Consultant', 'Landscaper', 'House Cleaner', 'General Contractor',
  'Painter', 'Plumber', 'Electrician', 'App Developer', 'UI UX Designer',
  'UGC Creator', 'Wedding Planner', 'Caterer', 'Event DJ', 
  'Personal Trainer', 'Interior Designer', 'Virtual Assistant', 'PR Consultant'
];

async function seedBatch14() {
  console.log('🌱 Planting seeds for Batch 14 (Scope of Work & Work Orders)...');

  const rowsToInsert: any[] = [];

  professions.forEach((job) => {
    const baseSlug = job.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // 1. Create Scope of Work Page
    rowsToInsert.push({
      slug: `${baseSlug}-scope-of-work-template`,
      job_title: job,
      keyword: `${job.toLowerCase()} scope of work template`,
      document_type: 'Scope of Work',
      intent: 'transactional',
      batch_label: 'Batch 14'
    });

    // 2. Create Work Order Page
    rowsToInsert.push({
      slug: `${baseSlug}-work-order-template`,
      job_title: job,
      keyword: `${job.toLowerCase()} work order template`,
      document_type: 'Work Order',
      intent: 'transactional',
      batch_label: 'Batch 14'
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

seedBatch14();