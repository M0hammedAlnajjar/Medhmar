import test from 'node:test';
import assert from 'node:assert/strict';
import {adminTrainingView,loadAdminTraining} from '../js/admin-training.js';
import {canAccessRoute,matchRoute} from '../js/routes.js';
const agreement={agreementId:15,camelId:8,trainerUserId:3,ownerUserId:2,status:'ACTIVE'};
test('training loader selects real agreements and rejects invalid IDs and mismatched records',async()=>{
 let calls=0;const api={list:async()=>[agreement]},training={logs:async id=>{calls++;assert.equal(id,15);return [{logId:1,agreementId:15,durationMinutes:40}];}};
 assert.equal((await loadAdminTraining({agreementId:null,api,training})).logs.length,1);
 for(const agreementId of ['-1','abc','1.5','9007199254740992','99'])await assert.rejects(loadAdminTraining({agreementId,api,training}));
 assert.equal(calls,1);
 await assert.rejects(loadAdminTraining({agreementId:'15',api,training:{logs:async()=>[{logId:1,agreementId:99,durationMinutes:40}]}}));
});
test('training errors propagate and stale navigation stops subsequent requests',async()=>{
 const api={list:async()=>[agreement]},training={logs:async()=>{throw new Error('Offline');}};
 await assert.rejects(loadAdminTraining({agreementId:'15',api,training}),/Offline/);
 assert.equal(await loadAdminTraining({agreementId:'15',api,training,isCurrent:()=>false}),null);
 assert.deepEqual((await loadAdminTraining({agreementId:null,api:{list:async()=>[]},training})).logs,[]);
});
test('training notes are escaped and empty records differ from failed requests',()=>{
 const html=adminTrainingView({agreements:[agreement],selected:15,logs:[{logId:1,durationMinutes:40,notes:'<script>alert(1)</script>'}]});
 assert.match(html,/40 min/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>|Add Training Session/);
 assert.match(adminTrainingView({agreements:[agreement],selected:15,logs:[]}),/No training sessions recorded/);
 const error=adminTrainingView({error:'Offline'});assert.match(error,/role="alert"/);assert.doesNotMatch(error,/No training sessions recorded|Total training/);
});
test('training admin route denies ordinary roles',()=>{
 const route=matchRoute('/admin/training').route;
 for(const role of ['OWNER','TRAINER','VIEWER','ORGANIZER'])assert.equal(canAccessRoute(route,{userId:1,roles:[role]}),false);
 assert.equal(canAccessRoute(route,{userId:1,roles:['ADMIN']}),true);
});
