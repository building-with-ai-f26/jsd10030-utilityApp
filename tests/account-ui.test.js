import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateAccountConfig } from '../account-config.js';
import { mountAccountUI, configuredSupabase } from '../src/account-ui.js';
function setup({ failSignOut = false, initialSession = null } = {}) {
  const ids = ['storage-mode','account-status','sign-in','sign-out','account-form','private-mode-option','account-email','account-password'];
  const nodes = Object.fromEntries(ids.map(id => [id, { value:'', hidden:false, disabled:false, textContent:'', listeners:{}, addEventListener(event, fn) { this.listeners[event]=fn; } }]));
  let callback; let session=initialSession; let changes=0;let credentials;
  const client={auth:{
    onAuthStateChange(fn){callback=fn;}, async getSession(){return{data:{session}};},
    async signInWithPassword(values){credentials=values;session={user:{id:'A'}};return{data:{session}};},
    async signOut(){return{error:failSignOut?new Error('private error'):null};},
  },from(){throw new Error('No reads in account module');}};
  const ui=mountAccountUI({client,document:{querySelector:s=>nodes[s.slice(1)]},onChange(){changes++;}});
  return{nodes,ui,get changes(){return changes;},get credentials(){return credentials;},auth:session=>callback('SIGNED_IN',session)};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('unconfigured/placeholders/private keys are not accepted as browser configuration',()=>{
  assert.equal(configuredSupabase('https://your-project.supabase.co','sb_publishable_REPLACE_ME'),false);
  assert.equal(configuredSupabase('https://demo.supabase.co','sb_secret_not_for_browser'),false);
  assert.equal(configuredSupabase('http://demo.supabase.co','sb_publishable_fake_fixture'),false);
  assert.equal(configuredSupabase('https://demo.supabase.co','sb_publishable_fake_fixture'),true);
});
test('sign-in chooses private storage; sign-out clears owner synchronously and removes credentials',async()=>{
  const h=setup();await tick();
  h.nodes['account-email'].value='a@example.test';h.nodes['account-password'].value='test password';
  await h.nodes['account-form'].listeners.submit({preventDefault(){}});
  assert.equal(h.ui.isPrivate(),true);assert.equal(h.nodes['storage-mode'].value,'private');
  assert.equal(h.nodes['account-password'].value,'');assert.equal(h.nodes['account-email'].value,'');
  assert.equal(h.credentials.email,'a@example.test');
  const pending=h.nodes['sign-out'].listeners.click();
  assert.equal(h.ui.isPrivate(),false);assert.equal(h.nodes['storage-mode'].value,'browser');
  assert.ok(h.changes>=2);await pending;
  assert.match(h.nodes['account-status'].textContent,/Signed out/);
  assert.equal(h.nodes['sign-out'].hidden,true);
});
test('failed sign-out still clears private owner/view and offers explicit retry',async()=>{
  const h=setup({failSignOut:true});await tick();h.auth({user:{id:'A'}});await tick();
  await h.nodes['sign-out'].listeners.click();
  assert.equal(h.ui.isPrivate(),false);assert.match(h.nodes['account-status'].textContent,/could not be confirmed/);
  assert.equal(h.nodes['sign-out'].hidden,false);
  h.auth({user:{id:'A'}});await tick();assert.equal(h.ui.isPrivate(),false);
});
test('auth change and session removal trigger clearing before private storage can be browsed',async()=>{
  const h=setup();await tick();h.auth({user:{id:'A'}});await tick();const changes=h.changes;
  h.auth({user:{id:'B'}});await tick();assert.ok(h.changes>changes);
  h.auth(null);await tick();assert.equal(h.ui.isPrivate(),false);
});


test('both build modes reject private-key configuration before bundling it',()=>{
  for(const key of ['sb_secret_fake_fixture','service_role_fake_fixture','phx_fake_fixture','eyJfake.fixture.fixture']){
    assert.throws(()=>validateAccountConfig({VITE_SUPABASE_URL:'https://demo.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:key}),/publishable/);
  }
  assert.doesNotThrow(()=>validateAccountConfig({}));
  assert.doesNotThrow(()=>validateAccountConfig({VITE_SUPABASE_URL:'https://your-project.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_REPLACE_ME'}));
  assert.throws(()=>validateAccountConfig({VITE_SUPABASE_URL:'https://demo.supabase.co'}),/both/);
});


test('failed authentication shows a generic error and clears the password without selecting private storage',async()=>{
  const h=setup();await tick();
  h.ui.cloud.setOwner(null);
  // A second mounted account UI injects a failing Auth provider, with no network.
  const client={auth:{onAuthStateChange(){},getSession:async()=>({data:{session:null}}),signInWithPassword:async()=>({data:{},error:new Error('PRIVATE EMAIL DETAIL')})}};
  const ui=mountAccountUI({client,document:{querySelector:s=>h.nodes[s.slice(1)]},onChange(){}});
  h.nodes['account-password'].value='private password';
  await h.nodes['account-form'].listeners.submit({preventDefault(){}});
  assert.equal(ui.isPrivate(),false);assert.equal(h.nodes['account-password'].value,'');
  assert.match(h.nodes['account-status'].textContent,/Sign-in failed/);
  assert.doesNotMatch(h.nodes['account-status'].textContent,/PRIVATE EMAIL/);
});

test('new account fields and account view are marked private for replay',()=>{
  const app = readFileSync(new URL('../index.html', import.meta.url),'utf8');
  for(const id of ['account-panel','account-form','account-email','account-password','account-status','storage-mode']){
    assert.match(app,new RegExp(`id="${id}"[^>]*data-analytics-private`));
  }
});


test('restored Auth session selects private storage on a new page instance',async()=>{
  const h=setup({initialSession:{user:{id:'A'}}});await tick();
  assert.equal(h.ui.isPrivate(),true);assert.equal(h.nodes['storage-mode'].value,'private');
  assert.equal(h.nodes['account-form'].hidden,true);assert.equal(h.nodes['sign-out'].hidden,false);
  assert.equal(h.changes,1);
});
