import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

const weeklyPages = [
  { slug: 'shopify-store-setup-specialist-deposit-and-approval-agreement', job_title: 'Shopify Store Setup Specialist', keyword: 'shopify store setup specialist deposit and approval agreement template', document_type: 'Deposit and Approval Agreement' },
  { slug: 'webflow-designer-payment-schedule-agreement-template', job_title: 'Webflow Designer', keyword: 'webflow designer payment schedule agreement template', document_type: 'Payment Schedule Agreement' },
  { slug: 'wordpress-maintenance-provider-retainer-payment-agreement', job_title: 'WordPress Maintenance Provider', keyword: 'wordpress maintenance provider retainer payment agreement template', document_type: 'Retainer Payment Agreement' },
  { slug: 'email-marketing-automation-consultant-upfront-payment-contract', job_title: 'Email Marketing Automation Consultant', keyword: 'email marketing automation consultant upfront payment contract template', document_type: 'Upfront Payment Contract' },
  { slug: 'klaviyo-specialist-content-approval-payment-contract', job_title: 'Klaviyo Specialist', keyword: 'klaviyo specialist content approval payment contract template', document_type: 'Content Approval Contract' },
  { slug: 'crm-implementation-consultant-milestone-payment-agreement', job_title: 'CRM Implementation Consultant', keyword: 'crm implementation consultant milestone payment agreement template', document_type: 'Milestone Payment Agreement' },
  { slug: 'hubspot-consultant-change-request-payment-agreement', job_title: 'HubSpot Consultant', keyword: 'hubspot consultant change request payment agreement template', document_type: 'Change Request Payment Agreement' },
  { slug: 'ga4-analytics-consultant-client-approval-agreement', job_title: 'GA4 Analytics Consultant', keyword: 'ga4 analytics consultant client approval agreement template', document_type: 'Client Approval Agreement' },
  { slug: 'data-dashboard-consultant-milestone-approval-agreement', job_title: 'Data Dashboard Consultant', keyword: 'data dashboard consultant milestone approval agreement template', document_type: 'Milestone Approval Agreement' },
  { slug: 'podcast-production-manager-retainer-payment-agreement', job_title: 'Podcast Production Manager', keyword: 'podcast production manager retainer payment agreement template', document_type: 'Retainer Payment Agreement' },
  { slug: 'youtube-channel-manager-content-approval-payment-contract', job_title: 'YouTube Channel Manager', keyword: 'youtube channel manager content approval payment contract template', document_type: 'Content Approval Contract' },
  { slug: 'ecommerce-product-page-copywriter-deposit-agreement', job_title: 'Ecommerce Product Page Copywriter', keyword: 'ecommerce product page copywriter deposit agreement template', document_type: 'Deposit Agreement' },
  { slug: 'landing-page-designer-project-approval-payment-agreement', job_title: 'Landing Page Designer', keyword: 'landing page designer project approval payment agreement template', document_type: 'Project Approval and Payment Agreement' },
  { slug: 'mobile-app-prototype-designer-milestone-payment-agreement', job_title: 'Mobile App Prototype Designer', keyword: 'mobile app prototype designer milestone payment agreement template', document_type: 'Milestone Payment Agreement' },
  { slug: 'api-integration-developer-deposit-and-approval-agreement', job_title: 'API Integration Developer', keyword: 'api integration developer deposit and approval agreement template', document_type: 'Deposit and Approval Agreement' },
];

async function seedBatch23() {
  console.log('Planting seeds for Batch 23 (Weekly 15 pages)...');

  const rowsToInsert = weeklyPages.map((page) => ({
    ...page,
    intent: 'transactional',
    batch_label: 'Batch 23',
  }));

  const { data, error } = await supabase
    .from('seo_pages')
    .upsert(rowsToInsert, { onConflict: 'slug' })
    .select();

  if (error) {
    console.error('Error inserting seeds:', error);
    process.exitCode = 1;
  } else {
    console.log('Successfully planted ' + data.length + ' SEO pages.');
  }
}

seedBatch23();

