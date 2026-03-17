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
  // 💻 Software & Engineering
  { job_title: 'Front End Developer', document_type: 'Invoice' },
  { job_title: 'Back End Developer', document_type: 'Invoice' },
  { job_title: 'Full Stack Developer', document_type: 'Invoice' },
  { job_title: 'Mobile App Developer', document_type: 'Invoice' },
  { job_title: 'Shopify Developer', document_type: 'Invoice' },
  { job_title: 'WordPress Developer', document_type: 'Invoice' },
  { job_title: 'Webflow Developer', document_type: 'Invoice' },
  { job_title: 'Software Architect', document_type: 'Invoice' },
  { job_title: 'QA Tester', document_type: 'Invoice' },
  { job_title: 'DevOps Engineer', document_type: 'Invoice' },

  // 🎨 Design & Creative (Filtered for duplicates)
  { job_title: 'UI UX Designer', document_type: 'Invoice' },
  { job_title: 'Brand Identity Designer', document_type: 'Invoice' },
  { job_title: 'Brand Strategist', document_type: 'Invoice' },
  { job_title: 'Logo Designer', document_type: 'Invoice' },
  { job_title: 'Digital Illustrator', document_type: 'Invoice' },
  { job_title: '3D Modeler', document_type: 'Invoice' },
  { job_title: '2D Animator', document_type: 'Invoice' },
  { job_title: 'Podcast Editor', document_type: 'Invoice' },
  { job_title: 'Voice Actor', document_type: 'Invoice' },
  { job_title: 'Motion Graphics Designer', document_type: 'Invoice' },

  // 📈 Digital Marketing & SEO
  { job_title: 'SEO Consultant', document_type: 'Invoice' },
  { job_title: 'PPC Specialist', document_type: 'Invoice' },
  { job_title: 'Social Media Manager', document_type: 'Invoice' },
  { job_title: 'Content Marketer', document_type: 'Invoice' },
  { job_title: 'Email Marketing Specialist', document_type: 'Invoice' },
  { job_title: 'Affiliate Marketing Manager', document_type: 'Invoice' },
  { job_title: 'Influencer Marketing Manager', document_type: 'Invoice' },
  { job_title: 'Conversion Rate Optimizer', document_type: 'Invoice' },
  { job_title: 'Sales Funnel Consultant', document_type: 'Invoice' },
  { job_title: 'Public Relations Freelancer', document_type: 'Invoice' },

  // ✍️ Specialized Writing (Filtered for generic "Copywriter")
  { job_title: 'Content Writer', document_type: 'Invoice' },
  { job_title: 'Technical Writer', document_type: 'Invoice' },
  { job_title: 'Grant Writer', document_type: 'Invoice' },
  { job_title: 'Ghostwriter', document_type: 'Invoice' },
  { job_title: 'Freelance Blogger', document_type: 'Invoice' },

  // ☁️ IT, Cloud & Data
  { job_title: 'Data Analyst', document_type: 'Invoice' },
  { job_title: 'Data Scientist', document_type: 'Invoice' },
  { job_title: 'Machine Learning Engineer', document_type: 'Invoice' },
  { job_title: 'Cloud Architect', document_type: 'Invoice' },
  { job_title: 'Cybersecurity Consultant', document_type: 'Invoice' },
  { job_title: 'Penetration Tester', document_type: 'Invoice' },
  { job_title: 'IT Support Specialist', document_type: 'Invoice' },
  { job_title: 'Database Administrator', document_type: 'Invoice' },

  // 👔 Management, Ops & B2B
  { job_title: 'Product Manager', document_type: 'Invoice' },
  { job_title: 'Project Manager', document_type: 'Invoice' },
  { job_title: 'Scrum Master', document_type: 'Invoice' },
  { job_title: 'Agile Coach', document_type: 'Invoice' },
  { job_title: 'Virtual Assistant', document_type: 'Invoice' },
  { job_title: 'Online Business Manager', document_type: 'Invoice' },
  { job_title: 'E-commerce Consultant', document_type: 'Invoice' },
];

async function seedDatabase() {
  console.log('🌱 Planting seeds for Batch 8 (Digital, Tech & B2B Invoices)...');

  const rowsToInsert = batch8Pages.map((page) => {
    // Standardize slug creation
    const baseSlug = page.job_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-invoice-template`;

    return {
      slug: slug,
      job_title: page.job_title,
      keyword: `${page.job_title.toLowerCase()} invoice template`,
      document_type: page.document_type,
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
    console.log(`\n🚀 NEXT STEP: Run 'npx tsx run-seo-invoices.ts' to let Gemini write the content.`);
  }
}

seedDatabase();