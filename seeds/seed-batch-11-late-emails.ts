import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

const batch11Pages = [
  // 🪓 Heavy Trades & Mechanics (Including our favorite!)
  { job_title: 'Stump Grinder' },
  { job_title: 'Deck Builder' },
  { job_title: 'Flooring Installer' },
  { job_title: 'Sheet Metal Worker' },
  { job_title: 'Crane Operator' },
  { job_title: 'Demolition Contractor' },
  { job_title: 'Restoration Contractor' },
  { job_title: 'Insulation Installer' },
  { job_title: 'Plasterer' },
  { job_title: 'Boat Mechanic' },
  { job_title: 'Small Engine Mechanic' },

  // 📈 High-Ticket Consulting & Business
  { job_title: 'Financial Advisor' },
  { job_title: 'Legal Consultant' },
  { job_title: 'Compliance Consultant' },
  { job_title: 'Strategy Consultant' },
  { job_title: 'Change Management Consultant' },
  { job_title: 'Career Coach' },
  { job_title: 'Sustainability Consultant' },
  { job_title: 'Agile Coach' },
  { job_title: 'Fundraising Consultant' },
  { job_title: 'Technical Recruiter' },

  // 💻 Niche Digital & E-Commerce
  { job_title: 'App Store Optimization Specialist' },
  { job_title: 'Shopify Developer' },
  { job_title: 'Conversion Rate Optimizer' },
  { job_title: 'Affiliate Marketing Manager' },
  { job_title: 'Freelance Journalist' },
  { job_title: 'Financial Writer' },
  { job_title: 'Speechwriter' },
  { job_title: 'Subtitle Translator' },

  // 🎬 Production, Film & Media
  { job_title: 'Colorist' },
  { job_title: '3D Animator' },
  { job_title: 'Audio Visual Technician' },
  { job_title: 'Lighting Designer' },
  { job_title: 'Stage Manager' },
  { job_title: 'Photo Retoucher' },
  { job_title: 'Drone Pilot' },
  { job_title: 'Voiceover Director' },
  { job_title: 'Casting Director' },
  { job_title: 'Music Supervisor' },
  { job_title: 'Set Designer' },
  { job_title: 'Prop Stylist' },

  // 💄 Personal, Beauty & Unique Services
  { job_title: 'Freelance Makeup Artist' },
  { job_title: 'Freelance Hair Stylist' },
  { job_title: 'Wardrobe Stylist' },
  { job_title: 'Private Investigator' },
  { job_title: 'Process Server' },
  { job_title: 'Pilates Instructor' },
  { job_title: 'Sommelier' },
  { job_title: 'Feng Shui Consultant' },
  { job_title: 'Grant Evaluator' }
];

async function seedDatabase() {
  console.log('🌱 Planting seeds for Batch 11 (Late Payment Emails Part 4)...');

  const rowsToInsert = batch11Pages.map((page) => {
    const baseSlug = page.job_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `late-payment-email-${baseSlug}`; 

    return {
      slug: slug,
      job_title: page.job_title,
      keyword: `late payment email template for ${page.job_title.toLowerCase()}`,
      document_type: 'Contract', 
      intent: 'transactional',
      batch_label: 'Batch 11',
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