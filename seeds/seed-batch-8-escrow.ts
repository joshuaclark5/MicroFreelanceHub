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

const batch8Pages = [
  // 📸 Visual Creatives (Highest Theft Risk)
  { job_title: 'Freelance Photographer' },
  { job_title: 'Wedding Photographer' },
  { job_title: 'Real Estate Photographer' },
  { job_title: 'Event Photographer' },
  { job_title: 'Portrait Photographer' },
  { job_title: 'Commercial Photographer' },
  { job_title: 'Freelance Videographer' },
  { job_title: 'Drone Videographer' },
  { job_title: 'Music Video Director' },
  { job_title: 'Video Editor' },

  // 🎨 Design & Branding
  { job_title: 'Graphic Designer' },
  { job_title: 'Logo Designer' },
  { job_title: 'Brand Identity Designer' },
  { job_title: 'UI/UX Designer' },
  { job_title: 'Web Designer' },
  { job_title: 'Freelance Illustrator' },
  { job_title: '3D Modeler' },
  { job_title: 'Animator' },
  { job_title: 'Motion Graphics Designer' },
  { job_title: 'Storyboard Artist' },

  // 💻 Code & Web Development
  { job_title: 'Freelance Web Developer' },
  { job_title: 'Frontend Developer' },
  { job_title: 'WordPress Developer' },
  { job_title: 'Shopify Expert' },
  { job_title: 'Webflow Developer' },
  { job_title: 'Mobile App Developer' },
  { job_title: 'Software Engineer' },
  { job_title: 'Smart Contract Developer' },
  { job_title: 'API Integration Specialist' },
  { job_title: 'Game Developer' },

  // 📝 Writing, Audio & Consulting
  { job_title: 'Freelance Copywriter' },
  { job_title: 'SEO Content Writer' },
  { job_title: 'Technical Writer' },
  { job_title: 'Ghostwriter' },
  { job_title: 'Grant Writer' },
  { job_title: 'Audio Engineer' },
  { job_title: 'Podcast Producer' },
  { job_title: 'Voiceover Artist' },
  { job_title: 'Beatmaker' },
  { job_title: 'Mixing and Mastering Engineer' },

  // 📈 Marketing & Strategy
  { job_title: 'Digital Marketer' },
  { job_title: 'Social Media Manager' },
  { job_title: 'SEO Consultant' },
  { job_title: 'PPC Specialist' },
  { job_title: 'Email Marketing Specialist' },
  { job_title: 'Public Relations Freelancer' },
  { job_title: 'Business Consultant' },
  { job_title: 'Data Analyst' },
  { job_title: 'Market Researcher' },
  { job_title: 'Virtual Assistant' }
];

async function seedDatabase() {
  console.log('🌱 Planting seeds for Batch 8 (Digital Escrow / Watermarking Waitlist)...');

  const rowsToInsert = batch8Pages.map((page) => {
    const baseSlug = page.job_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `watermark-files-${baseSlug}`; // New URL format

    return {
      slug: slug,
      job_title: page.job_title,
      keyword: `how to watermark files as a ${page.job_title.toLowerCase()}`,
      document_type: 'Contract', // We'll hijack the Contract chameleon logic later to show an Escrow UI
      intent: 'transactional',
      batch_label: 'Batch 8',
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
    console.log(`\n🚀 NEXT STEP: We will need a new AI generation script for these specific pages.`);
  }
}

seedDatabase();