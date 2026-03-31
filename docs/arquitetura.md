# Arquitetura do MOS valendo

## Direção

O MOS valendo deve continuar com a mesma experiência principal do protótipo atual, mas com:

- autenticação real
- persistência por usuário
- histórico consistente
- estrutura mais fácil de manter

## Stack

### Fase 1

- React
- Supabase Auth
- Supabase Postgres
- `localStorage` apenas como apoio temporário de UX

### Fase 2

- reorganização por domínio
- componentes menores
- serviços por feature

## Domínios de dados

### 1. Perfil

- nome
- email
- cidade
- aniversário
- objetivo
- peso atual
- peso alvo
- altura
- idade
- meta calórica
- meta de água

### 2. Medidas

- peso
- gordura corporal
- massa muscular
- água corporal
- altura
- idade metabólica
- data da coleta

### 3. Comida

- refeições consumidas por dia
- alimentos por refeição
- quantidade
- calorias
- macros

### 4. Plano alimentar

- refeições do plano
- ingredientes do plano
- quantidades
- equivalências de substituição

### 5. Água

- registros por data
- volume em ml
- hora do registro

### 6. Suplementos

- nome
- categoria
- dose
- horário
- descrição

## Fluxo de autenticação recomendado

### Cadastro

- usuário cria conta com nome, e-mail e senha
- sistema cria registro em `profiles`

### Login

- autenticação por e-mail e senha
- sessão persistida pelo Supabase

### Logout

- encerrar sessão
- voltar para tela de login

### Recuperação de senha

- envio de link por e-mail via Supabase Auth

## Organização sugerida do frontend

### Estrutura futura

```text
src/
  app/
  components/
  features/
    auth/
    food/
    plan/
    water/
    supplements/
    profile/
    measures/
  lib/
  services/
  stores/
  utils/
```

## Ordem de implementação

### Etapa 1

- configurar Supabase
- auth real
- perfil real

### Etapa 2

- medidas reais
- água real

### Etapa 3

- refeições consumidas
- plano alimentar

### Etapa 4

- suplementos
- feedback
- melhorias de exportação e histórico

## Critério de sucesso

O MOS valendo está pronto quando:

- cada usuário vê apenas os próprios dados
- os registros persistem entre dispositivos
- login e logout funcionam de verdade
- comida, plano, água, suplementos e medidas usam banco real
