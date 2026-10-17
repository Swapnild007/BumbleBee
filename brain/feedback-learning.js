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
  return{ok:true,steps:Object.freeze(steps),requiresConfirmation:true,preview:steps.map((a,i)=>(i+1)+". "+a.type).join("\n")};
 }
 root.JarvisToolPlanner=Object.freeze({MAX_STEPS,TYPES,validatePlan});
})(window);

/* Confirmation-first bridge from model plans into existing local command handlers. */
(function(root){
 "use strict";
 function install(){
  const planner=root.JarvisToolPlanner,baseHandle=root.handle,basePrompt=root.sysPrompt;
  if(!planner||typeof baseHandle!=="function"||typeof basePrompt!=="function"||root.__jarvisPlanBridgeInstalled)return;
  root.__jarvisPlanBridgeInstalled=true;
  let pending=null;
  root.sysPrompt=function(){
   return basePrompt()+"\nFor a multi-step request, you may append one final line: PLAN:[{\"type\":\"weather\"},{\"type\":\"reminder\",\"minutes\":30,\"text\":\"Take an umbrella\"}]. Use at most 4 steps. Allowed plan types: weather, timer, reminder, task, note, torch. Only propose a plan when all required details are explicit. Never invent a time. A plan is only a proposal and must wait for the user to say confirm plan. Otherwise ask a clarification question.";
  };
  function commandFor(step){
   if(step.type==="weather")return "weather";
   if(step.type==="timer")return "set timer for "+step.minutes+" minutes";
   if(step.type==="reminder")return "remind me in "+step.minutes+" minutes to "+step.text;
   if(step.type==="task")return "add task: "+step.text;
   if(step.type==="note")return "remember that "+step.text;
   if(step.type==="torch")return step.on?"turn flashlight on":"turn flashlight off";
   return "";
  }
  root.handle=async function(raw){
   const text=String(raw||"").trim();
   if(pending&&/^(?:confirm plan|confirm|yes,? run it|run plan)$/i.test(text)){
    const steps=pending;pending=null;const results=[];
    for(let i=0;i<steps.length;i++){
     const command=commandFor(steps[i]);
     if(!command)return "Plan stopped because step "+(i+1)+" has no safe command mapping.";
     let result;
     try{result=await baseHandle(command)}catch(error){return "Plan stopped at step "+(i+1)+": "+String(error&&error.message||"step failed")+". Completed "+results.length+" of "+steps.length+" steps."}
     if(/could not|couldn't|not available|isn't loaded|failed|did not|no action/i.test(String(result)))return "Plan stopped at step "+(i+1)+": "+result+" Completed "+results.length+" of "+steps.length+" steps.";
     results.push(String(result));
    }
    return "Plan completed. "+results.join(" ");
   }
   if(pending&&/^(?:cancel|cancel plan|never mind|nevermind|forget it)$/i.test(text)){pending=null;return "Plan cancelled. Nothing was executed.";}
   if(pending)pending=null;
   const reply=await baseHandle.apply(this,arguments);
   const match=String(reply||"").match(/(?:^|\n)PLAN:\s*(\[[\s\S]*\])\s*$/);
   if(!match)return reply;
   let items;try{items=JSON.parse(match[1])}catch{return "I could not read the proposed plan, so nothing was executed."}
   const checked=planner.validatePlan(items,a=>a.type==="weather"?"":root.validateActionProposal(a));
   if(!checked.ok)return String(reply).slice(0,match.index)+"I rejected the plan. "+checked.error;
   pending=checked.steps;
   const lead=String(reply).slice(0,match.index).trim();
   return (lead?lead+"\n":"")+"Proposed plan, awaiting your confirmation:\n"+checked.steps.map((a,i)=>(i+1)+". "+(a.type==="weather"?"Check current weather":a.type==="timer"?"Set timer for "+a.minutes+" minutes":a.type==="reminder"?"Reminder in "+a.minutes+" minutes: "+a.text:a.type==="task"?"Add task: "+a.text:a.type==="note"?"Save note: "+a.text:(a.on?"Turn flashlight on":"Turn flashlight off"))).join("\n")+"\nSay 'confirm plan' to run it, or 'cancel' to discard it.";
  };
 }
 if(root.document&&root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",install,{once:true});
 else Promise.resolve().then(install);
})(window);
