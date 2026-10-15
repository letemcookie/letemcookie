import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker,{hashIP} from '../counter/worker.mjs';
const base='https://counter.test';
const origin='chrome-extension://gcngilgdbfbghagejgjependcpbckdig';
const id='accc0d85-21e2-40cb-91a8-c80dd81d901f';
test('IP HMAC is daily, secret-keyed and not a plain IP',async()=>{
 const a=await hashIP('192.0.2.1','2026-10-15','secret-a');
 assert.equal(a.length,64); assert.notEqual(a,await hashIP('192.0.2.1','2026-10-16','secret-a')); assert.notEqual(a,await hashIP('192.0.2.1','2026-10-15','secret-b'));
});
test('stats reads only aggregate, valid schema',async()=>{
 const r=await worker.fetch(new Request(base+'/stats'),{DB:{prepare:()=>({first:async()=>({eaten:42})})}});
 assert.equal(r.status,200); assert.equal((await r.json()).eaten,42);
});
test('wrong origin, excess data, malformed and absent IP are rejected before DB',async()=>{
 for(const [o,b,ip,status] of [["https://evil.test",{event:id},'192.0.2.1',403],[origin,{event:id,host:'private.test'},'192.0.2.1',400],[origin,{event:'bad'},'192.0.2.1',400],[origin,{event:id},null,400]]){
 const h={'Origin':o}; if(ip) h['CF-Connecting-IP']=ip;
 const r=await worker.fetch(new Request(base+'/eat',{method:'POST',headers:h,body:JSON.stringify(b)}),{IP_HMAC_SECRET:'secret'});assert.equal(r.status,status);
 }
});
test('valid event writes only UUID, day, HMAC, time',async()=>{
 let args;const env={IP_HMAC_SECRET:'secret',DB:{prepare:()=>({bind:(...a)=>{args=a;return {run:async()=>{}}}})}};
 const r=await worker.fetch(new Request(base+'/eat',{method:'POST',headers:{Origin:origin,'CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify({event:id})}),env);
 assert.equal(r.status,200);assert.equal(args[0],id);assert.equal(args[2].length,64);assert.ok(!JSON.stringify(args).includes('192.0.2.1'));
});
test('database failure is retryable, not a fake count',async()=>{
 const r=await worker.fetch(new Request(base+'/stats'),{DB:{prepare:()=>{throw Error()}}}); assert.equal(r.status,503);
});
