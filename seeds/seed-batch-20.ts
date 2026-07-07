import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

const weeklyPages = [
  { slug: 'ai-automation-consultant-service-agreement', job_title: 'AI Automation Consultant', keyword: 'ai automation consultant service agreement template', document_type: 'Service Agreement' },
  { slug: 'chatbot-developer-scope-of-work-template', job_title: 'Chatbot Developer', keyword: 'chatbot developer scope of work template', document_type: 'Scope of Work' },
  { slug: 'no-code-app-developer-service-agreement', job_title: 'No-Code App Developer', keyword: 'no-code app developer service agreement template', document_type: 'Service Agreement' },
  { slug: 'podcast-editor-service-agreement', job_title: 'Podcast Editor', keyword: 'podcast editor service agreement template', document_type: 'Service Agreement' },
  { slug: 'youtube-shorts-editor-retainer-agreement', job_title: 'YouTube Shorts Editor', keyword: 'youtube shorts editor retainer agreement template', document_type: 'Retainer' },
  { slug: 'ugc-creator-scope-of-work-template', job_title: 'UGC Creator', keyword: 'ugc creator scope of work template', document_type: 'Scope of Work' },
  { slug: 'fractional-cmo-retainer-agreement', job_title: 'Fractional CMO', keyword: 'fractional cmo retainer agreement template', document_type: 'Retainer' },
  { slug: 'online-business-manager-independent-contractor-agreement', job_title: 'Online Business Manager', keyword: 'online business manager independent contractor agreement', document_type: 'Independent Contractor Agreement' },
  { slug: 'email-marketing-specialist-service-agreement', job_title: 'Email Marketing Specialist', keyword: 'email marketing specialist service agreement template', document_type: 'Service Agreement' },
  { slug: 'paid-ads-manager-service-agreement', job_title: 'Paid Ads Manager', keyword: 'paid ads manager service agreement template', document_type: 'Service Agreement' },
  { slug: 'website-maintenance-agreement', job_title: 'Website Maintenance Provider', keyword: 'website maintenance agreement template', document_type: 'Maintenance Agreement' },
  { slug: 'shopify-developer-scope-of-work-template', job_title: 'Shopify Developer', keyword: 'shopify developer scope of work template', document_type: 'Scope of Work' },
  { slug: 'wedding-photographer-project-sign-off-form', job_title: 'Wedding Photographer', keyword: 'wedding photographer project sign off form template', document_type: 'Project Sign-Off Form' },
  { slug: 'home-renovation-contractor-change-order-template', job_title: 'Home Renovation Contractor', keyword: 'home renovation contractor change order template', document_type: 'Change Order' },
  { slug: 'virtual-assistant-service-agreement', job_title: 'Virtual Assistant', keyword: 'virtual assistant service agreement template', document_type: 'Service Agreement' },
];

async function seedBatch20() {
  console.log('Planting seeds for Batch 20 (Weekly 15 pages)...');

  const rowsToInsert = weeklyPages.map((page) => ({
    ...page,
    intent: 'transactional',
    batch_label: 'Batch 20',
  }));

  const { data, error } = await supabase
    .from('seo_pages')
    .upsert(rowsToInsert, { onConflict: 'slug' })
    .select();

  if (error) {
    console.error('Error inserting seeds:', error);
    process.exitCode = 1;
  } else {
    console.log(`Successfully planted ${data.length} SEO pages.`);
  }
}

seedBatch20();
