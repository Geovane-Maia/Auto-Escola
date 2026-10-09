/* =========================================================
   Auto Escola Quixelô — Schema do banco (Supabase/Postgres)
   Cole este arquivo inteiro no SQL Editor do Supabase e
   clique em "Run". As tabelas ficam acessíveis pela API REST
   com a chave anon (adequado para este projeto escolar).
   ========================================================= */

create table if not exists alunos (
  id text primary key,
  nome text not null,
  cpf text not null unique,
  turma text default '',
  ativo boolean default true,
  criado_em timestamptz default now()
);

create table if not exists admins (
  id text primary key,
  usuario text not null unique,
  senha text not null,
  nome text default 'Administrador',
  criado_em timestamptz default now()
);

create table if not exists perguntas (
  id text primary key,
  categoria text not null,
  enunciado text not null,
  alternativas jsonb not null,
  correta int not null,
  imagem text
);

create table if not exists resultados (
  id text primary key,
  cpf text not null,
  nome text default '',
  categoria text default '',
  acertos int not null,
  total int not null,
  data timestamptz default now()
);

/* Índices para buscas comuns */
create index if not exists idx_alunos_cpf on alunos (cpf);
create index if not exists idx_resultados_cpf on resultados (cpf);
create index if not exists idx_perguntas_categoria on perguntas (categoria);

/* Habilita RLS mas permite acesso público (leitura/escrita)
   pois o site usa a chave anon. Para produção maior, restrinja. */
alter table alunos enable row level security;
alter table admins enable row level security;
alter table perguntas enable row level security;
alter table resultados enable row level security;

create policy "acesso_publico_alunos" on alunos for all using (true) with check (true);
create policy "acesso_publico_admins" on admins for all using (true) with check (true);
create policy "acesso_publico_perguntas" on perguntas for all using (true) with check (true);
create policy "acesso_publico_resultados" on resultados for all using (true) with check (true);

/* Aluno padrão de teste — Administrador (CPF 111.111.111-11) */
insert into alunos (id, nome, cpf, turma, ativo)
values (gen_random_uuid()::text, 'Administrador', '11111111111', 'Administrador', true)
on conflict (cpf) do nothing;
