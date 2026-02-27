"use client";

import { ALL_PARAMS } from "./constants";
import { Icons } from "@/components/icons/health-icons";
import { Spinner } from "@/components/ui/spinner";

interface AutosyncViewProps {
  loading: boolean;
  autoProgress: number;
  onSync: () => void;
}

export function AutosyncView({ loading, autoProgress, onSync }: AutosyncViewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary mx-auto mb-6">
          {Icons.shield("w-10 h-10")}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Auto Sync</h1>
        <p className="text-base text-gray-500 mt-3 leading-relaxed">
          Automatically sync and analyze all your health data in one click.
          This combines everything you have uploaded so far to give you the most accurate picture of your health.
        </p>
      </div>

      {/* Parameter overview */}
      <div className="w-full max-w-2xl grid grid-cols-3 sm:grid-cols-5 gap-3">
        {ALL_PARAMS.map(p => {
          const PIcon = Icons[p.key];
          return (
            <div key={p.key}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-center transition-all duration-200 ${
                loading ? "border-primary/30 bg-primary/5 animate-pulse" : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}>
              <div className="text-gray-400">{PIcon ? PIcon("w-6 h-6") : Icons.activity("w-6 h-6")}</div>
              <span className="text-xs font-semibold text-gray-600 leading-tight">{p.label}</span>
              {p.optional && <span className="text-[10px] text-gray-400 -mt-0.5">Optional</span>}
            </div>
          );
        })}
      </div>

      {/* Progress */}
      {loading && (
        <div className="w-full max-w-lg">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium">Loading your health data...</span>
            <span className="text-sm font-bold text-primary">{autoProgress}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-200 ease-out"
              style={{ width: `${autoProgress}%` }} />
          </div>
        </div>
      )}

      <button onClick={onSync} disabled={loading}
        className="w-full max-w-lg py-4 rounded-2xl bg-primary hover:bg-secondary text-white font-bold text-lg tracking-wide shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? (
          <span className="flex items-center justify-center gap-3"><Spinner /> Loading Report...</span>
        ) : (
          <span className="inline-flex items-center gap-3">{Icons.sync("w-5 h-5")} Start Auto Sync</span>
        )}
      </button>
    </div>
  );
}
