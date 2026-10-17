/* Explicit, exact-phrase learning for JARVIS. Local-only; corrections never execute actions. */
(function(root){
  "use strict";
  const KEY="jv_brain_corrections_v1",LIMIT=100;
  const ACTIONS=new Set(["phone.call","message.sms","message.whatsapp","app.open","timer.create","reminder.create","memory.save","task.create"]);
  function normalize(value){
    return String(value||"").toLowerCase().normalize("NFKC")
      .replace(/[’']/g,"'").replace(/[^\p{L}\p{N}\s']/gu," ")
      .replace(/\s+/g," ").trim().slice(0,300);
  }
  function read(){
    try{
      const value=JSON.parse(root.localStorage.getItem(KEY)||"[]");
      return Array.isArray(value)?value.filter(x=>x&&typeof x.phrase==="string"&&typeof x.intent==="string").slice(-LIMIT):[];
    }catch{return []}
  }
  function write(items){
    try{root.localStorage.setItem(KEY,JSON.stringify(items.slice(-LIMIT)));return true}catch{return false}
  }
  function teach(phrase,intent){
    const key=normalize(phrase);
    if(key.length<2||key.length>300||typeof intent!=="string"||!/^[a-z][a-z0-9_.-]{1,79}$/.test(intent))return {ok:false,reason:"Choose a valid phrase and intent."};
    const items=read().filter(x=>x.phrase!==key);
    items.push({phrase:key,intent,updatedAt:new Date().toISOString()});
    if(!write(items))return {ok:false,reason:"Could not save learning on this device."};
    return {ok:true,count:items.length};
  }
  function lookup(phrase){
    const key=normalize(phrase);
    const item=read().find(x=>x.phrase===key);
    return item?{intent:item.intent,phrase:item.phrase}:null;
  }
  function list(){return read()}
  function remove(phrase){const key=normalize(phrase);return write(read().filter(x=>x.phrase!==key))}
  function clear(){try{root.localStorage.removeItem(KEY);return true}catch{return false}}
  root.JarvisBrainLearning=Object.freeze({normalize,teach,lookup,list,remove,clear,isActionIntent:id=>ACTIONS.has(id)});
})(window);

/* Pure schema validation for proposed multi-step plans. This module never runs actions. */
(function(root){
 "use strict";
 const MAX_STEPS=4;
 const TYPES=["weather","timer","reminder","task","note","torch"];
 function validatePlan(items,validate){
  if(!Array.isArray(items)||items.length<1||items.length>MAX_STEPS)return{ok:false,error:"Plan must contain 1 to 4 steps."};
  const steps=[];
  for(let i=0;i<items.length;i++){
   const a=items[i];
   if(!a||typeof a!=="object"||Array.isArray(a)||!TYPES.includes(a.type))return{ok:false,error:"Unsupported step "+(i+1)};
   const x={type:a.type};
   if(a.type==="timer"){x.minutes=Number(a.minutes);x.label=String(a.label||"Timer").slice(0,120)}
   if(a.type==="reminder"){x.minutes=Number(a.minutes);x.text=String(a.text||"").trim().slice(0,1000)}
   if(a.type==="task"||a.type==="note")x.text=String(a.text||"").trim().slice(0,1000);
   if(a.type==="torch")x.on=a.on;
   const error=validate(x);if(error)return{ok:false,error:"Step "+(i+1)+": "+error};
   steps.push(Object.freeze(x));
  }
  return{ok:true,steps:Object.freeze(steps),requiresConfirmation:true,preview:steps.map((a,i)=>(i+1)+". "+a.type).join("\\n")};
 }
 root.JarvisToolPlanner=Object.freeze({MAX_STEPS,TYPES,validatePlan});
})(window);
