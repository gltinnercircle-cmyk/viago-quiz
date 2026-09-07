import { NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/v2/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { assembleValidationAttempt, type HistoryExposure } from '@/lib/v2/validation';
import { resolveValidationHistoryIdentity } from '@/lib/v2/validationIdentity';

export async function GET(request:Request){
  if(!(await hasAdminSession()))return NextResponse.json({error:'Unauthorized'},{status:401});
  const participantId=new URL(request.url).searchParams.get('participant_id');
  if(!participantId)return NextResponse.json({error:'participant_id required'},{status:400});
  try{
    const identity=await resolveValidationHistoryIdentity(participantId);
    const prior=await supabaseAdmin.from('validation_attempts').select('id,manifest,answers,completed_at,started_at').in('participant_id',identity.historical_participant_ids).order('started_at',{ascending:true});
    if(prior.error)throw prior.error;
    const history:HistoryExposure[]=(prior.data||[]).map(row=>{const answered=new Set(Object.keys(row.answers||{}));const questions=(row.manifest?.questions||[]).filter((q:{question_revision_id:string})=>row.completed_at||answered.has(q.question_revision_id)).map((q:{question_id:string;question_revision_id:string;semantic_family:string;construct?:string})=>({question_id:q.question_id,question_revision_id:q.question_revision_id,semantic_family:q.semantic_family,construct:q.construct}));return{attempt_id:row.id,completed:!!row.completed_at,questions}}).filter(x=>x.questions.length>0);
    const manifest=assembleValidationAttempt('OWNER_READ_ONLY_HISTORY_PREVIEW',history,identity);
    const recent=history.slice(-3),questions=recent.flatMap(attempt=>attempt.questions);
    return NextResponse.json({read_only:true,created_attempt:false,...identity,eligible_history_attempt_ids:history.map(x=>x.attempt_id),history_attempt_ids:manifest.history_attempt_ids,answered_exposure_from_incomplete_attempts:recent.filter(x=>!x.completed).map(x=>({attempt_id:x.attempt_id,answered_questions:x.questions.length})),question_identities_excluded:[...new Set(recent.at(-1)?.questions.map(q=>q.question_id)||[])],semantic_families_penalized:[...new Set(questions.map(q=>q.semantic_family))],broad_constructs_penalized:[...new Set(questions.map(q=>q.construct).filter(Boolean))],preview_manifest_hash:manifest.manifest_hash,preview_question_count:manifest.questions.length,preview_format_counts:{single:manifest.questions.filter(q=>q.format==='SINGLE_SELECT').length,likert:manifest.questions.filter(q=>q.format==='LIKERT').length},preview_likert_by_color:Object.fromEntries(['red','blue','yellow','green'].map(color=>[color,manifest.questions.filter(q=>q.format==='LIKERT'&&q.color===color).length])),fallback_relaxations:manifest.history_policy.fallback_relaxations});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'History preview failed'},{status:500});}
}
