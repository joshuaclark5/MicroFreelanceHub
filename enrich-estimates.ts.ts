import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { config } from 'dotenv';

config({ path: '.env.local' });

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('MISSING: SUPABASE_SERVICE_ROLE_KEY');
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) throw new Error('MISSING: GOOGLE_GENERATIVE_AI_API_KEY');

const DELAY_MS = 1000;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const model = google('gemini-flash-latest');

async function enrichEstimates() {
  console.log('📬 Starting ESTIMATES & QUOTES Enrichment...');

  while (true) {
    // Target both estimate and quote slugs
    const { data: rows, error } = await supabase
      .from('seo_pages')
      .select('id, job_title, slug, document_type')
      .or('slug.like.%-estimate-template,slug.like.%-quote-template') 
      .is('pain_point_hook', null) // Only grab empty ones
      .limit(10);

    if (error) {
      console.error('❌ DB Error:', error);
      break;
    }

    if (!rows || rows.length === 0) {
      console.log('✅ All Estimate/Quote pages are enriched!');
      break;
    }

    console.log(`\n📦 Loaded batch of ${rows.length} pages...`);

    for (const row of rows) {
      await processPageWithRetry(row);
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
}

async function processPageWithRetry(row: { id: string; job_title: string; document_type: string }) {
  let attempts = 0;
  
  while (attempts < 5) {
    try {
      console.log(`📝 Generating Data for: ${row.job_title} (${row.document_type})...`);

      const prompt = `
        You are a veteran business coach for a: ${row.job_title}.
        You are helping them win a pitch and secure an upfront deposit using a professional ${row.document_type}.
        
        TASK: Generate SEO landing page content for a ${row.job_title} ${row.document_type} Template.
        
        1. pain_point_hook: Write 1 punchy sentence about the pain of losing clients due to messy pricing, or doing work without an upfront deposit. 
        2. legal_tip: Write 1 tip about protecting scope or timelines in a ${row.document_type}.
        3. deliverables: A JSON Array of EXACTLY 3 standard line-items (strings) this profession would put on a ${row.document_type} (e.g., ["Phase 1: Research", "Phase 2: Execution", "Revisions"]).
        4. seo_title: "Free ${row.job_title} ${row.document_type} Template | MicroFreelanceHub"
        5. seo_desc: "Create and send professional ${row.document_type.toLowerCase()}s for ${row.job_title}s. Convert approvals instantly into contracts and Stripe deposits."
        6. faqs: A JSON array of exactly 3 unique, realistic questions about sending ${row.document_type}s, collecting deposits, and preventing scope creep.
        
        CRITICAL OUTPUT FORMAT: Return ONLY a valid JSON object. Do not use markdown tags.
        {
          "pain_point_hook": "...",
          "legal_tip": "...",
          "deliverables": ["Item 1", "Item 2", "Item 3"],
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

      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const json = JSON.parse(cleanJson);

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
      
      console.log(`   ✅ Saved: ${row.job_title} ${row.document_type}`);
      return; 

    } catch (err: any) {
      attempts++;
      console.error(`   ⚠️ Attempt ${attempts} failed: ${err.message}`);
      
      if (err.message.includes('Quota') || err.message.includes('429')) {
        await new Promise(r => setTimeout(r, 30000)); 
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  console.error(`   ❌ Giving up on: ${row.job_title}`);
}

enrichEstimates();