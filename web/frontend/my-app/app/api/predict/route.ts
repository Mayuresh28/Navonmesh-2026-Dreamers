import { NextRequest, NextResponse } from "next/server";

const FLASK_URL = process.env.FLASK_PREDICT_URL || "http://localhost:5000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[API POST /predict] Request received:", body);

    const { BMI, Genetic_Risk, Age_Risk_Multiplier, Baseline_Risk } = body;

    if (
      BMI === undefined ||
      Genetic_Risk === undefined ||
      Age_Risk_Multiplier === undefined ||
      Baseline_Risk === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields: BMI, Genetic_Risk, Age_Risk_Multiplier, Baseline_Risk" },
        { status: 400 }
      );
    }

    console.log("[API POST /predict] Forwarding to Flask:", FLASK_URL + "/predict");

    const flaskResponse = await fetch(`${FLASK_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ BMI, Genetic_Risk, Age_Risk_Multiplier, Baseline_Risk }),
    });

    if (!flaskResponse.ok) {
      const errorData = await flaskResponse.json();
      console.error("[API POST /predict] Flask error:", errorData);
      return NextResponse.json(
        { error: errorData.error || "Prediction failed" },
        { status: flaskResponse.status }
      );
    }

    const result = await flaskResponse.json();
    console.log("[API POST /predict] Prediction result:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API POST /predict] Error:", error);
    return NextResponse.json(
      { error: "Failed to get prediction. Make sure the ML server is running." },
      { status: 500 }
    );
  }
}
