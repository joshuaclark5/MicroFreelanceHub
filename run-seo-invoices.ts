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
async function enrichInvoices() {
  console.log('💸 Starting INVOICE Enrichment (Cash Flow Edition + FAQs)...');

  while (true) {
    // 1. Fetch rows: specifically INVOICES where 'faqs' is null
    const { data: rows, error } = await supabase
      .from('seo_pages')
      .select('id, job_title, slug')
      .eq('document_type', 'Invoice') 
      .is('faqs', null) 
      .limit(10);

    if (error) {
      console.error('❌ DB Error:', error);
      break;
    }

    if (!rows || rows.length === 0) {
      console.log('✅ All Invoice pages are enriched with FAQs!');
      break;
    }

    console.log(`\n📦 Loaded batch of ${rows.length} invoices...`);

    // 2. Loop through and generate
    for (const row of rows) {
      await processInvoiceWithRetry(row);
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
}

// --- WORKER FUNCTION ---
async function processInvoiceWithRetry(row: { id: string; job_title: string }) {
  let attempts = 0;
  
  while (attempts < 5) {
    try {
      console.log(`📝 Generating Invoice Data for: ${row.job_title}...`);

      const prompt = `
        You are a veteran ${row.job_title} business mentor.
        You are hyper-focused on CASH FLOW and getting paid fast.
        
        TASK: Generate content for an INVOICE TEMPLATE for a: ${row.job_title}.
        
        1. pain_point_hook: Write 1 sentence about the pain of clients paying late or disputing bills. (e.g., "Stop chasing checks and get paid instantly.")
        2. legal_tip: Write 1 professional tip about payment terms (e.g., "Always demand a 50% deposit for materials upfront.")
        3. deliverables: A JSON Array of 5-7 common billable line items for a ${row.job_title} invoice.
        4. seo_title: "Free ${row.job_title} Invoice Template & Generator"
        5. seo_desc: "Create and send a professional ${row.job_title} invoice in seconds. Mobile-friendly, printable, and accepts credit card payments instantly."
        6. faqs: A JSON array of exactly 3 unique, realistic questions this specific professional would ask about getting paid, deposits, or late fees. CRITICAL: Do NOT give legal advice. Explain how using a digital invoice helps solve these problems.
        
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
          faqs: json.faqs, // ✅ Saving the new FAQs!
          updated_at: new Date().toISOString()
        })
        .eq('id', row.id);

      if (error) throw error;
      
      console.log(`   ✅ Saved FAQs for: ${row.job_title}`);
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
enrichInvoices();