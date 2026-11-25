'use client';
import {useEffect,useState} from 'react';
import {CalendarTask,loadCalendarTasks} from '../lib/calendarTasks';
export default function CalendarDueNext({actorId}:{actorId:string}){
 const [tasks,setTasks]=useState<CalendarTask[]|null>(null),[error,setError]=useState(''),[reload,setReload]=useState(0),[visibleCount,setVisibleCount]=useState(5);
 useEffect(()=>{setTasks(null);setError('');if(!actorId)return;const controller=new AbortController();let current=true;
  loadCalendarTasks(actorId,controller.signal).then(rows=>{if(current)setTasks(rows);}).catch(e=>{if(current)setError(e instanceof Error?e.message:'Tasks unavailable.');});
  return()=>{current=false;controller.abort();};
 },[actorId,reload]);
 const now=new Date(),today=String(now.getFullYear())+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
 const date=(value:string)=>new Date(value+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
 if(!actorId)return null;
 return <section className="calendar-due-next" aria-labelledby="calendar-due-next-title">
  <header><div><p className="calendar-eyebrow">FROM YOUR EXISTING TASKS</p><h2 id="calendar-due-next-title">Due next</h2><p>Open tasks, earliest due date first. Undated tasks follow. Dates are all-day deadlines, not appointments. Overdue uses your device's current date.</p></div><a href="/workspace/tasks">Manage tasks</a></header>
  {error?<div role="alert"><p>{error}</p><button type="button" onClick={()=>setReload(n=>n+1)}>Retry tasks</button></div>:!tasks?<p role="status">Loading your task queue...</p>:tasks.length===0?<p>No open tasks. Add one in Tasks to see it here.</p>:<>
   <p className="calendar-task-summary">{tasks.length} open task{tasks.length===1?'':'s'} · {tasks.filter(t=>t.due_date&&t.due_date<today).length} overdue</p>
   <ol>{tasks.slice(0,visibleCount).map(task=><li key={task.id}><span className="calendar-task-kind">Task</span><strong>{task.title}</strong><span className={task.due_date&&task.due_date<today?'calendar-task-overdue':'calendar-task-date'}>{!task.due_date?'No due date':task.due_date<today?'Overdue · '+date(task.due_date):task.due_date===today?'Due today':'Due '+date(task.due_date)}</span></li>)}</ol>
   {tasks.length>visibleCount&&<button type="button" onClick={()=>setVisibleCount(n=>n+20)}>Show more tasks ({tasks.length-visibleCount} remaining)</button>}
   <p className="calendar-task-note">Saved tasks only. Refresh to pick up changes made in another tab.</p><button type="button" onClick={()=>setReload(n=>n+1)}>Refresh tasks</button>
  </>}
 </section>;
}
