export interface PredictionResult {
  predicted_class: string;
  probabilities: Record<string, number>;
  input_features: {
    BMI: number;
    Genetic_Risk: number;
    Age_Risk_Multiplier: number;
    Baseline_Risk: number;
  };
  engineered_features: {
    Composite_Risk: number;
    BMI_Genetic: number;
    Age_Baseline: number;
  };
}

/** Map user profile data to ML model input */
export function profileToModelInput(profile: {
  bmi: number;
  geneticRiskScore: number;
  ageRiskMultiplier: number;
  familyHistory: string;
  existingConditions: string[];
  smokingStatus: string;
  alcoholUse: string;
}) {
  let baselineRisk = 0.05;

  const highRiskConditions = ["Heart Disease", "Diabetes", "Cancer", "Kidney Disease"];
  const medRiskConditions = ["Hypertension", "Thyroid", "Liver Disease", "Asthma"];

  for (const cond of profile.existingConditions) {
    if (highRiskConditions.includes(cond)) baselineRisk += 0.1;
    else if (medRiskConditions.includes(cond)) baselineRisk += 0.05;
  }

  if (profile.familyHistory && profile.familyHistory.toLowerCase() !== "none" && profile.familyHistory.trim() !== "") {
    baselineRisk += 0.08;
  }

  if (profile.smokingStatus === "current") baselineRisk += 0.1;
  else if (profile.smokingStatus === "former") baselineRisk += 0.04;

  if (profile.alcoholUse === "heavy") baselineRisk += 0.08;
  else if (profile.alcoholUse === "moderate") baselineRisk += 0.04;
  else if (profile.alcoholUse === "occasional") baselineRisk += 0.01;

  baselineRisk = Math.min(0.6, Math.max(0.05, baselineRisk));

  return {
    BMI: profile.bmi,
    Genetic_Risk: profile.geneticRiskScore,
    Age_Risk_Multiplier: profile.ageRiskMultiplier,
    Baseline_Risk: parseFloat(baselineRisk.toFixed(4)),
  };
}

export function getRiskColor(riskClass: string) {
  const lower = riskClass.toLowerCase();
  if (lower === "low") return { bg: "bg-status-low", text: "text-status-low", border: "border-status-low" };
  if (lower === "high") return { bg: "bg-status-high", text: "text-status-high", border: "border-status-high" };
  return { bg: "bg-status-mod", text: "text-status-mod", border: "border-status-mod" };
}

export function getRiskMessage(riskClass: string) {
  const lower = riskClass.toLowerCase();
  if (lower === "low") return "Your health risk level is low. Keep up the great work!";
  if (lower === "high") return "Elevated risk detected. Please consult your doctor for further evaluation.";
  return "Your risk is within normal range. Maintain healthy habits for continued wellness.";
}
