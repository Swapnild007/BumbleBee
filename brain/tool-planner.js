(function(root){"use strict";
const MAX_STEPS=4;
function validatePlan(items,validate){
 if(!Array.isArray(items)||items.length<1||items.length>MAX_STEPS)return{ok:false,error:"Plan must contain 1 to 4 steps."};
 const steps=[];
 for(let i=0;i<items.length;i++){
  const a=items[i];if(!a||typeof a!=="object"||Array.isArray(a))return{ok:false,error:"Invalid step "+(i+1)};
  const error=validate(a);if(error)return{ok:false,error:"Step "+(i+1)+": "+error};
  steps.push(Object.freeze({...a}));
 }
 return{ok:true,steps:Object.freeze(steps),requiresConfirmation:true,preview:steps.map((a,i)=>(i+1)+". "+a.type).join("\n")};
}
root.JarvisToolPlanner=Object.freeze({MAX_STEPS,validatePlan});
})(typeof window!=="undefined"?window:globalThis);
