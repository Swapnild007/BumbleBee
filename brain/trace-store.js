/* JARVIS local brain traces. Inspired by OpenJarvis trace-driven evaluation; no network calls. */
(function(root){
  "use strict";
  const KEY="jv_brain_traces_v1",LIMIT=100;
  let sequence=0;
  function read(){
    try{const value=JSON.parse(root.localStorage.getItem(KEY)||"[]");return Array.isArray(value)?value.filter(x=>x&&typeof x==="object").slice(-LIMIT):[]}
    catch{return []}
  }
  function write(items){
    try{root.localStorage.setItem(KEY,JSON.stringify(items.slice(-LIMIT)));return true}
    catch{return false}
  }
  function clip(value,max){
    return String(value==null?"":value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"").slice(0,max);
  }
  function record(input){
    const item={
      id:Date.now().toString(36)+"-"+(++sequence).toString(36),
      at:new Date().toISOString(),
      command:clip(input.input,1000),
      intent:clip(input.intent,80)||"general.query",
      confidence:Number.isFinite(input.confidence)?Math.max(0,Math.min(1,input.confidence)):0,
      source:clip(input.source,40)||"unknown",
      response:clip(input.response,2000),
      outcome:["answered","failed","awaiting-confirmation","clarification"].includes(input.outcome)?input.outcome:"answered",
      durationMs:Number.isFinite(input.durationMs)?Math.max(0,Math.round(input.durationMs)):null,
      feedback:null
    };
    const items=read();items.push(item);write(items);return item;
  }
  function rate(id,rating){
    if(!["helpful","unhelpful"].includes(rating))return false;
    const items=read(),item=items.find(x=>x.id===id);
    if(!item)return false;
    item.feedback=rating;item.feedbackAt=new Date().toISOString();return write(items);
  }
  function list(){return read()}
  function summary(){
    const items=read();
    return {total:items.length,helpful:items.filter(x=>x.feedback==="helpful").length,unhelpful:items.filter(x=>x.feedback==="unhelpful").length,failed:items.filter(x=>x.outcome==="failed").length,awaitingConfirmation:items.filter(x=>x.outcome==="awaiting-confirmation").length};
  }
  root.JarvisTraceStore=Object.freeze({record,rate,list,summary,exportJson:()=>JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),localOnly:true,traces:read()},null,2)});
})(window);
