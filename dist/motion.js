// Short, optional motion. All content remains visible without JavaScript motion.
const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
const running=new Set();
const perElement=new WeakMap();
function play(element,frames,options){
 if(!element||preference.matches||typeof element.animate!=='function')return;
 perElement.get(element)?.cancel();const animation=element.animate(frames,options);perElement.set(element,animation);running.add(animation);
 const forget=()=>running.delete(animation);animation.addEventListener('finish',forget,{once:true});animation.addEventListener('cancel',forget,{once:true});
}
function visible(element){const r=element.getBoundingClientRect();return r.bottom>0&&r.top<window.innerHeight;}
export function highlightResults(scope='.metrics .metric'){
 if(preference.matches)return;
 document.querySelectorAll(scope).forEach(element=>{if(visible(element))play(element,[{boxShadow:'0 0 0 1px rgba(181,237,147,.55), 0 0 24px rgba(181,237,147,.10)'},{boxShadow:'0 0 0 1px rgba(181,237,147,0), 0 0 0 rgba(181,237,147,0)'}],{duration:650,easing:'ease-out'});});
}
function revealCard(element,delay=0){play(element,[{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,delay,fill:'backwards',easing:'cubic-bezier(.16,1,.3,1)'});}
function revealBars(){
 document.querySelectorAll('.impact-bar').forEach(bar=>play(bar,[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:520,easing:'cubic-bezier(.2,.7,.2,1)'}));
}
export function initMotion(){
 document.querySelectorAll('.auto-summary strong').forEach(value=>{new MutationObserver(()=>{if(visible(value))play(value,[{color:'#ffffff',backgroundColor:'rgba(181,237,147,.16)'},{color:'#d1e5c9',backgroundColor:'transparent'}],{duration:450,easing:'ease-out'});}).observe(value,{childList:true,characterData:true,subtree:true});});

 const replay=document.createElement('button');replay.type='button';replay.id='motionReplay';replay.className='outline motion-replay';
 const state=()=>{replay.disabled=preference.matches;replay.textContent=preference.matches?'端末設定により動きはOFF':'登場の動きを再生';};state();
 replay.addEventListener('click',()=>{document.querySelectorAll('.setup-card').forEach((card,index)=>revealCard(card,index*110));});
 document.querySelector('.input-heading').append(replay);
 preference.addEventListener('change',state);
 if(!('IntersectionObserver' in window))return;
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);if(preference.matches)continue;let cards=[...document.querySelectorAll('.setup-card')],index=cards.indexOf(entry.target);revealCard(entry.target,index>=0?index*110:0);if(entry.target.classList.contains('bb-impact'))revealBars();}},{threshold:.15});
 document.querySelectorAll('.setup-card,.metric,.bb-impact,.comparison,.ranges,.payout-panel,.method').forEach(element=>observer.observe(element));
 preference.addEventListener('change',()=>{if(preference.matches){for(const animation of running)animation.cancel();running.clear();}});
}
