import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironment,validEnvironment} from './environment.js';
test('validates coordinates and timezones without storing supplied fields',()=>{
 assert.deepEqual(validEnvironment({timezone:'bad',latitude:100,longitude:200,source:'ip',address:'private'}),{timezone:'UTC'});
 assert.equal(validEnvironment({timezone:'Asia/Tokyo',latitude:35.123456,longitude:139.123456,source:'browser'}).latitude,35.12);
});
test('weather opt-in, isolated clients, cache expiry and missing location',async()=>{
 let time=Date.parse('2026-09-12T01:00:00Z'),calls=0;
 const service=createEnvironment({now:()=>time,fetcher:async()=>{calls++;return Response.json({current:{time:time/1000,temperature_2m:24,precipitation:0,weather_code:0}});}});
 service.update('a',{timezone:'Asia/Tokyo',latitude:35,longitude:139,source:'ip'});
 assert.match(await service.context('a',false),/2026/);assert.equal(calls,0);
 assert.match(await service.context('a',true),/公网 IP/);assert.equal(calls,1);
 await service.context('a',true);assert.equal(calls,1);
 assert.ok(!(await service.context('b',true)).includes('temperatureC'));
 time+=1800001;await service.context('a',true);assert.equal(calls,2);
 time+=3600001;assert.ok(!(await service.context('a',true)).includes('temperatureC'));
 service.clear();assert.match(await service.context('a',true),/时区未知/);
});
test('weather outage and invalid data cannot become factual weather',async()=>{
 const service=createEnvironment({fetcher:async()=>{throw Error('offline');}});
 service.update('a',{timezone:'UTC',latitude:0,longitude:0,source:'browser'});
 assert.match(await service.context('a',true),/获取失败/);
});
