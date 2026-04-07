import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { config } from 'dotenv';

// --- LOAD SECRETS ---
config({ path: '.env.local' });

// --- CHECKS ---
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('MISSING: SUPABASE_SERVICE_ROLE_KEY');
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) throw new Error('MISSING: GOOGLE_GENERATIVE_AI_API_KEY');

// --- CONFIGURATION ---
const DELAY_MS = 1000; // 1 second delay to be safe

// --- INIT CLIENTS ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const model = google('gemini-flash-latest');

// --- MAIN FUNCTION ---
async function enrichEscrowPages() {
  console.log('🔒 Starting DIGITAL ESCROW Enrichment (Waitlist Edition)...');

  while (true) {
    // 1. Fetch rows: specifically pages starting with watermark-files-
    const { data: rows, error } = await supabase
      .from('seo_pages')
      .select('id, job_title, slug')
      .like('slug', 'watermark-files-%')
      .is('deliverables', null) 
      .limit(10);

    if (error) {
      console.error('❌ DB Error:', error);
      break;
    }

    if (!rows || rows.length === 0) {
      console.log('✅ All Escrow pages are enriched!');
      break;
    }

    console.log(`\n📦 Loaded batch of ${rows.length} escrow pages...`);

    // 2. Loop through and generate
    for (const row of rows) {
      await processEscrowWithRetry(row);
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
}

// --- WORKER FUNCTION ---
async function processEscrowWithRetry(row: { id: string; job_title: string }) {
  let attempts = 0;
  
  while (attempts < 5) {
    try {
      console.log(`📝 Generating Escrow Data for: ${row.job_title}...`);

      const prompt = `
        You are a veteran digital rights and business mentor for a: ${row.job_title}.
        You are hyper-focused on preventing clients from stealing digital files and ghosting before payment.
        
        TASK: Generate SEO content for a Digital Escrow / Watermarking waitlist page for a: ${row.job_title}.
        
        1. pain_point_hook: Write 1 sentence about the fear of sending final files and getting ghosted. (e.g., "Stop sending unprotected files and hoping the client decides to pay you.")
        2. legal_tip: Write 1 professional tip about copyright transfer (e.g., "Always stipulate that full copyright ownership does not transfer until the final invoice is paid in full.")
        3. deliverables: A JSON Array of 5-7 common digital assets this specific professional creates that need protection (e.g., ["High-Resolution Logos (.ai, .eps)", "Brand Identity Guidelines", "Web-Ready PNGs"]).
        4. seo_title: "How to Watermark ${row.job_title} Files & Get Paid Safely"
        5. seo_desc: "Stop getting ghosted. Learn how to securely watermark your ${row.job_title} deliverables and unlock them automatically upon payment."
        6. faqs: A JSON array of exactly 3 unique, realistic questions this professional would ask about protecting their work, watermarks, or digital escrow. CRITICAL: Do NOT give legal advice. Explain how using an automated Digital Escrow system solves these problems.
        
        CRITICAL OUTPUT FORMAT: Return ONLY a valid JSON object.
        {
          "pain_point_hook": "...",
          "legal_tip": "...",
          "deliverables": ["...", "..."],
          "seo_title": "...",
          "seo_desc": "...",
          "faqs": [
            { "q": "...", "a": "..." },
            { "q": "...", "a": "..." },
            { "q": "...", "a": "..." }
          ]
        }
      `;

      const { text } = await generateText({
        model: model,
        prompt: prompt,
      });

      // Clean the JSON (Gemini sometimes adds markdown blocks)
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const json = JSON.parse(cleanJson);

      // Update Supabase
      const { error } = await supabase
        .from('seo_pages')
        .update({
          pain_point_hook: json.pain_point_hook,
          legal_tip: json.legal_tip,
          deliverables: json.deliverables, 
          seo_title: json.seo_title,
          seo_desc: json.seo_desc,
          faqs: json.faqs, 
          updated_at: new Date().toISOString()
        })
        .eq('id', row.id);

      if (error) throw error;
      
      console.log(`   ✅ Saved Escrow Data for: ${row.job_title}`);
      return; // Success!

    } catch (err: any) {
      attempts++;
      console.error(`   ⚠️ Attempt ${attempts} failed: ${err.message}`);
      
      if (err.message.includes('Quota exceeded') || err.message.includes('429')) {
        console.log('   ⏳ Hit rate limit. Sleeping for 30 seconds...');
        await new Promise(r => setTimeout(r, 30000)); 
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  console.error(`   ❌ Giving up on: ${row.job_title}`);
}

// Run it
enrichEscrowPages();