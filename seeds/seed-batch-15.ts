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

async function seedBatch15() {
  console.log('🌱 Planting seeds for Batch 15 (Subcontractor & NDAs)...');

  const rowsToInsert: any[] = [];

  professions.forEach((job) => {
    const baseSlug = job.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    rowsToInsert.push({
      slug: `${baseSlug}-subcontractor-agreement`,
      job_title: job,
      keyword: `${job.toLowerCase()} subcontractor agreement template`,
      document_type: 'Subcontractor Agreement',
      intent: 'transactional',
      batch_label: 'Batch 15'
    });

    rowsToInsert.push({
      slug: `${baseSlug}-non-disclosure-agreement`,
      job_title: job,
      keyword: `${job.toLowerCase()} nda non disclosure agreement`,
      document_type: 'Non-Disclosure Agreement',
      intent: 'transactional',
      batch_label: 'Batch 15'
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

seedBatch15();