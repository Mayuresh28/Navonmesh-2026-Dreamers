"use client";

import { useRef } from "react";
import { Icons } from "@/components/icons/health-icons";
import type { ParamCard } from "./constants";

interface UploadRowProps {
  cfg: ParamCard;
  csvFile: File | null;
  imgFile: File | null;
  status: "idle" | "ok" | "err";
  onCsv: (f: File | null) => void;
  onImg: (f: File | null) => void;
  inputValue?: string;
  onInputChange?: (v: string) => void;
}

export function UploadRow({ cfg, csvFile, imgFile, status, onCsv, onImg, inputValue, onInputChange }: UploadRowProps) {
  const csvRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const IconFn = Icons[cfg.key];

  const rowBg =
    status === "ok"  ? "border-emerald-200 bg-emerald-50/50" :
    status === "err" ? "border-red-200 bg-red-50/40" :
                       "border-gray-200 bg-white hover:bg-gray-50/50";

  return (
    <div className={`flex items-center gap-4 rounded-2xl border-2 px-5 py-4 transition-all duration-200 hover:shadow-sm ${rowBg}`}>
      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 shrink-0">
        {IconFn ? IconFn("w-6 h-6") : Icons.activity("w-6 h-6")}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-gray-800">
          {cfg.label}
          {cfg.optional && <span className="ml-2 text-xs text-gray-400 font-normal">(Optional)</span>}
        </p>
        <p className="text-sm text-gray-400 mt-0.5">{cfg.description}</p>
      </div>

      <div className="shrink-0 w-20 flex justify-center">
        {status === "ok" && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
            {Icons.check("w-4 h-4")} Ready
          </span>
        )}
        {status === "err" && (
          <span className="inline-flex items-center gap-1.5 text-sm text-red-500 font-semibold">
            {Icons.alertTriangle("w-4 h-4")} Error
          </span>
        )}
      </div>

      {cfg.isInput ? (
        <input
          type="number"
          value={inputValue ?? ""}
          onChange={(e) => onInputChange?.(e.target.value)}
          placeholder={`Enter ${cfg.unit}`}
          className="w-40 h-11 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-base text-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all"
        />
      ) : (
        <>
          <button onClick={() => csvRef.current?.click()}
            className={`shrink-0 inline-flex items-center gap-2 h-11 px-5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
              csvFile ? "border-primary/40 bg-primary/5 text-primary" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            }`}>
            {Icons.upload("w-4 h-4")}
            <span>{csvFile ? (csvFile.name.length > 14 ? csvFile.name.slice(0, 14) + "\u2026" : csvFile.name) : "Upload File"}</span>
          </button>
          <input ref={csvRef} type="file" className="hidden" accept=".csv,.xlsx,.xls,.txt" onChange={e => onCsv(e.target.files?.[0] ?? null)} />
        </>
      )}

      {!cfg.isInput && (
        <>
          <button onClick={() => imgRef.current?.click()}
            className={`shrink-0 inline-flex items-center gap-2 h-11 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
              imgFile ? "border-violet-300 bg-violet-50 text-violet-700" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-600"
            }`}>
            {Icons.image("w-4 h-4")}
            <span>{imgFile ? (imgFile.name.length > 10 ? imgFile.name.slice(0, 10) + "\u2026" : imgFile.name) : "Photo"}</span>
          </button>
          <input ref={imgRef} type="file" className="hidden" accept="image/*" onChange={e => onImg(e.target.files?.[0] ?? null)} />
        </>
      )}
    </div>
  );
}
