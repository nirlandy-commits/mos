# MOS valendo

Versão do MOS preparada para evoluir de protótipo navegável para app real, mantendo custo zero no começo.

## Objetivo

Esta pasta existe para a gente:

- preservar o protótipo atual em `/Users/npl0/Documents/APPs/MOS`
- construir a versão real em paralelo
- migrar aos poucos para autenticação e banco reais

## Stack recomendada

- Frontend: React
- Persistência local de transição: `localStorage`
- Backend sem custo inicial: Supabase free
- Auth: Supabase Auth
- Banco: Postgres do Supabase
- Deploy futuro: Vercel ou GitHub Pages com adaptação do build

## Estrutura inicial

- [/Users/npl0/Documents/APPs/MOS valendo/index.html](/Users/npl0/Documents/APPs/MOS%20valendo/index.html): base atual copiada do protótipo
- [/Users/npl0/Documents/APPs/MOS valendo/src/main.js](/Users/npl0/Documents/APPs/MOS%20valendo/src/main.js): interface atual
- [/Users/npl0/Documents/APPs/MOS valendo/docs/arquitetura.md](/Users/npl0/Documents/APPs/MOS%20valendo/docs/arquitetura.md): arquitetura da versão real
- [/Users/npl0/Documents/APPs/MOS valendo/docs/supabase-setup.md](/Users/npl0/Documents/APPs/MOS%20valendo/docs/supabase-setup.md): passo a passo de configuração do Supabase
- [/Users/npl0/Documents/APPs/MOS valendo/supabase/schema.sql](/Users/npl0/Documents/APPs/MOS%20valendo/supabase/schema.sql): tabelas iniciais
- [/Users/npl0/Documents/APPs/MOS valendo/supabase/policies.sql](/Users/npl0/Documents/APPs/MOS%20valendo/supabase/policies.sql): políticas de acesso por usuário
- [/Users/npl0/Documents/APPs/MOS valendo/src/lib/auth.js](/Users/npl0/Documents/APPs/MOS%20valendo/src/lib/auth.js): integração de autenticação real
- [/Users/npl0/Documents/APPs/MOS valendo/src/lib/supabase.example.js](/Users/npl0/Documents/APPs/MOS%20valendo/src/lib/supabase.example.js): exemplo de configuração

## Próximos passos

1. Criar projeto no Supabase
2. Rodar `schema.sql`
3. Rodar `policies.sql`
4. Configurar URL e anon key no `index.html`
5. Validar login, cadastro, logout e recuperação
6. Migrar dados por domínio:
   - perfil
   - medidas
   - comida
   - plano
   - água
   - suplementos

## Observação

O app desta pasta ainda está usando a interface do protótipo como base. A ideia não é reconstruir tudo do zero agora, e sim usar o que já está pronto para acelerar a versão real.
