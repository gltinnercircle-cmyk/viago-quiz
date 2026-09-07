import fs from 'node:fs';
import crypto from 'node:crypto';

const source=JSON.parse(fs.readFileSync('data/v2-research/viago-validation-bank-233-empirical-language-v1.0.0.json','utf8'));
const changes={
  'EXP2-S-13':{kind:'MAJOR_REWRITE',prompt:'After a demanding week, you get one completely free evening. What do you choose?',options:[
    'Finish a personal project I have wanted to move forward',
    'Try a new place, activity, or spontaneous plan',
    'Spend unhurried time with someone close to me',
    'Dive into a topic, puzzle, or hobby I want to understand better']},
  'EXP3-S-048':{kind:'LIGHT_REWRITE',prompt:'You and a friend disagree about how to spend a shared day. What do you want first?',options:[
    'Pick an option and get the day moving',
    'Suggest something new that could excite us both',
    'Talk until we find what we would both enjoy together',
    'Lay out the time, cost, and practical tradeoffs']},
  'EXP3-S-019':{kind:'MAJOR_REWRITE',prompt:'You strike up a conversation with someone new at a gathering. Which kind of exchange draws you in most?',options:[
    'We trade ideas we can put to use',
    'The conversation gains energy and goes somewhere unexpected',
    'We find something personal that helps us connect',
    'We unpack how something works or why they see it that way']},
  'EXP3-L-R-008':{kind:'MAJOR_REWRITE',prompt:'When choosing between two good purchases, I lean toward the one that could deliver the bigger result, even if the safer option is more predictable.'},
  'EXP2-L-B-03':{kind:'MAJOR_REWRITE',prompt:'With someone new, I warm up faster through an open, free-flowing conversation than through getting to know each other gradually.'},
  '0eaa09f4-95af-45a6-9846-13202a795033':{kind:'MAJOR_REWRITE',prompt:'When two choices are both good, I lean toward the predictable one even when the other offers more upside.'},
  'EXP3-L-Y-003':{kind:'LIGHT_REWRITE',prompt:'I trust people more when they keep showing up after the excitement wears off.'}
};

const questions=source.questions.map(old=>{
  const change=changes[old.id]; if(!change)return old;
  const options=change.options?old.options.map((option,index)=>({...option,label:change.options[index]})):old.options;
  return {...old,prompt:change.prompt,options,question_revision_id:`${old.id}@targeted-language-1.0.0`,targeted_language_revision:{source_question_revision_id:old.question_revision_id,disposition:change.kind,owner_attempt_id:'be07d7f3-7df2-4d31-8106-c5c9c2ae3180',mapping_changed:false,scoring_changed:false,semantic_family_changed:false}};
});
const bank={...source,status:'OWNER_AUTHORIZED_TARGETED_RETEST',bank_version:`viago-validation-bank-${questions.length}-targeted-language-v1.0.0`,parent_bank_version:source.bank_version,parent_bank_hash:source.bank_hash,created_at:new Date().toISOString(),question_count:questions.length,questions};
bank.bank_hash=crypto.createHash('sha256').update(JSON.stringify(questions)).digest('hex');
fs.writeFileSync(`data/v2-research/${bank.bank_version}.json`,JSON.stringify(bank,null,2)+'\n');
const review={schema_version:'1.0.0',status:'OWNER_AUTHORIZED_TARGETED_RETEST',owner_attempt_id:'be07d7f3-7df2-4d31-8106-c5c9c2ae3180',source_bank:source.bank_version,successor_bank:bank.bank_version,successor_hash:bank.bank_hash,dispositions:Object.entries(changes).map(([id,c])=>({id,disposition:c.kind,before:source.questions.find(q=>q.id===id),after:questions.find(q=>q.id===id)}))};
fs.writeFileSync('data/v2-research/targeted-language-owner-corrections-v1.0.0.json',JSON.stringify(review,null,2)+'\n');
console.log(JSON.stringify({bank:bank.bank_version,hash:bank.bank_hash,count:questions.length,rewritten:Object.keys(changes).length},null,2));
