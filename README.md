# Financeiro — Plataforma SaaS de Análise de Investimentos

Plataforma profissional para análise inteligente de investimentos na bolsa brasileira.

## Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS + Shadcn UI
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
- **IA**: OpenRouter (modelo configurável pelo admin)
- **Market Data**: BRAPI (provider plugável, com cache obrigatório)
- **Estrutura**: Monorepo com pnpm workspaces

## Setup Local

### Pré-requisitos

- Node.js 18+ (recomendado 20 LTS)
- pnpm (instalar com `npm install -g pnpm`)
- Supabase CLI (instalar com `npm install -g supabase`)

### Instalação

1. **Clone o repositório e instale dependências**

```bash
cd financas
pnpm install
```

2. **Configure as variáveis de ambiente**

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais (já preenchidas com o projeto Supabase):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY` (não é obrigatório localmente, pode ser deixado vazio ou com placeholder)

3. **Linque o projeto Supabase remoto** (já foi criado em produção)

```bash
supabase link --project-ref vfglcvmcsiwvqtkpjchl
```

Quando solicitado, forneça a senha do projeto: `WnAi3z1zNbYp81Ef`

4. **Aplique as migrations ao banco remoto**

```bash
supabase db push
```

Isso aplicará as migrations em `supabase/migrations/` ao projeto Supabase remoto.

5. **Inicie o servidor de desenvolvimento**

```bash
pnpm dev
```

O frontend estará em `http://localhost:5173`.

## Estrutura do Projeto

```
financas/
├── apps/
│   └── web/                     # Frontend React + Vite + TypeScript
│       ├── src/
│       │   ├── main.tsx         # Entry point
│       │   ├── App.tsx          # Componente raiz
│       │   └── index.css        # Tailwind styles
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── package.json
├── supabase/
│   ├── migrations/              # SQL migrations (versionadas)
│   ├── functions/               # Edge Functions (uma por domínio)
│   └── config.toml              # Configuração do projeto Supabase
├── packages/
│   └── shared-types/            # Tipos compartilhados (gerar com `supabase gen types`)
├── pnpm-workspace.yaml          # Configuração de workspaces
├── .env.example                 # Variáveis de ambiente (template)
├── .gitignore
└── README.md                    # Este arquivo
```

## Desenvolvimento

### Comandos principais

```bash
pnpm dev              # Inicia o servidor de desenvolvimento (frontend)
pnpm build            # Build do frontend para produção
pnpm lint             # ESLint nos arquivos do projeto
pnpm typecheck        # Verifica tipos TypeScript
```

### Trabalhando com Supabase

```bash
supabase status                 # Status do projeto linkado
supabase db push                # Aplicar migrations
supabase db pull                # Baixar schema remoto como migration
supabase gen types              # Gerar tipos TypeScript baseado no schema
supabase functions new <name>   # Criar nova Edge Function
```

## Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Chave pública do Supabase | ✅ |
| `OPENROUTER_API_KEY` | Chave da API OpenRouter | ❌ (será configurada no admin) |
| `NODE_ENV` | Ambiente (development/production) | ❌ |

## Fases de Implementação

A implementação segue plano faseado (ver [plano completo](./PLAN.md)):

- **Fase 0** ✅ Setup de projeto e infraestrutura
- **Fase 1** Auth + RBAC + schema base
- **Fase 2** Admin: settings/branding/usuários/auditoria
- **Fase 3** MarketData (BRAPIProvider + cache)
- **Fase 4** Carteiras + DataSources (CRUD)
- **Fase 5** Importador Investidor10 (texto colado)
- **Fase 6** Dashboard
- **Fase 7** IA / OpenRouter
- **Fase 8** Hardening de segurança

## Roadmap

- [x] Fase 0: Setup monorepo, Vite, Supabase linkado, migrations base
- [ ] Fase 1: Auth + RBAC
- [ ] Fases 2-8: Funcionalidades principais

## Segurança

- Todas as chaves sensíveis (OpenRouter, BRAPI) são armazenadas no Supabase (via `.env` servidor, Edge Functions ou Vault)
- Nenhuma chave é exposta ao client (frontend)
- RLS (Row Level Security) ativado em todas as tabelas de dados do usuário
- Auditoria de todas as ações administrativas

## Contato

Para dúvidas ou contribuições, contate Fernando Lino (fernandoflino95@gmail.com).

## Licença

Privado (SaaS).
