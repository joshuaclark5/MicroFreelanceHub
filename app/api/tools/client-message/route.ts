import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const runtime = 'nodejs';

const scenarioLabels: Record<string, string> = {
  'late-payment': 'late payment follow-up',
  'scope-creep': 'scope change or added work response',
  'final-files': 'final file handoff response',
  'revision-request': 'additional revision request response',
  'ghosted-invoice': 'stalled invoice follow-up',
  'discount-request': 'discount request response',
  'approval-delay': 'approval delay follow-up',
  'vague-feedback': 'vague client feedback response',
};

const fallbackMessages: Record<string, string> = {
  'late-payment':
    'Hi [Client Name], I wanted to follow up on invoice [Invoice Number], which was due on [Due Date]. Could you confirm when payment is expected to be sent? Once that is handled, I can keep the remaining project steps moving smoothly. Thanks.',
  'scope-creep':
    'Hi [Client Name], thanks for sending this over. This request adds work beyond the current project scope, so I can price it as an added item and share the updated timeline before I begin. If you want, I can send that update today.',
  'final-files':
    'Hi [Client Name], I can prepare the final files for handoff. Before I send the editable/source files, let us close out the remaining invoice and confirm the final delivery list so everything is wrapped up clearly.',
  'revision-request':
    'Hi [Client Name], thanks for the notes. The included revision rounds have already been used, so I can handle these as an additional revision round. I can send the added cost and timing for approval before making the updates.',
  'ghosted-invoice':
    'Hi [Client Name], checking back in on invoice [Invoice Number]. I may have missed your update, so could you let me know where this stands? Once payment timing is confirmed, I can close out the project records on my side.',
  'discount-request':
    'Hi [Client Name], I appreciate you being upfront about budget. I am not able to reduce the full project price by that amount, but I can suggest a smaller scope that fits closer to your target budget if that would help.',
  'approval-delay':
    'Hi [Client Name], I wanted to check in on the pending review. To keep the project moving, could you send approval or consolidated feedback by [Date]? If I do not hear back, I can follow up with the next best project step.',
  'vague-feedback':
    'Hi [Client Name], thanks for reviewing this. To make the next revision useful, could you share what specifically feels off and one or two examples of the direction you want? That will help me make a cleaner update.',
};

const riskyTerms = [
  /legal protection/gi,
  /guaranteed payment/gi,
  /guarantee payment/gi,
  /force payment/gi,
  /limit liability/gi,
  /prevent lawsuits/gi,
  /legally binding/gi,
  /enforceable contract/gi,
  /protect yourself legally/gi,
  /legal advice/gi,
];

function sanitizeMessage(message: string) {
  return riskyTerms.reduce((safeMessage, term) => safeMessage.replace(term, 'clear project communication'), message).trim();
}

export async function POST(req: Request) {
  try {
    const { scenario, tone, context } = await req.json();
    const safeScenario = scenarioLabels[scenario] ? scenario : 'late-payment';
    const safeTone = ['calm', 'firm', 'friendly'].includes(tone) ? tone : 'calm';
    const safeContext = typeof context === 'string' ? context.slice(0, 1600) : '';

    if (safeContext.trim().length < 10) {
      return Response.json({ message: fallbackMessages[safeScenario] });
    }

    const prompt = `
You write concise business communication for freelancers.

Task: Draft one client message for a ${scenarioLabels[safeScenario]}.
Tone: ${safeTone}.
Situation: """${safeContext}"""

Rules:
- Return only the message body.
- Do not mention legal advice, legal protection, enforceability, lawsuits, guaranteed payment, or forcing payment.
- Do not claim any legal outcome.
- Keep it professional, specific, and easy to edit.
- Keep it under 140 words.
- Use placeholders like [Client Name], [Invoice Number], or [Date] only when useful.
`;

    try {
      const { text } = await generateText({
        model: google('gemini-flash-latest'),
        prompt,
      });

      const message = sanitizeMessage(text || fallbackMessages[safeScenario]);

      return Response.json({ message: message || fallbackMessages[safeScenario] });
    } catch (error) {
      console.error('Client message generator model error:', error);
      return Response.json({ message: fallbackMessages[safeScenario] });
    }
  } catch (error) {
    console.error('Client message generator request error:', error);
    return Response.json({ message: fallbackMessages['late-payment'] });
  }
}
