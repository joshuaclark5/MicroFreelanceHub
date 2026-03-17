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

const batch9Pages = [
  // 🚗 Auto, Marine & Aviation Customization
  { job_title: 'Window Tinting Installer', document_type: 'Contract' },
  { job_title: 'Ceramic Coating Specialist', document_type: 'Contract' },
  { job_title: 'Paint Protection Film Installer', document_type: 'Contract' },
  { job_title: 'Vinyl Wrap Technician', document_type: 'Contract' },
  { job_title: 'Paintless Dent Repair Tech', document_type: 'Contract' },
  { job_title: 'Fleet Maintenance Mechanic', document_type: 'Contract' },
  { job_title: 'Mobile Tire Technician', document_type: 'Contract' },
  { job_title: 'Heavy Truck Mechanic', document_type: 'Contract' },
  { job_title: 'Aviation Mechanic', document_type: 'Contract' },
  { job_title: 'Aircraft Detailer', document_type: 'Contract' },

  // 🏡 Real Estate & Property Services
  { job_title: 'Real Estate Appraiser', document_type: 'Contract' },
  { job_title: 'Property Surveyor', document_type: 'Contract' },
  { job_title: 'Commercial Property Inspector', document_type: 'Contract' },
  { job_title: 'Title Searcher', document_type: 'Contract' },
  { job_title: 'Eviction Cleanout Contractor', document_type: 'Contract' },
  { job_title: 'Vacation Rental Cleaner', document_type: 'Contract' },
  { job_title: 'Short Term Rental Manager', document_type: 'Contract' },
  { job_title: 'HOA Management Consultant', document_type: 'Contract' },
  { job_title: 'Foreclosure Cleanout Service', document_type: 'Contract' },
  { job_title: 'Real Estate Videographer', document_type: 'Contract' },

  // 🎪 Event Production & Entertainment Ops
  { job_title: 'Stagehand Rigger', document_type: 'Contract' },
  { job_title: 'Event Security Contractor', document_type: 'Contract' },
  { job_title: 'Valet Parking Contractor', document_type: 'Contract' },
  { job_title: 'Wardrobe Stylist', document_type: 'Contract' },
  { job_title: 'Prop Stylist', document_type: 'Contract' },
  { job_title: 'AV Setup Technician', document_type: 'Contract' },

  // 🍽️ Commercial Food & Retail Repair
  { job_title: 'Commercial Kitchen Cleaner', document_type: 'Contract' },
  { job_title: 'Exhaust Hood Cleaner', document_type: 'Contract' },
  { job_title: 'Vending Machine Technician', document_type: 'Contract' },
  { job_title: 'ATM Repair Technician', document_type: 'Contract' },
  { job_title: 'Espresso Machine Technician', document_type: 'Contract' },
  { job_title: 'Draft Beer Machine Mechanic', document_type: 'Contract' },
  { job_title: 'Walk-In Cooler Repair Tech', document_type: 'Contract' },

  // 🏭 Warehouse & Commercial Maintenance
  { job_title: 'Loading Dock Repair Tech', document_type: 'Contract' },
  { job_title: 'Pallet Rack Installer', document_type: 'Contract' },
  { job_title: 'Forklift Mechanic', document_type: 'Contract' },
  { job_title: 'Conveyor Belt Technician', document_type: 'Contract' },
  { job_title: 'Commercial Door Installer', document_type: 'Contract' },
  { job_title: 'Storefront Glass Installer', document_type: 'Contract' },
  { job_title: 'Soundproofing Contractor', document_type: 'Contract' },

  // 🛑 Parking Lot & Pavement Specialized
  { job_title: 'Parking Lot Striper', document_type: 'Contract' },
  { job_title: 'Line Striping Contractor', document_type: 'Contract' },
  { job_title: 'Asphalt Crack Sealer', document_type: 'Contract' },
  { job_title: 'Speed Bump Installer', document_type: 'Contract' },
  { job_title: 'Warehouse Floor Sweeper', document_type: 'Contract' },

  // 💡 Niche Fabrication & Install
  { job_title: 'Billboard Installer', document_type: 'Contract' },
  { job_title: 'Neon Sign Repair Tech', document_type: 'Contract' },
  { job_title: 'Custom Neon Fabricator', document_type: 'Contract' },
  { job_title: 'Silo Installer', document_type: 'Contract' },
  { job_title: 'Industrial Tent Installer', document_type: 'Contract' },
];

async function seedDatabase() {
  console.log('🌱 Planting seeds for Batch 9 (Specialized B2B Commercial Contracts)...');

  const rowsToInsert = batch9Pages.map((page) => {
    // Standardize slug creation
    const baseSlug = page.job_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-contract-template`;

    return {
      slug: slug,
      job_title: page.job_title,
      keyword: `${page.job_title.toLowerCase()} contract template`,
      document_type: page.document_type,
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
    console.log(`\n🚀 NEXT STEP: Run 'npx tsx run-seo.ts' to let Gemini write the Contracts.`);
  }
}

seedDatabase();