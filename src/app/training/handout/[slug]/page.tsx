import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { TrainingHandoutViewer } from "@/components/training/TrainingHandoutViewer";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import {
  getTrainingHandoutBySlug,
  trainingHandoutStaticPath,
} from "@/lib/training-handouts";
import { userCanAccessTrainingHandout } from "@/lib/training-handouts-server";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const handout = getTrainingHandoutBySlug(slug);
  return {
    title: handout ? handout.title : "Training handout",
  };
}

export default async function TrainingHandoutPage({ params }: PageProps) {
  const { slug } = await params;
  const handout = getTrainingHandoutBySlug(slug);
  if (!handout) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/training/handout/${slug}`)}`);
  }

  const allowed = await userCanAccessTrainingHandout(user, slug);
  if (!allowed) {
    notFound();
  }

  return (
    <TrainingHandoutViewer
      title={handout.title}
      staticPath={trainingHandoutStaticPath(handout)}
      pdfPath={handout.pdfFile ? `/training/${handout.pdfFile}` : undefined}
    />
  );
}
