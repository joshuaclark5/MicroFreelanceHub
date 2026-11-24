// Shared, image-independent layout. Message content is escaped, never interpreted as HTML.
export function escapeEmail(value: string): string {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
}
export function emailMessageHtml(text: string): string {
  // Keep existing action URLs usable without interpreting user-supplied markup.
  return text.split(/(https?:\/\/[^\s<>"']+)/g).map(part => {
    if (!/^https?:\/\//.test(part)) return escapeEmail(part);
    const safe = escapeEmail(part);
    return `<a href="${safe}" style="color:#185c43;text-decoration:underline;overflow-wrap:anywhere">${safe}</a>`;
  }).join('');
}
export function brandedEmail(subject: string, text: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeEmail(subject)}</title></head><body style="margin:0;background:#eef2ed;color:#183d32;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${escapeEmail(text.slice(0,120))}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #d7e2da;border-radius:20px"><tr><td style="padding:28px 24px;background:#123e35;color:#ffffff;border-radius:20px 20px 0 0;font-size:22px;font-weight:bold">MicroFreelanceHub<span style="display:block;margin-top:8px;font-size:12px;font-weight:normal;letter-spacing:2px;color:#d8ebd3">YOUR CLIENT WORK, CONNECTED</span></td></tr><tr><td style="padding:32px 24px"><h1 style="margin:0 0 24px;font-size:28px;line-height:1.25;overflow-wrap:anywhere">${escapeEmail(subject)}</h1><div style="font-size:16px;line-height:1.75;white-space:pre-wrap;overflow-wrap:anywhere">${emailMessageHtml(text)}</div></td></tr><tr><td style="padding:24px;border-top:1px solid #d7e2da;font-size:13px;line-height:1.7;color:#486255">Sent through MicroFreelanceHub.<br><a href="https://www.microfreelancehub.com" style="color:#185c43">Visit MicroFreelanceHub</a> &middot; <a href="https://www.microfreelancehub.com/privacy-policy" style="color:#185c43">Privacy</a></td></tr></table></td></tr></table></body></html>`;
}
