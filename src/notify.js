import {q,getSet,setSet} from './db';
const iso=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
export async function ping(title,body){
  if(!window.Notification||Notification.permission!=='granted')return;
  const o={body,icon:'icon.svg',tag:'p'+Date.now()};
  try{const r=await navigator.serviceWorker?.getRegistration();r?await r.showNotification(title,o):new Notification(title,o)}catch{new Notification(title,o)}
}
export function tick(){
  if(getSet('notif','0')!=='1')return;
  const n=new Date(),hm=n.toTimeString().slice(0,5),t=iso(n),y=iso(new Date(Date.now()-864e5));
  const c=d=>q('select count(*) c from logs where day=?',[d])[0].c,total=q('select count(*) c from habits')[0].c;
  if(hm>=getSet('remind','21:30')&&getSet('s_eve')!==t){setSet('s_eve',t);const d=c(t);
    ping(d>=total?'The whole sky is lit ✨':'Close your day',d>=total?'Every star shone today. Rest well.':`${d} stars are lit, ${total-d} still dark. Two minutes to fill them in and write one good thing.`)}
  if(hm>='09:00'&&getSet('s_bd')!==t){setSet('s_bd',t);const md=t.slice(5),tm=iso(new Date(Date.now()+864e5)).slice(5);
    q('select name,md from birthdays where md in (?,?)',[md,tm]).forEach(x=>ping(x.md===md?`🎂 ${x.name}'s birthday is today`:`${x.name}'s birthday is tomorrow`,x.md===md?'Send a message or call. It means a lot.':'Plan a call, a message, or a small gift.'));
    if(getSet('birth').slice(5)===md)ping(`Happy birthday, ${getSet('name')} 🎉`,'Another year, another chance to shine.')}
  if(hm>='14:00'&&getSet('s_win')!==t){setSet('s_win',t);const d=c(y);
    if(d)ping('A good thing you did',`Yesterday you lit ${d} stars, including ${q('select h.name from logs l join habits h on h.id=l.habit_id where l.day=? limit 2',[y]).map(r=>r.name).join(' and ')}. That was you.`)}
}
export const download=(name,data,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click()};
export const age=b=>{if(!b)return '';const d=new Date(b),n=new Date();let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;return a};
export const bmi=(w,h)=>w&&h?+(w/(h/100)**2).toFixed(1):null;
export const until=md=>{const n=new Date(),y=n.getFullYear(),t0=new Date(y,n.getMonth(),n.getDate());let d=new Date(y,+md.slice(0,2)-1,+md.slice(3,5));if(d<t0)d=new Date(y+1,d.getMonth(),d.getDate());return Math.round((d-t0)/864e5)};
