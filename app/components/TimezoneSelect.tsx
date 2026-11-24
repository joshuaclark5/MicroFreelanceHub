'use client';
import {useEffect,useState} from 'react';
const common:Record<string,string>={
 'America/New_York':'Eastern Time — New York','America/Chicago':'Central Time — Chicago',
 'America/Denver':'Mountain Time — Denver','America/Phoenix':'Arizona — Phoenix (no daylight saving)',
 'America/Los_Angeles':'Pacific Time — Los Angeles','America/Anchorage':'Alaska — Anchorage',
 'Pacific/Honolulu':'Hawaii — Honolulu','America/Toronto':'Toronto','America/Vancouver':'Vancouver',
 'Europe/London':'London','Europe/Paris':'Paris','Asia/Kolkata':'India — Kolkata',
 'Asia/Tokyo':'Tokyo','Australia/Sydney':'Sydney','UTC':'UTC — Coordinated Universal Time'
};
export default function TimezoneSelect({value,onChange,className}:{value:string;onChange:(value:string)=>void;className?:string}){
 const [zones,setZones]=useState<string[]>(Object.keys(common));
 useEffect(()=>{const api=Intl as typeof Intl & {supportedValuesOf?:(key:string)=>string[]};
  if(api.supportedValuesOf)setZones(Array.from(new Set([...Object.keys(common),...api.supportedValuesOf('timeZone')])).sort());
 },[]);
 const other=Array.from(new Set([...zones,value])).filter(z=>!common[z]).sort();
 return <select className={className} required value={value} onChange={e=>onChange(e.target.value)}>
  <optgroup label="Common timezones">{Object.entries(common).map(([zone,label])=><option key={zone} value={zone}>{label}</option>)}</optgroup>
  {other.length>0&&<optgroup label="All other timezones">{other.map(zone=><option key={zone} value={zone}>{zone.replaceAll('_',' ').replaceAll('/',' / ')}</option>)}</optgroup>}
 </select>;
}
