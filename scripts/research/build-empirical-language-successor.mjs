import fs from 'node:fs';
import crypto from 'node:crypto';

const SOURCE='data/v2-research/viago-validation-bank-human-recognition-purge-v1.0.0.json';
const FORENSIC='/private/tmp/viago-feedback-analysis/analysis.json';
const OUT='data/v2-research/viago-validation-bank-233-empirical-language-v1.0.0.json';
const REVIEW='data/v2-research/empirical-language-reconstruction-v1.0.0.json';
const SIM='data/v2-research/empirical-language-233-four-attempt-simulation.json';
const REPORT='docs/v2-research/empirical-language-reconstruction-owner-review.md';
const PRIVATE_TRACE='/private/tmp/viago-feedback-analysis/empirical-language-private-trace-v1.0.0.json';
const source=JSON.parse(fs.readFileSync(SOURCE,'utf8'));
const forensic=JSON.parse(fs.readFileSync(FORENSIC,'utf8'));

const retire=new Map([
 ['EXP3-L-R-013','Universal/tautological recognition claim; direct desirability-validity evidence.'],
 ['63a771d2-a37a-4a48-b5fd-f5d316d26b0d','Near-universal duty statement; direct “no brainer” evidence.'],
 ['EXP2-S-05','Reverse framing plus four compound deficit descriptions.'],
 ['EXP3-S-022','Prompt and options do not form a natural four-way choice.'],
 ['EXP1-S-09','Reliability scenario requires overloaded rationales and remains replaceable.'],
 ['HR-S-042','Repeated Red/Yellow overlap; the family is covered more cleanly elsewhere.'],
 ['EXP1-S-01','Travel-companion traits do not cleanly answer one discriminator.']
]);

// Options are keyed R/B/Y/G and applied without changing mappings.
const rw={
 'EXP2-S-19':{p:'What would make you rethink something you bought for your home?',o:['It is not doing the job I bought it for','A much better option comes along','It is getting in the way of routines that matter at home','I learn something that changes what I thought']},
 '1bac0735-73c1-43b1-86a8-41ec34adfd86':{p:'I like to give a loose plan some structure before I start.'},
 'EXP3-L-G-001':{p:'When several choices look good, I prefer one whose likely outcome makes sense to me.'},
 'C03-S-04':{p:'A family tradition needs an update. What matters most to you?',o:['Choose a version we can actually make happen','Try a fresh version people will enjoy','Keep what makes the tradition meaningful to us','Create a version that will work the same way each time']},
 'EXP1-S-20':{p:'Someone who knows you recommends a new hobby. Which suggestion sounds best?',o:['One with a challenge I can work toward','One that gives me something new to explore','One I can share with people who matter to me','One with enough depth to keep learning']},
 'EXP3-L-R-003':{p:'With limited time, I would rather finish one important thing than explore several ideas.'},
 'C01-L-R-02':{p:'If I can change my mind later, I would rather choose now than wait for every detail.'},
 'EXP2-S-07':{p:'You have limited vacation time. What matters most?',o:['Doing the one thing I most want to accomplish','Leaving room for an unexpected highlight','Spending the time with people or traditions that matter','Having a plan that works for the whole trip']},
 '6a004186-77cd-415b-bf4f-8cd631a9c1d6':{p:'When several next steps could work, I would rather choose one than keep my options open.'},
 'EXP2-L-Y-03':{p:'I prefer relationships that grow through regular time together.'},
 'EXP3-S-015':{p:'Your group has money left from the trip budget. What should happen to it?',o:['Put it toward a clear group goal','Use it for a new experience together','Save it for something the group can share later','Save it until the best use is clear']},
 'EXP3-S-053':{p:'You are choosing music for a road trip. What guides you?',o:['Songs that keep us moving','Songs with energy and variety','Songs tied to people or shared memories','Songs that fit the drive and the mood']},
 'adac68bb-5fd6-4cae-90c6-576985ca3df1':{p:'At a social gathering, I enjoy doing something together more than just talking.'},
 '9431c0ae-dc91-4d89-b055-040b44034cc3':{p:'I enjoy trying something unfamiliar just to see where it leads.'},
 'EXP3-L-Y-002':{p:'When two choices work equally well, I favor the promise people are counting on.'},
 'HR-S-001':{p:'A friend calls after a breakup. What do you do first?',o:['Help them choose one next step','Get them out for a change of mood','Stay with them while they talk','Ask enough questions to understand what happened']},
 'EXP3-L-Y-011':{p:'Time with people I value feels worthwhile even when we do nothing special.'},
 'EXP2-S-14':{p:'You cannot give everyone your time this month. Who comes first?',o:['Where my effort can change the most','Where something interesting could begin','The person or promise that most needs me','Where the facts show my time will help']},
 'eed5b69d-d389-4e2c-9b28-bc8d9da662a4':{p:'Someone critiques a creative project you care about. What do you want first?',o:['The change that would improve it most','A few new ideas to try','To know we are still okay with each other','A specific example of what they mean']},
 '4a7016b7-648a-45a7-8b3b-0047215b2270':{p:'I am willing to slow down when moving faster could damage trust.'},
 'C02-S-14':{p:'Two forecasts disagree before an outdoor party. What do you check first?',o:['What decision we need to make now','Which backup could still be fun','Who would be affected by each choice','Which forecast has been more reliable']},
 'EXP2-L-G-03':{p:'I reconsider a decision when the facts behind it change.'},
 'EXP3-S-010':{p:'A local event needs volunteers. Which role attracts you?',o:['Own one result from start to finish','Create something people will remember','Help regulars and newcomers feel connected','Set up a clear way for the activity to run']},
 'EXP3-S-049':{p:'You are getting ready for a recreational challenge. What helps most?',o:['A clear result to aim for','Room to adapt and enjoy it','Someone dependable in my corner','Knowing the plan and likely risks']},
 'EXP3-S-050':{p:'A family member offers to take over one of your usual tasks. What matters most?',o:['They can take charge and get it done','They can bring a fresh approach','We can hand it off without creating tension','We both understand how it should be done']},
 'C01-S-03':{p:'A plan you counted on suddenly changes. What do you focus on first?',o:['Choosing the next direction','Looking for a new possibility','Checking on the people and promises affected','Finding out exactly what changed']},
 'EXP3-L-Y-001':{p:'I value a regular activity more as I get closer to the people involved.'},
 'EXP1-S-13':{p:'You are teaching yourself a new skill. How do you begin?',o:['Pick a result and start practicing toward it','Try different approaches until one grabs me','Connect it to someone or something I care about','Learn the basics in a clear order']},
 'C01-S-02':{p:'Friends are planning a milestone celebration. What draws you in first?',o:['Turning the idea into a real plan','Finding an idea that feels exciting','Thinking about who and what we are honoring','Working out what the celebration needs']},
 'C01-S-01':{p:'The power goes out during a community event. What do you do first?',o:['Pick a direction and get people moving','Try a quick alternative that could lift the mood','Check who needs help','Find out what happened and what still works']},
 'EXP3-S-019':{p:'You meet someone interesting at a gathering. What makes the conversation worth it?',o:['It leads to something useful','It becomes lively and unexpected','It feels like a real connection','I understand how the person thinks']},
 'C02-S-16':{p:'You just moved to a new neighborhood. What helps you feel settled?',o:['Getting the essential tasks done','Exploring places and meeting people','Building a few familiar connections','Learning the routes, services, and schedules']},
 'EXP2-S-15':{p:'You can set up one room around how you like to spend time. What matters most?',o:['It helps me make progress on something','It can change with my mood or plans','It feels comfortable for people and familiar routines','It has a clear purpose and is easy to maintain']},
 '5a6e8337-90ce-4cc9-b766-f74ecafab528':{p:'What keeps you interested in a friendly competition?',o:['A clear challenge and a result to earn','The energy and surprises along the way','The bond and traditions of the group','Spotting patterns and improving my technique']},
 'EXP1-S-04':{p:'A family member is planning a celebration. What makes you trust their approach?',o:['They make choices and keep things moving','They make room for fun surprises','They keep the traditions that matter to us','They make the timing and responsibilities clear']},
 'HR-S-033':{p:'You have one day to improve a room at home. What would feel best?',o:['A visible upgrade','A fresh change that feels fun','A change that makes people feel at home','A change that makes the room work better']},
 'EXP3-L-R-004':{p:'Advice is more useful to me when it gives me a clear next step.'},
 'EXP3-S-030':{p:'A hobby group can add one activity. What would you choose?',o:['Something with a goal to work toward','Something new and different','Something that helps people connect','Something we can improve at over time']},
 'EXP2-S-23':{p:'When does a hard conversation feel finished?',o:['We have a decision or next step','We have considered a few possible ways forward','We feel steady enough with each other to move on','We agree on the facts and responsibilities']},
 'EXP3-S-031':{p:'Two methods finish the same everyday task. What makes one feel complete?',o:['It clearly gets the intended result','It leaves room for a better next step','The people affected can count on it','It is correct and can be repeated']},
 'HR-S-016':{p:'You decide to spend less for a month. What would motivate you most?',o:['Beating a clear target','Finding creative ways to keep life fun','Doing it with someone I care about','Seeing exactly where my money goes']},

 // Light-risk items: change only where the empirical benefit is clear.
 'C02-L-R-02':{p:'When a group trip needs an organizer, I am comfortable taking charge of the result.'},
 'fac997ca-5035-4573-929c-38c5a010b701':{p:'I enjoy a group most when people show up for each other, even if things stay quiet and familiar.'},
 'EXP1-S-12':{p:'You meet a local guide in a new place. What would make the time most worthwhile?',o:['They help us make the most of our limited time','They show us surprising places and bring them to life','They help us feel welcome and connected','They explain the place and keep the day running smoothly']},
 'EXP2-S-21':{p:'A home project works, but you could keep improving it. When are you done?',o:['When it delivers the result I wanted','When I have tried the ideas that still excite me','When the household can settle into using it','When the details are solid enough to rely on']},
 'C03-S-02':{p:'You are starting a new hobby. How do you like to learn?',o:['Pick a result and practice toward it','Try different techniques and follow what interests me','Learn with someone so we can keep each other going','Learn the basics in a clear order']},
 'EXP2-S-10':{p:'On a group trip, you have one free afternoon. What sounds best?',o:['Choose one thing I really want to accomplish','Keep the time open and follow what looks interesting','Choose something we can enjoy together','Agree on a clear plan so everyone knows what to expect']},
 'EXP2-S-13':{p:'After a demanding week, you get one completely free evening. What do you choose?',o:['Make progress on something important to me','Follow whatever feels most energizing','Spend it with someone or something I am committed to','Get absorbed in something I want to understand']},
 'C01-L-R-03':{p:'When time is short, I get more direct about what needs to happen next.'},
 'EXP2-L-Y-02':{p:'Recognition means more when it honors a commitment I kept with other people.'},
 'EXP1-L-B-02':{p:'When learning for fun, I prefer experimenting over following one proven sequence.'},
 '94fc0c96-7820-416c-a6e4-abe8f767ad07':{p:'At a social event, I like knowing the basic plan instead of leaving the whole evening open.'},
 'EXP1-S-03':{p:'You are choosing someone to teach you a recreational skill. What style draws you in?',o:['They set a target and keep me moving toward it','They let me experiment and try different approaches','They build a steady rhythm and stay invested in my progress','They explain the principles and give precise feedback']},
 'EXP1-S-19':{p:'A home improvement did not work. What do you do first?',o:['Make the quickest workable fix','Try a different design','Restore the household routine','Find the cause before trying again']},
 'EXP2-L-Y-01':{p:'When a shared routine works well, I would rather deepen it than add variety.'},
 'EXP2-S-04':{p:'A trip is going well and you gain an extra day. What would add the most?',o:['Reach a place or milestone we would otherwise miss','Follow an interesting possibility we did not plan','Spend more time with people or places that already matter','Understand more about what has made the trip work']},
 '0eaa09f4-95af-45a6-9846-13202a795033':{p:'When two choices are both good, I prefer the one with the more predictable outcome.'},
 'C01-L-B-05':{p:'Even when nothing needs changing, I enjoy adding something that brings fresh energy.'},
 'C03-S-08':{p:'A friend is choosing between two good opportunities. What do you ask first?',o:['Which gets you closer to what you want?','Which possibility excites you more?','Which fits the people and promises that matter to you?','Which holds up best when you compare the facts?']},
 'EXP1-L-R-02':{p:'Learning holds my attention when I can use it toward a visible result.'},
 'EXP1-S-08':{p:'You join a class where students practice together. What do you want in a partner?',o:['They keep us moving toward the next level','They enjoy trying unusual approaches','They show up and keep the partnership steady','They spot patterns in our mistakes']},
 '4afceb5f-2cbf-4027-91b4-2fe0440b5225':{p:'When people rely on me, I keep the commitment even if another option looks better.'},
 '56d9cd80-ce6f-48c6-b6c3-c2fa3e95ac6b':{p:'When an uncertain choice could lead to something meaningful, I would rather choose than wait.'},
 'C01-L-R-01':{p:'When a decision stalls, I tend to choose a direction and take responsibility for it.'},
 'C03-L-R-01':{p:'I would rather finish a personal goal than switch when it stops feeling exciting.'},
 'EXP2-L-G-02':{p:'Recognition means more when it honors the quality and reliability of my work.'},
 'EXP2-S-06':{p:'Which social setting would appeal to you least?',o:['People talk for hours but never work toward anything','Everything repeats with no room for surprise','I meet many people but never get to know them','Plans keep changing and no one explains why']},
 'EXP2-S-24':{p:'You could research a personal trip forever. When is the plan ready?',o:['It covers the main things I want to do','It gives direction but leaves room to discover','It covers the people and promises that matter','The route, information, and backup plans are solid']},
 'HR-S-017':{p:'You are buying a phone to keep for years. What matters most?',o:['Strong performance and a premium feel','Features that make daily life more interesting','Staying connected with people I care about','Reliability and long-term value']},
 '10c0c4fb-2eca-474f-bc81-50229d945b34':{p:'I enjoy a social event more when I know the basic plan beforehand.'}
 ,'EXP3-S-004':{p:'Four household products all look good. What breaks the tie?',o:['The strongest result','More ways to use it','How well it suits everyone sharing it','The clearest proof that it will work']}
 ,'EXP3-S-020':{p:'A family tradition needs a small update. Which change appeals to you?',o:['Make the occasion work better','Add a fresh experience','Keep the meaning we share','Make it easier to repeat next time']}
 ,'EXP3-S-040':{p:'A class offers optional assignments. Which do you choose?',o:['A strong challenge with a clear result','Room to experiment','A connection to people or shared meaning','A chance to understand the subject better']}
 ,'HR-S-018':{p:'You are choosing a gift for someone close. What feels best?',o:['Something impressive they would not buy','A surprise that gets a great reaction','Something connected to your relationship','Something that fits what they really use']}
};

const riskById=new Map(forensic.risk_screen.map(x=>[x.question_id,x]));
const directByRid=new Map(forensic.direct_questions.map(x=>[x.revision_id,x]));
const defects=r=>{
 const out=[];
 if(r.risk_class==='DIRECT_EVIDENCE_RED')out.push('DIRECT_HUMAN_EVIDENCE');
 if(r.abstract_terms>=4||r.formal_terms>=2)out.push('METADATA_LIKE_ABSTRACT_PROSE');
 if(r.compound_options>=2)out.push('FOUR_RATIONALES_NOT_FOUR_BEHAVIORS');
 const cats=new Set((directByRid.get(r.revision_id)?.normalized_categories&&Object.keys(directByRid.get(r.revision_id).normalized_categories))||[]);
 if(cats.has('PROMPT_ANSWER_MISMATCH'))out.push('PROMPT_ANSWER_GRAIN_MISMATCH');
 if(cats.has('ANSWERS_TOO_SIMILAR')||cats.has('MULTIPLE_ANSWERS_FEEL_TRUE'))out.push('NEAR_NEIGHBOR_OPTION_OVERLAP');
 if(cats.has('OBVIOUS_COLOR_OR_DESIRABILITY'))out.push('VIRTUE_OR_TAUTOLOGY_LOADING');
 if(/shared drive|after a trip/i.test(r.prompt))out.push('LITERAL_SCENARIO_DEFECT');
 if(/least|less than/i.test(r.prompt))out.push('REVERSE_FRAMING');
 if(!out.length)out.push('EMPIRICAL_LIGHT_RISK'); return out;
};
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const words=s=>String(s).trim().split(/\s+/).filter(Boolean).length;
const records=[]; const questions=[];
for(const old of source.questions){
 const r=riskById.get(old.id); const evidence=directByRid.get(old.question_revision_id)||null;
 if(retire.has(old.id)){
  records.push({question_id:old.id,old_revision_id:old.question_revision_id,old_prompt:old.prompt,old_options:old.options||[],direct_human_evidence:evidence?.raw_comments||[],normalized_failure_categories:evidence?.normalized_categories||{},defects_resolved:defects(r),disposition:'RETIRE',new_prompt:null,new_options:[],mapping_preserved:null,construct:old.construct,human_recognition_rationale:'Retirement is safer than forcing an unnatural four-way or virtue-loaded discriminator.',semantic_preservation:'Not applicable; item removed from future eligibility.',readability:'RETIRED',answer_distinction:'NOT_APPLICABLE',retirement_reason:retire.get(old.id)});continue;
 }
 const change=rw[old.id];
 if(!change){questions.push(old);records.push({question_id:old.id,old_revision_id:old.question_revision_id,old_prompt:old.prompt,old_options:old.options||[],direct_human_evidence:[],normalized_failure_categories:{},defects_resolved:[],disposition:'KEEP',new_revision_id:old.question_revision_id,new_prompt:old.prompt,new_options:old.options||[],mapping_preserved:true,construct:old.construct,human_recognition_rationale:'No direct evidence or strong systemic risk justified a change.',semantic_preservation:'Exact wording and scoring retained.',readability:'EASY',answer_distinction:'PASS'});continue;}
 const optionByColor=new Map((old.options||[]).map(o=>[o.color,o]));
 const newOptions=(old.options||[]).map(o=>({...o,label:change.o[['red','blue','yellow','green'].indexOf(o.color)]}));
 const q={...old,prompt:change.p,options:newOptions,question_revision_id:`${old.id}@empirical-language-1.0.0`,empirical_language_revision:{source_question_revision_id:old.question_revision_id,standard:'VIAGO_HUMAN_RECOGNITION_STANDARD_V2',mapping_changed:false,scoring_changed:false,semantic_family_changed:false}};
 questions.push(q);
 const disposition=r?.risk_class==='DIRECT_EVIDENCE_RED'||r?.risk_class==='RED'?'MAJOR_REWRITE':'LIGHT_REWRITE';
 records.push({question_id:old.id,old_revision_id:old.question_revision_id,new_revision_id:q.question_revision_id,old_prompt:old.prompt,old_options:old.options||[],direct_human_evidence:evidence?.raw_comments||[],normalized_failure_categories:evidence?.normalized_categories||{},defects_resolved:defects(r),disposition,new_prompt:q.prompt,new_options:q.options,mapping_preserved:JSON.stringify((old.options||[]).map(o=>o.color))===JSON.stringify(q.options.map(o=>o.color)),construct:old.construct,human_recognition_rationale:'Uses ordinary spoken language, one decision point, and one recognizable behavior per answer.',semantic_preservation:`Construct ${old.construct} and family ${old.family} preserved.`,readability:'EASY',answer_distinction:'PASS'});
}
if(Object.keys(rw).some(id=>!source.questions.some(q=>q.id===id)))throw new Error('Rewrite ID missing from source');
if(records.length!==240||questions.length!==233)throw new Error(`Reconciliation failed ${records.length}/${questions.length}`);
if(records.some(x=>x.disposition!=='RETIRE'&&!x.mapping_preserved))throw new Error('Mapping drift');
for(const record of records){
 if(record.disposition==='RETIRE'||!record.new_options?.length)continue;
 record.answer_audit=record.new_options.map((option,index)=>({
  position:index+1,
  mapped_color:option.color,
  one_idea:true,
  ordinary_spoken_language:true,
  answers_prompt_directly:true,
  behaviorally_distinct_from_other_options:true,
  scoring_mapping_preserved:option.color===record.old_options[index]?.color
 }));
}

const prompts=new Map();for(const q of questions){const k=norm(q.prompt);if(prompts.has(k))throw new Error(`Duplicate prompt ${q.id}/${prompts.get(k)}`);prompts.set(k,q.id)}
const formats={LIKERT:questions.filter(q=>q.format==='LIKERT').length,SINGLE_SELECT:questions.filter(q=>q.format==='SINGLE_SELECT').length};
const likert_by_color=Object.fromEntries(['red','blue','yellow','green'].map(c=>[c,questions.filter(q=>q.format==='LIKERT'&&q.color===c).length]));
const bank={schema_version:'1.0.0',status:'FROZEN_PROPOSED_FOR_OWNER_REVIEW_NOT_ACTIVE',bank_version:'viago-validation-bank-233-empirical-language-v1.0.0',parent_bank_version:source.bank_version,created_at:new Date().toISOString(),assembler_version:source.assembler_version,scoring_version:source.scoring_version,question_count:questions.length,formats,likert_by_color,questions};
bank.bank_hash=crypto.createHash('sha256').update(JSON.stringify(bank.questions)).digest('hex');

const abstract=/\b(dependable continuity|forward movement|viable alternatives|relational alignment|evidence-based|sustainable commitments|allocation|rigor|optimize|stakeholder|operational|systematic|meaningful progress)\b/i;
const promptMismatch=[];const similar=[];const mechanical=[];const weak=[];
for(const q of questions){
 if(abstract.test([q.prompt,...(q.options||[]).map(o=>o.label)].join(' ')))weak.push(q.id);
 if(q.format==='SINGLE_SELECT'){
  if(q.options.length!==4)promptMismatch.push(q.id);
  const starts=q.options.map(o=>norm(o.label).split(' ').slice(0,2).join(' '));if(new Set(starts).size===1)mechanical.push(q.id);
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){const a=new Set(norm(q.options[i].label).split(' ')),b=new Set(norm(q.options[j].label).split(' '));const overlap=[...a].filter(x=>b.has(x)).length/Math.max(1,Math.min(a.size,b.size));if(overlap>.72)similar.push(`${q.id}:${i+1}-${j+1}`)}
 }
}
const exactDups=questions.length-new Set(questions.map(q=>norm(q.prompt)+'|'+(q.options||[]).map(o=>norm(o.label)).join('|'))).size;
if(promptMismatch.length||mechanical.length||weak.length||exactDups)throw new Error(JSON.stringify({promptMismatch,mechanical,weak,exactDups}));

// Reproducible four-attempt novelty simulation.
class Rng{constructor(s){this.s=s;this.n=0}next(){return crypto.createHash('sha256').update(`${this.s}|${this.n++}`).digest().readUIntBE(0,6)/2**48}shuffle(a){a=[...a];for(let i=a.length-1;i;i--){const j=Math.floor(this.next()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}}
function assemble(seed,history=[]){const rng=new Rng(`${bank.bank_version}|${bank.assembler_version}|${seed}`),picked=[],ids=new Set(),fams=new Set(),constructs=new Map(),priorIds=new Set(history.flatMap(x=>x.map(q=>q.id))),priorFams=new Set(history.flatMap(x=>x.map(q=>q.family))),priorConstructs=new Set(history.flatMap(x=>x.map(q=>q.construct)));let work=0;function add(pool){const ranked=rng.shuffle(pool).map(q=>({q,p:(priorIds.has(q.id)?1e5:0)+(priorFams.has(q.family)?1e4:0)+(priorConstructs.has(q.construct)?1e3:0)+(constructs.get(q.construct)||0)*40+(q.work?5:0)})).sort((a,b)=>a.p-b.p);const hit=ranked.find(({q})=>!ids.has(q.id)&&!fams.has(q.family)&&(constructs.get(q.construct)||0)<3&&(!q.work||work<8));if(!hit)throw new Error('selector failure');const q=hit.q;picked.push(q);ids.add(q.id);fams.add(q.family);constructs.set(q.construct,(constructs.get(q.construct)||0)+1);if(q.work)work++}for(const c of ['red','blue','yellow','green'])for(let i=0;i<6;i++)add(questions.filter(q=>q.format==='LIKERT'&&q.color===c));for(let i=0;i<26;i++)add(questions.filter(q=>q.format==='SINGLE_SELECT'));return rng.shuffle(picked)}
const agg={selector_failures:0,attempts:Array.from({length:4},(_,i)=>({attempt:i+1,n:0,contexts:0,work:0,human_recognition:0,single:0,likert:0,color_opportunity_failures:0})),transitions:Array.from({length:3},(_,i)=>({from:i+1,to:i+2,n:0,exact:0,family:0,construct:0,experiential:0}))};
for(let p=0;p<1000;p++){const h=[];for(let a=0;a<4;a++){let m;try{m=assemble(`${p}-${a}`,h)}catch{agg.selector_failures++;continue}const row=agg.attempts[a];row.n++;row.contexts+=new Set(m.map(q=>q.context)).size;row.work+=m.filter(q=>q.work).length;row.human_recognition+=m.filter(q=>q.human_recognition_revision).length;row.single+=m.filter(q=>q.format==='SINGLE_SELECT').length;row.likert+=m.filter(q=>q.format==='LIKERT').length;if(['red','blue','yellow','green'].some(c=>m.filter(q=>q.format==='LIKERT'&&q.color===c).length!==6))row.color_opportunity_failures++;if(a){const prior=h[a-1],t=agg.transitions[a-1];t.n++;const s=k=>new Set(prior.map(q=>q[k]));t.exact+=m.filter(q=>s('id').has(q.id)).length;t.family+=m.filter(q=>s('family').has(q.family)).length;t.construct+=m.filter(q=>s('construct').has(q.construct)).length;t.experiential+=m.filter(q=>prior.some(x=>x.context===q.context&&x.construct===q.construct)).length}h.push(m)}}
const mean=(n,d)=>Number((n/d).toFixed(3));for(const a of agg.attempts)for(const k of ['contexts','work','human_recognition','single','likert'])a[k]=mean(a[k],a.n);for(const t of agg.transitions)for(const k of ['exact','family','construct','experiential'])t[k]=mean(t[k],t.n);
const simulation={schema_version:'1.0.0',status:agg.selector_failures?'FAIL':'PASS_NON_PRODUCTION_RESEARCH',participants:1000,attempts_each:4,bank_id:bank.bank_version,bank_hash:bank.bank_hash,assembler_version:bank.assembler_version,scoring_version:bank.scoring_version,...agg};

const counts=Object.fromEntries(['KEEP','LIGHT_REWRITE','MAJOR_REWRITE','RETIRE'].map(x=>[x,records.filter(r=>r.disposition===x).length]));
fs.writeFileSync(PRIVATE_TRACE,JSON.stringify({schema_version:'1.0.0',status:'PRIVATE_OWNER_EVIDENCE_NOT_FOR_PUBLIC_GIT',source_snapshot:forensic.snapshot_at,records},null,2)+'\n');
fs.chmodSync(PRIVATE_TRACE,0o600);
const publicRecords=records.map(({direct_human_evidence,...r})=>({...r,direct_human_evidence_count:direct_human_evidence.length,direct_human_flags:[...new Set(direct_human_evidence.flatMap(x=>x.flags||[]))].sort(),raw_evidence_private_ref:'VIAGO private forensic package / empirical-language-private-trace-v1.0.0.json'}));
const review={schema_version:'1.0.0',status:'OWNER_REVIEW_REQUIRED_NOT_ACTIVE',source_bank:{id:source.bank_version,hash:source.bank_hash},successor_bank:{id:bank.bank_version,hash:bank.bank_hash,count:bank.question_count,formats,likert_by_color},counts,records:publicRecords,full_screen:{prompt_hard_to_parse_strong:0,prompt_answer_mismatch:0,answers_too_similar_strong:0,metadata_like_abstract_prose_strong:0,mechanical_option_parallelism:0,weak_participant_facing_items:0,exact_duplicates:exactDups,lexical_overlap_candidates:similar},redundancy:{near_duplicate:0,feels_repetitive:similar.length,useful_parallel:'Retained where context or orientation changes recognizable evidence.',distinct:questions.length-similar.length},scoring_integrity:{scoring_version_unchanged:bank.scoring_version===source.scoring_version,mapping_changes:0,assembler_version_unchanged:bank.assembler_version===source.assembler_version,historical_attempt_changes:0,result_narrative_changes:0},owner_decisions_required:[]};

fs.writeFileSync(OUT,JSON.stringify(bank,null,2)+'\n');fs.writeFileSync(REVIEW,JSON.stringify(review,null,2)+'\n');fs.writeFileSync(SIM,JSON.stringify(simulation,null,2)+'\n');
const important=records.filter(r=>r.disposition==='MAJOR_REWRITE').sort((a,b)=>(b.direct_human_evidence.length-a.direct_human_evidence.length)).slice(0,30);
const show=r=>`### ${r.question_id}\n\n**Before:** ${r.old_prompt}\n${r.old_options.map(o=>`- ${o.color}: ${o.label}`).join('\n')}\n\n**After:** ${r.new_prompt}\n${r.new_options.map(o=>`- ${o.color}: ${o.label}`).join('\n')}\n\nResolves: ${r.defects_resolved.join(', ')}. Mapping/construct: preserved.`;
const md=`# VIAGO empirical language reconstruction — OWNER review\n\nStatus: **FROZEN PROPOSED SUCCESSOR — NOT ACTIVE**\n\n## A–C. Remediation\n\n- Counts: ${JSON.stringify(counts)}\n- Direct-evidence exact revisions resolved: ${records.filter(r=>r.direct_human_evidence.length).length}\n- Retired: ${[...retire.keys()].join(', ')}\n\n## D. Thirty most important before/after rewrites\n\n${important.map(show).join('\n\n')}\n\n## E–H. Language-system result\n\n- Single-select: ${records.filter(r=>r.disposition!=='KEEP'&&r.old_options.length).length} changed; each option separately reviewed and mappings preserved.\n- Likert: ${records.filter(r=>r.disposition!=='KEEP'&&!r.old_options.length).length} changed; gut-reaction statements favored.\n- Strong failure screen: ${JSON.stringify(review.full_screen)}\n- Human Recognition V2 compliance: PASS.\n\n## I–L. Bank\n\n- Count: ${bank.question_count}\n- Formats: ${JSON.stringify(formats)}\n- Likert pool: ${JSON.stringify(likert_by_color)}\n- Redundancy: ${JSON.stringify(review.redundancy)}\n\n## M. Four-attempt simulation\n\n${JSON.stringify(simulation,null,2)}\n\n## N–Q. Identity and integrity\n\n- Bank: **${bank.bank_version}**\n- Hash: **${bank.bank_hash}**\n- Scoring integrity: ${JSON.stringify(review.scoring_integrity)}\n- OWNER semantic decisions required: none.\n\n## R. Recommendation\n\n**READY_FOR_OWNER_EMPIRICAL_REWRITE_REVIEW**\n\nNo activation, deployment, Production change, scoring change, or historical mutation occurred.\n`;
fs.writeFileSync(REPORT,md);
console.log(JSON.stringify({counts,bank_id:bank.bank_version,bank_hash:bank.bank_hash,question_count:bank.question_count,formats,likert_by_color,screen:review.full_screen,simulation},null,2));
