export const supabaseConfig = {
  url: "https://YOUR_PROJECT.supabase.co",
  anonKey: "YOUR_PUBLIC_ANON_KEY",
};

export function getSupabaseBootstrapNote() {
  return {
    message: "Este arquivo é apenas um exemplo de configuração para o MOS valendo.",
    nextStep: "Quando criarmos o projeto real, esta config deve ser substituída por uma integração com o cliente do Supabase.",
  };
}
