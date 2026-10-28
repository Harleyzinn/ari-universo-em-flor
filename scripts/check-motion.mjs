// Regression checks for the continuous motion and the work done on every frame.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH||'playwright');
for(const name of ['chromium','webkit']){
  const browser=await(name==='chromium'?chromium:webkit).launch(name==='chromium'?{channel:'msedge',headless:true}:{headless:true});
  const page=await browser.newPage({viewport:{width:375,height:667}});
  await page.addInitScript(()=>{
    let callback,id=0;window.now=0;
    window.requestAnimationFrame=fn=>{callback=fn;return ++id;};
    window.cancelAnimationFrame=()=>{callback=null;};
    window.advance=ms=>{for(let t=0;t<ms;t+=10){window.now+=10;const fn=callback;callback=null;if(fn)fn(window.now);}};
    window.geometryReads=0;
    const original=SVGGeometryElement.prototype.getPointAtLength;
    SVGGeometryElement.prototype.getPointAtLength=function(...args){window.geometryReads++;return original.apply(this,args);};
  });
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:4173/');
  await page.locator('#start').click();
  const result=await page.evaluate(async()=>{
    const initialReads=geometryReads;
    const point=()=>{const m=document.getElementById('light').parentNode.transform.baseVal.consolidate().matrix;return{x:m.e,y:m.f};};
    advance(10);const samples=[];let previous=point(),largestStep=0,stalled=0;
    let textChanges=0;
    const observer=new MutationObserver(records=>{textChanges+=records.filter(r=>r.type==='childList'||r.type==='characterData').length;});
    observer.observe(document.getElementById('story'),{subtree:true,childList:true,characterData:true});
    // Sample all joins and all of the former idle interval.
    for(let i=0;i<750;i++){
      advance(100);const p=point(),distance=Math.hypot(p.x-previous.x,p.y-previous.y);
      if(now<73500){largestStep=Math.max(largestStep,distance);if(distance<.01)stalled++;}
      previous=p;if(i%50===0)samples.push({time:now,point:p});
    }
    await Promise.resolve();observer.disconnect();
    return{initialReads,playbackGeometryReads:geometryReads-initialReads,largestStep,stalled,textChanges,samples};
  });
  assert.equal(result.playbackGeometryReads,0,'No geometry queries during playback');
  assert(result.largestStep<10,'Light jumped at a path boundary: '+result.largestStep);
  assert.equal(result.stalled,0,'Light stopped while the narrative was running');
  assert(result.textChanges<60,'Text rewritten unnecessarily: '+result.textChanges);
  await page.locator('#restart').click();await page.locator('#start').click();
  await page.evaluate(()=>advance(5500));await page.locator('#pause').click();
  const before=await page.locator('#drawing').innerHTML();await page.evaluate(()=>advance(5000));
  assert.equal(await page.locator('#drawing').innerHTML(),before,'Pause must freeze petals and lines too');
  console.log(name,JSON.stringify(result));await browser.close();
}
