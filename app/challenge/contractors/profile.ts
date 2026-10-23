export const contractorFields=[
 ['Job, customer and site','Name the job, customer, site and proposed date or work window. Use fictional details for practice.'],
 ['Included work and completion record','List quantities, included services and how completion will be recorded.'],
 ['Exclusions, extra charges and changes','State quoted limits, excluded work, and how waiting time or additional work will be priced and approved.'],
 ['Site inputs and responsible contacts','List information, access and client inputs needed, their owners and due dates. Name the commercial approver.'],
 ['Price, job records and payment timing','List agreed price components, any minimums, records needed, PO reference and invoice/payment steps.'],
 ['Extra-work response','Describe a changed request, the additional scope and how you will get the revised terms reviewed.'],
] as const;
export const contractorChecks=[
 'I identified the job, customer, site and proposed work window, or marked it as practice.',
 'I listed the included work and the evidence needed to record completion.',
 'I stated exclusions and the process for agreeing extra charges; nothing is assumed approved.',
 'I named responsible contacts and who can approve commercial changes.',
 'I checked price components, any minimums, required job records and payment timing.',
 'My reply asks for review of changed terms and separates technical feasibility from commercial approval.',
];
export const contractorExamples={
 crane:{label:'Crane hire — commercial scope',values:[
 'FICTIONAL: Two-unit rooftop placement for North Yard Mechanical, site and work window to confirm',
 'Proposed crane service for two identified units during the agreed window. Confirm equipment, crew and technical scope through a separate assessment by qualified personnel. Commercial completion record: job reference, service performed, start/finish and waiting times, exceptions and customer acknowledgment.',
 'Confirm included booking duration and mobilization/demobilization items. Additional units, changed loads, extended time, standby and rescheduling require review under agreed terms. Do not assume an extra lift or any charge is approved.',
 'Customer names the site contact and authorized commercial approver and supplies the required job information and PO. Competent parties confirm technical requirements and site readiness separately. This commercial brief does not replace lift planning, capacity checks, ground assessment, permits or safety authorization.',
 'Before confirming the job, agree equipment/crew rates, any minimum, travel, standby, overtime and cancellation terms. During work, retain times and reasons for delays. Invoice against the agreed terms and job records. Actual rates, due dates and PO reference remain to be entered.',
 'The extra unit is outside the two-unit scope. We need a separate technical review and revised commercial scope before confirming it. We can document the extra price and timing for approval, or retain the original scope if feasible. Commercial approval does not authorize an unsafe lift.'
 ]},
 striping:{label:'Parking-lot striping — commercial scope',values:[
 'FICTIONAL: Repaint marked parking bays for Oak Court, site and work window to confirm',
 'Repaint the client-approved marked bays and symbols listed in the job schedule. Confirm counts, materials and boundaries before quoting. Completion record: agreed checklist, dated job photos where permitted, exceptions and customer acknowledgment.',
 'New layout design, surface repairs, removal of old markings and extra bays are excluded unless listed and priced. Weather delays and return visits follow terms reviewed before work. A changed quantity requires a revised scope and price.',
 'Customer provides the approved layout, site contact, access arrangements and commercial approver. Confirm who clears vehicles and when the site is available. Technical, traffic-management and regulatory requirements are reviewed separately by appropriate personnel.',
 'Enter agreed quantity/rate lines, any minimum or travel charge, deposit if applicable, PO reference and payment due event. Keep the approved scope version and job-completion records with the invoice. No example rate is recommended.',
 'The additional bays are outside the agreed count. I can prepare a revised quantity, price and work window for approval, or keep this job to the original scope. Please confirm which option you want us to document.'
 ]},
};
