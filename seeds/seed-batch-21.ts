import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

const weeklyPages = [
  { slug: 'freelance-video-editor-deposit-agreement-template', job_title: 'Freelance Video Editor', keyword: 'freelance video editor deposit agreement template', document_type: 'Deposit Agreement' },
  { slug: 'brand-identity-designer-upfront-payment-contract', job_title: 'Brand Identity Designer', keyword: 'brand identity designer upfront payment contract template', document_type: 'Upfront Payment Contract' },
  { slug: 'webflow-developer-milestone-payment-agreement', job_title: 'Webflow Developer', keyword: 'webflow developer milestone payment agreement template', document_type: 'Milestone Payment Agreement' },
  { slug: 'seo-consultant-client-approval-and-payment-template', job_title: 'SEO Consultant', keyword: 'seo consultant client approval and payment template', document_type: 'Client Approval and Payment Agreement' },
  { slug: 'copywriter-content-approval-contract-template', job_title: 'Copywriter', keyword: 'copywriter content approval contract template', document_type: 'Content Approval Contract' },
  { slug: 'social-media-manager-monthly-retainer-payment-agreement', job_title: 'Social Media Manager', keyword: 'social media manager monthly retainer payment agreement template', document_type: 'Retainer Payment Agreement' },
  { slug: 'product-photographer-deposit-and-usage-rights-agreement', job_title: 'Product Photographer', keyword: 'product photographer deposit and usage rights agreement template', document_type: 'Deposit and Usage Rights Agreement' },
  { slug: 'event-videographer-deposit-and-cancellation-contract', job_title: 'Event Videographer', keyword: 'event videographer deposit and cancellation contract template', document_type: 'Deposit and Cancellation Contract' },
  { slug: 'mobile-app-designer-milestone-approval-template', job_title: 'Mobile App Designer', keyword: 'mobile app designer milestone approval template', document_type: 'Milestone Approval Agreement' },
  { slug: 'landing-page-designer-payment-schedule-agreement', job_title: 'Landing Page Designer', keyword: 'landing page designer payment schedule agreement template', document_type: 'Payment Schedule Agreement' },
  { slug: 'crm-setup-consultant-service-agreement-template', job_title: 'CRM Setup Consultant', keyword: 'crm setup consultant service agreement template', document_type: 'Service Agreement' },
  { slug: 'email-automation-specialist-milestone-payment-template', job_title: 'Email Automation Specialist', keyword: 'email automation specialist milestone payment template', document_type: 'Milestone Payment Agreement' },
  { slug: 'online-course-creator-production-agreement', job_title: 'Online Course Creator', keyword: 'online course creator production agreement template', document_type: 'Production Agreement' },
  { slug: 'podcast-producer-retainer-payment-agreement', job_title: 'Podcast Producer', keyword: 'podcast producer retainer payment agreement template', document_type: 'Retainer Payment Agreement' },
  { slug: 'interior-designer-deposit-agreement-template', job_title: 'Interior Designer', keyword: 'interior designer deposit agreement template', document_type: 'Deposit Agreement' },
];

async function seedBatch21() {
  console.log('Planting seeds for Batch 21 (Weekly 15 pages)...');

  const rowsToInsert = weeklyPages.map((page) => ({
    ...page,
    intent: 'transactional',
    batch_label: 'Batch 21',
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

seedBatch21();
