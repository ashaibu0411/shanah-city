import "@/components/marriage/marriage-counseling.css";

export default function MarriageCounselingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marriage-prep-layout min-w-0 w-full max-w-full overflow-x-clip pb-[max(1rem,env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
}
