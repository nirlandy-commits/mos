import { createProfile } from "../../lib/profile.js";

export function createDemoMosState({ demoTodayKey, planImages = {} }) {
  return {
    auth: {
      registered: true,
      signedIn: true,
      email: "",
      password: "",
    },
    profile: createProfile({
      name: "Nirlandy Leitão Pinheiro",
    }),
    feedbackEntries: [],
    appNotifications: [],
    measureEntries: [
      {
        id: "measure-2025-12-02",
        date: "2025-12-02",
        weight: 82.9,
        height: 170,
        bodyFat: 25.2,
        muscleMass: 58.7,
        bodyWater: 53.2,
        metabolicAge: 54,
      },
      {
        id: "measure-2026-01-06",
        date: "2026-01-06",
        weight: 77.7,
        height: 170,
        bodyFat: 24.5,
        muscleMass: 55.7,
        bodyWater: 53.8,
        metabolicAge: 50,
      },
    ],
    consumedMeals: {
      [demoTodayKey]: [
        {
          id: "meal-demo-breakfast",
          name: "Café da manhã",
          icon: "light_mode",
          description: "Ovos, pão integral e café sem açúcar",
          foods: [
            { id: "meal-demo-breakfast-1", name: "Ovos mexidos", quantity: "2 ovos", calories: 180, protein: 14, carbs: 2, fat: 12, benefit: "Ajuda a manter saciedade pela manhã." },
            { id: "meal-demo-breakfast-2", name: "Pão integral", quantity: "2 fatias", calories: 140, protein: 6, carbs: 24, fat: 2, benefit: "Entrega energia equilibrada para começar o dia." },
            { id: "meal-demo-breakfast-3", name: "Café", quantity: "200 ml", calories: 5, protein: 0, carbs: 1, fat: 0, benefit: "Ajuda na rotina matinal sem pesar na refeição." },
          ],
        },
        {
          id: "meal-demo-lunch",
          name: "Almoço",
          icon: "restaurant",
          description: "Frango, arroz, feijão e salada",
          foods: [
            { id: "meal-demo-lunch-1", name: "Peito de frango grelhado", quantity: "140g", calories: 230, protein: 34, carbs: 0, fat: 8, benefit: "Boa base de proteína para o plano." },
            { id: "meal-demo-lunch-2", name: "Arroz integral", quantity: "120g", calories: 150, protein: 3, carbs: 31, fat: 1, benefit: "Fornece energia com boa saciedade." },
            { id: "meal-demo-lunch-3", name: "Feijão", quantity: "80g", calories: 90, protein: 6, carbs: 15, fat: 1, benefit: "Ajuda no equilíbrio nutricional da refeição." },
            { id: "meal-demo-lunch-4", name: "Salada verde", quantity: "1 prato", calories: 25, protein: 1, carbs: 4, fat: 0, benefit: "Aumenta volume e leveza do prato." },
          ],
        },
        {
          id: "meal-demo-snack",
          name: "Lanche da tarde",
          icon: "eco",
          description: "Iogurte, banana e aveia",
          foods: [
            { id: "meal-demo-snack-1", name: "Iogurte natural", quantity: "1 pote", calories: 110, protein: 9, carbs: 8, fat: 4, benefit: "Ajuda a sustentar a tarde com praticidade." },
            { id: "meal-demo-snack-2", name: "Banana", quantity: "1 un", calories: 89, protein: 1, carbs: 23, fat: 0, benefit: "Boa opção de energia rápida antes da rotina seguir." },
            { id: "meal-demo-snack-3", name: "Aveia", quantity: "20g", calories: 78, protein: 3, carbs: 13, fat: 2, benefit: "Acrescenta fibra e mais saciedade ao lanche." },
          ],
        },
        {
          id: "meal-demo-dinner",
          name: "Jantar",
          icon: "dark_mode",
          description: "Tilápia, purê e legumes",
          foods: [
            { id: "meal-demo-dinner-1", name: "Tilápia grelhada", quantity: "160g", calories: 210, protein: 34, carbs: 0, fat: 7, benefit: "Fecha o dia com proteína leve e de boa digestão." },
            { id: "meal-demo-dinner-2", name: "Purê de batata", quantity: "130g", calories: 142, protein: 3, carbs: 27, fat: 3, benefit: "Traz conforto e energia sem pesar demais." },
            { id: "meal-demo-dinner-3", name: "Legumes no vapor", quantity: "1 porção", calories: 48, protein: 2, carbs: 9, fat: 0, benefit: "Ajuda no equilíbrio e no volume do prato." },
          ],
        },
      ],
    },
    planMeals: [
      {
        id: "plan-breakfast",
        name: "Café da manhã",
        time: "08:30",
        icon: "light_mode",
        color: "border-[#DFF37D]",
        accent: "#DFF37D",
        image: planImages.breakfast,
        title: "Ovos mexidos com Abacate",
        description: "2 ovos, 50g de abacate, 1 fatia de pão integral",
        foods: [
          { id: "pf1", name: "Ovos mexidos", quantity: "2 ovos", calories: 180, protein: 14, carbs: 2, fat: 12, benefit: "Ajuda a manter saciedade pela manhã." },
          { id: "pf2", name: "Abacate", quantity: "50g", calories: 80, protein: 1, carbs: 4, fat: 7, benefit: "Boa fonte de gordura e energia estável." },
          { id: "pf3", name: "Pão integral", quantity: "1 fatia", calories: 75, protein: 3, carbs: 12, fat: 1, benefit: "Complementa com carboidrato simples para a rotina." },
        ],
      },
      {
        id: "plan-lunch",
        name: "Almoço",
        time: "12:30",
        icon: "restaurant",
        color: "border-[#4558C8]",
        accent: "#4558C8",
        image: planImages.lunch,
        title: "Frango Grelhado com Brócolis",
        description: "150g de frango, 100g arroz integral, legumes à vontade",
        foods: [
          { id: "pf4", name: "Arroz Integral Cozido", quantity: "150g", calories: 185, protein: 4, carbs: 38, fat: 1, benefit: "Entrega energia de forma equilibrada." },
          { id: "pf5", name: "Peito de Frango Grelhado", quantity: "120g", calories: 198, protein: 36, carbs: 0, fat: 5, benefit: "Excelente fonte de proteína magra." },
          { id: "pf6", name: "Mix de Salada Verde", quantity: "50g", calories: 15, protein: 1, carbs: 3, fat: 0, benefit: "Ajuda na digestão e micronutrientes." },
          { id: "pf7", name: "Azeite de Oliva Extra Virgem", quantity: "10ml", calories: 88, protein: 0, carbs: 0, fat: 10, benefit: "Complementa a refeição com gordura boa." },
        ],
      },
      {
        id: "plan-snack",
        name: "Lanche da tarde",
        time: "16:00",
        icon: "eco",
        color: "border-[#EF5F37]",
        accent: "#EF5F37",
        image: planImages.snack,
        title: "Mix de Nuts & Fruta",
        description: "30g de castanhas, 1 maçã média",
        foods: [
          { id: "pf8", name: "Castanhas", quantity: "30g", calories: 170, protein: 5, carbs: 6, fat: 14, benefit: "Ajuda na saciedade e rotina entre refeições." },
          { id: "pf9", name: "Maçã", quantity: "1 un", calories: 70, protein: 0, carbs: 18, fat: 0, benefit: "Boa opção leve e prática para o lanche." },
        ],
      },
    ],
    supplements: [
      { id: "s1", period: "Pós-treino", category: "Performance", time: "18:00", name: "Creatina", dosage: "5 gramas", instruction: "Usar 1x por dia para consistência no treino.", card: "bg-old-flax text-custom-jet" },
      { id: "s2", period: "Manhã", category: "Proteína", time: "08:00", name: "Whey Protein", dosage: "30 gramas", instruction: "Boa opção para subir proteína no café da manhã.", card: "bg-secondary text-white" },
      { id: "s3", period: "Almoço", category: "Saúde", time: "12:30", name: "Ômega 3", dosage: "2 caps", instruction: "Consumir junto com refeição principal.", card: "bg-[#D9B8F3] text-custom-jet" },
      { id: "s4", period: "Pré-treino", category: "Energia", time: "16:30", name: "Cafeína", dosage: "210 mg", instruction: "Usar somente quando fizer sentido na rotina.", card: "bg-[#EF5F37] text-white" },
    ],
    trainingPlans: [
      {
        id: "training-a",
        name: "Peito + Ombro",
        estimatedMinutes: 50,
        exercises: [
          { id: "training-a-1", name: "Supino reto", focus: "Peito", sets: 4, reps: "10-12", targetReps: 12, restSeconds: 90, suggestedLoadKg: 40, loadDelta: "+2kg" },
          { id: "training-a-2", name: "Supino inclinado", focus: "Peito", sets: 4, reps: "8-10", targetReps: 10, restSeconds: 75, suggestedLoadKg: 36, loadDelta: "+2kg" },
          { id: "training-a-3", name: "Crucifixo", focus: "Peito", sets: 3, reps: "12-15", targetReps: 15, restSeconds: 60, suggestedLoadKg: 12, loadDelta: "+1kg" },
          { id: "training-a-4", name: "Desenvolvimento", focus: "Ombros", sets: 4, reps: "10-12", targetReps: 12, restSeconds: 90, suggestedLoadKg: 18, loadDelta: "+2kg" },
        ],
      },
      {
        id: "training-b",
        name: "Costas + Bíceps",
        estimatedMinutes: 55,
        exercises: [
          { id: "training-b-1", name: "Puxada frontal", focus: "Costas", sets: 4, reps: "10-12", targetReps: 12, restSeconds: 75, suggestedLoadKg: 45, loadDelta: "+5kg" },
          { id: "training-b-2", name: "Remada baixa", focus: "Costas", sets: 4, reps: "10-12", targetReps: 12, restSeconds: 75, suggestedLoadKg: 40, loadDelta: "+2kg" },
          { id: "training-b-3", name: "Rosca direta", focus: "Bíceps", sets: 3, reps: "8-10", targetReps: 10, restSeconds: 60, suggestedLoadKg: 20, loadDelta: "+2kg" },
        ],
      },
    ],
    trainingHistory: [],
    water: {
      [demoTodayKey]: 2450,
    },
    waterHistory: {
      [demoTodayKey]: [
        { id: "water-demo-1", amount: 300, label: "Ao acordar", time: "07:15" },
        { id: "water-demo-2", amount: 500, label: "Após o café da manhã", time: "09:40" },
        { id: "water-demo-3", amount: 450, label: "Antes do almoço", time: "12:10" },
        { id: "water-demo-4", amount: 600, label: "Durante a tarde", time: "16:25" },
        { id: "water-demo-5", amount: 350, label: "Após o treino", time: "19:05" },
        { id: "water-demo-6", amount: 250, label: "No jantar", time: "20:20" },
      ],
    },
  };
}
