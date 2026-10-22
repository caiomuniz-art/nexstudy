type DbLike = { message?: string; code?: string };

export function mapDbError(error: DbLike) {
  const message = error.message ?? "";
  const code = error.code ?? "";
  if (message.includes("sobrepõe")) return "Este horário se sobrepõe a outra aula no mesmo dia.";
  if (message.includes("não pertence")) return "A matéria selecionada não pertence à sua conta.";
  if (message.includes("Não autenticado")) return "Sua sessão expirou. Entre novamente.";
  if (message.includes("identificador do perfil")) return "Não é permitido alterar o identificador do perfil.";
  if (code === "42501" || message.toLowerCase().includes("row-level security") || message.toLowerCase().includes("permission denied")) {
    return "Você não tem permissão para alterar este registro.";
  }
  if (code === "23514") return "Algum campo não atende às regras de validação.";
  if (code === "23505") return "Este registro entra em conflito com outro já salvo.";
  if (code === "42P01" || code === "PGRST205" || message.toLowerCase().includes("does not exist") || message.includes("schema cache")) {
    return "Não foi possível carregar os dados. Tente de novo.";
  }
  if (message.toLowerCase().includes("jwt") || code === "PGRST301") {
    return "Sua sessão expirou. Entre novamente.";
  }
  if (message.toLowerCase().includes("fetch") || message.toLowerCase().includes("network")) {
    return "Não foi possível conectar. Verifique a rede e tente de novo.";
  }
  return "Não foi possível concluir a operação. Tente novamente.";
}

export function mapAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login")) return "Não foi possível entrar. Confira os dados e tente de novo.";
  if (normalized.includes("email not confirmed")) return "A conta ainda não está liberada para entrar.";
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return "Já existe uma conta com estes dados.";
  }
  if (normalized.includes("password")) return "A sequência não atende às regras.";
  if (normalized.includes("rate") || normalized.includes("too many")) {
    return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
  }
  if (normalized.includes("network") || normalized.includes("fetch") || normalized.includes("failed to fetch")) {
    return "Não foi possível conectar ao serviço de autenticação.";
  }
  if (normalized.includes("reauth") || normalized.includes("recent")) {
    return "Por segurança, entre novamente e repita a troca de senha.";
  }
  return "Não foi possível concluir a autenticação. Tente novamente.";
}
