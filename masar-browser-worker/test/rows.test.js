import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapHeaders, parseTableCapture } from '../src/rows.js';

const headers = ['Origin', 'Destination', 'Rate ▾', 'Trip', 'Contact', 'Company'];
const row = { cells: ['Atlanta, GA', 'Jacksonville, FL', '$1,200\n$3.48*/mi', '345', '(555) 010-0100', 'Demo Broker'], text: 'Demo load', fields: {rate:'$1,200',email:'demo@example.com',phone:'5550100100',ref:'demo-1'} };
test('nested rate and contact fields remain distinct', () => {
  const result = parseTableCapture({headers,rows:[row],page:''});
  assert.equal(result.rows[0].rate,'$1,200');
  assert.equal(result.rows[0].email,'demo@example.com');
  assert.equal(result.rows[0].phone,'5550100100');
  assert.equal(result.rows[0].ref,'demo-1');
  assert.equal(result.rows[0].miles,'345');
  assert.equal(mapHeaders(headers)[2],'rate');
});
test('hidden padding, expanded detail and malformed rows cannot become offers', () => {
  const result = parseTableCapture({headers,rows:[{...row,hidden:true},{cells:['Chicago, IL','Dallas, TX','$3,250'],text:'padding'}, {cells:['expanded detail'],text:'detail'},row],page:''});
  assert.equal(result.rows.length,1);
  assert.equal(result.rows[0].origin,'Atlanta, GA');
});
test('missing values stay missing and no-results tables remain empty', () => {
  const empty = {...row,cells:['Atlanta, GA','Jacksonville, FL','','','','Demo Broker'],fields:{}};
  assert.equal(parseTableCapture({headers,rows:[empty],page:''}).rows[0].rate,undefined);
  assert.deepEqual(parseTableCapture({headers,rows:[],page:'No results'}).rows,[]);
  assert.throws(()=>parseTableCapture({headers:['Unknown'],rows:[],page:''}),/Unrecognized/);
});
test('candidate cap is explicit and never claims complete results', () => {
  assert.equal(parseTableCapture({headers,rows:[row,row],page:''},1).truncated,true);
  assert.equal(parseTableCapture({headers,rows:[row],page:'Showing first 500 results'}).truncated,true);
});
