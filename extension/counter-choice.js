'use strict';
for(const [id,enabled] of [['yes',true],['no',false]]) document.getElementById(id).addEventListener('click',async()=>{
 await chrome.storage.local.set({counterEnabled:enabled,counterChoiceVersion:1,counterQueue:[]});
 document.getElementById('done').textContent=enabled?'Your next cookie counts.':'No counting. Still eating.';
 document.getElementById('yes').disabled=true;document.getElementById('no').disabled=true;
});
