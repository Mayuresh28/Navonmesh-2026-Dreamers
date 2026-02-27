import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import {
  mean, callMLApi, computeHrvSdnn, computeEmgRms,
  computeStressProxy, formulaBasedNCM,
} from "@/lib/ncm-engine";

/** Merge rawData arrays from all MongoDB entries */
function mergeRawData(entries: Record<string, unknown>[]) {
  const merged: Record<string, number[]> = {};
  for (const entry of entries) {
    const raw = (entry as { rawData?: Record<string, unknown> }).rawData;
    if (!raw) continue;
    for (const [param, values] of Object.entries(raw)) {
      if (!Array.isArray(values)) continue;
      if (!merged[param]) merged[param] = [];
      merged[param].push(...(values as number[]));
    }
  }
  return merged;
}

/** Build NCM result with formula fallback */
async function analyze(payload: { heart_rate: number[]; ecg: number[]; eeg: number[]; emg: number[] }) {
  const ml = await callMLApi(payload);
  if (ml) return ml;
  const hrSrc = payload.heart_rate.length > 0 ? payload.heart_rate : payload.ecg;
  const hr = hrSrc.length > 0 ? mean(hrSrc) : 72;
  return formulaBasedNCM(hr, computeHrvSdnn(hrSrc), computeStressProxy(payload.eeg), computeEmgRms(payload.emg));
}

// ── GET: Fetch from MongoDB and analyze ───────────────────────────────

export async function GET() {
  try {
    const client = await clientPromise;
    const col = client.db("dhanvantari").collection("dynamic_data");
    const entries = await col.find({}).sort({ createdAt: -1 }).toArray();

    if (entries.length === 0)
      return NextResponse.json({ error: "No data found. Upload ECG/EEG/EMG data first." }, { status: 404 });

    const m = mergeRawData(entries as unknown as Record<string, unknown>[]);
    const ecg = m["ecg"] || [], eeg = m["eeg"] || [], emg = m["emg"] || [], hr = m["heart_rate"] || [];

    if (!ecg.length && !eeg.length && !emg.length)
      return NextResponse.json({ error: "No ECG/EEG/EMG data found in database." }, { status: 404 });

    const result = await analyze({ heart_rate: hr, ecg, eeg, emg });

    return NextResponse.json({
      ...result,
      data_summary: {
        ecg_samples: ecg.length, eeg_samples: eeg.length,
        emg_samples: emg.length, heart_rate_samples: hr.length,
        entries_analyzed: entries.length,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("NCM API Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── POST: Accept raw arrays directly ──────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const payload = {
      heart_rate: (b.heart_rate || []) as number[],
      ecg: (b.ecg || []) as number[],
      eeg: (b.eeg || []) as number[],
      emg: (b.emg || []) as number[],
    };
    return NextResponse.json(await analyze(payload));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("NCM API Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
