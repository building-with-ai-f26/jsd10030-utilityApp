import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalPrivacyChecker } from '../src/local-privacy-check.js';
import { mountLocalPrivacyUI } from '../src/local-privacy-ui.js';

const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const trip='33333333-3333-4333-8333-333333333333';
const bill='44444444-4444-4444-8444-444444444444';
const now=Date.parse('2026-11-23T15:00:00Z');
const selection={tripId:trip,billId:bill};
function fakeClient({ id=A, error=false, status=200, leakTrip=false, leakBill=false, expired=false, authError=false, afterSwitch=false, hang=false, wrongBill=false }={}) {
  let authCalls=0;const requests=[];
  const user=()=>({id,email:id===A?'a@example.test':'b@example.test'});
  const client={requests,auth:{
    async getSession(){return{data:{session:{user:user(),expires_at:Math.floor(now/1000)+(expired?-1:3600)}}};},
    async getUser(){authCalls++;return{data:{user:afterSwitch&&authCalls>1?{id:B,email:'b@example.test'}:user()},error:authError?new Error('PRIVATE ERROR'):null};},
  },from(table){
    const request={table,filters:[]};requests.push(request);
    return {select(fields){request.fields=fields;return this;},eq(key,value){request.filters.push([key,value]);return this;},abortSignal(signal){request.signal=signal;return this;},
      then(resolve,reject){
        if(hang)return new Promise(()=>{}).then(resolve,reject);
        const visible=id===A||(table==='utility_trips'?leakTrip:leakBill);
        const data=!visible?[]:table==='utility_trips'?[{id:trip,owner_id:A,name:'build 3 private test'}]:[{id:bill,trip_id:trip,owner_id:A,snapshot:{splitMode:'by_person',result:{totalCents:wrongBill?13300:12800,shares:[3840,8960]}}}];
        return Promise.resolve({data:error?null:data,status,error:error?{message:'PRIVATE DATABASE ERROR'}:null}).then(resolve,reject);
      }};
  }};
  return client;
}
function checker(client,opts={}) {return createLocalPrivacyChecker(client,{projectOrigin:'https://demo.supabase.co',getExpectedOwner:()=>A,now:()=>now,...opts});}
async function reference(){return(await checker(fakeClient()).checkOwner({email:'a@example.test',selection})).reference;}

test('A verifies real-session identity and exact trip/bill IDs before preparing a credential-free reference',async()=>{
 const client=fakeClient();const out=await checker(client).checkOwner({email:'a@example.test',selection});
 assert.equal(out.outcome,'A BASELINE VERIFIED');assert.equal(out.accountVerified,true);
 assert.deepEqual([out.tripStatus,out.tripRows,out.billStatus,out.billRows],[200,1,200,1]);
 const ref=JSON.parse(out.reference);assert.equal(ref.trip,trip);assert.equal(ref.bill,bill);assert.equal(ref.owner,A);
 assert.deepEqual(Object.keys(ref).sort(),['bill','owner','project','trip','verifiedAt','version']);
 assert.doesNotMatch(out.reference,/email|password|token|12800/);
 assert.deepEqual(client.requests[0].filters,[['id',trip]]);
 assert.deepEqual(client.requests[1].filters,[['id',bill],['trip_id',trip]]);
});
test('B succeeds only when both exact-ID reads complete as 200 with zero rows, without owner filters',async()=>{
 const client=fakeClient({id:B});const out=await checker(client,{getExpectedOwner:()=>B}).checkOther({email:'b@example.test',reference:await reference()});
 assert.equal(out.outcome,'B READ ISOLATION VERIFIED');assert.equal(out.accountVerified,true);
 assert.deepEqual([out.tripStatus,out.tripRows,out.billStatus,out.billRows],[200,0,200,0]);
 assert.equal(client.requests.length,2);
 assert.ok(client.requests.every(r=>!r.filters.some(([key])=>key==='owner_id')));
 assert.deepEqual(client.requests[1].filters,[['id',bill],['trip_id',trip]]);
});
for(const options of [{expired:true},{authError:true}])test(`invalid authentication is inconclusive ${JSON.stringify(options)}`,async()=>{
 const client=fakeClient({id:B,...options});const out=await checker(client,{getExpectedOwner:()=>B}).checkOther({email:'b@example.test',reference:await reference()});
 assert.equal(out.outcome,'INCONCLUSIVE');assert.equal(out.accountVerified,false);assert.equal(client.requests.length,0);
});
test('wrong expected email and A using B check are inconclusive',async()=>{
 const ref=await reference();
 for(const email of ['a@example.test','c@example.test']){
  const client=fakeClient({id:B});const out=await checker(client,{getExpectedOwner:()=>B}).checkOther({email,reference:ref});
  assert.equal(out.outcome,'INCONCLUSIVE');assert.equal(client.requests.length,0);
 }
 const client=fakeClient();const out=await checker(client).checkOther({email:'a@example.test',reference:ref});
 assert.equal(out.outcome,'INCONCLUSIVE');assert.equal(out.accountVerified,false);assert.equal(client.requests.length,0);
});
for(const status of [0,401,403,500])test(`failed read ${status} never counts as a privacy pass`,async()=>{
 const out=await checker(fakeClient({id:B,status,error:true}),{getExpectedOwner:()=>B}).checkOther({email:'b@example.test',reference:await reference()});
 assert.equal(out.outcome,'INCONCLUSIVE');assert.equal(out.tripRows,null);
 assert.doesNotMatch(JSON.stringify(out),/PRIVATE/);
});
for(const options of [{leakTrip:true},{leakBill:true}])test(`a visible private row fails ${JSON.stringify(options)}`,async()=>{
 const out=await checker(fakeClient({id:B,...options}),{getExpectedOwner:()=>B}).checkOther({email:'b@example.test',reference:await reference()});
 assert.equal(out.outcome,'FAIL: PRIVATE ROWS VISIBLE');
});
test('malformed, wrong-project and stale references are inconclusive without database requests',async()=>{
 const ref=JSON.parse(await reference());
 for(const value of ['', '{}',JSON.stringify({...ref,project:'https://other.supabase.co'}),JSON.stringify({...ref,verifiedAt:'2020-01-01T00:00:00Z'}),JSON.stringify({...ref,access_token:'not allowed'})]){
  const client=fakeClient({id:B});const out=await checker(client,{getExpectedOwner:()=>B}).checkOther({email:'b@example.test',reference:value});
  assert.equal(out.outcome,'INCONCLUSIVE');assert.equal(client.requests.length,0);
 }
});
test('A cannot prepare a reference for a missing selection or a different bill',async()=>{
 const missing=await checker(fakeClient()).checkOwner({email:'a@example.test',selection:null});
 const wrong=await checker(fakeClient({wrongBill:true})).checkOwner({email:'a@example.test',selection});
 for(const out of [missing,wrong]){assert.equal(out.outcome,'INCONCLUSIVE');assert.equal(out.reference,undefined);}
});
test('account change during reads and request timeout are inconclusive',async()=>{
 const ref=await reference();
 for(const opts of [{afterSwitch:true},{hang:true}]){
  const out=await checker(fakeClient({id:A,...opts}),{timeoutMs:5}).checkOwner({email:'a@example.test',selection});
  assert.equal(out.outcome,'INCONCLUSIVE');assert.equal(out.reference,undefined);
 }
});

function fakeDocument() {
 const nodes=new Map();
 class Element {
  constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.handlers={};this.value='';}
  set id(value){this._id=value;nodes.set(value,this);}get id(){return this._id;}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=[];this._text='';this.append(...children);}
  set textContent(value){this._text=value;this.children=[];}get textContent(){return(this._text??'')+this.children.map(c=>c.textContent).join('\n');}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(t,fn){this.handlers[t]=fn;}
 }
 const root=new Element('section');root.id='account-panel';
 return{nodes,root,createElement:t=>new Element(t),querySelector:s=>nodes.get(s.slice(1))};
}
test('UI uses injected existing client, clears typed identity/reference and prints only safe result fields',async()=>{
 const doc=fakeDocument();let copied;
 // UI clock uses real time; make the fake SDK session current.
 const client=fakeClient();const original=client.auth.getSession;
 client.auth.getSession=async()=>{const r=await original();r.data.session.expires_at=Math.floor(Date.now()/1000)+3600;return r;};
 const ui=mountLocalPrivacyUI({client,projectOrigin:'https://demo.supabase.co',getExpectedOwner:()=>A,getSelectedBill:()=>selection,document:doc,clipboard:{writeText:async text=>{copied=text;}},hostname:'127.0.0.1'});
 const panel=doc.nodes.get('local-privacy-check');assert.ok('data-analytics-private' in panel.attrs);
 const run=panel.children.find(c=>c.tag==='button');const copy=panel.children.filter(c=>c.tag==='button')[1];
 doc.nodes.get('privacy-email').value='a@example.test';
 await run.handlers.click();
 assert.equal(doc.nodes.get('privacy-email').value,'');assert.equal(copy.disabled,false);
 const output=doc.nodes.get('privacy-check-result').textContent;
 assert.match(output,/A BASELINE VERIFIED/);assert.match(output,/Trip rows: 1/);assert.match(output,/Bill rows: 1/);
 assert.doesNotMatch(output,/example.test|11111111|33333333|44444444|access_token|Authorization/);
 await copy.handlers.click();assert.equal(JSON.parse(copied).bill,bill);
 ui.reset();assert.equal(doc.nodes.get('privacy-check-result').textContent,'');assert.equal(copy.disabled,true);
});
test('UI refuses non-local hostnames',()=>{
 assert.equal(mountLocalPrivacyUI({hostname:'building-with-ai-f26.github.io'}),null);
});
