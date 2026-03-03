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
async function enrichCompetitors() {
  console.log('🤖 Starting COMPETITOR Enrichment (Pass-Through Fee Attack Edition)...');

  // Fetch ALL competitors to overwrite the data with the new attack angle
  const { data: rows, error } = await supabase
    .from('seo_pages')
    .select('id, job_title, slug')
    .eq('document_type', 'Comparison')
    .limit(30);

  if (error) {
    console.error('❌ DB Error:', error);
    return;
  }

  if (!rows || rows.length === 0) {
    console.log('✅ No competitors found.');
    return;
  }

  console.log(`\n📦 Loaded batch of ${rows.length} competitors to rewrite...`);

  for (const row of rows) {
    await processCompetitorWithRetry(row);
    await new Promise(r => setTimeout(r, DELAY_MS));
  }
  
  console.log('\n🏁 Competitor AI Enrichment Complete! The Pass-Through Fee weapon is live.');
}

// --- WORKER FUNCTION ---
async function processCompetitorWithRetry(row: { id: string; job_title: string }) {
  let attempts = 0;
  
  while (attempts < 5) {
    try {
      console.log(`📝 Analyzing Competitor: ${row.job_title}...`);

      const prompt = `
        You are an aggressive, truth-telling B2B SaaS copywriter comparing MicroFreelanceHub against its competitor: "${row.job_title}".
        
        THE ULTIMATE WEAPON (Zero-Cost Credit Card Processing): 
        Most CRMs like ${row.job_title} "double-dip." They charge the freelancer a $40/month subscription AND force the freelancer to eat the ~3% credit card processing fee out of their own pocket, costing them thousands a year. 
        MicroFreelanceHub has a "Pass-Through Fee" toggle. The freelancer checks a box, the 3.9% processing fee is added directly to the client's invoice, Stripe takes their cut, and the freelancer keeps exactly 100% of their hard-earned money. 
        
        MicroFreelanceHub's Pricing Model: 
        - Free Tier: First 3 projects are totally free to manage. 
        - Pro Tier: Flat $29/month for unlimited projects.

        Generate a JSON response with the following keys exactly:
        - "pain_point_hook": 2 punchy sentences attacking ${row.job_title} for "double-dipping" (charging a monthly fee PLUS making the freelancer lose 3% of their income to credit card processing fees).
        - "legal_tip": 1 practical "Pro Tip" for someone switching away from ${row.job_title}.
        - "deliverables": A JSON array of 4 short bullet points highlighting MicroFreelanceHub's specific advantages (Must include concepts like: "Pass the 3.9% fee to the client", "Keep 100% of your principal cash", "Free to start (3 Projects)").
        - "faqs": A JSON array of exactly 3 FAQs comparing the two. Focus heavily on how MicroFreelanceHub lets you pass credit card fees to the client, saving them thousands a year compared to ${row.job_title}. Each FAQ needs a 'q' and 'a'.

        Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json.
      `;

      const { text } = await generateText({
        model: model,
        prompt: prompt,
      });

      // Clean the JSON
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const json = JSON.parse(cleanJson);

      // Update Supabase
      const { error } = await supabase
        .from('seo_pages')
        .update({
          pain_point_hook: json.pain_point_hook,
          legal_tip: json.legal_tip,
          deliverables: json.deliverables,
          faqs: json.faqs,
          updated_at: new Date().toISOString()
        })
        .eq('id', row.id);

      if (error) throw error;
      
      console.log(`   ✅ Saved Attack Copy for: ${row.job_title}`);
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
enrichCompetitors();