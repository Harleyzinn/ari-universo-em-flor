// Teste de integração opcional: PLAYWRIGHT_PATH pode apontar para um Playwright local.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base=process.env.TEST_URL || 'http://127.0.0.1:4173/';
await mkdir('test-results',{recursive:true});
const results=[];
for(const engine of ['chromium','webkit']){
  let browser;
  try{browser=await (engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{channel:'msedge',headless:true}:{headless:true});}
  catch(e){results.push({engine,unavailable:e.message.split('\n')[0]});continue;}
  const errors=[];
  const page=await browser.newPage({viewport:{width:375,height:667},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    window.testFrames=new Map();window.testTime=0;let id=0;
    window.requestAnimationFrame=fn=>{window.testFrames.set(++id,fn);return id;};
    window.cancelAnimationFrame=id=>window.testFrames.delete(id);
    window.advance=ms=>{for(let t=0;t<ms;t+=100){window.testTime+=100;const queue=[...window.testFrames.values()];window.testFrames.clear();queue.forEach(fn=>fn(window.testTime));}};
  });
  await page.goto(base);
  for(const width of [320,375,414]){
    await page.setViewportSize({width,height:568});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow at '+width);
    await page.screenshot({path:`test-results/${engine}-${width}-opening.png`,fullPage:true});
  }
  await page.setViewportSize({width:375,height:667});
  await page.getByRole('button',{name:'Ler todos os recados',exact:true}).click();
  assert.equal(await page.locator('.modal-content li').count(),14);await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Deixa eu te mostrar'}).click();
  await page.evaluate(()=>advance(10100));
  const before=await page.locator('.progress').getAttribute('aria-valuenow');
  await page.getByRole('button',{name:'Pausar',exact:true}).click();await page.evaluate(()=>advance(10000));
  assert.equal(await page.locator('.progress').getAttribute('aria-valuenow'),before);
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));advance(20000);});
  assert.equal(await page.locator('.progress').getAttribute('aria-valuenow'),before);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));advance(10100);});
  await page.locator('.flower-touch.available').first().click();
  const inspected=await page.locator('#note-text').innerText();
  await page.evaluate(()=>advance(10000));assert.equal(await page.locator('#note-text').innerText(),inspected);
  await page.setViewportSize({width:667,height:375});assert.equal(await page.locator('#note-text').innerText(),inspected);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.getByRole('button',{name:'Voltar ao jardim',exact:true}).click();
  await page.evaluate(()=>advance(56000));assert(await page.locator('#ending').isVisible());
  assert.equal(await page.locator('.flower-touch.available').count(),14);
  await page.setViewportSize({width:375,height:667});
  for(let i=0;i<14;i++){
    await page.locator('.flower-touch').nth(i).click();
    assert.equal(await page.locator('#note-text').innerText(),await page.evaluate(i=>PRESENTE.recados[i],i));
    await page.getByRole('button',{name:'Voltar ao jardim',exact:true}).click();
  }
  await page.getByRole('button',{name:'Próximo →',exact:true}).click();assert(await page.locator('#close-note').isVisible());await page.locator('#close-note').click();
  await page.locator('#previous').click();await page.locator('#close-note').click();
  await page.getByRole('button',{name:'Ainda tem uma coisa…',exact:true}).click();
  assert(await page.locator('.modal-content').innerText().then(t=>t.endsWith('Com todo o meu amor.')));
  assert(await page.locator('.modal-content').evaluate(el=>el.scrollHeight>el.clientHeight));
  await page.locator('.modal-content').evaluate(el=>el.scrollTop=el.scrollHeight);assert(await page.locator('#modal-close').isVisible());
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'modal-close');await page.keyboard.press('Escape');
  await page.locator('#secret').click();assert(await page.locator('#modal-title').innerText().then(t=>t==='Só entre a gente'));await page.locator('#modal-close').click();
  for(let i=0;i<3;i++){await page.locator('#extra').click();await page.locator('#modal-close').click();}
  assert.equal(await page.locator('#extra-flower').count(),1);
  await page.screenshot({path:`test-results/${engine}-375-final.png`,fullPage:true});
  await page.setViewportSize({width:1280,height:900});await page.screenshot({path:`test-results/${engine}-desktop-final.png`,fullPage:true});
  await page.locator('#restart').click();assert.equal(await page.locator('.flower-touch.available').count(),0);
  await page.locator('#start').click();await page.locator('#reveal').click();assert.equal(await page.locator('.flower-touch.available').count(),14);
  await page.locator('#restart').click();await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#start').click();assert(await page.locator('#ending').isVisible());
  // Large type and narrow layout retain flow and permit normal page scrolling.
  await page.setViewportSize({width:320,height:480});await page.evaluate(()=>document.documentElement.style.fontSize='32px');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  results.push({engine,passed:true,checks:'320/375/414; landscape; complete 75s timeline; pause; simulated visibility; all flowers; navigation; letter scroll/focus; secret; bounded extra; reset/reveal; reduced motion; large root font; no JS errors'});
  await browser.close();
}
await writeFile('test-results/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
assert(results.some(r=>r.passed),'No browser tests completed');
