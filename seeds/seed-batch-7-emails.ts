import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load env vars
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase env variables. Check .env.local');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const batch7Pages = [
  // 🛠️ Skilled Trades & Home Services
  { job_title: 'Plumber' },
  { job_title: 'Electrician' },
  { job_title: 'HVAC Technician' },
  { job_title: 'Handyman' },
  { job_title: 'Carpenter' },
  { job_title: 'General Contractor' },
  { job_title: 'Roofer' },
  { job_title: 'Painter' },
  { job_title: 'Drywall Finisher' },
  { job_title: 'Tile Setter' },
  { job_title: 'Landscaper' },
  { job_title: 'Arborist' },
  { job_title: 'Pool Cleaner' },
  { job_title: 'Pest Control' },
  { job_title: 'House Cleaner' },
  { job_title: 'Septic Servicer' },
  { job_title: 'Carpet Installer' },
  { job_title: 'Garage Door Tech' },
  { job_title: 'Siding Contractor' },
  { job_title: 'Asphalt Paver' },
  { job_title: 'Masonry Contractor' },
  { job_title: 'Appliance Repair' },
  { job_title: 'Home Inspector' },
  { job_title: 'Property Manager' },
  { job_title: 'Mobile Mechanic' },

  // 💻 Creative & Digital Professionals
  { job_title: 'Freelance Writer' },
  { job_title: 'Technical Writer' },
  { job_title: 'Copywriter' },
  { job_title: 'Medical Writer' },
  { job_title: 'Freelance Web Designer' },
  { job_title: 'UX Designer' },
  { job_title: 'Graphic Designer' },
  { job_title: 'Freelance Illustrator' },
  { job_title: 'Freelance Developer' },
  { job_title: 'Software Engineer' },
  { job_title: 'Data Analyst' },
  { job_title: 'Solidity Developer' },
  { job_title: 'Laravel Developer' },
  { job_title: 'Webflow Developer' },
  { job_title: 'SEO Consultant' },
  { job_title: 'Social Media Manager' },
  { job_title: 'Marketing Automation Specialist' },
  { job_title: 'Growth Hacker' },
  { job_title: 'Virtual Assistant' },
  { job_title: 'Executive Assistant' },
  { job_title: 'Freelance Photographer' },
  { job_title: 'Videographer' },
  { job_title: 'Video Editor' },
  { job_title: 'Audio Engineer' },
  { job_title: 'Voice Actor' }
];

async function seedDatabase() {
  console.log('🌱 Planting seeds for Batch 7 (Late Payment Email Templates)...');

  const rowsToInsert = batch7Pages.map((page) => {
    // Standardize base slug creation (e.g., "Plumber" -> "plumber")
    const baseSlug = page.job_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `late-payment-email-${baseSlug}`; // 🟢 Set to Email Slug format

    return {
      slug: slug,
      job_title: page.job_title,
      keyword: `late payment email template for ${page.job_title.toLowerCase()}`,
      document_type: 'Contract', // We use "Contract" to satisfy the DB schema constraints
      intent: 'transactional',
      batch_label: 'Batch 7',
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
    console.log(`\n🚀 NEXT STEP: Run 'npx tsx run-seo-late-emails.ts' to let Gemini write the emails.`);
  }
}

seedDatabase();