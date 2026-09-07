import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const old=JSON.parse(fs.readFileSync('data/v2-research/viago-validation-bank-human-recognition-purge-v1.0.0.json','utf8'));
const bank=JSON.parse(fs.readFileSync('data/v2-research/viago-validation-bank-233-empirical-language-v1.0.0.json','utf8'));
const review=JSON.parse(fs.readFileSync('data/v2-research/empirical-language-reconstruction-v1.0.0.json','utf8'));
const sim=JSON.parse(fs.readFileSync('data/v2-research/empirical-language-233-four-attempt-simulation.json','utf8'));

test('successor is immutable, non-active, and reconciled',()=>{
 assert.equal(bank.status,'FROZEN_PROPOSED_FOR_OWNER_REVIEW_NOT_ACTIVE');
 assert.equal(bank.parent_bank_version,old.bank_version);
 assert.equal(bank.question_count,233);
 assert.deepEqual(bank.formats,{LIKERT:110,SINGLE_SELECT:123});
 assert.deepEqual(bank.likert_by_color,{red:27,blue:28,yellow:27,green:28});
 assert.equal(new Set(bank.questions.map(q=>q.id)).size,233);
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(bank.questions)).digest('hex'),bank.bank_hash);
 assert.deepEqual(review.counts,{KEEP:159,LIGHT_REWRITE:33,MAJOR_REWRITE:41,RETIRE:7});
 assert.equal(Object.values(review.counts).reduce((a,b)=>a+b,0),240);
});

test('retained item mappings, scoring and families remain unchanged',()=>{
 const byId=new Map(old.questions.map(q=>[q.id,q]));
 for(const q of bank.questions){
  const prior=byId.get(q.id); assert.ok(prior,q.id);
  assert.equal(q.format,prior.format,q.id);
  assert.equal(q.color,prior.color,q.id);
  assert.equal(q.family,prior.family,q.id);
  assert.equal(q.construct,prior.construct,q.id);
  assert.deepEqual((q.options||[]).map(x=>[x.id,x.color]),(prior.options||[]).map(x=>[x.id,x.color]),q.id);
 }
 assert.equal(bank.scoring_version,old.scoring_version);
 assert.equal(bank.assembler_version,old.assembler_version);
 assert.equal(review.scoring_integrity.mapping_changes,0);
 assert.equal(review.scoring_integrity.historical_attempt_changes,0);
});

test('every remediation preserves full traceability and language gates pass',()=>{
 assert.equal(review.records.length,240);
 assert.equal(review.records.filter(x=>x.direct_human_evidence_count>0).length,47);
 for(const r of review.records){assert.ok(r.question_id);assert.ok(r.old_revision_id);assert.ok(r.old_prompt);assert.ok(r.disposition);assert.equal(Object.hasOwn(r,'direct_human_evidence'),false);if(r.disposition!=='RETIRE'){assert.ok(r.new_revision_id);assert.equal(r.mapping_preserved,true);assert.equal(r.readability,'EASY');assert.equal(r.answer_distinction,'PASS');if(r.new_options.length){assert.equal(r.answer_audit.length,r.new_options.length);assert.ok(r.answer_audit.every(a=>a.one_idea&&a.ordinary_spoken_language&&a.answers_prompt_directly&&a.behaviorally_distinct_from_other_options&&a.scoring_mapping_preserved))}}}
 for(const [k,v] of Object.entries(review.full_screen)){if(Array.isArray(v))continue;assert.equal(v,0,k)}
 assert.deepEqual(review.full_screen.lexical_overlap_candidates,[]);
});

test('1000-person four-attempt simulation passes',()=>{
 assert.equal(sim.status,'PASS_NON_PRODUCTION_RESEARCH');
 assert.equal(sim.selector_failures,0);
 assert.equal(sim.participants,1000);
 assert.equal(sim.attempts_each,4);
 assert.ok(sim.attempts.every(x=>x.n===1000&&x.single===26&&x.likert===24&&x.color_opportunity_failures===0));
 assert.ok(sim.transitions.every(x=>x.exact===0&&x.family===0));
});
