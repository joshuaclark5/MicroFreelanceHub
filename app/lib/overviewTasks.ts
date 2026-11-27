export function browserCalendarDate(now:Date):string {
 return [String(now.getFullYear()).padStart(4,'0'),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
}
export function validTaskDate(value:unknown):value is string {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const parsed=new Date(value+'T00:00:00Z');
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
}
export function taskUrgency(due:unknown,today:string|null):string {
 if(due===undefined||due===null||due==='')return 'No due date';
 if(!validTaskDate(due))return 'Due date unavailable';
 if(!today||!validTaskDate(today))return 'Due';
 return due<today?'Overdue':due===today?'Due today':'Upcoming';
}
export function openTasks<T extends {id:string;status?:string;due_date?:string}>(rows:T[]):T[] {
 return rows.filter(row=>row.status==='open').sort((a,b)=>(validTaskDate(a.due_date)?a.due_date:'9999-99-99').localeCompare(validTaskDate(b.due_date)?b.due_date:'9999-99-99')||a.id.localeCompare(b.id));
}
