import {useEffect,useMemo,useState} from 'react';
import {open,q,run,exportBytes,getSet,setUser} from './db';
import {Auth,Onboard,Greet} from './Auth';
import Me from './Me';
import {tick} from './notify';
import Plan from './Plan';
import Report from './Report';
const AREAS=['Islam','Myself','Family'];
const iso=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const lastDays=n=>Array.from({length:n},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(n-1-i));return iso(d)});
const wkDays=()=>{const s=new Date();s.setDate(s.getDate()-((s.getDay()+6)%7));return lastDays(7).filter(d=>d>=iso(s))};
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;

function Main({uid,out}){
  const [ready,setReady]=useState(false),[tab,setTab]=useState('today'),[J,setJ]=useState({}),[stage,setStage]=useState(''),[toast,setToast]=useState(''),[H,setH]=useState([]),[L,setL]=useState(new Set()),[off,setOff]=useState(0);
  const load=()=>{setJ(Object.fromEntries(q('select * from journal').map(r=>[r.day,r])));setH(q('select * from habits order by sort'));setL(new Set(q('select * from logs').map(r=>r.habit_id+'|'+r.day)))};
  useEffect(()=>{open().then(()=>{load();setReady(true);setStage(getSet('name')?'greet':'onboard')})},[]);
  useEffect(()=>{if(!ready)return;tick();const i=setInterval(tick,30000);return()=>clearInterval(i)},[ready]);
  const day=lastDays(2)[1-off];
  const toggle=h=>{const k=h.id+'|'+day;if(L.has(k)){run('delete from logs where habit_id=? and day=?',[h.id,day])}else{run('insert into logs values(?,?)',[h.id,day]);const N=new Set(L).add(k),s=streakOf(h,N),ok=x=>N.has(x.id+'|'+day),all=H.every(ok),ar=H.filter(x=>x.area===h.area).every(ok);
    setToast(all?'The whole sky is lit. Alhamdulillah ✨':ar?`${h.area} constellation complete ✦`:h.per_week===7&&[3,7,14,30,60,100].includes(s)?`${s} days in a row: ${h.name} 🔥`:PRAISE[h.id%PRAISE.length]);setTimeout(()=>setToast(''),3200)}load()};
  const score=(d,area,ex)=>{const hs=H.filter(h=>(!area||h.area===area)&&h.id!==ex);const e=avg(hs.map(h=>h.per_week/7))*hs.length;return e?Math.min(1,hs.filter(h=>L.has(h.id+'|'+d)).length/e):0};
  if(!ready)return <main><p className="dim">Opening your database…</p></main>;
  if(stage==='onboard')return <Onboard uid={uid} done={()=>setStage('greet')}/>;
  if(stage==='greet')return <Greet done={()=>{load();setStage('app')}}/>;
  return <main>
    <h1>Pathway</h1>
    <p className="dim" style={{margin:0}}>Signed in as {getSet('name')}. <button className="chip" style={{'--c':'var(--dim)'}} onClick={out}>Switch profile</button></p>
    <p className="dim">Every tick lights a star. Every star is a step back to yourself.</p>
    <Level n={L.size}/>
    {tab==='today'&&<Today {...{H,L,day,off,setOff,toggle,score,J,load}}/>}
    {tab==='insights'&&<Insights {...{H,L,score}}/>}
    {tab==='report'&&<Report {...{H,L,J,score}}/>}
    {tab==='me'&&<Me load={load}/>}
    {tab==='plan'&&<Plan H={H} load={load}/>}
    {tab==='sql'&&<Sql load={load}/>}
    {toast&&<div className="toast">{toast}</div>}
    <nav>{[['today','Today'],['insights','Insights'],['report','Report'],['me','Me'],['plan','Plan'],['sql','SQL']].map(([k,n])=><button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{n}</button>)}</nav>
  </main>;
}

function Today({H,L,day,off,setOff,toggle,score,J,load}){
  const wk=wkDays(),done=h=>L.has(h.id+'|'+day);
  const streak=h=>{let n=0;const d=new Date();if(!L.has(h.id+'|'+iso(d)))d.setDate(d.getDate()-1);while(L.has(h.id+'|'+iso(d))){n++;d.setDate(d.getDate()-1)}return n};
  return <>
    <div className="card">
      <Sky H={H} done={done}/>
      <p className="dim" style={{textAlign:'center',margin:0}}>{Math.round(score(day)*100)}% of today's sky is lit</p>
    </div>
    <button className="b" style={{opacity:off?.5:1}} onClick={()=>setOff(0)}>Today</button>
    <button className="b" style={{opacity:off?1:.5}} onClick={()=>setOff(1)}>Yesterday</button>
    <Close day={day} J={J} load={load}/>
    {AREAS.map(a=><div className="card" key={a} style={{'--c':`var(--${a})`}}>
      <h3 style={{color:`var(--${a})`}}>{a}</h3>
      {H.filter(h=>h.area===a).map(h=>{const w=wk.filter(d=>L.has(h.id+'|'+d)).length,s=h.per_week===7?streak(h):0;
        return <div className="row" key={h.id}>
          <button className={'chk'+(done(h)?' on':'')} onClick={()=>toggle(h)} aria-label={h.name}/>
          <div className="n">{h.name}<div className="bar"><i style={{width:Math.min(100,w/h.per_week*100)+'%'}}/></div></div>
          <span className="pill">{h.per_week===7?(s?`🔥 ${s}d`:'—'):`${w}/${h.per_week} wk`}</span>
        </div>})}
    </div>)}
  </>;
}

function Sky({H,done}){
  const C={Islam:[75,70,48],Family:[80,235,48],Myself:[245,150,95]};
  const pts=a=>{const hs=H.filter(h=>h.area===a),[cx,cy,r]=C[a];
    return hs.map((h,i)=>{const t=i/hs.length*6.283+a.length,rr=r*(.55+.45*(i%2));return {h,x:cx+Math.cos(t)*rr,y:cy+Math.sin(t)*rr}})};
  return <svg viewBox="0 0 340 300" width="100%">
    {Array.from({length:46},(_,i)=><circle key={i} className="tw" cx={(i*97)%340} cy={(i*53)%300} r={.6+i%3*.4} fill="#fff" style={{animationDelay:i*.37+'s'}}/>)}
    {AREAS.map(a=>{const p=pts(a),lit=p.filter(s=>done(s.h)),c=`var(--${a})`,full=p.length&&lit.length===p.length,pl=lit.map(s=>s.x+','+s.y).join(' ');
      return <g key={a}>
        {full?<polygon points={pl} fill={c} opacity=".14" stroke={c}/>:<polyline points={pl} fill="none" stroke={c} strokeWidth="1" opacity=".6"/>}
        {p.map(s=>{const d=done(s.h);return <g key={s.h.id}>{d&&<circle className="pulse" cx={s.x} cy={s.y} r="10" fill={c}/>}<circle cx={s.x} cy={s.y} r={d?5:2.5} fill={d?c:'#4a5580'} style={{transition:'all .4s'}}><title>{s.h.name}</title></circle></g>})}
        <text x={C[a][0]} y={C[a][1]+C[a][2]+22} fill={c} fontSize="12" textAnchor="middle" fontFamily="Fraunces">{full?'✦ ':''}{a}</text>
      </g>})}
  </svg>;
}

function Insights({H,L,score}){
  const D=lastDays(42),E={};
  AREAS.forEach(a=>{let e=0;E[a]=D.map(d=>e=e*.7+score(d,a)*.3)});
  const cols={Islam:'#e6c35c',Myself:'#5eead4',Family:'#fb7185'};
  const wd=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],byWd=wd.map((_,i)=>avg(lastDays(56).filter(d=>(new Date(d+'T12:00').getDay()+6)%7===i).map(d=>score(d))));
  const w7=lastDays(7),weak=[...H].map(h=>({h,r:Math.min(1,w7.filter(d=>L.has(h.id+'|'+d)).length/h.per_week)})).sort((a,b)=>a.r-b.r)[0];
  const D30=lastDays(30),key=H.map(h=>{const w=D30.filter(d=>L.has(h.id+'|'+d)),n=D30.filter(d=>!L.has(h.id+'|'+d));
    return w.length>3&&n.length>3?{h,lift:avg(w.map(d=>score(d,null,h.id)))-avg(n.map(d=>score(d,null,h.id)))}:null}).filter(Boolean).sort((a,b)=>b.lift-a.lift).slice(0,3);
  return <>
    <div className="card nudge"><b>Smallest next step</b><p style={{margin:'4px 0 0'}}>{weak.h.name} is your quietest star this week ({Math.round(weak.r*100)}% of target). Do just this one today.</p></div>
    <div className="card"><h3>Momentum</h3><p className="dim">Smoothed 28-day trend per area</p>
      <svg viewBox="0 0 300 110" width="100%">{AREAS.map(a=><polyline key={a} fill="none" stroke={cols[a]} strokeWidth="2" strokeLinejoin="round" points={E[a].slice(14).map((v,i)=>`${i/27*300},${105-v*100}`).join(' ')}/>)}</svg>
      <p className="dim">{AREAS.map(a=><span key={a} style={{color:cols[a],marginRight:12}}>● {a}</span>)}</p></div>
    <div className="card"><h3>Last 28 days</h3><div className="grid">{lastDays(28).map(d=><i key={d} title={d} style={{opacity:.08+score(d)*.92}}/>)}</div></div>
    <div className="card"><h3>Your strongest weekday</h3>
      <svg viewBox="0 0 300 90" width="100%">{byWd.map((v,i)=><g key={i}><rect x={i*43+6} y={70-v*65} width="30" height={v*65+1} rx="4" fill="#7c9cff"/><text x={i*43+21} y="86" fontSize="11" fill="#8a93b2" textAnchor="middle">{wd[i]}</text></g>)}</svg></div>
    <div className="card"><h3>Keystone habits</h3><p className="dim">When you do these, everything else gets easier (last 30 days).</p>
      {key.length?key.map(k=><div className="row" key={k.h.id}><span className="n">{k.h.name}</span><b>{k.lift>0?'+':''}{Math.round(k.lift*100)}%</b></div>):<p className="dim">Log a few more days and I'll find them.</p>}</div>
  </>;
}

function Sql({load}){
  const [s,setS]=useState('select h.area,h.name,count(l.day) done\nfrom habits h left join logs l on l.habit_id=h.id\ngroup by h.id order by done desc'),[r,setR]=useState([]),[err,setErr]=useState('');
  const go=()=>{try{setErr('');if(/^\s*(select|with|pragma)/i.test(s))setR(q(s));else{run(s);load();setR([])}}catch(e){setErr(String(e))}};
  const dl=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([exportBytes()]));a.download='pathway.sqlite';a.click()};
  const imp=async e=>{const f=e.target.files[0];if(f){await open(new Uint8Array(await f.arrayBuffer()));load()}};
  return <div className="card"><h3>Your data, your SQL</h3><p className="dim">Real SQLite running in your browser. Tables: habits, logs.</p>
    <textarea rows="5" value={s} onChange={e=>setS(e.target.value)}/>
    <button className="b" onClick={go}>Run</button><button className="b" onClick={dl}>Export .sqlite</button>
    <p><label className="dim">Import backup: <input type="file" onChange={imp}/></label></p>
    {err&&<p style={{color:'var(--Family)'}}>{err}</p>}
    {r.length>0&&<div className="sc"><table><thead><tr>{Object.keys(r[0]).map(k=><th key={k}>{k}</th>)}</tr></thead><tbody>{r.map((x,i)=><tr key={i}>{Object.values(x).map((v,j)=><td key={j}>{String(v)}</td>)}</tr>)}</tbody></table></div>}
  </div>;
}

const PRAISE=['One more star. Well done.','That one counted.','You showed up. That is the whole game.','Small step, real light.','Bismillah, and look at you.'];
function streakOf(h,N){let n=0;const d=new Date();if(!N.has(h.id+'|'+iso(d)))d.setDate(d.getDate()-1);while(N.has(h.id+'|'+iso(d))){n++;d.setDate(d.getDate()-1)}return n}
function Level({n}){const lv=Math.floor(Math.sqrt(n/4)),a=lv**2*4,b=(lv+1)**2*4,N=['Dust','Spark','Ember','Star','Nova','Pulsar','Quasar','Galaxy'];
  return <div><b style={{fontFamily:'Fraunces'}}>{N[Math.min(lv,7)]}</b> <span className="dim">level {lv+1}, {n} stars lit all-time</span><div className="bar" style={{'--c':'var(--Myself)'}}><i style={{width:(n-a)/(b-a)*100+'%',transition:'width .6s'}}/></div></div>}
function Close({day,J,load}){const j=J[day]||{},[note,setNote]=useState(j.note||'');
  useEffect(()=>setNote(j.note||''),[day]);
  const sv=(m,t)=>{run('insert or replace into journal values(?,?,?)',[day,m,t]);load()};
  return <div className="card"><h3>Close the day</h3><p className="dim">How did it feel, and what was one good thing?</p>
    <div style={{display:'flex',gap:12,fontSize:26}}>{['😞','😕','😐','🙂','😄'].map((e,i)=><span key={i} onClick={()=>sv(i+1,note)} style={{cursor:'pointer',transition:'.25s',opacity:j.mood===i+1?1:.3,transform:j.mood===i+1?'scale(1.3)':'none'}}>{e}</span>)}</div>
    <input type="text" style={{marginTop:10,fontFamily:'inherit'}} placeholder="One good thing today…" value={note} onChange={e=>setNote(e.target.value)} onBlur={()=>sv(j.mood||3,note)}/></div>}

export default function App(){const [uid,setUid]=useState(null);
  if(!uid)return <Auth onLogin={id=>{setUser(id);setUid(id)}}/>;
  return <Main key={uid} uid={uid} out={()=>setUid(null)}/>}
