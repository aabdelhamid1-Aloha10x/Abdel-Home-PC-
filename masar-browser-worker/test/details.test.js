import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { detailIdentity, enrichDetails } from '../src/details.js';

test('MC identity needs same posting, matching company, and one unambiguous MC', () => {
  const expected = { ref:'qa-1',broker:'Demo Freight' };
  assert.deepEqual(detailIdentity({ref:'qa-1',company:'Demo Freight MC#123456 ACTIVE'},expected),{mc:'123456'});
  assert.equal(detailIdentity({ref:'other',company:'Demo Freight MC#123456'},expected),null);
  assert.equal(detailIdentity({ref:'qa-1',company:'Other Freight MC#123456'},expected),null);
  assert.equal(detailIdentity({ref:'qa-1',company:'Demo Freight ACTIVE Authority'},expected),null);
  assert.equal(detailIdentity({ref:'qa-1',company:'Demo Freight MC#123456 MC#654321'},expected),null);
});

test('visible row expansion enriches correct identity without contacting or trusting badges; limit applies', async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || chromium.executablePath(),args:['--no-sandbox']});
  try {
    const page = await browser.newPage();
    await page.setContent(`<table><tbody id="loadsTableBody">${[1,2].map(i=>`<tr class="load-row" data-posting-id="qa-${i}"><td><a class="company-link" href="#">Demo Freight ${i}</a></td></tr>`).join('')}</tbody></table><button id="call">Call broker</button><script>
    document.querySelectorAll('.company-link').forEach(a=>a.onclick=e=>{e.preventDefault();const tr=a.closest('tr');tr.classList.add('expanded');setTimeout(()=>{tr.insertAdjacentHTML('afterend','<tr class="expand-row"><td><dat-company>'+a.textContent+' MC#123456 ACTIVE Authority</dat-company></td></tr>');},100);});
    document.querySelector('#call').onclick=()=>document.body.dataset.contacted='yes';
    </script>`);
    const rows=[1,2].map(i=>({ref:'qa-'+i,broker:'Demo Freight '+i}));
    await enrichDetails(page,'#loadsTableBody',rows,{limit:1});
    assert.equal(rows[0].mc,'123456'); assert.equal(rows[1].mc,undefined);
    assert.equal(rows[0].broker_verified,undefined);
    assert.equal(await page.locator('body').getAttribute('data-contacted'),null);
  } finally { await browser.close(); }
});

test('security check aborts detail enrichment before clicks',async()=>{
  await assert.rejects(enrichDetails({},'#loadsTableBody',[{ref:'qa',broker:'Demo'}],{check:async()=>{throw new Error('verification required');}}),/verification required/);
});
