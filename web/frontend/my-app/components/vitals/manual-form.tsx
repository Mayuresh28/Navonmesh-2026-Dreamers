"use client";

import { UploadRow } from "./upload-row";
import { LOW_FREQ, HI_FREQ } from "./constants";
import { Spinner } from "@/components/ui/spinner";

export interface FileState {
  csv: File | null;
  img: File | null;
  status: "idle" | "ok" | "err";
  inputValue?: string;
}

interface ManualFormProps {
  files: Record<string, FileState>;
  onFileChange: (key: string, field: "csv" | "img" | "inputValue", val: File | string | null) => void;
  anyReady: boolean;
  loading: boolean;
  onAnalyze: () => void;
}

export function ManualForm({ files, onFileChange, anyReady, loading, onAnalyze }: ManualFormProps) {
  return (
    <div className="flex-1 overflow-auto flex flex-col px-6 sm:px-8 py-6 gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Your Health Data</h1>
        <p className="text-base text-gray-500 mt-1">
          Upload your health files or enter values below to get a personalized health report.
        </p>
      </div>

      {/* Basic Health */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-6 rounded-full bg-primary" />
          <h2 className="text-lg font-bold text-gray-800">Basic Health Data</h2>
        </div>
        <div className="flex flex-col gap-3">
          {LOW_FREQ.map(cfg => (
            <UploadRow key={cfg.key} cfg={cfg}
              csvFile={files[cfg.key].csv} imgFile={files[cfg.key].img}
              status={files[cfg.key].status}
              onCsv={f => onFileChange(cfg.key, "csv", f)}
              onImg={f => onFileChange(cfg.key, "img", f)}
              inputValue={files[cfg.key].inputValue}
              onInputChange={v => onFileChange(cfg.key, "inputValue", v)}
            />
          ))}
        </div>
      </section>

      {/* Additional Tests */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-6 rounded-full bg-gray-300" />
          <h2 className="text-lg font-bold text-gray-800">Additional Tests</h2>
          <span className="text-sm text-gray-400 font-medium">(Optional)</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {HI_FREQ.map(cfg => (
            <UploadRow key={cfg.key} cfg={cfg}
              csvFile={files[cfg.key].csv} imgFile={files[cfg.key].img}
              status={files[cfg.key].status}
              onCsv={f => onFileChange(cfg.key, "csv", f)}
              onImg={f => onFileChange(cfg.key, "img", f)}
            />
          ))}
        </div>
      </section>

      {/* Analyze Button */}
      <button onClick={onAnalyze} disabled={loading || !anyReady}
        className={`shrink-0 w-full py-4 rounded-2xl text-lg font-bold tracking-wide transition-all duration-200 ${
          !loading && anyReady
            ? "bg-primary hover:bg-secondary text-white shadow-lg hover:shadow-xl active:scale-[0.99]"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}>
        {loading ? (
          <span className="flex items-center justify-center gap-3"><Spinner /> Analyzing your data...</span>
        ) : !anyReady ? "Upload at least one file to get started" : "Analyze My Health"}
      </button>
    </div>
  );
}
