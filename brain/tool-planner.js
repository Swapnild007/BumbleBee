(function(root){"use strict";
const MAX_STEPS=4;
const TYPES=["weather","timer","reminder","task","note","torch"];
function validatePlan(items,validate){
 if(!Array.isArray(items)||items.length<1||items.length>MAX_STEPS)return{ok:false,error:"Plan must contain 1 to 4 steps."};
 const steps=[];
 for(let i=0;i<items.length;i++){
  const a=items[i];if(!a||typeof a!=="object"||Array.isArray(a)||!TYPES.includes(a.type))return{ok:false,error:"Unsupported action at step "+(i+1)};
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
})(typeof window!=="undefined"?window:globalThis);
