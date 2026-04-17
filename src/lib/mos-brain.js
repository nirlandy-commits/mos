export const MOS_STATE = {
  ON_TRACK: "ON_TRACK",
  ACIMA_CALORIA: "ACIMA_CALORIA",
  ABAIXO_CALORIA_EXTREMO: "ABAIXO_CALORIA_EXTREMO",
  SEM_DADOS: "SEM_DADOS",
  CONSISTENTE: "CONSISTENTE",
  INCONSISTENTE: "INCONSISTENTE",
  HIDRATACAO_BAIXA: "HIDRATACAO_BAIXA",
  HIDRATACAO_OK: "HIDRATACAO_OK",
  TREINO_FEITO: "TREINO_FEITO",
  TREINO_NAO_FEITO: "TREINO_NAO_FEITO",
};

export function calculateMosExecutionSignals(input = {}) {
  const calorieTarget = toNumber(input.calorieTarget);
  const caloriesConsumed = toNumber(input.caloriesConsumed);
  const waterTargetMl = toNumber(input.waterTargetMl);
  const waterConsumedMl = toNumber(input.waterConsumedMl);

  return {
    caloriesRemaining: Math.max(0, calorieTarget - caloriesConsumed),
    calorieTarget,
    caloriesConsumed,
    waterPercent: waterTargetMl > 0 ? Math.max(0, Math.min(1, waterConsumedMl / waterTargetMl)) : 0,
    waterConsumedMl,
    waterTargetMl,
    trainingDone: Boolean(input.trainingDone),
  };
}

export function generateMosOperationalInsight(signals = {}) {
  if (!signals.caloriesConsumed && !signals.waterConsumedMl && !signals.trainingDone) {
    return "Sem dados do dia ainda";
  }

  if (signals.caloriesRemaining > 0) {
    return "Você ainda tem margem hoje";
  }

  if (signals.waterPercent < 0.6) {
    return "Consumo de água abaixo do ideal";
  }

  if (!signals.trainingDone) {
    return "Nenhum treino registrado hoje";
  }

  return "Seu dia segue dentro do plano";
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasCalorieData(input) {
  return toNumber(input.caloriesConsumed) > 0 || toNumber(input.calorieTarget) > 0;
}

function getCalorieState(input) {
  const caloriesConsumed = toNumber(input.caloriesConsumed);
  const calorieTarget = toNumber(input.calorieTarget);

  if (!caloriesConsumed || !calorieTarget) {
    return MOS_STATE.SEM_DADOS;
  }

  const ratio = caloriesConsumed / calorieTarget;

  if (ratio > 1.1) {
    return MOS_STATE.ACIMA_CALORIA;
  }

  if (ratio < 0.5) {
    return MOS_STATE.ABAIXO_CALORIA_EXTREMO;
  }

  return MOS_STATE.ON_TRACK;
}

function getConsistencyState(input) {
  const caloriesConsumed = toNumber(input.caloriesConsumed);
  const calorieTarget = toNumber(input.calorieTarget);

  if (!caloriesConsumed || !calorieTarget) {
    return MOS_STATE.SEM_DADOS;
  }

  const ratio = caloriesConsumed / calorieTarget;
  return ratio >= 0.8 && ratio <= 1.1 ? MOS_STATE.CONSISTENTE : MOS_STATE.INCONSISTENTE;
}

function getHydrationState(input) {
  const waterConsumedMl = toNumber(input.waterConsumedMl);
  const waterTargetMl = toNumber(input.waterTargetMl);

  if (!waterConsumedMl || !waterTargetMl) {
    return MOS_STATE.SEM_DADOS;
  }

  return waterConsumedMl / waterTargetMl >= 0.75 ? MOS_STATE.HIDRATACAO_OK : MOS_STATE.HIDRATACAO_BAIXA;
}

function getTrainingState(input) {
  return input.trainingDone ? MOS_STATE.TREINO_FEITO : MOS_STATE.TREINO_NAO_FEITO;
}

export function calculateMosState(input = {}) {
  const calorie = getCalorieState(input);
  const consistency = getConsistencyState(input);
  const hydration = getHydrationState(input);
  const training = getTrainingState(input);

  const hasAnyData =
    hasCalorieData(input) ||
    toNumber(input.waterConsumedMl) > 0 ||
    Boolean(input.trainingDone);

  return {
    overall: hasAnyData ? calorie : MOS_STATE.SEM_DADOS,
    calorie,
    consistency,
    hydration,
    training,
  };
}

export function generateMosMainMessage(state = {}) {
  if (state.overall === MOS_STATE.SEM_DADOS) {
    return "Hoje ainda faltam dados para ler bem seu dia.";
  }

  if (state.calorie === MOS_STATE.ACIMA_CALORIA) {
    return "Você passou da meta e precisa ajustar o resto do dia.";
  }

  if (state.calorie === MOS_STATE.ABAIXO_CALORIA_EXTREMO) {
    return "Você está bem abaixo da meta e precisa ajustar com calma.";
  }

  if (state.hydration === MOS_STATE.HIDRATACAO_BAIXA) {
    return "Seu dia vai bem, mas sua água ainda está baixa.";
  }

  if (state.training === MOS_STATE.TREINO_FEITO && state.consistency === MOS_STATE.CONSISTENTE) {
    return "Seu dia está firme, e o treino reforçou esse ritmo.";
  }

  if (state.consistency === MOS_STATE.CONSISTENTE) {
    return "Seu dia está firme e segue no rumo certo.";
  }

  return "Seu dia já mostra sinais bons para ajustar o rumo.";
}

export function generateMosShortRecommendation(state = {}) {
  if (state.overall === MOS_STATE.SEM_DADOS) {
    return "Registre comida, água ou treino para o MOS ler seu dia.";
  }

  if (state.calorie === MOS_STATE.ACIMA_CALORIA) {
    return "Siga com refeições leves e olhe a meta antes de outro lanche.";
  }

  if (state.calorie === MOS_STATE.ABAIXO_CALORIA_EXTREMO) {
    return "Faça uma refeição completa para subir isso sem pressa.";
  }

  if (state.hydration === MOS_STATE.HIDRATACAO_BAIXA) {
    return "Suba a água aos poucos nas próximas horas.";
  }

  if (state.training === MOS_STATE.TREINO_NAO_FEITO) {
    return "Se der hoje, treine. Se não, ajuste bem o resto do dia.";
  }

  if (state.consistency === MOS_STATE.CONSISTENTE) {
    return "Mantenha essa linha nas próximas escolhas do dia.";
  }

  return "Siga registrando para o MOS ler melhor sua rotina.";
}
