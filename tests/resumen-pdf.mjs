import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { Browser } = await import(pathToFileURL(process.env.FOXHOUND_CDP || join(homedir(), '.codex/skills/taste-skill/scripts/lib/cdp.mjs')).href);
const browser = await Browser.launch();
const out = 'test-results/resumen-pdf'; mkdirSync(out, {recursive:true});
try {
 const page = await browser.newPage();
 const errors=[]; browser.on(page.sessionId,'Runtime.exceptionThrown', e=>errors.push(e.exceptionDetails.text));
 await page.goto(new URL('resumen.html', process.env.FOXHOUND_URL || 'http://127.0.0.1:8000/').href);
 await page.eval(()=>{window.print=()=>{window.printCalls=(window.printCalls||0)+1;};document.querySelector('#save-summary-pdf').click();});
 assert.equal(await page.eval(()=>window.printCalls),1);
 assert.ok(await page.eval(()=>document.querySelector('#pdf-generated-at').textContent.includes('Generado el')));
 for (const width of [390,768,1440]) {await page.setViewport({width,height:1000,dsf:1});assert.ok(await page.eval(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${out}/screen-${width}.png`,fullPage:true});}
 await page.eval(()=>{localStorage.setItem('foxhound.applications',JSON.stringify(['enviado','en_proceso','rechazado','oferta'].map((status,i)=>({id:String(i),company:'Empresa '+i,role:'Desarrollador frontend',sentDate:new Date().toISOString().slice(0,10),status}))));window.dispatchEvent(new Event('beforeprint'));});
 assert.equal(await page.eval(()=>document.querySelector('#total-count').textContent),'4');
 await page.send('Emulation.setEmulatedMedia',{media:'print'});
 await new Promise(r=>setTimeout(r,200));
 assert.equal(await page.eval(()=>getComputedStyle(document.querySelector('.sidebar')).display),'none');
 const pdf=await page.send('Page.printToPDF',{printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
 writeFileSync(`${out}/resumen.pdf`,Buffer.from(pdf.data,'base64'));
 await page.screenshot({path:`${out}/print.png`,fullPage:true});
 await page.eval(()=>{localStorage.setItem('foxhound.applications','invalid');window.dispatchEvent(new Event('beforeprint'));});
 assert.ok(await page.eval(()=>document.querySelector('#save-summary-pdf').disabled&&!document.querySelector('#summary-error').hidden));
 assert.deepEqual(errors,[]); console.log('PASS: botón, fecha, vacío, datos actualizados, PDF real, error y tres anchos.');
} finally {await browser.close();}
