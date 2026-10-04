import initSqlJs from 'sql.js';
import wasm from 'sql.js/dist/sql-wasm.wasm?url';
let KEY = 'pathway-db';
const SEED = [
 ['Islam','Memorize Quran',7],['Islam','Keep every salah on time',7],['Islam','Tawba & istighfar',7],['Islam','Pay a step toward debts',3],
 ['Myself','TryHackMe room + LeetCode',7],['Myself','Clean environment',7],['Myself','Football',2],['Myself','Run or bike',3],
 ['Myself','Open up to a friend',2],['Myself','A step toward love',1],['Myself','Clean day (no relapse)',7],
 ['Myself','30 min to heal & think',7],['Myself','Phone under my limit',7],['Myself','Sleep well',7],['Myself','Fix my entourage',2],['Myself','Shower',3],
 ['Family','Stay close to my sister',3],['Family','Visit someone close',1],['Family','Provide',5],['Family','Take responsibility',7]];
let db, SQL;
const b64 = u => { let s=''; for (let i=0;i<u.length;i+=8192) s+=String.fromCharCode(...u.subarray(i,i+8192)); return btoa(s); };
export async function open(bytes) {
  SQL ||= await initSqlJs({locateFile:()=>wasm});
  const s = localStorage.getItem(KEY);
  db = new SQL.Database(bytes || (s ? Uint8Array.from(atob(s),c=>c.charCodeAt(0)) : undefined));
  db.run('create table if not exists habits(id integer primary key,area text,name text,per_week int,sort int);create table if not exists logs(habit_id int,day text,primary key(habit_id,day));create table if not exists body(day text primary key,weight real,height real);create table if not exists birthdays(id integer primary key,name text,md text);create table if not exists journal(day text primary key,mood int,note text);create table if not exists settings(k text primary key,v text);');
  if (!q('select 1 x from habits limit 1').length)
    SEED.forEach((h,i)=>db.run('insert into habits values(null,?,?,?,?)',[...h,i]));
  save();
}
export function q(sql, p=[]) {
  const st = db.prepare(sql); st.bind(p); const out=[];
  while (st.step()) out.push(st.getAsObject());
  st.free(); return out;
}
export const run = (sql,p=[]) => { db.run(sql,p); save(); };
export const save = () => localStorage.setItem(KEY, b64(db.export()));
export const exportBytes = () => db.export();
export const getSet=(k,d='')=>q('select v from settings where k=?',[k])[0]?.v??d;
export const setSet=(k,v)=>run('insert or replace into settings values(?,?)',[k,String(v)]);
export const setUser=id=>{KEY='pathway-db:'+id};
