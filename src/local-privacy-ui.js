import { createLocalPrivacyChecker } from './local-privacy-check.js';

// LOCAL_PRIVACY_CHECKER_DEV_ONLY. No credentials, references, IDs or results go to analytics.
export function mountLocalPrivacyUI({ client, projectOrigin, getExpectedOwner, getSelectedBill,
  document: doc = globalThis.document, clipboard = globalThis.navigator?.clipboard, hostname = globalThis.location?.hostname } = {}) {
  if (!['localhost','127.0.0.1','[::1]'].includes(hostname)) return null;
  const checker = createLocalPrivacyChecker(client, { projectOrigin, getExpectedOwner });
  const panel = doc.createElement('details'); panel.id = 'local-privacy-check';
  panel.setAttribute('data-analytics-private', '');
  const summary = doc.createElement('summary'); summary.textContent = 'Local privacy check';
  const info = doc.createElement('p'); info.textContent = 'Localhost only · read-only · hosted Supabase. Keep Safari as A and Chrome as B. Confirm the expected account email locally; it will not appear in the result. No passwords or tokens are needed.';
  const roleLabel = doc.createElement('label'); roleLabel.htmlFor = 'privacy-role'; roleLabel.textContent = 'Check as';
  const role = doc.createElement('select'); role.id = 'privacy-role';
  for (const [value,text] of [['owner','Account A · existing selected bill'],['other','Account B · pasted test reference']]) {
    const option=doc.createElement('option');option.value=value;option.textContent=text;role.append(option);
  }
  role.value='owner';
  const emailLabel=doc.createElement('label');emailLabel.htmlFor='privacy-email';emailLabel.textContent='Expected account email (cleared before the result)';
  const email=doc.createElement('input');email.id='privacy-email';email.type='email';email.autocomplete='off';email.setAttribute('data-analytics-private','');
  const refLabel=doc.createElement('label');refLabel.htmlFor='privacy-reference';refLabel.textContent='Paste test reference from Account A';
  const reference=doc.createElement('textarea');reference.id='privacy-reference';reference.rows=3;reference.setAttribute('data-analytics-private','');
  refLabel.hidden=true;reference.hidden=true;
  const run=doc.createElement('button');run.type='button';run.textContent='Check selected bill as A';
  const copy=doc.createElement('button');copy.type='button';copy.textContent='Copy test reference';copy.disabled=true;
  const output=doc.createElement('div');output.id='privacy-check-result';output.setAttribute('role','status');output.setAttribute('data-analytics-private','');
  let prepared=null;let revision=0;
  function reset() {
    revision++;checker.invalidate();prepared=null;copy.disabled=true;
    email.value='';reference.value='';output.replaceChildren();run.disabled=false;
  }
  role.addEventListener('change',()=>{
    reset();reference.hidden=refLabel.hidden=role.value!=='other';
    run.textContent=role.value==='other'?'Check reference as B':'Check selected bill as A';
  });
  run.addEventListener('click',async()=>{
    const scope=++revision;const expectedEmail=email.value.trim();const pasted=reference.value;
    email.value='';reference.value='';prepared=null;copy.disabled=true;run.disabled=true;
    output.textContent='Checking signed-in account and exact record IDs…';
    const result=role.value==='owner'
      ?await checker.checkOwner({email:expectedEmail,selection:getSelectedBill()})
      :await checker.checkOther({email:expectedEmail,reference:pasted});
    if(scope!==revision)return;
    output.replaceChildren();
    for(const [label,value] of [
      ['Environment','Localhost app → hosted Supabase'],['Outcome',result.outcome],
      ['Signed-in account',result.accountVerified?'verified':'not verified'],
      ['Trip request status',result.tripStatus],['Trip rows',result.tripRows??'not verified'],
      ['Bill request status',result.billStatus],['Bill rows',result.billRows??'not verified'],
      ['Note',result.reason],
    ]){const p=doc.createElement('p');p.textContent=`${label}: ${value}`;output.append(p);}
    prepared=result.reference??null;copy.disabled=!prepared;run.disabled=false;
  });
  copy.addEventListener('click',async()=>{
    if(!prepared)return;
    try {
      // Invoked directly by a fresh click, preserving Safari's clipboard user gesture.
      await clipboard.writeText(prepared);
      const p=doc.createElement('p');p.textContent='Test reference copied. It contains record IDs, not login credentials. Paste only into Chrome’s local checker.';output.append(p);
    } catch {const p=doc.createElement('p');p.textContent='Clipboard permission was not granted. Allow clipboard access and click Copy test reference again.';output.append(p);}
  });
  panel.append(summary,info,roleLabel,role,emailLabel,email,refLabel,reference,run,copy,output);
  doc.querySelector('#account-panel').append(panel);
  return { reset };
}
