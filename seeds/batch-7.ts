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
  // 🚜 Heavy Equipment & Dirt Work
  { job_title: 'Excavation Contractor', document_type: 'Invoice' },
  { job_title: 'Bobcat Service', document_type: 'Invoice' },
  { job_title: 'Trenching Service', document_type: 'Invoice' },
  { job_title: 'Grading Contractor', document_type: 'Invoice' },
  { job_title: 'Land Clearing Service', document_type: 'Invoice' },
  { job_title: 'Dump Truck Operator', document_type: 'Invoice' },
  
  // 🪨 Concrete, Paving & Masonry
  { job_title: 'Concrete Pourer', document_type: 'Invoice' },
  { job_title: 'Asphalt Paving Contractor', document_type: 'Invoice' },
  { job_title: 'Driveway Sealcoating Service', document_type: 'Invoice' },
  { job_title: 'Masonry Contractor', document_type: 'Invoice' },
  { job_title: 'Bricklayer', document_type: 'Invoice' },
  { job_title: 'Foundation Repair Contractor', document_type: 'Invoice' },
  { job_title: 'Waterproofing Contractor', document_type: 'Invoice' },
  
  // 🌲 Trees & Landscaping
  { job_title: 'Landscaping Contractor', document_type: 'Invoice' },
  { job_title: 'Lawn Care Service', document_type: 'Invoice' },
  { job_title: 'Tree Removal Specialist', document_type: 'Invoice' },
  { job_title: 'Arborist', document_type: 'Invoice' },
  { job_title: 'Stump Grinding Service', document_type: 'Invoice' },
  { job_title: 'Mulch Delivery and Installation', document_type: 'Invoice' },
  { job_title: 'Topsoil Delivery', document_type: 'Invoice' },
  { job_title: 'Yard Waste Removal Service', document_type: 'Invoice' },
  { job_title: 'Artificial Turf Installer', document_type: 'Invoice' },
  
  // 💧 Water & Drainage
  { job_title: 'Sprinkler System Installer', document_type: 'Invoice' },
  { job_title: 'Irrigation Contractor', document_type: 'Invoice' },
  { job_title: 'French Drain Installer', document_type: 'Invoice' },
  { job_title: 'Septic Tank Excavator', document_type: 'Invoice' },
  
  // 🔨 Exterior Construction
  { job_title: 'Fence Installer', document_type: 'Invoice' },
  { job_title: 'Deck Builder', document_type: 'Invoice' },
  { job_title: 'Patio Contractor', document_type: 'Invoice' },
  { job_title: 'Retaining Wall Builder', document_type: 'Invoice' },
  { job_title: 'Hardscaping Contractor', document_type: 'Invoice' },
  { job_title: 'Paver Installation Specialist', document_type: 'Invoice' },
  { job_title: 'Outdoor Kitchen Builder', document_type: 'Invoice' },
  { job_title: 'Pergola Builder', document_type: 'Invoice' },
  
  // 🏠 Home Exterior Maintenance
  { job_title: 'Gutter Cleaning Service', document_type: 'Invoice' },
  { job_title: 'Gutter Installation Contractor', document_type: 'Invoice' },
  { job_title: 'Siding Contractor', document_type: 'Invoice' },
  { job_title: 'Stucco Contractor', document_type: 'Invoice' },
  { job_title: 'Exterior Painter', document_type: 'Invoice' },
  { job_title: 'Power Washing Service', document_type: 'Invoice' },
  { job_title: 'Pressure Washing Contractor', document_type: 'Invoice' },
  { job_title: 'Window Cleaning Service', document_type: 'Invoice' },
  { job_title: 'Roof Cleaning Service', document_type: 'Invoice' },
  { job_title: 'Awning Installer', document_type: 'Invoice' },
  { job_title: 'Landscape Lighting Specialist', document_type: 'Invoice' },
  { job_title: 'Greenhouse Installer', document_type: 'Invoice' },
  
  // ❄️ Seasonal
  { job_title: 'Snow Removal Service', document_type: 'Invoice' },
  { job_title: 'Commercial Snow Plow Operator', document_type: 'Invoice' },
  { job_title: 'Ice Management Service', document_type: 'Invoice' },
  { job_title: 'Holiday Lighting Installer', document_type: 'Invoice' },
];

async function seedDatabase() {
  console.log('🌱 Planting seeds for Batch 7 (Exterior Trades Invoices)...');

  const rowsToInsert = batch7Pages.map((page) => {
    // Standardize slug creation
    const baseSlug = page.job_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-invoice-template`;

    return {
      slug: slug,
      job_title: page.job_title,
      keyword: `${page.job_title.toLowerCase()} invoice template`,
      document_type: page.document_type,
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
    console.log(`\n🚀 NEXT STEP: Run 'npx tsx run-seo-invoices.ts' to let Gemini write the content.`);
  }
}

seedDatabase();