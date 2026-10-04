import {useState,useEffect} from 'react';
import {run,getSet,setSet,q} from './db';
import {until} from './notify';
const iso=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('pathway'+s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const WORDS=['Istiqamah. Steady beats loud.','Sabr is not waiting. It is staying kind while you build.','You do not need a perfect day, only a true one.','Small stars, one sky.','Discipline is how you love your future self.','Fall seven times, rise with a dua.','Your habits are your vote for who you become.','The door to return is always open.','Be gentle with yourself, and stubborn with your goals.','Today is a clean page. Write one good line.','Every step toward Allah is met with speed.','Rest is part of the journey, not the end of it.'];
const inp={fontFamily:'inherit',marginTop:8};
export function Auth({onLogin}){
  const [U,setU]=useState(()=>JSON.parse(localStorage.getItem('pathway-users')||'[]')),[sel,setSel]=useState(null),[pin,setPin]=useState(''),[nm,setNm]=useState(''),[err,setErr]=useState('');
  const save=u=>{setU(u);localStorage.setItem('pathway-users',JSON.stringify(u))};
  const create=async()=>{if(!nm.trim())return;const id=Date.now().toString(36);
    if(!U.length&&localStorage.getItem('pathway-db'))localStorage.setItem('pathway-db:'+id,localStorage.getItem('pathway-db'));
    save([...U,{id,nm:nm.trim(),h:pin?await sha(pin):''}]);onLogin(id,nm.trim())};
  const enter=async u=>{if(u.h&&await sha(pin)!==u.h){setErr('Wrong PIN. Try again.');return}onLogin(u.id)};
  return <main className="greet"><div>
    <h1>Pathway</h1><p className="dim">Who is walking today?</p>
    {U.map(u=><div className="card" key={u.id}><div className="row" style={{border:0}}>
      <b className="n" style={{cursor:'pointer',fontFamily:'Fraunces',fontSize:20}} onClick={()=>u.h?(setSel(u),setErr('')):onLogin(u.id)}>{u.nm}{u.h?' 🔒':''}</b>
      <button className="chip" style={{'--c':'var(--dim)'}} onClick={()=>confirm(`Delete profile "${u.nm}" and all its data?`)&&(localStorage.removeItem('pathway-db:'+u.id),save(U.filter(x=>x.id!==u.id)))}>✕</button></div>
      {sel?.id===u.id&&<><input type="password" inputMode="numeric" style={inp} placeholder="PIN" value={pin} onChange={e=>setPin(e.target.value)}/><button className="b" onClick={()=>enter(u)}>Enter</button>{err&&<span style={{color:'var(--Family)'}}>{err}</span>}</>}</div>)}
    <div className="card"><h3>{U.length?'Add a profile':'Create your profile'}</h3>
      <input type="text" style={inp} placeholder="Name" value={nm} onChange={e=>setNm(e.target.value)}/>
      <input type="password" inputMode="numeric" style={inp} placeholder="PIN (optional)" value={pin} onChange={e=>setPin(e.target.value)}/>
      <button className="b" onClick={create}>Create and enter</button>
      <p className="dim">Profiles live on this device. A PIN keeps casual eyes out but does not encrypt your data.</p></div>
  </div></main>;
}
export function Onboard({uid,done}){
  const u=(JSON.parse(localStorage.getItem('pathway-users')||'[]').find(x=>x.id===uid)||{}).nm||'';
  const [f,setF]=useState({name:u,birth:'',height:'',weight:''}),s=k=>e=>setF({...f,[k]:e.target.value});
  const ok=f.name.trim()&&f.birth&&+f.height>0&&+f.weight>0;
  return <main className="greet"><div className="card"><h2>Welcome. Tell me about you.</h2><p className="dim">You can change all of this later in the Me tab.</p>
    <input type="text" style={inp} placeholder="Full name" value={f.name} onChange={s('name')}/>
    <label className="dim">Date of birth (I work out your age)<input type="date" style={inp} value={f.birth} onChange={s('birth')}/></label>
    <input type="number" style={inp} placeholder="Height in cm" value={f.height} onChange={s('height')}/>
    <input type="number" style={inp} placeholder="Weight in kg" value={f.weight} onChange={s('weight')}/>
    <button className="b" disabled={!ok} style={{opacity:ok?1:.4}} onClick={()=>{setSet('name',f.name.trim());setSet('birth',f.birth);run('insert or replace into body values(?,?,?)',[iso(new Date()),+f.weight,+f.height]);done()}}>Save and continue</button></div></main>;
}
export function Greet({done}){
  const n=new Date(),hr=n.getHours(),g=hr<5?'Peace':hr<12?'Good morning':hr<18?'Good afternoon':'Good evening',t=iso(n),md=t.slice(5);
  const [word]=useState(()=>WORDS[Math.floor(Math.random()*WORDS.length)]);
  const last=q('select * from body where weight is not null order by day desc limit 1')[0]||{},[w,setW]=useState(last.weight||''),[typing,setTyping]=useState(false);
  const bd=q('select name from birthdays where md=?',[md]),own=getSet('birth').slice(5)===md;
  const go=()=>{if(w&&+w!==last.weight)run('insert or replace into body values(?,?,?)',[t,+w,last.height||null]);done()};
  useEffect(()=>{const i=setTimeout(()=>!typing&&go(),7000);return()=>clearTimeout(i)},[typing,w]);
  return <main className="greet"><div style={{textAlign:'center'}}>
    <p className="dim">{g}</p><h1 style={{fontSize:44,color:'var(--Islam)'}}>{getSet('name')}</h1>
    <p style={{fontFamily:'Fraunces',fontSize:21,margin:'18px 0'}}>{word}</p>
    {own&&<p>🎉 Happy birthday! May this year be your brightest.</p>}
    {bd.map(b=><p key={b.name}>🎂 Today is {b.name}'s birthday. A message goes a long way.</p>)}
    <label className="dim">Weight today, kg (optional)<input type="number" style={{...inp,textAlign:'center',width:140,display:'block',margin:'8px auto'}} value={w} onFocus={()=>setTyping(true)} onChange={e=>setW(e.target.value)}/></label>
    <button className="b" onClick={go}>Open my sky</button></div></main>;
}
