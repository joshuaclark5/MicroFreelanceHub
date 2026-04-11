import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

const batch9Pages = [
  // 💼 Consulting & Business
  { job_title: 'Business Coach' },
  { job_title: 'Life Coach' },
  { job_title: 'Bookkeeper' },
  { job_title: 'Freelance Accountant' },
  { job_title: 'HR Consultant' },
  { job_title: 'PR Consultant' },
  { job_title: 'Event Planner' },
  { job_title: 'Wedding Planner' },
  { job_title: 'Travel Advisor' },

  // 🎨 More Creative & Digital
  { job_title: '3D Artist' },
  { job_title: 'UI Designer' },
  { job_title: 'Brand Strategist' },
  { job_title: 'Podcast Editor' },
  { job_title: 'Music Producer' },
  { job_title: 'Sound Designer' },
  { job_title: 'Freelance Editor' },
  { job_title: 'Proofreader' },
  { job_title: 'Freelance Translator' },
  { job_title: 'Presentation Designer' },

  // 🧘‍♀️ Health, Wellness & Personal
  { job_title: 'Personal Trainer' },
  { job_title: 'Nutritionist' },
  { job_title: 'Yoga Instructor' },
  { job_title: 'Massage Therapist' },
  { job_title: 'Doula' },
  { job_title: 'Private Tutor' },

  // 💻 IT & Advanced Tech
  { job_title: 'IT Consultant' },
  { job_title: 'Network Administrator' },
  { job_title: 'Cybersecurity Analyst' },
  { job_title: 'Database Administrator' },
  { job_title: 'Cloud Architect' },
  { job_title: 'DevOps Engineer' },
  { job_title: 'QA Tester' },
  { job_title: 'Scrum Master' },
  { job_title: 'Product Manager' },
  { job_title: 'No-Code Developer' },

  // 🔨 Specialized Trades & Real Estate
  { job_title: 'Welder' },
  { job_title: 'Locksmith' },
  { job_title: 'Glazier' },
  { job_title: 'Concrete Contractor' },
  { job_title: 'Fencing Contractor' },
  { job_title: 'Tree Surgeon' },
  { job_title: 'Land Surveyor' },
  { job_title: 'Architect' },
  { job_title: 'Interior Designer' },
  { job_title: 'Draftsman' },
  { job_title: 'Home Stager' },
  { job_title: 'Custom Cabinet Maker' },
  { job_title: 'Upholsterer' },
  { job_title: 'Tailor' },
  { job_title: 'Home Appraiser' }
];

async function seedDatabase() {
  console.log('🌱 Planting seeds for Batch 9 (Late Payment Emails Part 2)...');

  const rowsToInsert = batch9Pages.map((page) => {
    const baseSlug = page.job_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `late-payment-email-${baseSlug}`; 

    return {
      slug: slug,
      job_title: page.job_title,
      keyword: `late payment email template for ${page.job_title.toLowerCase()}`,
      document_type: 'Contract', 
      intent: 'transactional',
      batch_label: 'Batch 9',
    };
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

seedDatabase();