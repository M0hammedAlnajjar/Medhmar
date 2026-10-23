const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const time = value => {
 const date = new Date(value);
 return value && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('en-GB', {dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Muscat'}).format(date) : '—';
};
export const validAgreementId = value => /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0;

// This view only reads existing records. Creating sessions remains a trainer action.
export function adminTrainingView({agreements=[],selected=null,logs=null,error=''}={}) {
 const options=agreements.map(a=>'<option value="'+a.agreementId+'"'+(a.agreementId===selected?' selected':'')+'>Agreement #'+a.agreementId+' · Camel #'+esc(a.camelId)+' · '+esc(a.status)+'</option>').join('');
 const agreement=agreements.find(a=>a.agreementId===selected);
 const ready=!error&&Array.isArray(logs);
 const total=ready?logs.reduce((sum,l)=>sum+l.durationMinutes,0):null;
 return '<div class="admin-training-page"><section class="admin-training-heading"><div class="admin-training-copy"><p class="admin-training-eyebrow">TRAINING OVERSIGHT</p><h1>Training Log</h1><p>Review recorded camel training sessions by agreement.</p></div><img class="admin-training-art" src="/assets/admin-training-hero.svg" width="1088" height="512" alt="" aria-hidden="true"><span class="admin-training-badge">Read-only review</span></section>'+
 '<section class="admin-training-panel"><form action="/admin/training" method="get" class="admin-training-filter"><div><label for="training-agreement">Training agreement</label><select id="training-agreement" name="agreementId" required'+(!agreements.length?' disabled':'')+'>'+(options||'<option value="">No agreements available</option>')+'</select></div><button class="btn btn-primary" type="submit"'+(!agreements.length?' disabled':'')+'>View sessions</button></form>'+
 (error?'<div role="alert" class="admin-training-error"><p>'+esc(error)+'</p><a href="/admin/training'+(selected?'?agreementId='+selected:'')+'" data-link>Retry</a></div>':!agreements.length?'<p role="status">No training agreements have been recorded yet.</p>':'')+'</section>'+
 (agreement?'<section class="admin-training-panel admin-training-summary" aria-label="Selected agreement"><div><span>Agreement</span><strong>#'+agreement.agreementId+'</strong></div><div><span>Camel</span><strong>#'+esc(agreement.camelId)+'</strong></div><div><span>Owner / Trainer</span><strong>#'+esc(agreement.ownerUserId)+' / #'+esc(agreement.trainerUserId)+'</strong></div><div><span>Agreement status</span><strong>'+esc(agreement.status)+'</strong></div><div><span>Sessions</span><strong>'+(ready?logs.length:'—')+'</strong></div><div><span>Total training</span><strong>'+(ready?total+' min':'—')+'</strong></div></section>':'')+
 (ready?'<section class="admin-training-panel"><div class="admin-training-table-heading"><h2>Training sessions</h2><span>Times in Muscat · GMT+4</span></div>'+(logs.length?'<div class="admin-training-table-scroll" role="region" aria-label="Training session records" tabindex="0"><table><thead><tr><th scope="col">Session</th><th scope="col">Trained at</th><th scope="col">Duration</th><th scope="col">Notes</th><th scope="col">Recorded at</th></tr></thead><tbody>'+logs.map(l=>'<tr><td>#'+esc(l.logId)+'</td><td>'+esc(time(l.sessionAt))+'</td><td>'+l.durationMinutes+' min</td><td class="admin-training-notes">'+esc(l.notes)+'</td><td>'+esc(time(l.createdAt))+'</td></tr>').join('')+'</tbody></table></div>':'<p role="status">No training sessions recorded for this agreement.</p>')+'</section>':'')+'</div>';
}

export async function loadAdminTraining({agreementId,api,training,isCurrent=()=>true}) {
 if(agreementId!==null&&!validAgreementId(agreementId))throw new Error('Enter a valid agreement ID.');
 const agreements=await api.list();
 if(!Array.isArray(agreements)||agreements.some(a=>!a||!validAgreementId(a.agreementId)||typeof a.agreementId!=='number'))throw new Error('Invalid training agreement response.');
 if(!isCurrent())return null;
 const selected=agreementId===null?(agreements[0]?.agreementId??null):Number(agreementId);
 if(selected!==null&&!agreements.some(a=>a.agreementId===selected))throw new Error('The selected agreement was not found.');
 if(selected===null)return {agreements,selected,logs:[]};
 const logs=await training.logs(selected);
 if(!Array.isArray(logs)||logs.some(l=>!l||l.agreementId!==selected||!validAgreementId(l.logId)||!Number.isInteger(l.durationMinutes)||l.durationMinutes<1||l.durationMinutes>720))throw new Error('Invalid training session response.');
 return {agreements,selected,logs};
}
