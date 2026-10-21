import assert from 'node:assert/strict';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const {Browser}=await import(pathToFileURL(process.env.FOXHOUND_CDP || join(homedir(),'.codex/skills/taste-skill/scripts/lib/cdp.mjs')).href);
const b=await Browser.launch();
try{
 const p=await b.newPage();const url='http://127.0.0.1:8000/';await p.goto(url,{settleMs:100});
 assert.ok(await p.eval(()=>document.querySelector('#sent-date').hidden&&!document.querySelector('#date-trigger').hidden));
 const original=await p.eval(()=>document.querySelector('#sent-date').value);
 await p.eval(()=>document.querySelector('#date-trigger').click());
 assert.ok(await p.eval(()=>document.querySelector('dialog').open&&document.activeElement.classList.contains('calendar-day')&&document.querySelector('#calendar-next').disabled));
 await p.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
 await p.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await p.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await new Promise(r=>setTimeout(r,100));
 console.log('keyboard result',await p.eval(()=>({open:document.querySelector('dialog').open,focus:document.activeElement.id,value:document.querySelector('#sent-date').value})));
 assert.ok(await p.eval(()=>!document.querySelector('dialog').open&&document.activeElement.id==='date-trigger'));
 assert.notEqual(await p.eval(()=>document.querySelector('#sent-date').value),original);
 console.log('PASS selección con flechas y Enter, cierre y devolución del foco');
 await p.eval(()=>{document.querySelector('#date-trigger').click();document.querySelector('#calendar-today').click();document.querySelector('#date-trigger').click();});
 assert.equal(await p.eval(()=>document.querySelector('#sent-date').value),original);
 assert.ok(await p.eval(()=>Array.from(document.querySelectorAll('.calendar-day')).filter(x=>x.dataset.date>document.querySelector('#sent-date').value).every(x=>x.disabled)));
 await p.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await p.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 assert.ok(await p.eval(()=>!document.querySelector('dialog').open));
 console.log('PASS Elegir hoy, fechas futuras bloqueadas y Escape');
 await p.eval(()=>{document.querySelector('#date-trigger').click();const now=new Date();const count=(now.getFullYear()-2024)*12+now.getMonth()-1;for(let i=0;i<count;i++)document.querySelector('#calendar-prev').click();});
 assert.ok(await p.eval(()=>!!document.querySelector('[data-date="2024-02-29"]')&&!document.querySelector('[data-date="2024-02-30"]')));
 await p.eval(()=>{document.querySelector('[data-date="2024-02-29"]').click();document.querySelector('#company').value='Estudio del Sur';document.querySelector('#role').value='Frontend';document.querySelector('form').requestSubmit();});
 assert.equal(await p.eval(()=>JSON.parse(localStorage.getItem('foxhound.applications'))[0].sentDate),'2024-02-29');
 assert.equal(await p.eval(()=>document.querySelector('#sent-date').value),original);
 assert.equal(await p.eval(()=>document.querySelector('#date-value').textContent),await p.eval(()=>new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(document.querySelector('#sent-date').value+'T12:00:00'))));
 console.log('PASS febrero bisiesto, persistencia de la fecha elegida y reinicio del calendario');
 for(const width of [1440,390,320]){
 await p.setViewport({width,height:900,dsf:1,mobile:width<600});await p.goto(url,{settleMs:100});await p.eval(()=>{document.querySelector('#date-trigger').scrollIntoView({block:'center'});document.querySelector('#date-trigger').click();});
 assert.ok(await p.eval(()=>{const r=document.querySelector('dialog').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&document.documentElement.scrollWidth<=innerWidth;}));
 await p.screenshot({path:`/tmp/foxhound-calendar-${width}.png`,format:'png'});
 }
 assert.deepEqual(p.consoleErrors,[]);console.log('PASS calendario visible sin desbordes en escritorio y móvil; sin excepciones JavaScript');
}finally{await b.close();}
