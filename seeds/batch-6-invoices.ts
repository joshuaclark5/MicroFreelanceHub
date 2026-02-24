import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// 1. Load Environment Variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // MUST use Service Role to bypass RLS

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ Missing Environment Variables. Check .env.local');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. The Data (50 New Invoice Templates - Batch 6)
const rawBatch6 = [
  // --- HEAVY TRADES & EXTERIOR ---
  "Concrete Contractor",
  "Demolition Contractor",
  "Excavating Contractor",
  "Asphalt Paver",
  "Stucco Contractor",
  "Gutter Installer",
  "Garage Door Technician",
  "Deck Builder",
  "Land Surveyor",
  "Septic Tank Service",

  // --- HOME SPECIALTY & EMERGENCY ---
  "Mold Remediation Specialist",
  "Water Damage Restoration",
  "Fire Damage Restoration",
  "Home Inspector",
  "Security System Installer",
  "Solar Panel Installer",
  "Home Theater Installer",
  "Furniture Repair Specialist",
  "Upholstery Professional",
  "Piano Tuner",

  // --- AUTO & TRANSPORT ---
  "Auto Body Shop",
  "Windshield Repair Technician",
  "Tire Service Technician",
  "RV Mechanic",
  "Boat Mechanic",
  "Courier Service",
  "Freight Dispatcher",
  "Heavy Equipment Operator",
  "Crane Operator",
  "Scaffolding Erector",

  // --- EVENTS & CREATIVE SERVICES ---
  "Florist",
  "Freelance Bartender",
  "Photo Booth Operator",
  "Audio Engineer",
  "Event Decorator",
  "Personal Chef",
  "Voiceover Artist",
  "Music Producer",
  "Freelance Model",
  "Session Musician",

  // --- PERSONAL CARE & WELLNESS ---
  "Babysitter",
  "Nanny",
  "Doula",
  "Massage Therapist",
  "Hair Stylist",
  "Barber",
  "Esthetician",
  "Tattoo Artist",
  "Eyelash Technician",
  "Personal Stylist"
];

// Automatically map the array of strings into your required database schema
const invoiceBatch6 = rawBatch6.map(job => {
  const slug = `${job.toLowerCase().replace(/ /g, '-')}-invoice-template`;
  return {
    job_title: job,
    slug: slug,
    document_type: "Invoice",
    seo_title: `Free ${job} Invoice Template & Generator`,
    seo_desc: `Create and send a professional ${job} invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly.`
  };
});

// 3. The Execution Logic
async function seedBatch6() {
  console.log('🚀 Starting Batch 6: INVOICE Templates...');
  
  for (const page of invoiceBatch6) {
    // Check if exists
    const { data: existing } = await supabase
      .from('seo_pages')
      .select('id')
      .eq('slug', page.slug)
      .single();

    if (existing) {
      console.log(`   ⏭️  Skipping (Exists): ${page.slug}`);
    } else {
      // Insert
      const { error } = await supabase
        .from('seo_pages')
        .insert({
          slug: page.slug,
          job_title: page.job_title,
          document_type: page.document_type, // Crucial: "Invoice"
          keyword: `${page.job_title.toLowerCase()} invoice`,
          intent: 'transactional',
          seo_title: page.seo_title,
          seo_desc: page.seo_desc,
          batch_label: 'batch_6_invoices'
        });

      if (error) console.error(`   ❌ Error: ${page.slug}`, error.message);
      else console.log(`   ✅ Created: ${page.slug}`);
    }
  }
  
  console.log('🏁 Batch 6 Complete.');
}

seedBatch6();