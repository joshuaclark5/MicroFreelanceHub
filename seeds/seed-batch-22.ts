import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

const weeklyPages = [
  { slug: 'ai-agent-builder-milestone-payment-agreement', job_title: 'AI Agent Builder', keyword: 'ai agent builder milestone payment agreement template', document_type: 'Milestone Payment Agreement' },
  { slug: 'make-automation-specialist-upfront-payment-contract', job_title: 'Make Automation Specialist', keyword: 'make automation specialist upfront payment contract template', document_type: 'Upfront Payment Contract' },
  { slug: 'zapier-consultant-deposit-and-approval-agreement', job_title: 'Zapier Consultant', keyword: 'zapier consultant deposit and approval agreement template', document_type: 'Deposit and Approval Agreement' },
  { slug: 'notion-consultant-project-approval-payment-template', job_title: 'Notion Consultant', keyword: 'notion consultant project approval payment template', document_type: 'Project Approval and Payment Agreement' },
  { slug: 'airtable-consultant-milestone-payment-agreement', job_title: 'Airtable Consultant', keyword: 'airtable consultant milestone payment agreement template', document_type: 'Milestone Payment Agreement' },
  { slug: 'salesforce-consultant-change-request-payment-template', job_title: 'Salesforce Consultant', keyword: 'salesforce consultant change request payment template', document_type: 'Change Request Payment Agreement' },
  { slug: 'google-ads-specialist-retainer-payment-agreement', job_title: 'Google Ads Specialist', keyword: 'google ads specialist retainer payment agreement template', document_type: 'Retainer Payment Agreement' },
  { slug: 'tiktok-ads-manager-upfront-payment-contract', job_title: 'TikTok Ads Manager', keyword: 'tiktok ads manager upfront payment contract template', document_type: 'Upfront Payment Contract' },
  { slug: 'conversion-rate-optimization-consultant-service-agreement', job_title: 'Conversion Rate Optimization Consultant', keyword: 'conversion rate optimization consultant service agreement template', document_type: 'Service Agreement' },
  { slug: 'website-speed-optimization-consultant-payment-schedule-agreement', job_title: 'Website Speed Optimization Consultant', keyword: 'website speed optimization consultant payment schedule agreement template', document_type: 'Payment Schedule Agreement' },
  { slug: 'saas-onboarding-consultant-client-approval-agreement', job_title: 'SaaS Onboarding Consultant', keyword: 'saas onboarding consultant client approval agreement template', document_type: 'Client Approval Agreement' },
  { slug: 'linkedin-ghostwriter-content-approval-contract', job_title: 'LinkedIn Ghostwriter', keyword: 'linkedin ghostwriter content approval contract template', document_type: 'Content Approval Contract' },
  { slug: 'amazon-listing-optimizer-deposit-agreement', job_title: 'Amazon Listing Optimizer', keyword: 'amazon listing optimizer deposit agreement template', document_type: 'Deposit Agreement' },
  { slug: 'online-community-manager-retainer-payment-agreement', job_title: 'Online Community Manager', keyword: 'online community manager retainer payment agreement template', document_type: 'Retainer Payment Agreement' },
  { slug: 'course-launch-manager-milestone-approval-template', job_title: 'Course Launch Manager', keyword: 'course launch manager milestone approval template', document_type: 'Milestone Approval Agreement' },
];

async function seedBatch22() {
  console.log('Planting seeds for Batch 22 (Weekly 15 pages)...');

  const rowsToInsert = weeklyPages.map((page) => ({
    ...page,
    intent: 'transactional',
    batch_label: 'Batch 22',
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

seedBatch22();

