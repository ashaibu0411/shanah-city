/** Generate weekly services using Denver wall-clock time, including DST transitions. */
export type WeeklyServiceRule = {weekday:0|1|2|3|4|5|6;hour:number;minute:number;title:string};
export const DEFAULT_WEEKLY_SERVICES: WeeklyServiceRule[] = [
  {weekday:5,hour:19,minute:0,title:"Glory Encounter Service"},
  {weekday:0,hour:10,minute:0,title:"Sunday Celebration Service"},
];
function denverParts(date:Date) {
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Denver",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23",weekday:"short"}).formatToParts(date);
 return Object.fromEntries(parts.map(part=>[part.type,part.value]));
}
const dayNumber:Record<string,number>={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
export function upcomingWeeklyServiceDates(now=new Date(),rules=DEFAULT_WEEKLY_SERVICES,days=21) {
 const results:{title:string;startsAt:string}[]=[];
 const seen=new Set<string>();
 for(let offset=0;offset<days*24*60;offset+=30){
   const candidate=new Date(now.getTime()+offset*60_000);
   const p=denverParts(candidate);
   const rule=rules.find(r=>r.weekday===dayNumber[p.weekday]&&r.hour===Number(p.hour)&&r.minute===Number(p.minute));
   if(!rule)continue;
   const key=`${p.year}-${p.month}-${p.day}:${rule.title}`;
   if(seen.has(key))continue;
   seen.add(key);results.push({title:rule.title,startsAt:candidate.toISOString()});
 }
 return results;
}
