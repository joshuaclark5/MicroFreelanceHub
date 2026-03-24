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

const batch10Pages = [
  // 🚗 Auto, Marine & Aviation Customization
  { job_title: 'Window Tinting Installer', document_type: 'Invoice' },
  { job_title: 'Ceramic Coating Specialist', document_type: 'Invoice' },
  { job_title: 'Paint Protection Film Installer', document_type: 'Invoice' },
  { job_title: 'Vinyl Wrap Technician', document_type: 'Invoice' },
  { job_title: 'Paintless Dent Repair Tech', document_type: 'Invoice' },
  { job_title: 'Fleet Maintenance Mechanic', document_type: 'Invoice' },
  { job_title: 'Heavy Truck Mechanic', document_type: 'Invoice' },
  { job_title: 'Aviation Mechanic', document_type: 'Invoice' },
  { job_title: 'Aircraft Detailer', document_type: 'Invoice' },

  // 🏡 Real Estate & Property Services
  { job_title: 'Real Estate Appraiser', document_type: 'Invoice' },
  { job_title: 'Property Surveyor', document_type: 'Invoice' },
  { job_title: 'Commercial Property Inspector', document_type: 'Invoice' },
  { job_title: 'Title Searcher', document_type: 'Invoice' },
  { job_title: 'Eviction Cleanout Contractor', document_type: 'Invoice' },
  { job_title: 'Vacation Rental Cleaner', document_type: 'Invoice' },
  { job_title: 'Short Term Rental Manager', document_type: 'Invoice' },
  { job_title: 'HOA Management Consultant', document_type: 'Invoice' },
  { job_title: 'Foreclosure Cleanout Service', document_type: 'Invoice' },
  { job_title: 'Real Estate Videographer', document_type: 'Invoice' },

  // 🎪 Event Production & Entertainment Ops
  { job_title: 'Stagehand Rigger', document_type: 'Invoice' },
  { job_title: 'Event Security Contractor', document_type: 'Invoice' },
  { job_title: 'Valet Parking Contractor', document_type: 'Invoice' },
  { job_title: 'Wardrobe Stylist', document_type: 'Invoice' },
  { job_title: 'Prop Stylist', document_type: 'Invoice' },
  { job_title: 'AV Setup Technician', document_type: 'Invoice' },

  // 🍽️ Commercial Food & Retail Repair
  { job_title: 'Commercial Kitchen Cleaner', document_type: 'Invoice' },
  { job_title: 'Exhaust Hood Cleaner', document_type: 'Invoice' },
  { job_title: 'Vending Machine Technician', document_type: 'Invoice' },
  { job_title: 'ATM Repair Technician', document_type: 'Invoice' },
  { job_title: 'Espresso Machine Technician', document_type: 'Invoice' },
  { job_title: 'Draft Beer Machine Mechanic', document_type: 'Invoice' },
  { job_title: 'Walk-In Cooler Repair Tech', document_type: 'Invoice' },

  // 🏭 Warehouse & Commercial Maintenance
  { job_title: 'Loading Dock Repair Tech', document_type: 'Invoice' },
  { job_title: 'Pallet Rack Installer', document_type: 'Invoice' },
  { job_title: 'Forklift Mechanic', document_type: 'Invoice' },
  { job_title: 'Conveyor Belt Technician', document_type: 'Invoice' },
  { job_title: 'Commercial Door Installer', document_type: 'Invoice' },
  { job_title: 'Storefront Glass Installer', document_type: 'Invoice' },
  { job_title: 'Soundproofing Contractor', document_type: 'Invoice' },

  // 🛑 Parking Lot & Pavement Specialized
  { job_title: 'Parking Lot Striper', document_type: 'Invoice' },
  { job_title: 'Line Striping Contractor', document_type: 'Invoice' },
  { job_title: 'Asphalt Crack Sealer', document_type: 'Invoice' },
  { job_title: 'Speed Bump Installer', document_type: 'Invoice' },
  { job_title: 'Warehouse Floor Sweeper', document_type: 'Invoice' },
  { job_title: 'Traffic Control Flagger', document_type: 'Invoice' },

  // 💡 Niche Fabrication & Install
  { job_title: 'Billboard Installer', document_type: 'Invoice' },
  { job_title: 'Neon Sign Repair Tech', document_type: 'Invoice' },
  { job_title: 'Custom Neon Fabricator', document_type: 'Invoice' },
  { job_title: 'Silo Installer', document_type: 'Invoice' },
  { job_title: 'Industrial Tent Installer', document_type: 'Invoice' },
];

async function seedDatabase() {
  console.log('🌱 Planting seeds for Batch 10 (Specialized B2B Commercial Invoices)...');

  const rowsToInsert = batch10Pages.map((page) => {
    // Standardize slug creation
    const baseSlug = page.job_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-invoice-template`; // 🟢 Set to Invoice

    return {
      slug: slug,
      job_title: page.job_title,
      keyword: `${page.job_title.toLowerCase()} invoice template`,
      document_type: page.document_type,
      intent: 'transactional',
      batch_label: 'Batch 10',
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
    console.log(`\n🚀 NEXT STEP: Run 'npx tsx run-seo-invoices.ts' to let Gemini write the Invoices.`);
  }
}

seedDatabase();