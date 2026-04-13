import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

const batch10Pages = [
  // 🎪 Events, Entertainment & Weddings
  { job_title: 'Event Caterer' },
  { job_title: 'Freelance Bartender' },
  { job_title: 'Wedding Florist' },
  { job_title: 'Mobile DJ' },
  { job_title: 'Face Painter' },
  { job_title: 'Magician' },
  { job_title: 'Event Emcee' },
  { job_title: 'Caricature Artist' },

  // 🚗 Mobile Automotive & Transport
  { job_title: 'Auto Detailer' },
  { job_title: 'Freight Broker' },
  { job_title: 'Owner-Operator Truck Driver' },
  { job_title: 'Independent Courier' },
  { job_title: 'Heavy Equipment Operator' },

  // 🐶 Home, Pet & Personal Services
  { job_title: 'Pet Groomer' },
  { job_title: 'Dog Trainer' },
  { job_title: 'Professional Nanny' },
  { job_title: 'House Sitter' },
  { job_title: 'Personal Chef' },
  { job_title: 'Professional Organizer' },
  { job_title: 'Personal Stylist' },

  // 📁 Specialized Admin & Legal
  { job_title: 'Data Entry Clerk' },
  { job_title: 'Transcriptionist' },
  { job_title: 'Freelance Paralegal' },
  { job_title: 'Mobile Notary' },
  { job_title: 'Medical Coder' },
  { job_title: 'Medical Biller' },

  // 🖌️ Niche Arts & Instruction
  { job_title: 'Muralist' },
  { job_title: 'Calligrapher' },
  { job_title: 'T-Shirt Designer' },
  { job_title: 'Jewelry Designer' },
  { job_title: 'Pattern Maker' },
  { job_title: 'Voice Coach' },
  { job_title: 'Piano Teacher' },
  { job_title: 'Acting Coach' },

  // 🧘 Specialized Health & Body Art
  { job_title: 'Tattoo Artist' },
  { job_title: 'Professional Piercer' },
  { job_title: 'Acupuncturist' },
  { job_title: 'Reiki Practitioner' },
  { job_title: 'Sleep Consultant' },
  { job_title: 'Lactation Consultant' },

  // 🚜 Niche Home Exterior & Seasonal Trades
  { job_title: 'Chimney Sweep' },
  { job_title: 'Window Cleaner' },
  { job_title: 'Pressure Washer' },
  { job_title: 'Gutter Cleaner' },
  { job_title: 'Excavation Contractor' },
  { job_title: 'Snow Removal Contractor' },
  { job_title: 'Junk Removal Specialist' },
  { job_title: 'Awning Installer' },
  { job_title: 'Solar Panel Installer' },
  { job_title: 'Custom Sign Maker' }
];

async function seedDatabase() {
  console.log('🌱 Planting seeds for Batch 10 (Late Payment Emails Part 3)...');

  const rowsToInsert = batch10Pages.map((page) => {
    const baseSlug = page.job_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `late-payment-email-${baseSlug}`; 

    return {
      slug: slug,
      job_title: page.job_title,
      keyword: `late payment email template for ${page.job_title.toLowerCase()}`,
      document_type: 'Contract', 
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
  }
}

seedDatabase();