import {useState} from 'react';
import {run,getSet,setSet} from './db';
import {ping,download} from './notify';
const LIB={Islam:[['Morning & evening adhkar',7],['Sunnah prayers',7],['Read tafsir 10 min',3],['Fast Monday/Thursday',2],['Give sadaqa',2],['Tahajjud',2],['Dua before sleep',7],['Read Quran with meaning',7]],
Myself:[['Read 20 pages',7],['Write a journal line',7],['Plan tomorrow',7],['Stretch 10 min',5],['Drink 2L water',7],['Learn a new skill',5],['No sugar',5],['Walk 30 min',4],['Cold shower',3],['Ship one small project',3]],
Family:[['Call parents',4],['Help at home',3],['Family meal together',2],['Message a relative',3],['Save money for family',5],['Do one thing for my sister',2]]};
const ics=t=>{const [h,m]=t.split(':'),d=new Date(),p=x=>String(x).padStart(2,'0');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Pathway//EN','BEGIN:VEVENT','UID:pathway-evening@local',`DTSTART:${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}T${h}${m}00`,'DURATION:PT10M','RRULE:FREQ=DAILY','SUMMARY:Close the day in Pathway ✨','BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Light your stars','TRIGGER:PT0M','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n')};
export default function Plan({H,load}){
  const [on,setOn]=useState(getSet('notif','0')==='1'),[t,setT]=useState(getSet('remind','21:30')),[a,setA]=useState('Myself'),[n,setN]=useState(''),[w,setW]=useState(7),[msg,setMsg]=useState('');
  const add=(area,name,pw)=>{run('insert into habits select null,?,?,?,coalesce(max(sort),0)+1 from habits',[area,name,pw]);load()};
  const enable=async()=>{const p=await window.Notification?.requestPermission?.();
    if(p==='granted'){setSet('notif','1');setOn(true);setMsg('Reminders on.');ping('Pathway',`I will remind you at ${t}.`)}else setMsg('Notifications are blocked here. Use the calendar reminder below.')};
  return <>
    <div className="card"><h3>Reminders</h3>
      <p className="dim">Evening check-in at the time you choose, plus a daily recap of good things you did. Browsers only fire these while Pathway is open or installed to your home screen. The calendar file works even when it is closed.</p>
      <input type="time" value={t} onChange={e=>{setT(e.target.value);setSet('remind',e.target.value)}} style={{background:'#0b1020',color:'#e8ecf8',border:'1px solid #243058',borderRadius:8,padding:9}}/>
      <div><button className="b" onClick={on?()=>{setSet('notif','0');setOn(false)}:enable}>{on?'Turn reminders off':'Turn reminders on'}</button>
      <button className="b" onClick={()=>ping('Close your day','This is how your reminder will look.')}>Test</button>
      <button className="b" onClick={()=>download('pathway-reminder.ics',ics(t),'text/calendar')}>Add daily reminder to calendar</button></div>
      {msg&&<p className="dim">{msg}</p>}</div>
    <div className="card"><h3>Add your own star</h3>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><select value={a} onChange={e=>setA(e.target.value)}>{Object.keys(LIB).map(k=><option key={k}>{k}</option>)}</select>
      <input type="text" style={{flex:1,minWidth:140,fontFamily:'inherit'}} placeholder="New habit" value={n} onChange={e=>setN(e.target.value)}/>
      <select value={w} onChange={e=>setW(+e.target.value)}>{[1,2,3,4,5,6,7].map(x=><option key={x} value={x}>{x===7?'daily':x+' per week'}</option>)}</select></div>
      <button className="b" onClick={()=>{if(n.trim()){add(a,n.trim(),w);setN('')}}}>Add</button></div>
    <div className="card"><h3>Ideas for each pole</h3>{Object.entries(LIB).map(([k,l])=><div key={k} style={{'--c':`var(--${k})`}}><p style={{color:`var(--${k})`,margin:'10px 0 0'}}>{k}</p>
      {l.filter(([x])=>!H.some(h=>h.name===x)).map(([x,p])=><button key={x} className="chip" onClick={()=>add(k,x,p)}>+ {x}</button>)}</div>)}</div>
    <div className="card"><h3>Your stars</h3>{H.map(h=><div className="row" key={h.id} style={{'--c':`var(--${h.area})`}}><span className="n" style={{color:`var(--${h.area})`}}>{h.name}</span><span className="pill">{h.per_week}/wk</span>
      <button className="chip" onClick={()=>confirm(`Remove "${h.name}" and its history?`)&&(run('delete from habits where id=?',[h.id]),run('delete from logs where habit_id=?',[h.id]),load())}>✕</button></div>)}</div>
  </>;
}
