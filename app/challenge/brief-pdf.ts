import {briefFields} from './examples';

/** Client-only export: no project text is sent to a PDF service. */
export async function buildBriefPdf(values:string[],reviewed:boolean[]){
 const [{jsPDF},response]=await Promise.all([import('jspdf'),fetch('/fonts/NotoSans-Regular.ttf')]);
 if(!response.ok)throw new Error('Font unavailable');
 const bytes=new Uint8Array(await response.arrayBuffer());
 let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 const doc=new jsPDF({unit:'pt',format:'a5',compress:true});
 doc.addFileToVFS('NotoSans.ttf',btoa(binary));doc.addFont('NotoSans.ttf','Brief','normal');doc.setFont('Brief');
 const font=doc.getFont().metadata as {characterToGlyph?:(code:number)=>number};
 if(font.characterToGlyph&&values.some(value=>Array.from(value).some(char=>!/[\n\r\t]/.test(char)&&!font.characterToGlyph!(char.codePointAt(0)!))))throw new Error('This text includes characters unavailable in the PDF font. Use the editable text download to preserve them.');
 doc.setProperties({title:'Project brief — for client review',author:'MicroFreelanceHub',subject:'Project scope and client discussion'});
 const w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight(),margin=30,bottom=h-49,content=w-margin*2;
 let y=0;
 function page(first=false){
  if(!first)doc.addPage();
  doc.setFillColor(18,100,91);doc.rect(0,0,w,7,'F');
  doc.setFontSize(11);doc.setTextColor(18,64,59);doc.text('MicroFreelanceHub',margin,31);
  doc.setFontSize(9);doc.setTextColor(93,109,106);doc.text(first?'CLIENT-READY PROJECT':'PROJECT BRIEF · CONTINUED',margin,48);
  y=first?78:75;
 }
 function line(text:string,size=13,color:[number,number,number]=[29,48,46]){
  doc.setFontSize(size);doc.setTextColor(...color);
  for(const part of doc.splitTextToSize(text,content) as string[]){
   if(y+size>bottom)page();
   doc.setFontSize(size);doc.setTextColor(...color);doc.text(part,margin,y);y+=size*1.5;
  }
 }
 page(true);
 line('Your project brief',25,[18,64,59]);y+=5;
 line('FOR CLIENT REVIEW · NOT AN AGREEMENT',9,[93,109,106]);y+=15;
 // The project name is content, not a filename or unsafe HTML.
 line(values[0]?.trim()||'Untitled project',16);y+=13;
 const pending=briefFields.filter((_,i)=>!values[i]?.trim()||!reviewed[i]).map(([label])=>label);
 if(pending.length){line('Draft — review before sharing',11,[125,73,24]);line('Still to check: '+pending.join('; ')+'.',10,[93,78,61]);y+=14;}
 else{line('Prepared for a conversation with your client. Confirm the details together before starting.',11,[93,109,106]);y+=14;}
 for(let i=1;i<briefFields.length;i++){
  // Keep section title and at least two body lines together.
  if(y+83>bottom)page();
  doc.setDrawColor(204,220,215);doc.line(margin,y,w-margin,y);y+=20;
  const headings=['','Deliverables & acceptance','Revisions & boundaries','What the client supplies','Milestones & payment timing','Handling extra requests'];
  line(String(i).padStart(2,'0')+'  '+headings[i],11,[18,100,91]);y+=5;
  line(values[i]?.trim()||'To be completed before sharing.');y+=18;
 }
 if(y+64>bottom)page();
 line('Next step',11,[18,100,91]);
 line('Review this brief with your client. Confirm scope, dates, amounts and approval in your project agreement. Educational starting point, not legal advice.',10,[93,109,106]);
 const pages=doc.getNumberOfPages();
 for(let i=1;i<=pages;i++){doc.setPage(i);doc.setDrawColor(204,220,215);doc.line(margin,h-35,w-margin,h-35);doc.setFontSize(8);doc.setTextColor(93,109,106);doc.text('microfreelancehub.com/challenge',margin,h-20);doc.text(`${i} / ${pages}`,w-margin,h-20,{align:'right'});}
 return doc;
}
