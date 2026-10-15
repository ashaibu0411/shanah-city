import { MarriageCurriculumEditor } from "@/components/marriage/MarriageCurriculumEditor";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

export default function MarriageCurriculumAdminPage() {
  return (
    <div className={marriagePremium.page}>
      <div className={marriagePremium.inset}>
        <MarriageCurriculumEditor />
      </div>
    </div>
  );
}
