import {
  calculateMosExecutionSignals,
  calculateMosState,
  generateMosMainMessage,
  generateMosOperationalInsight,
  generateMosShortRecommendation,
} from "./mos-brain.js";

export const MOS_BRAIN_PROVIDER = {
  RULES: "rules",
  HYBRID_AI: "hybrid-ai",
};

export function buildMosBrainInput(input = {}) {
  return {
    caloriesConsumed: toNumber(input.caloriesConsumed),
    calorieTarget: toNumber(input.calorieTarget),
    waterConsumedMl: toNumber(input.waterConsumedMl),
    waterTargetMl: toNumber(input.waterTargetMl),
    trainingDone: Boolean(input.trainingDone),
  };
}

function evaluateWithRules(input) {
  const normalizedInput = buildMosBrainInput(input);
  const signals = calculateMosExecutionSignals(normalizedInput);
  const state = calculateMosState(normalizedInput);
  return {
    provider: MOS_BRAIN_PROVIDER.RULES,
    input: normalizedInput,
    signals,
    state,
    output: {
      mainMessage: generateMosMainMessage(state),
      recommendation: generateMosShortRecommendation(state),
      insight: generateMosOperationalInsight(signals),
    },
  };
}

export function createMosBrainEngine(provider = MOS_BRAIN_PROVIDER.RULES) {
  return {
    provider,
    evaluate(input = {}) {
      // Future-ready: this switch is the seam where a hybrid AI engine can enter later.
      if (provider === MOS_BRAIN_PROVIDER.HYBRID_AI) {
        return evaluateWithRules(input);
      }
      return evaluateWithRules(input);
    },
  };
}

const defaultMosBrainEngine = createMosBrainEngine();

export function evaluateMosBrain(input = {}, engine = defaultMosBrainEngine) {
  return engine.evaluate(input);
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
