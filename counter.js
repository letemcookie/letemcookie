// This page reads the public total. It never submits counter events.
(async()=>{
 const el=document.getElementById('eaten');
 try {
   const response=await fetch('https://letemcookie-counter.chrisbest.workers.dev/stats',{credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(5000)});
   if(!response.ok)throw new Error('unavailable');
   const {eaten}=await response.json();
   if(!Number.isSafeInteger(eaten)||eaten<0)throw new Error('invalid count');
   el.textContent=eaten.toLocaleString();
 }catch {el.closest('.census').textContent='Cookie counter taking a breather.';}
})();
