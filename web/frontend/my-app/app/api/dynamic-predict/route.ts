import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { processAllParameters } from "@/app/dynamic/healthEngine";

const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";

export async function GET() {
  try {
    const client = await clientPromise;
    const col = client.db("dhanvantari").collection("dynamic_data");
    const entries = await col.find({}).sort({ createdAt: -1 }).toArray();

    if (entries.length === 0)
      return NextResponse.json(
        { error: "No dynamic data found. Upload health data on the Dynamic page first." },
        { status: 404 }
      );

    // Merge rawData from all entries
    const merged: Record<string, number[]> = {};
    for (const entry of entries) {
      if (!entry.rawData) continue;
      for (const [param, values] of Object.entries(entry.rawData)) {
        if (!Array.isArray(values)) continue;
        if (!merged[param]) merged[param] = [];
        merged[param].push(...(values as number[]));
      }
    }

    if (Object.keys(merged).length === 0)
      return NextResponse.json({ error: "No raw data found across entries." }, { status: 404 });

    // Run healthEngine analysis
    const analysis = processAllParameters(merged);

    // Extract mean vitals for main.py
    const vitals = {
      BP: analysis.metrics.blood_pressure?.mean || 120,
      HeartRate: analysis.metrics.heart_rate?.mean || 72,
      Glucose: analysis.metrics.glucose?.mean || 100,
      SpO2: analysis.metrics.spo2?.mean || 97,
      Sleep: analysis.metrics.sleep?.mean || 7,
      Steps: analysis.metrics.steps?.mean || 5000,
    };

    // Call main.py /predict
    let prediction = null;
    try {
      const res = await fetch(`${ML_API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vitals),
      });
      if (res.ok) prediction = await res.json();
    } catch {
      /* ML server unreachable — continue without prediction */
    }

    return NextResponse.json({
      prediction,
      vitals,
      analysis,
      entries_count: entries.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Dynamic Predict Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
