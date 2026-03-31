# Como ligar o Supabase no MOS valendo

## 1. Criar um projeto

No Supabase:

- crie um projeto novo
- copie a `Project URL`
- copie a `anon public key`

## 2. Criar as tabelas

No SQL Editor:

1. rode o conteúdo de [/Users/npl0/Documents/APPs/MOS valendo/supabase/schema.sql](/Users/npl0/Documents/APPs/MOS%20valendo/supabase/schema.sql)
2. depois rode o conteúdo de [/Users/npl0/Documents/APPs/MOS valendo/supabase/policies.sql](/Users/npl0/Documents/APPs/MOS%20valendo/supabase/policies.sql)

## 3. Configurar o frontend

Abra [/Users/npl0/Documents/APPs/MOS valendo/index.html](/Users/npl0/Documents/APPs/MOS%20valendo/index.html) e preencha:

```html
<script>
  window.MOS_SUPABASE_CONFIG = {
    url: "https://SEU-PROJETO.supabase.co",
    anonKey: "SUA_ANON_PUBLIC_KEY",
  };
</script>
```

## 4. O que já funciona depois disso

Com essa configuração, o MOS valendo já fica preparado para:

- criar conta
- entrar com e-mail e senha
- sair
- recuperar senha
- salvar perfil
- salvar medidas
- salvar suplementos
- salvar hidratação
- salvar plano alimentar
- salvar comida consumida
- salvar feedback

## 5. Próxima camada

Depois da auth funcionando, esta é a base de dados que o app já usa:

- `profiles`
- `measure_entries`
- `consumed_meals`
- `consumed_food_items`
- `plan_meals`
- `plan_food_items`
- `supplements`
- `water_entries`
- `feedback_entries`

## 6. Se você já tinha rodado o schema antes

Se o projeto Supabase foi criado usando uma versão anterior do schema, confira se a tabela `profiles` já tem também estas colunas:

- `plan_focus`
- `plan_notes`

Se ainda não tiver, rode novamente o conteúdo atualizado de [/Users/npl0/Documents/APPs/MOS valendo/supabase/schema.sql](/Users/npl0/Documents/APPs/MOS%20valendo/supabase/schema.sql).

## Observação

Enquanto o Supabase não estiver configurado, a interface continua em modo de demonstração para não bloquear a navegação.
