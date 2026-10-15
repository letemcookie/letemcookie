'use strict';
chrome.storage.local.get('counterEnabled').then(({counterEnabled=false})=>{document.getElementById('counter').checked=counterEnabled;});
document.getElementById('counter').addEventListener('change',async event=>{
 await chrome.storage.local.set({counterEnabled:event.target.checked,counterChoiceVersion:1,counterQueue:[]});
 document.getElementById('status').textContent=event.target.checked?'Counting on.':'Counting off.';
});
