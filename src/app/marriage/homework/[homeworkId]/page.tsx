import { MarriageCoupleHomeworkWorkspace } from "@/components/marriage/MarriageCoupleHomeworkWorkspace";

type Props = { params: Promise<{ homeworkId: string }> };

export default async function MarriageHomeworkDetailPage({ params }: Props) {
  const { homeworkId } = await params;
  return <MarriageCoupleHomeworkWorkspace homeworkId={homeworkId} />;
}
