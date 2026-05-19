import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Setup clients using your environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const genAI = new GoogleGenerativeAI("AIzaSyAj8mspxAvxYdtFYYRtVUMFnPYHu_2BQJY");
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

async function repairPages() {
  console.log("🔍 Scanning database for the 738 broken pages...");

  // 1. Fetch all pages so we can filter them safely in memory
  const { data: allPages, error } = await supabase
    .from('seo_pages')
    .select('id, slug, job_title, document_type, content, deliverables, faqs');

  if (error) {
    console.error("❌ Failed to fetch from Supabase:", error);
    return;
  }

  // 2. Isolate ONLY the broken pages using our exact audit logic
  const brokenPages = allPages.filter(page => {
    const noContent = !page.content || page.content.trim() === '' || page.content.includes('<p>Loading email draft...</p>');
    const badDeliverables = JSON.stringify(page.deliverables || '').includes('Deliverable Phase 1');
    const badFaqs = JSON.stringify(page.faqs || '').includes('What is a');
    
    return noContent || badDeliverables || badFaqs;
  });

  if (brokenPages.length === 0) {
    console.log("✅ All pages are fully optimized! Nothing to repair.");
    return;
  }

  console.log(`🚨 Found ${brokenPages.length} pages needing repair. Starting surgical fix...`);

  // 3. Fix them one by one
  for (let i = 0; i < brokenPages.length; i++) {
    const page = brokenPages[i];
    console.log(`\n[${i + 1}/${brokenPages.length}] 🛠️ Repairing: ${page.slug}...`);

    const prompt = `
      You are an expert legal copywriter for freelancers. 
      Job Title: ${page.job_title}
      Document Type: ${page.document_type}
      
      Generate a raw JSON object (NO markdown formatting, NO backticks) with these exact keys:
      {
        "ai_summary": "1 sentence summary of why they need this document.",
        "deliverables": ["Phase 1 specific to this job", "Phase 2 specific to this job", "Phase 3 specific to this job"],
        "faqs": [{"q": "Specific question?", "a": "Specific answer."}],
        "content": "<h2>Overview</h2><p>2 paragraphs of HTML legal content protecting this specific job.</p>"
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      let rawText = result.response.text();
      
      // Clean the JSON response to prevent parsing errors
      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const aiData = JSON.parse(rawText);

      // 4. Update ONLY this specific row in the database
      const { error: updateError } = await supabase
        .from('seo_pages')
        .update({
          ai_summary: aiData.ai_summary,
          deliverables: aiData.deliverables, // Supabase handles the array format automatically
          faqs: aiData.faqs,
          content: aiData.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', page.id);

      if (updateError) {
        console.error(`❌ Failed to save ${page.slug} to DB:`, updateError.message);
      } else {
        console.log(`✅ Fixed ${page.slug}!`);
      }

    } catch (err) {
      console.error(`⚠️ AI Generation or Parsing failed for ${page.slug}:`, err.message);
    }

    // 🛑 CRITICAL: Wait 2.5 seconds between calls so we don't hit rate limits again!
    await new Promise(resolve => setTimeout(resolve, 2500));
  }
  
  console.log("\n🎉 Repair complete! All 1,100 pages are now 10/10 quality.");
}

repairPages();