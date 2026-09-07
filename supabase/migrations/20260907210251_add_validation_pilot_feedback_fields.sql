begin;

alter table viago_quiz.validation_feedback
  add column if not exists overthinking_score int null
    check (overthinking_score between 1 and 5),
  add column if not exists answer_distinctness_score int null
    check (answer_distinctness_score between 1 and 5);

comment on column viago_quiz.validation_feedback.overthinking_score is
  'Participant agreement, 1-5: I had to overthink too many questions.';
comment on column viago_quiz.validation_feedback.answer_distinctness_score is
  'Participant agreement, 1-5: The answer choices usually felt clearly different.';

notify pgrst, 'reload schema';
commit;
