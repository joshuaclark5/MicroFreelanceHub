import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// --- LOAD SECRETS ---
config({ path: '.env.local' });

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('MISSING: SUPABASE_SERVICE_ROLE_KEY');

// --- INIT CLIENT ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- THE LIST ---
const batch1Jobs = [
  // Residential & Service
  "Residential Plumber", "Emergency Plumber", "Bathroom Remodel Plumber",
  "Kitchen Plumbing Installer", "Water Heater Installer", "Tankless Water Heater Tech",
  "Leak Detection Specialist", "Drain Cleaning Service", "Hydro Jetting Technician",
  "Sump Pump Installer", "Garbage Disposal Installer", "Water Softener Installer",
  "Water Filtration Tech", "Re-piping Specialist", "Sewer Line Repair",

  // Commercial & Industrial
  "Commercial Plumbing Subcontractor", "Industrial Pipefitter", "Steamfitter",
  "Boiler Technician", "Medical Gas Installer", "Fire Sprinkler Fitter",
  "Fire Suppression Tech", "Process Piping", "Pipeline Welder",
  "Oil and Gas Pipefitter",

  // Septic & Utility
  "Septic System Installer", "Septic Tank Pumper", "Leach Field Repair",
  "Sewer Camera Inspection", "Underground Utility Contractor", "Storm Drain Installer",
  "Backflow Testing", "Grease Trap Cleaning", "Portable Toilet Rental",
  "Dewatering Subcontractor",

  // Specialized Water
  "Pool Plumbing Contractor", "Spa and Hot Tub Repair", "Fountain Installation",
  "Rainwater Harvesting System", "Greywater System Installer", "Solar Water Heating Tech",
  "Radiant Floor Heating Installer", "Hydronic Heating Specialist",

  // Business/B2B
  "Plumbing Apprentice Employment", "Journeyman Plumber", "Master Plumber Consulting",
  "Plumbing Estimator", "Plumbing Maintenance Annual", "Winterization Service",
  "Plumbing Inspection"
];

// --- HELPER: Slugify ---
function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Swap spaces for hyphens
    .replace(/^-+|-+$/g, '') + '-contract-template'; // Add standard suffix
}

// --- MAIN ---
async function seed() {
  console.log(`🌱 Seeding Batch 1: Water & Pipe Cluster (${batch1Jobs.length} pages)...`);

  const rows = batch1Jobs.map(job => ({
    job_title: job,
    keyword: job, // ✅ FIXED: Now includes the required keyword
    slug: toSlug(job),
    document_type: 'Contract',
    batch_label: 'batch_1_water_pipe',
    intent: 'transactional',
    // We leave these NULL so the AI knows to target them
    pain_point_hook: null,
    legal_tip: null,
    deliverables: null 
  }));

  // Upsert (Insert or Update if slug exists)
  const { data, error } = await supabase
    .from('seo_pages')
    .upsert(rows, { onConflict: 'slug' })
    .select();

  if (error) {
    console.error('❌ Error seeding:', error);
  } else {
    console.log(`✅ Successfully planted ${data.length} rows.`);
    console.log('👉 Now run "npx tsx run-seo.ts" to enrich them!');
  }
}

seed();