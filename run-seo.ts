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
// ⚡ SPEED DEMON MODE
const DELAY_MS = 500;   // Wait only 0.5 seconds between items

// --- INIT CLIENTS ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const model = google('gemini-flash-latest'); 

// --- MAIN FUNCTION ---
async function enrichContent() {
  console.log('💎 Starting SEO Enrichment V2 (Hooks + Tips + Deliverables)...');

  // Loop until no more rows are found
  while (true) {
    // 1. Fetch rows that need content
    // We check if 'deliverables' is NULL to target the new batch
    const { data: rows, error } = await supabase
      .from('seo_pages')
      .select('id, job_title, slug')
      .is('deliverables', null) 
      .limit(50); // Increased batch size for efficiency

    if (error) {
      console.error('❌ DB Error:', error);
      break;
    }

    if (!rows || rows.length === 0) {
      console.log('✅ All pages are already enriched!');
      break;
    }

    console.log(`\n📦 Loaded batch of ${rows.length} rows...`);

    // 2. Loop through and generate
    for (const row of rows) {
      await processRowWithRetry(row);
      // Tiny pause to prevent flooding
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
}

// --- WORKER FUNCTION WITH RETRY ---
async function processRowWithRetry(row: { id: string; job_title: string }) {
  let attempts = 0;
  
  while (attempts < 5) {
    try {
      console.log(`📝 Generating for: ${row.job_title}...`);

      const prompt = `
        You are a grumpy, seasoned veteran contractor and freelancer mentor. 
        You speak in direct, punchy, "Blue Collar" professional terms. No fluff.
        
        TASK: Generate Content for a: ${row.job_title}.
        
        1. pain_point_hook: 2 sentences max. Focus on specific financial risks (lost money, damaged gear, lawsuits). VISCERAL.
        2. legal_tip: 1 sentence. Recommend a specific contract clause (e.g. "Kill Fee", "Overtime", "Lien Waiver").
        3. deliverables: A JSON Array of 5-7 specific, physical tasks this job performs. (e.g. "Rough-in Inspection", "Pressure Test", "Debris Removal").
        
        CRITICAL OUTPUT FORMAT: Return ONLY a valid JSON object.
        {
          "pain_point_hook": "...",
          "legal_tip": "...",
          "deliverables": ["...", "..."]
        }
      `;

      const { text } = await generateText({
        model: model,
        prompt: prompt,
      });

      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const json = JSON.parse(cleanJson);

      // Update Supabase
      const { error } = await supabase
        .from('seo_pages')
        .update({
          pain_point_hook: json.pain_point_hook,
          legal_tip: json.legal_tip,
          deliverables: json.deliverables // ✅ Now saving the checklist!
        })
        .eq('id', row.id);

      if (error) throw error;
      // Show us the first deliverable so we know it worked
      const preview = json.deliverables ? json.deliverables[0] : "No deliverables";
      console.log(`   ✅ Saved: "${preview}..."`);
      return; // Success! Exit the retry loop

    } catch (err: any) {
      attempts++;
      console.error(`   ⚠️ Attempt ${attempts} failed: ${err.message}`);
      
      if (err.message.includes('Quota exceeded') || err.message.includes('429')) {
        console.log('   ⏳ Hit rate limit. Sleeping for 30 seconds...');
        await new Promise(r => setTimeout(r, 30000)); 
      } else {
        // If it's a different error, short wait
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  console.error(`   ❌ Giving up on: ${row.job_title}`);
}

// Run it
enrichContent();