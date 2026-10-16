import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../brain/trace-store.js", import.meta.url), "utf8");
function createStore(){
  const values=new Map();
  const window={localStorage:{
    getItem:key=>values.has(key)?values.get(key):null,
    setItem:(key,value)=>values.set(key,String(value))
  }};
  vm.runInNewContext(source,{window,Date,JSON,String,Number,Math});
  return {api:window.JarvisTraceStore,values};
}

test("trace ledger stores bounded, normalized command evidence locally",()=>{
  const {api,values}=createStore();
  const first=api.record({input:"  hello\u0000  ",intent:"greeting",confidence:2,source:"offline-rule",response:"Hi",outcome:"answered",durationMs:12.7});
  assert.equal(first.command,"  hello  ");
  assert.equal(first.confidence,1);
  assert.equal(first.durationMs,13);
  assert.equal(api.summary().total,1);
  assert.equal(api.summary().averageDurationMs,13);
  assert.ok(values.has("jv_brain_traces_v1"));
  for(let i=0;i<105;i++)api.record({input:"command "+i,intent:"general.query",response:"reply"});
  assert.equal(api.list().length,100,"trace storage must stay within its fixed retention limit");
  assert.equal(api.list().at(-1).command,"command 104");
});

test("explicit feedback is attached to the selected trace and appears in summary/export",()=>{
  const {api}=createStore();
  const trace=api.record({input:"open settings",intent:"app.open",confidence:.94,response:"Confirm first",outcome:"awaiting-confirmation"});
  assert.equal(api.rate(trace.id,"helpful"),true);
  assert.equal(api.rate(trace.id,"unhelpful"),true);
  assert.equal(api.rate(trace.id,"invalid"),false);
  assert.equal(api.summary().unhelpful,1);
  const exported=JSON.parse(api.exportJson());
  assert.equal(exported.schemaVersion,1);
  assert.equal(exported.localOnly,true);
  assert.equal(exported.traces[0].feedback,"unhelpful");
});

test("users can clear local brain traces",()=>{
  const {api,values}=createStore();
  api.record({input:"private test command"});
  assert.equal(api.list().length,1);
  assert.equal(api.clear(),true);
  assert.equal(api.list().length,0);
  assert.equal(values.has("jv_brain_traces_v1"),false);
});

test("unavailable local storage fails safely without crashing the app",()=>{
  const window={localStorage:{getItem(){throw new Error("blocked")},setItem(){throw new Error("blocked")}}};
  vm.runInNewContext(source,{window,Date,JSON,String,Number,Math});
  const item=window.JarvisTraceStore.record({input:"test"});
  assert.equal(item.command,"test");
  assert.equal(window.JarvisTraceStore.list().length,0);
  assert.equal(window.JarvisTraceStore.rate(item.id,"helpful"),false);
});
