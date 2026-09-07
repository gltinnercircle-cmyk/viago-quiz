begin;

create table if not exists viago_quiz.validation_participant_identities (
  id uuid primary key default gen_random_uuid(),
  normalized_handle text not null,
  display_label text not null,
  reconnect_policy text not null check (reconnect_policy in ('EXACT_UNIQUE','COOKIE_OR_ADMIN_LINK')),
  created_at timestamptz not null default now(),
  created_by text not null,
  reason text not null
);

create unique index if not exists validation_participant_identities_normalized_unique
  on viago_quiz.validation_participant_identities (normalized_handle);

create table if not exists viago_quiz.validation_participant_identity_links (
  participant_id uuid primary key references viago_quiz.validation_participants(id),
  identity_id uuid not null references viago_quiz.validation_participant_identities(id),
  link_basis text not null,
  linked_at timestamptz not null default now(),
  linked_by text not null
);

alter table viago_quiz.validation_participant_identities enable row level security;
alter table viago_quiz.validation_participant_identity_links enable row level security;
revoke all on viago_quiz.validation_participant_identities,viago_quiz.validation_participant_identity_links from public,anon,authenticated;
grant select,insert,update on viago_quiz.validation_participant_identities to service_role;
grant select,insert on viago_quiz.validation_participant_identity_links to service_role;

create or replace function viago_quiz.validation_participant_link_immutable()
returns trigger language plpgsql set search_path='' as $fn$
begin
  raise exception 'Validation participant identity links are immutable';
end
$fn$;
revoke all on function viago_quiz.validation_participant_link_immutable() from public,anon,authenticated;
drop trigger if exists validation_participant_link_immutable_trigger on viago_quiz.validation_participant_identity_links;
create trigger validation_participant_link_immutable_trigger before update or delete on viago_quiz.validation_participant_identity_links
for each row execute function viago_quiz.validation_participant_link_immutable();

do $guard$
begin
  if has_table_privilege('anon','viago_quiz.validation_participant_identities','SELECT,INSERT,UPDATE,DELETE')
    or has_table_privilege('authenticated','viago_quiz.validation_participant_identities','SELECT,INSERT,UPDATE,DELETE')
    or has_table_privilege('anon','viago_quiz.validation_participant_identity_links','SELECT,INSERT,UPDATE,DELETE')
    or has_table_privilege('authenticated','viago_quiz.validation_participant_identity_links','SELECT,INSERT,UPDATE,DELETE') then
    raise exception 'Validation participant identity data exposed to browser roles';
  end if;
end
$guard$;

notify pgrst,'reload schema';
commit;
