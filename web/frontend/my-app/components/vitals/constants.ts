/* Vitals parameter definitions and display mappings */

export interface ParamCard {
  key: string;
  label: string;
  unit: string;
  description: string;
  optional?: boolean;
  isInput?: boolean;
}

export const LOW_FREQ: ParamCard[] = [
  { key: "blood_pressure", label: "Blood Pressure", unit: "mmHg", description: "Your blood pressure reading" },
  { key: "heart_rate", label: "Heart Rate", unit: "bpm", description: "Beats per minute" },
  { key: "glucose", label: "Blood Sugar", unit: "mg/dL", description: "Blood glucose level" },
  { key: "spo2", label: "Oxygen Level", unit: "%", description: "Blood oxygen saturation" },
  { key: "sleep", label: "Sleep Hours", unit: "hrs", description: "How many hours did you sleep?", isInput: true },
  { key: "steps", label: "Daily Steps", unit: "steps", description: "Steps walked today", isInput: true },
];

export const HI_FREQ: ParamCard[] = [
  { key: "eeg", label: "Brain Activity", unit: "\u03BCV", description: "EEG brain wave data", optional: true },
  { key: "emg", label: "Muscle Activity", unit: "mV", description: "EMG muscle signal data", optional: true },
  { key: "ecg", label: "Heart Signal", unit: "ms", description: "ECG heart rhythm data", optional: true },
];

export const ALL_PARAMS = [...LOW_FREQ, ...HI_FREQ];

export const DISPLAY: Record<string, { label: string; unit: string }> = {
  blood_pressure: { label: "Blood Pressure", unit: "mmHg" },
  heart_rate:     { label: "Heart Rate",     unit: "bpm" },
  glucose:        { label: "Blood Sugar",    unit: "mg/dL" },
  spo2:           { label: "Oxygen Level",   unit: "%" },
  sleep:          { label: "Sleep Hours",    unit: "hrs" },
  steps:          { label: "Daily Steps",    unit: "steps" },
  eeg:            { label: "Brain Activity", unit: "\u03BCV" },
  emg:            { label: "Muscle Activity",unit: "mV" },
  ecg:            { label: "Heart Signal",   unit: "ms" },
};

export const RESULT_ORDER = [
  "blood_pressure", "heart_rate", "glucose", "spo2",
  "sleep", "steps", "eeg", "emg", "ecg",
];
