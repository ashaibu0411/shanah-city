import type { ReactNode } from "react";

export default function TrainingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="/training/training.css" />
      {children}
    </>
  );
}
