import type { LiveStreamSchedule } from "@/lib/live-schedule-types";
export type WeeklyServiceRule={weekday:number;hour:number;minute:number;title:string};
export const DEFAULT_WEEKLY_SERVICES:WeeklyServiceRule[]=[
 {weekday:5,hour:19,minute:0,title:"Glory Encounter Service"},
 {weekday:0,hour:10,minute:0,title:"Sunday Celebration Service"},
];
const weekdays=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function parts(date:Date){const values=new Intl.DateTimeFormat("en-US",{timeZone:"America/Denver",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23",weekday:"short"}).formatToParts(date);return Object.fromEntries(values.map(v=>[v.type,v.value]));}
function denverToUtc(year:number,month:number,day:number,hour:number,minute:number){
 const nominal=Date.UTC(year,month-1,day,hour,minute);
 let candidate=nominal;
 for(let i=0;i<3;i++){
  const p=parts(new Date(candidate));
  const observed=Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour),Number(p.minute));
  candidate+=nominal-observed;
 }
 return new Date(candidate);
}
export function recurringLiveSchedules(now=new Date(),days=21):LiveStreamSchedule[]{
 const schedules:LiveStreamSchedule[]=[];
 const start=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()-1,12);
 for(let offset=0;offset<days+2;offset++){
  const anchor=new Date(start+offset*86400000);
  const p=parts(anchor);
  const year=Number(p.year),month=Number(p.month),day=Number(p.day);
  const dateKey=`${p.year}-${p.month}-${p.day}`;
  const rules=dateKey==="2026-11-25"
    ? [{weekday:3,hour:19,minute:0,title:"Glory Encounter Service"}]
    : dateKey==="2026-11-27" ? [] : DEFAULT_WEEKLY_SERVICES;
  for(const rule of rules){
   if(weekdays[rule.weekday]!==p.weekday)continue;
   const startsAt=denverToUtc(year,month,day,rule.hour,rule.minute).toISOString();
   if(Date.parse(startsAt)<now.getTime()-3*3600000)continue;
   schedules.push({id:`recurring-${dateKey}-${rule.weekday}`,title:rule.title,startsAt,platform:"all",notifyEnabled:false,createdBy:"system",createdByName:"Shanah City",updatedAt:startsAt});
  }
 }
 return schedules.sort((a,b)=>a.startsAt.localeCompare(b.startsAt));
}
