import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

const professions = [
  'Web Developer', 'Graphic Designer', 'SEO Consultant', 'Freelance Copywriter',
  'Video Editor', 'Machinist', 'Freelance Photographer', 'Social Media Manager',
  'IT Consultant', 'Landscaper', 'House Cleaner', 'General Contractor',
  'Painter', 'Plumber', 'Electrician', 'App Developer', 'UI UX Designer',
  'UGC Creator', 'Wedding Planner', 'Caterer', 'Event DJ', 
  'Personal Trainer', 'Interior Designer', 'Virtual Assistant', 'PR Consultant'
];

async function seedBatch17() {
  console.log('🌱 Planting seeds for Batch 17 (Service & Maintenance Agreements)...');

  const rowsToInsert: any[] = [];

  professions.forEach((job) => {
    const baseSlug = job.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    rowsToInsert.push({
      slug: `${baseSlug}-service-agreement`,
      job_title: job,
      keyword: `${job.toLowerCase()} service agreement template`,
      document_type: 'Service Agreement',
      intent: 'transactional',
      batch_label: 'Batch 17'
    });

    rowsToInsert.push({
      slug: `${baseSlug}-maintenance-agreement`,
      job_title: job,
      keyword: `${job.toLowerCase()} maintenance agreement template`,
      document_type: 'Maintenance Agreement',
      intent: 'transactional',
      batch_label: 'Batch 17'
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

seedBatch17();