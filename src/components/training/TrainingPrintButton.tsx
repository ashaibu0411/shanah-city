"use client";

export function TrainingPrintButton() {
  return (
    <button type="button" className="no-print" onClick={() => window.print()}>
      Print this index
    </button>
  );
}
