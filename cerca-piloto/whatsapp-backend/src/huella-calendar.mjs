/**
 * HUELLA: each household starts at its chosen local hour on the day AFTER
 * finishing onboarding. The seven-day cycle is NOT aligned to weekdays.
 *
 * Day 1 family, day 2 connect, day 3 verified story, day 4 understand,
 * day 5 rest, day 6 grow skills, day 7 reflect. Repeat in this order.
 *
 * UTC noon is used only for calendar arithmetic, never as a delivery time.
 * This avoids DST and instant/timezone parsing mistakes.
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
export function familyCycleForDay(registrationDay,currentDay){
 if(!asDay(registrationDay)||!asDay(currentDay))return null;
 const offset=daysBetween(currentDay,registrationDay)-1;
 if(offset<0)return null; // No message on registration day.
 const weekIndex=Math.floor(offset/7);
 const slotIndex=offset%7;
 const key=addCalendarDays(registrationDay,1+weekIndex*7);
 return {key,slot:SLOTS[slotIndex],slotIndex,weekIndex,day:currentDay};
}
export function nextFamilyWeekStart(registrationDay,today){
 if(!asDay(registrationDay)||!asDay(today))return null;
 const current=familyCycleForDay(registrationDay,today);
 if(!current)return addCalendarDays(registrationDay,1);
 return addCalendarDays(current.key,7);
}
export const FAMILY_CYCLE_SLOTS=SLOTS;
