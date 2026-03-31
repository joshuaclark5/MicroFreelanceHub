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
async function enrichLateEmails() {
  console.log('📬 Starting LATE PAYMENT EMAIL Enrichment (Product-Led Waitlist Edition)...');

  while (true) {
    // 1. Fetch rows: specifically CONTRACT types (where emails are categorized) where 'deliverables' (our email array) is null
    const { data: rows, error } = await supabase
      .from('seo_pages')
      .select('id, job_title, slug')
      .eq('document_type', 'Contract') // Assuming emails are inserted as type 'Contract' per strategy
      .is('deliverables', null) // We use deliverables to store the email array
      .limit(10);

    if (error) {
      console.error('❌ DB Error:', error);
      break;
    }

    if (!rows || rows.length === 0) {
      console.log('✅ All Late Email pages are enriched!');
      break;
    }

    console.log(`\n📦 Loaded batch of ${rows.length} email pages...`);

    // 2. Loop through and generate
    for (const row of rows) {
      await processEmailWithRetry(row);
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
}

// --- WORKER FUNCTION ---
async function processEmailWithRetry(row: { id: string; job_title: string }) {
  let attempts = 0;
  
  while (attempts < 5) {
    try {
      console.log(`📝 Generating Email Data for: ${row.job_title}...`);

      const prompt = `
        You are a veteran collections agent and business mentor for a: ${row.job_title}.
        You are hyper-focused on escalating urgency professionally while maintaining the client relationship.
        
        TASK: Generate content for LATE PAYMENT EMAIL TEMPLATES for a: ${row.job_title}.
        
        1. pain_point_hook: Write 1 sentence about the pain of sending awkward, desperate emails chasing money. (e.g., "Stop wasting hours manually chasing late payments and maintain professional boundaries.")
        2. legal_tip: Write 1 professional tip about payment terms escalation (e.g., "Your contract should state that Day 30 triggers a mandatory stop-work order until balance is cleared.")
        3. deliverance: A JSON Array of EXACTLY 3 unique email body templates (strings) geared towards a ${row.job_title}:
           - index 0: A gentle "Day 3 Past Due" reminder (polite, assuming oversight).
           - index 1: A firm "Day 15 Past Due" notice (mentioning contract terms).
           - index 2: A final "Day 30 Past Due" notice (stop-work warning/final demand).
        4. seo_title: "Late Payment Email Templates for ${row.job_title} Contractors"
        5. seo_desc: "Download professional, escalated late payment email templates for ${row.job_title}s. Stop chasing checks manually and join the automated dunning waitlist."
        6. faqs: A JSON array of exactly 3 unique, realistic questions this specific professional would ask about non-payment, demand letters, or stop-work orders. CRITICAL: Do NOT give legal advice. Explain how using a digital Dunning Engine (automated robots) helps solve these problems.
        
        CRITICAL OUTPUT FORMAT: Return ONLY a valid JSON object.
        {
          "pain_point_hook": "...",
          "legal_tip": "...",
          "deliverables": ["Email 1 Gentle...", "Email 2 Firm...", "Email 3 Final..."],
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

      // Validate delivers array length
      if (!Array.isArray(json.deliverables) || json.deliverables.length !== 3) {
          throw new Error('AI failed to generate exactly 3 deliverables (email templates)');
      }

      // Update Supabase
      const { error } = await supabase
        .from('seo_pages')
        .update({
          pain_point_hook: json.pain_point_hook,
          legal_tip: json.legal_tip,
          deliverables: json.deliverables, // We use this JSONB array to store the 3 emails!
          seo_title: json.seo_title,
          seo_desc: json.seo_desc,
          faqs: json.faqs, 
          updated_at: new Date().toISOString()
        })
        .eq('id', row.id);

      if (error) throw error;
      
      console.log(`   ✅ Saved Emails for: ${row.job_title}`);
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
enrichLateEmails();