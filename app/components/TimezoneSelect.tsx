'use client';
import {useEffect,useId,useRef,useState} from 'react';
import './timezone-select.css';
const common:Record<string,string>={
 'America/New_York':'Eastern Time — New York','America/Chicago':'Central Time — Chicago',
 'America/Denver':'Mountain Time — Denver','America/Phoenix':'Arizona — Phoenix (no daylight saving)',
 'America/Los_Angeles':'Pacific Time — Los Angeles','America/Anchorage':'Alaska — Anchorage',
 'Pacific/Honolulu':'Hawaii — Honolulu','America/Toronto':'Toronto','America/Vancouver':'Vancouver',
 'Europe/London':'London','Europe/Paris':'Paris','Asia/Kolkata':'India — Kolkata',
 'Asia/Tokyo':'Tokyo','Australia/Sydney':'Sydney','UTC':'UTC — Coordinated Universal Time'
};
const display=(zone:string)=>common[zone]||zone.replaceAll('_',' ').replaceAll('/',' / ');
export default function TimezoneSelect({value,onChange,className,label='Timezone'}:{value:string;onChange:(value:string)=>void;className?:string;label?:string}){
 const id=useId(),input=useRef<HTMLInputElement>(null);
 const [zones,setZones]=useState<string[]>(Object.keys(common)),[text,setText]=useState(display(value)),[query,setQuery]=useState(''),[open,setOpen]=useState(false),[active,setActive]=useState(0);
 useEffect(()=>{const api=Intl as typeof Intl & {supportedValuesOf?:(key:string)=>string[]};if(api.supportedValuesOf)setZones(Array.from(new Set([...Object.keys(common),...api.supportedValuesOf('timeZone')])));},[]);
 useEffect(()=>{setText(display(value));setQuery('');setActive(0);},[value]);
 const needle=query.trim().toLowerCase().replaceAll('_',' '),matches=Array.from(new Set([...zones,value])).filter(z=>(display(z)+' '+z.replaceAll('_',' ')).toLowerCase().includes(needle));
 const options=matches.slice(0,50),current=Math.min(active,Math.max(0,options.length-1));
 function choose(zone:string){onChange(zone);setText(display(zone));setQuery('');setOpen(false);setActive(0);}
 function close(){setOpen(false);setText(display(value));setQuery('');setActive(0);}
 useEffect(()=>{if(open)document.getElementById(id+'-option-'+current)?.scrollIntoView({block:'nearest'});},[current,open,id]);
 return <div className="timezone-picker"><label htmlFor={id}>{label}</label><input ref={input} id={id} className={className} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={id+'-list'} aria-activedescendant={open&&options.length?id+'-option-'+current:undefined} aria-describedby={id+'-help'} autoComplete="off" spellCheck={false} value={text}
 onFocus={e=>{setOpen(true);setQuery('');setActive(0);e.target.select();}} onBlur={close}
 onChange={e=>{setText(e.target.value);setQuery(e.target.value);setActive(0);setOpen(true);}}
 onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();close();}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpen(true);setActive(n=>Math.max(0,Math.min(options.length-1,n+(e.key==='ArrowDown'?1:-1))));}else if(e.key==='Enter'&&open){e.preventDefault();if(options[current])choose(options[current]);}}}/>
 <small id={id+'-help'}>Type a city or timezone, then choose a result.</small>
 {open&&<div className="timezone-results"><ul id={id+'-list'} role="listbox" aria-label={label+' options'}>{options.map((zone,index)=><li role="option" aria-selected={index===current} id={id+'-option-'+index} key={zone} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(zone)}><strong>{display(zone)}</strong><span>{zone}</span></li>)}</ul><p role="status">{matches.length===0?'No matching timezone. Your selection is unchanged.':matches.length>50?'Showing 50 matches. Keep typing to narrow the list.':matches.length+' matching timezones'}</p></div>}
 </div>;
}
