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

// 2. The Data (50 Invoice Templates)
const invoiceBatch = [
  // --- CORE TRADES (The "Cash Flow" Kings) ---
  {
    job_title: "Plumber",
    slug: "plumber-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Plumber Invoice Template & Generator",
    seo_desc: "Create and send a professional Plumber invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Electrician",
    slug: "electrician-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Electrician Invoice Template & Generator",
    seo_desc: "Create and send a professional Electrician invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Handyman",
    slug: "handyman-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Handyman Invoice Template & Generator",
    seo_desc: "Create and send a professional Handyman invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "HVAC Technician",
    slug: "hvac-technician-invoice-template",
    document_type: "Invoice",
    seo_title: "Free HVAC Technician Invoice Template & Generator",
    seo_desc: "Create and send a professional HVAC Technician invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Landscaper",
    slug: "landscaper-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Landscaper Invoice Template & Generator",
    seo_desc: "Create and send a professional Landscaper invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Roofer",
    slug: "roofer-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Roofer Invoice Template & Generator",
    seo_desc: "Create and send a professional Roofer invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "General Contractor",
    slug: "general-contractor-invoice-template",
    document_type: "Invoice",
    seo_title: "Free General Contractor Invoice Template & Generator",
    seo_desc: "Create and send a professional General Contractor invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Carpenter",
    slug: "carpenter-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Carpenter Invoice Template & Generator",
    seo_desc: "Create and send a professional Carpenter invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Drywaller",
    slug: "drywaller-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Drywaller Invoice Template & Generator",
    seo_desc: "Create and send a professional Drywaller invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Painter",
    slug: "painter-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Painter Invoice Template & Generator",
    seo_desc: "Create and send a professional Painter invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Flooring Installer",
    slug: "flooring-installer-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Flooring Installer Invoice Template & Generator",
    seo_desc: "Create and send a professional Flooring Installer invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Mason",
    slug: "mason-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Mason Invoice Template & Generator",
    seo_desc: "Create and send a professional Mason invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Welder",
    slug: "welder-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Welder Invoice Template & Generator",
    seo_desc: "Create and send a professional Welder invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Glazier",
    slug: "glazier-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Glazier Invoice Template & Generator",
    seo_desc: "Create and send a professional Glazier invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Locksmith",
    slug: "locksmith-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Locksmith Invoice Template & Generator",
    seo_desc: "Create and send a professional Locksmith invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Fencing Contractor",
    slug: "fencing-contractor-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Fencing Contractor Invoice Template & Generator",
    seo_desc: "Create and send a professional Fencing Contractor invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Insulation Contractor",
    slug: "insulation-contractor-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Insulation Contractor Invoice Template & Generator",
    seo_desc: "Create and send a professional Insulation Contractor invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Siding Contractor",
    slug: "siding-contractor-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Siding Contractor Invoice Template & Generator",
    seo_desc: "Create and send a professional Siding Contractor invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Tile Setter",
    slug: "tile-setter-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Tile Setter Invoice Template & Generator",
    seo_desc: "Create and send a professional Tile Setter invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Cabinet Maker",
    slug: "cabinet-maker-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Cabinet Maker Invoice Template & Generator",
    seo_desc: "Create and send a professional Cabinet Maker invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },

  // --- AUTOMOTIVE ---
  {
    job_title: "Auto Mechanic",
    slug: "auto-mechanic-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Auto Mechanic Invoice Template & Generator",
    seo_desc: "Create and send a professional Auto Mechanic invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Mobile Mechanic",
    slug: "mobile-mechanic-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Mobile Mechanic Invoice Template & Generator",
    seo_desc: "Create and send a professional Mobile Mechanic invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Auto Detailer",
    slug: "auto-detailer-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Auto Detailer Invoice Template & Generator",
    seo_desc: "Create and send a professional Auto Detailer invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Tow Truck Operator",
    slug: "tow-truck-operator-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Tow Truck Operator Invoice Template & Generator",
    seo_desc: "Create and send a professional Tow Truck Operator invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },

  // --- HOME SERVICES ---
  {
    job_title: "House Cleaner",
    slug: "house-cleaner-invoice-template",
    document_type: "Invoice",
    seo_title: "Free House Cleaner Invoice Template & Generator",
    seo_desc: "Create and send a professional House Cleaner invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Pool Cleaner",
    slug: "pool-cleaner-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Pool Cleaner Invoice Template & Generator",
    seo_desc: "Create and send a professional Pool Cleaner invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Pest Control Technician",
    slug: "pest-control-technician-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Pest Control Technician Invoice Template & Generator",
    seo_desc: "Create and send a professional Pest Control Technician invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Carpet Cleaner",
    slug: "carpet-cleaner-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Carpet Cleaner Invoice Template & Generator",
    seo_desc: "Create and send a professional Carpet Cleaner invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Window Washer",
    slug: "window-washer-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Window Washer Invoice Template & Generator",
    seo_desc: "Create and send a professional Window Washer invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Junk Removal Specialist",
    slug: "junk-removal-specialist-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Junk Removal Specialist Invoice Template & Generator",
    seo_desc: "Create and send a professional Junk Removal Specialist invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Mover",
    slug: "mover-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Mover Invoice Template & Generator",
    seo_desc: "Create and send a professional Mover invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Chimney Sweep",
    slug: "chimney-sweep-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Chimney Sweep Invoice Template & Generator",
    seo_desc: "Create and send a professional Chimney Sweep invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Appliance Repair Technician",
    slug: "appliance-repair-technician-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Appliance Repair Technician Invoice Template & Generator",
    seo_desc: "Create and send a professional Appliance Repair Technician invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Tree Trimmer",
    slug: "tree-trimmer-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Tree Trimmer Invoice Template & Generator",
    seo_desc: "Create and send a professional Tree Trimmer invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },

  // --- EVENTS & PERSONAL ---
  {
    job_title: "Caterer",
    slug: "caterer-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Caterer Invoice Template & Generator",
    seo_desc: "Create and send a professional Caterer invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Event Planner",
    slug: "event-planner-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Event Planner Invoice Template & Generator",
    seo_desc: "Create and send a professional Event Planner invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Wedding Photographer",
    slug: "wedding-photographer-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Wedding Photographer Invoice Template & Generator",
    seo_desc: "Create and send a professional Wedding Photographer invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Videographer",
    slug: "videographer-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Videographer Invoice Template & Generator",
    seo_desc: "Create and send a professional Videographer invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "DJ",
    slug: "dj-invoice-template",
    document_type: "Invoice",
    seo_title: "Free DJ Invoice Template & Generator",
    seo_desc: "Create and send a professional DJ invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Makeup Artist",
    slug: "makeup-artist-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Makeup Artist Invoice Template & Generator",
    seo_desc: "Create and send a professional Makeup Artist invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Personal Trainer",
    slug: "personal-trainer-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Personal Trainer Invoice Template & Generator",
    seo_desc: "Create and send a professional Personal Trainer invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Dog Walker",
    slug: "dog-walker-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Dog Walker Invoice Template & Generator",
    seo_desc: "Create and send a professional Dog Walker invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Pet Sitter",
    slug: "pet-sitter-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Pet Sitter Invoice Template & Generator",
    seo_desc: "Create and send a professional Pet Sitter invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Tutor",
    slug: "tutor-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Tutor Invoice Template & Generator",
    seo_desc: "Create and send a professional Tutor invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },

  // --- WHITE COLLAR ---
  {
    job_title: "Graphic Designer",
    slug: "graphic-designer-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Graphic Designer Invoice Template & Generator",
    seo_desc: "Create and send a professional Graphic Designer invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Web Developer",
    slug: "web-developer-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Web Developer Invoice Template & Generator",
    seo_desc: "Create and send a professional Web Developer invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Consultant",
    slug: "consultant-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Consultant Invoice Template & Generator",
    seo_desc: "Create and send a professional Consultant invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Copywriter",
    slug: "copywriter-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Copywriter Invoice Template & Generator",
    seo_desc: "Create and send a professional Copywriter invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Interior Designer",
    slug: "interior-designer-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Interior Designer Invoice Template & Generator",
    seo_desc: "Create and send a professional Interior Designer invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  },
  {
    job_title: "Translator",
    slug: "translator-invoice-template",
    document_type: "Invoice",
    seo_title: "Free Translator Invoice Template & Generator",
    seo_desc: "Create and send a professional Translator invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
  }
];

// 3. The Execution Logic
async function seedBatch5() {
  console.log('🚀 Starting Batch 5: INVOICE Templates...');
  
  for (const page of invoiceBatch) {
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
          keyword: `${page.job_title} invoice`,
          intent: 'transactional',
          seo_title: page.seo_title,
          seo_desc: page.seo_desc,
          batch_label: 'batch_5_invoices'
        });

      if (error) console.error(`   ❌ Error: ${page.slug}`, error.message);
      else console.log(`   ✅ Created: ${page.slug}`);
    }
  }
  
  console.log('🏁 Batch 5 Complete.');
}

seedBatch5();