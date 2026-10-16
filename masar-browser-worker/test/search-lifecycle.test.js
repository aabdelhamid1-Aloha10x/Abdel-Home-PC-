import {test} from 'node:test';
import assert from 'node:assert/strict';
import {submitAndWait, monthIndex} from '../src/dat.js';

test('completion waits for a new progress lifecycle even when old rows already exist', async () => {
  const events=[];
  let resolveStarted, resolveFinished;
  const active={waitFor:async ({state})=>{
    events.push(state);
    if(state==='attached') await new Promise(r=>resolveStarted=r);
    if(state==='detached') await new Promise(r=>resolveFinished=r);
  }};
  const page={locator:s=>s==='#searchProgressBar.active'?active:{click:async()=>{events.push('click');resolveStarted();}}};
  let complete=false;
  const promise=submitAndWait(page,'#searchBtn').then(()=>complete=true);
  await new Promise(r=>setImmediate(r));
  assert.equal(complete,false);
  assert.deepEqual(events,['hidden','attached','click','detached']);
  resolveFinished(); await promise;
  assert.equal(complete,true);
});
test('missing start or stuck search throws rather than accepting old results', async()=>{
  for(const failState of ['attached','detached']) {
    const page={locator:s=>s==='#searchProgressBar.active'?{waitFor:async({state})=>{if(state===failState)throw new Error('timeout');}}:{click:async()=>{}}};
    await assert.rejects(submitAndWait(page,'#searchBtn'),/timeout/);
  }
});
test('calendar month parsing respects year changes and rejects unfamiliar labels',()=>{
  assert.equal(monthIndex('JAN 2027')-monthIndex('DEC 2026'),1);
  assert.throws(()=>monthIndex('??? 2026'),/Unrecognized/);
});
