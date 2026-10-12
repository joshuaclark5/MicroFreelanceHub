// Only fixed action names; never send estimate labels, references or draft text.
export function trackQuoteEvent(name:'quote_tool_opened'|'quote_added'|'quote_message_copied'|'quote_response_recorded'){
 if(typeof window==='undefined'||navigator.doNotTrack==='1'||(navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl)return;
 const gtag=(window as Window & {gtag?:(...args:unknown[])=>void}).gtag;
 if(typeof gtag==='function')gtag('event',name,{event_category:'quote_follow_up'});
}
