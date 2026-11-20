/**
 * HUELLA operates on a universal Monday-Sunday schedule. Completing
 * onboarding activates delivery from the FOLLOWING local calendar day;
 * it never shifts any weekday's assigned purpose.
 *
 * Mon family, Tue connect, Wed verified story, Thu understand,
 * Fri rest, Sat grow skills, Sun reflect.
 *
 * UTC noon is used only for date arithmetic; actual delivery uses the
 * family's local hour and time zone in the scheduler.
 */
const SLOTS=Object.freeze(['family','conectar','story','comprender',null,'sembrar','reflection']);
const DAY_PATTERN=/^\d{4}-\d{2}-\d{2}$/;
const asDay=day=>{
 if(typeof day!=='string'||!DAY_PATTERN.test(day))return null;
 const date=new Date(day+'T12:00:00Z');
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===day?date:null;
};
export function addCalendarDays(day,count){
 const d=asDay(day);
 if(!d||!Number.isInteger(count))throw Error('huella_invalid_calendar_day');
 d.setUTCDate(d.getUTCDate()+count);
 return d.toISOString().slice(0,10);
}
export function daysBetween(day,start){
 const a=asDay(day),b=asDay(start);
 if(!a||!b)throw Error('huella_invalid_calendar_day');
 return Math.round((a-b)/86400000);
}
export function calendarWeekStart(day){
 const date=asDay(day);
 if(!date)throw Error('huella_invalid_calendar_day');
 // Mon=0, Tue=1, ... Sun=6
 const weekday=(date.getUTCDay()+6)%7;
 return addCalendarDays(day,-weekday);
}
export function familyCycleForDay(registrationDay,currentDay){
 const registration=asDay(registrationDay),current=asDay(currentDay);
 if(!registration||!current||daysBetween(currentDay,registrationDay)<=0)return null;
 const slotIndex=(current.getUTCDay()+6)%7;
 const key=calendarWeekStart(currentDay);
 return {key,slot:SLOTS[slotIndex],slotIndex,
  weekIndex:daysBetween(key,calendarWeekStart(registrationDay))/7,day:currentDay};
}
export function nextFamilyWeekStart(registrationDay,today){
 if(!asDay(registrationDay)||!asDay(today))return null;
 const anchor=daysBetween(today,registrationDay)<0?registrationDay:today;
 return addCalendarDays(calendarWeekStart(anchor),7);
}
export const FAMILY_CYCLE_SLOTS=SLOTS;
