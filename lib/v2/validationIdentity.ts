import { supabaseAdmin } from '@/lib/supabaseAdminClient';

export function normalizeValidationHandle(value:string){
  return value.trim().replace(/\s+/g,' ').toLocaleLowerCase();
}
export function baseValidationHandle(value:string){
  return normalizeValidationHandle(value).replace(/\s+\([0-9a-f]{4}\)$/i,'');
}

export async function resolveValidationHistoryIdentity(participantId:string){
  const link=await supabaseAdmin.from('validation_participant_identity_links').select('identity_id').eq('participant_id',participantId).maybeSingle();
  if(link.error)throw link.error;
  if(!link.data)return {canonical_history_identity_id:null,historical_participant_ids:[participantId]};
  const linked=await supabaseAdmin.from('validation_participant_identity_links').select('participant_id').eq('identity_id',link.data.identity_id).order('linked_at',{ascending:true});
  if(linked.error)throw linked.error;
  const ids=(linked.data||[]).map(row=>row.participant_id);
  return {canonical_history_identity_id:link.data.identity_id,historical_participant_ids:ids.includes(participantId)?ids:[...ids,participantId]};
}

export async function exactNormalizedParticipantMatches(name:string){
  const rows=await supabaseAdmin.from('validation_participants').select('*');
  if(rows.error)throw rows.error;
  const normalized=normalizeValidationHandle(name);
  return (rows.data||[]).filter(row=>baseValidationHandle(String(row.participant_code||''))===normalized);
}

export async function registerUniqueValidationIdentity(participantId:string,name:string){
  const normalized=normalizeValidationHandle(name);
  const identity=await supabaseAdmin.from('validation_participant_identities').insert({normalized_handle:normalized,display_label:name,reconnect_policy:'EXACT_UNIQUE',created_by:'VALIDATION_RUNTIME',reason:'First unambiguous normalized participant handle'}).select('id').single();
  if(identity.error)return null;
  const link=await supabaseAdmin.from('validation_participant_identity_links').insert({participant_id:participantId,identity_id:identity.data.id,link_basis:'UNIQUE_NORMALIZED_HANDLE_AT_CREATION',linked_by:'VALIDATION_RUNTIME'});
  if(link.error)throw link.error;
  return identity.data.id as string;
}
