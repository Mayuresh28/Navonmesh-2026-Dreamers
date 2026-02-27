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

  const rowStyle: React.CSSProperties =
    status === "ok"  ? { borderColor: "var(--ok)",     background: "var(--ok-bg)" } :
    status === "err" ? { borderColor: "var(--danger)",  background: "var(--danger-bg)" } :
                       { borderColor: "var(--border)",  background: "var(--bg-card)" };

  return (
    <div className="flex items-center gap-4 rounded-2xl border-2 px-5 py-4 transition-all duration-200 hover:shadow-sm"
      style={rowStyle}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
        <span style={{ color: "var(--text-muted)" }}>{IconFn ? IconFn("w-6 h-6") : Icons.activity("w-6 h-6")}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          {cfg.label}
          {cfg.optional && <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>(Optional)</span>}
        </p>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{cfg.description}</p>
      </div>

      <div className="shrink-0 w-20 flex justify-center">
        {status === "ok" && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--ok)" }}>
            {Icons.check("w-4 h-4")} Ready
          </span>
        )}
        {status === "err" && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--danger)" }}>
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
          className="input-field w-40 h-11"
        />
      ) : (
        <>
          <button onClick={() => csvRef.current?.click()}
            className="shrink-0 inline-flex items-center gap-2 h-11 px-5 rounded-xl border-2 text-sm font-semibold transition-all duration-200"
            style={csvFile
              ? { borderColor: "var(--teal)", background: "var(--teal-bg)", color: "var(--teal)" }
              : { borderColor: "var(--border)", background: "var(--bg-raised)", color: "var(--text-body)" }
            }>
            {Icons.upload("w-4 h-4")}
            <span>{csvFile ? (csvFile.name.length > 14 ? csvFile.name.slice(0, 14) + "\u2026" : csvFile.name) : "Upload File"}</span>
          </button>
          <input ref={csvRef} type="file" className="hidden" accept=".csv,.xlsx,.xls,.txt" onChange={e => onCsv(e.target.files?.[0] ?? null)} />
        </>
      )}

      {!cfg.isInput && (
        <>
          <button onClick={() => imgRef.current?.click()}
            className="shrink-0 inline-flex items-center gap-2 h-11 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200"
            style={imgFile
              ? { borderColor: "var(--cyan)", background: "var(--cyan-bg, rgba(24,216,245,0.1))", color: "var(--cyan)" }
              : { borderColor: "var(--border)", background: "var(--bg-raised)", color: "var(--text-body)" }
            }>
            {Icons.image("w-4 h-4")}
            <span>{imgFile ? (imgFile.name.length > 10 ? imgFile.name.slice(0, 10) + "\u2026" : imgFile.name) : "Photo"}</span>
          </button>
          <input ref={imgRef} type="file" className="hidden" accept="image/*" onChange={e => onImg(e.target.files?.[0] ?? null)} />
        </>
      )}
    </div>
  );
}
