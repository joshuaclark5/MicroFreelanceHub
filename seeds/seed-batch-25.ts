import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

const weeklyPages = [
  { slug: 'framer-website-designer-deposit-and-approval-agreement', job_title: 'Framer Website Designer', keyword: 'framer website designer deposit and approval agreement template', document_type: 'Deposit and Approval Agreement' },
  { slug: 'woocommerce-developer-payment-schedule-agreement', job_title: 'WooCommerce Developer', keyword: 'woocommerce developer payment schedule agreement template', document_type: 'Payment Schedule Agreement' },
  { slug: 'wordpress-redesign-consultant-milestone-payment-agreement', job_title: 'WordPress Redesign Consultant', keyword: 'wordpress redesign consultant milestone payment agreement template', document_type: 'Milestone Payment Agreement' },
  { slug: 'local-seo-specialist-retainer-payment-agreement', job_title: 'Local SEO Specialist', keyword: 'local seo specialist retainer payment agreement template', document_type: 'Retainer Payment Agreement' },
  { slug: 'pinterest-ads-manager-upfront-payment-contract', job_title: 'Pinterest Ads Manager', keyword: 'pinterest ads manager upfront payment contract template', document_type: 'Upfront Payment Contract' },
  { slug: 'cold-email-copywriter-content-approval-payment-contract', job_title: 'Cold Email Copywriter', keyword: 'cold email copywriter content approval payment contract template', document_type: 'Content Approval Contract' },
  { slug: 'case-study-writer-deposit-agreement', job_title: 'Case Study Writer', keyword: 'case study writer deposit agreement template', document_type: 'Deposit Agreement' },
  { slug: 'white-paper-writer-client-approval-agreement', job_title: 'White Paper Writer', keyword: 'white paper writer client approval agreement template', document_type: 'Client Approval Agreement' },
  { slug: 'saas-demo-video-producer-milestone-approval-agreement', job_title: 'SaaS Demo Video Producer', keyword: 'saas demo video producer milestone approval agreement template', document_type: 'Milestone Approval Agreement' },
  { slug: 'virtual-event-producer-payment-schedule-agreement', job_title: 'Virtual Event Producer', keyword: 'virtual event producer payment schedule agreement template', document_type: 'Payment Schedule Agreement' },
  { slug: 'webinar-funnel-builder-deposit-and-approval-agreement', job_title: 'Webinar Funnel Builder', keyword: 'webinar funnel builder deposit and approval agreement template', document_type: 'Deposit and Approval Agreement' },
  { slug: 'customer-support-ops-consultant-retainer-payment-agreement', job_title: 'Customer Support Ops Consultant', keyword: 'customer support ops consultant retainer payment agreement template', document_type: 'Retainer Payment Agreement' },
  { slug: 'operations-automation-consultant-change-request-payment-agreement', job_title: 'Operations Automation Consultant', keyword: 'operations automation consultant change request payment agreement template', document_type: 'Change Request Payment Agreement' },
  { slug: 'figma-to-webflow-developer-upfront-payment-contract', job_title: 'Figma to Webflow Developer', keyword: 'figma to webflow developer upfront payment contract template', document_type: 'Upfront Payment Contract' },
  { slug: 'sales-enablement-designer-milestone-payment-agreement', job_title: 'Sales Enablement Designer', keyword: 'sales enablement designer milestone payment agreement template', document_type: 'Milestone Payment Agreement' },
];

async function seedBatch25() {
  console.log('Planting seeds for Batch 25 (Weekly 15 pages)...');

  const rowsToInsert = weeklyPages.map((page) => ({
    ...page,
    intent: 'transactional',
    batch_label: 'Batch 25',
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

seedBatch25();
