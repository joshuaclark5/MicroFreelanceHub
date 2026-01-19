import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { deliverables, price, instructions } = await req.json();

    // ✅ FIX: "gemini-flash-latest" is the correct alias from your debug list.
    // The previous 2.0 model has a limit of 0 (Paid only).
    const model = google('gemini-flash-latest'); 

    const prompt = `
      You are a smart contract assistant.
      Current Deliverables: """${deliverables}"""
      Current Price: ${price}
      User Instructions: "${instructions}"
      Task: Modify the deliverables and price based on the instructions.
      CRITICAL OUTPUT FORMAT: Return ONLY a valid JSON object.
    `;

    const { text } = await generateText({
      model: model,
      prompt: prompt,
    });

    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return new Response(cleanJson, { 
      status: 200,
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('AI API Error:', error);
    // If this fails, we return the error so you see it in the terminal
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}