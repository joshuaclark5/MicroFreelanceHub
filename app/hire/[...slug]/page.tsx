import { permanentRedirect } from 'next/navigation';

// 🛑 THE TRAP DOOR (Upgraded for SEO)
// This page catches ANY traffic to /hire/anything
// and forces it to the new /templates/ location PERMANENTLY.

export default function HireRedirect({ params }: { params: { slug: string[] } }) {
  // 1. Grab the URL parts (e.g. "hire-freelance-grant-writer")
  // The slug comes in as an array, so we join it back to a string
  const slugPath = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;
  
  // 2. Clean it: Remove "hire-" prefix if it's there
  // Example: "hire-plumber" -> "plumber"
  const cleanSlug = slugPath.replace(/^hire-/, '');
  
  // 3. FORCE THE PERMANENT MOVE (308 Redirect)
  // This tells Google to delete the old /hire/ link from its memory 
  // and replace it with the new safe link.
  permanentRedirect(`/templates/${cleanSlug}-contract-template`);
}