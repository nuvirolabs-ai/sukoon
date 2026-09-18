import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const require = createRequire('/Users/tanutejas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = require('playwright');
const phase = process.argv[2] || 'after';
const marker = JSON.parse(await readFile('.data/synthetic-demo/dataset-v1.json', 'utf8'));
const dir = `output/design-redesign/${phase}`;
await mkdir(dir, {recursive:true});
const browser = await chromium.launch({headless:true});
const results=[];
try {
 const context=await browser.newContext({viewport:{width:390,height:844}}); const page=await context.newPage();
 async function login(email){await page.goto('http://localhost:3100/');await page.getByLabel('Email address').fill(email);await page.getByRole('button',{name:'Send OTP',exact:true}).click();await page.getByLabel('One-time code').waitFor();const m=await context.request.get(`http://localhost:3100/api/auth/dev-mailbox?email=${encodeURIComponent(email)}`);await page.getByLabel('One-time code').fill((await m.json()).data.otp);const response=page.waitForResponse(r=>r.url().endsWith('/api/session')&&r.status()===200);await page.getByRole('button',{name:'Open passport',exact:true}).click();await response;await page.getByLabel('Email address').waitFor({state:'hidden'});}
 await login('demo-owner@sukoon.local');
 const routes=[['home','/'],['properties','/properties'],['property',`/property/${marker.properties[0]}`],['vault',`/property/${marker.properties[0]}?tab=vault`],['construction',`/construction/${marker.activeProject}`],['purchase','/buy-sell/purchases'],['updates','/updates']];
 for(const width of phase==='before'?[390]:[390,410,430,1280]) {await page.setViewportSize({width,height:width===1280?1000:844});for(const [name,route] of routes){await page.goto(`http://localhost:3100${route}`,{waitUntil:'domcontentloaded'});const landmark={home:'Your properties',properties:'Vijay Nagar House',property:'Record readiness',vault:'Demo Registry — Vijay Nagar',construction:'Mehta Residence',purchase:'Riverfront Residency — Unit 1204',updates:'Today'}[name];await page.getByText(landmark,{exact:true}).first().waitFor();await page.waitForFunction(()=>!Array.from(document.querySelectorAll(".metric strong")).some(e=>e.textContent==="…"));await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${dir}/${name}-${width}-full.png`,fullPage:true});await page.screenshot({path:`${dir}/${name}-${width}.png`});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);results.push({name,width,overflow});if(overflow)throw Error(`${name} overflow at ${width}`);}}
 await context.request.post('http://localhost:3100/api/auth/sign-out',{headers:{origin:'http://localhost:3100'},data:{}});
 await login('demo-architect@sukoon.local');await page.setViewportSize({width:390,height:844});await page.goto(`http://localhost:3100/shared/${marker.properties[0]}`);await page.getByText('Shared documents',{exact:false}).waitFor();await page.screenshot({path:`${dir}/shared-390.png`,fullPage:true});
 await writeFile(`${dir}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));
} finally {await browser.close();}
