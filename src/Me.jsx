import {useState} from 'react';
import {q,run,getSet,setSet} from './db';
import {age,bmi,until} from './notify';
const iso=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const inp={fontFamily:'inherit',marginTop:8};
export default function Me({load}){
  const [,r]=useState(0),re=()=>{r(x=>x+1);load()};
  const B=q('select * from body order by day'),L=B[B.length-1]||{},W=B.filter(b=>b.weight).slice(-60),BD=q('select * from birthdays').sort((a,b)=>until(a.md)-until(b.md));
  const [w,setW]=useState(L.weight||''),[h,setH]=useState(L.height||''),[nm,setNm]=useState(getSet('name')),[bi,setBi]=useState(getSet('birth')),[bn,setBn]=useState(''),[bd,setBd]=useState('');
  const lo=Math.min(...W.map(x=>x.weight))-1,hi=Math.max(...W.map(x=>x.weight))+1,X=i=>W.length>1?i/(W.length-1)*290+5:150,Y=v=>100-(v-lo)/(hi-lo)*90;
  const bm=bmi((W[W.length-1]||{}).weight,L.height),d=W.length>1?W[W.length-1].weight-W[0].weight:0;
  return <>
    <div className="card"><h3>Profile</h3><p className="dim">{bi?`Age ${age(bi)}`:'Add your birth date'}</p>
      <input type="text" style={inp} value={nm} onChange={e=>setNm(e.target.value)} placeholder="Full name"/>
      <input type="date" style={inp} value={bi} onChange={e=>setBi(e.target.value)}/>
      <button className="b" onClick={()=>{setSet('name',nm.trim());setSet('birth',bi);re()}}>Save profile</button></div>
    <div className="card"><h3>Weight and height</h3>
      {W.length>1&&<svg viewBox="0 0 300 110" width="100%"><polyline fill="none" stroke="#5eead4" strokeWidth="2" strokeLinejoin="round" points={W.map((p,i)=>`${X(i)},${Y(p.weight)}`).join(' ')}/>{W.map((p,i)=><circle key={p.day} cx={X(i)} cy={Y(p.weight)} r="3" fill="#5eead4"><title>{p.day}: {p.weight} kg</title></circle>)}</svg>}
      <p className="dim">{W.length>1?`${d>0?'+':''}${d.toFixed(1)} kg since ${W[0].day}. `:''}{bm?`BMI ${bm} at ${L.height} cm.`:'Add height and weight to see your BMI.'}</p>
      <div style={{display:'flex',gap:8}}><input type="number" style={inp} placeholder="Weight kg" value={w} onChange={e=>setW(e.target.value)}/><input type="number" style={inp} placeholder="Height cm" value={h} onChange={e=>setH(e.target.value)}/></div>
      <button className="b" onClick={()=>{run('insert or replace into body values(?,?,?)',[iso(new Date()),+w||null,+h||null]);re()}}>Log today</button>
      {B.slice(-6).reverse().map(b=><div className="row" key={b.day}><span className="n dim">{b.day}</span><span>{b.weight??'-'} kg, {b.height??'-'} cm</span><button className="chip" style={{'--c':'var(--dim)'}} onClick={()=>{run('delete from body where day=?',[b.day]);re()}}>✕</button></div>)}</div>
    <div className="card"><h3>Birthdays</h3><p className="dim">I remind you the day before and on the day (with reminders on).</p>
      {BD.map(b=><div className="row" key={b.id}><span className="n">{b.name}</span><span className="pill">{b.md} {until(b.md)?`in ${until(b.md)}d`:'today 🎂'}</span><button className="chip" style={{'--c':'var(--dim)'}} onClick={()=>{run('delete from birthdays where id=?',[b.id]);re()}}>✕</button></div>)}
      <div style={{display:'flex',gap:8}}><input type="text" style={inp} placeholder="Name" value={bn} onChange={e=>setBn(e.target.value)}/><input type="date" style={inp} value={bd} onChange={e=>setBd(e.target.value)}/></div>
      <button className="b" onClick={()=>{if(bn.trim()&&bd){run('insert into birthdays values(null,?,?)',[bn.trim(),bd.slice(5)]);setBn('');setBd('');re()}}}>Add birthday</button></div>
  </>;
}
