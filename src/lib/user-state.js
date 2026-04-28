import { createDemoMosState } from "../data/demo/app-demo-state.js";
import { createProfile } from "./profile.js";

export function createMosUserStateSeeds({
  localDemoMode = false,
  demoTodayKey,
  planImages = {},
}) {
  const defaultState = createDemoMosState({
    demoTodayKey,
    planImages,
  });

  const emptyUserState = {
    ...structuredClone(defaultState),
    auth: {
      registered: false,
      signedIn: false,
      email: "",
      password: "",
    },
    profile: createProfile(),
    feedbackEntries: [],
    appNotifications: [],
    measureEntries: [],
    consumedMeals: {},
    planMeals: [],
    supplements: [],
    trainingPlans: [],
    trainingHistory: [],
    water: {},
    waterHistory: {},
  };

  const initialState = localDemoMode ? defaultState : emptyUserState;
  const emptyMeasureEntry = {
    id: "measure-empty",
    date: demoTodayKey,
    weight: 0,
    height: 0,
    bodyFat: 0,
    muscleMass: 0,
    bodyWater: 0,
    metabolicAge: 0,
  };

  return {
    defaultState,
    emptyUserState,
    initialState,
    emptyMeasureEntry,
  };
}
