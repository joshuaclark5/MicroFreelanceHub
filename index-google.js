const { google } = require('googleapis');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');

async function main() {
  // 1. Setup Auth
  const auth = new google.auth.GoogleAuth({
    keyFile: './service_account.json',
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });
  const client = await auth.getClient();

  try {
    // 2. Fetch your Sitemap to get all URLs automatically
    console.log("🗺️  Fetching sitemap...");
    const sitemapUrl = 'https://www.microfreelancehub.com/sitemap.xml';
    const { data } = await axios.get(sitemapUrl);
    
    // 3. Parse the XML to get the list of links
    const parsed = await parseStringPromise(data);
    const urls = parsed.urlset.url.map(entry => entry.loc[0]);
    
    console.log(`🔥 Found ${urls.length} URLs. Starting indexing...`);

    // 4. Loop through and send them to Google
    for (const url of urls) {
      console.log(`🚀 Sending: ${url}`);
      
      try {
        const result = await google.indexing({ version: 'v3', auth: client }).urlNotifications.publish({
          requestBody: {
            url: url,
            type: 'URL_UPDATED',
          },
        });
        console.log(`   ✅ Sent! (Status: ${result.status})`);
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
      }

      // Small pause to be nice to the API
      await new Promise(r => setTimeout(r, 500)); 
    }
    
    console.log("🏁 DONE! All pages submitted.");

  } catch (error) {
    console.error("❌ CRITICAL ERROR:", error.message);
    console.log("Make sure your site actually has a sitemap at /sitemap.xml!");
  }
}

main();