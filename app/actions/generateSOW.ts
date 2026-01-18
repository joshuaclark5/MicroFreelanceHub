'use server';

const MODEL_NAME = "gemini-2.5-flash"; 
const API_KEY = process.env.GOOGLE_API_KEY;

// --- FALLBACK TEMPLATES (Used if AI fails) ---
const FALLBACK_QUESTIONS = [
  "What is the main goal of this project?",
  "What are the specific deliverables?",
  "What is the deadline for completion?"
];

const FALLBACK_SOW = {
  title: "Project Scope of Work",
  deliverables: "• Deliverable 1 (Please edit)\n• Deliverable 2\n• Deliverable 3",
  price: 0,
  timeline: "TBD"
};

async function callGemini(prompt: string) {
  // If no key, fail immediately to trigger fallback
  if (!API_KEY) return null;
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    
    // If Google blocks us, return NULL to trigger the fallback
    if (data.error) {
      console.error("⚠️ AI Limit Hit (Switching to Manual Mode):", data.error.message);
      return null; 
    }
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);

  } catch (error) {
    console.error("⚠️ AI Network Error (Switching to Manual Mode)");
    return null;
  }
}

// 1. Generate Questions (With Fallback)
export async function generateQuestions(description: string) {
  const aiResult = await callGemini(`
    You are a project manager. Ask 3 clarifying questions about: "${description}".
    Return JSON array: ["Q1", "Q2", "Q3"]
  `);
  
  // If AI worked, use it. If not, use generic questions so the app keeps moving.
  return aiResult || FALLBACK_QUESTIONS;
}

// 2. Final Contract (With Fallback)
export async function generateFinalSOW(clientName: string, description: string, qaPairs: {q: string, a: string}[]) {
  const context = qaPairs.map(item => `Q: ${item.q} A: ${item.a}`).join("\n");
  const aiResult = await callGemini(`
    Write a SOW. Client: ${clientName} | Project: ${description} | Details: ${context}
    Output JSON:
    {
      "title": "Project Title",
      "deliverables": "Single string with bullet points.",
      "price": (ESTIMATE A NUMBER, DO NOT PUT 0),
      "timeline": "Duration"
    }
  `);

  // If AI worked, use it. If not, give a Template so user can Edit manually.
  return aiResult || FALLBACK_SOW;
}

// 3. Refine SOW (Safe Mode)
export async function refineSOW(currentDeliverables: string, currentPrice: number, instruction: string) {
  const aiResult = await callGemini(`
    Edit SOW. Scope: "${currentDeliverables}" Price: ${currentPrice} Instruction: "${instruction}"
    Output JSON:
    {
      "title": "Title",
      "deliverables": "Updated deliverables string",
      "price": (Update number if asked, else keep ${currentPrice}),
      "timeline": "Duration"
    }
  `);

  // If AI fails here, return NULL so the UI knows to alert the user
  return aiResult; 
}