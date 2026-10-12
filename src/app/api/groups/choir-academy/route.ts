import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserFromSession, SESSION_COOKIE } from "@/lib/auth-server";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import {
  buildChoirAcademyAchievementsPayload,
  buildChoirAcademyCourseDetailPayload,
  buildChoirAcademyCoursesPayload,
  buildChoirAcademyHomePayload,
  buildChoirAcademyLessonPayload,
  buildChoirAcademyMyLearningPayload,
  buildChoirAcademyPathPayload,
  handleChoirAcademyAction,
} from "@/lib/choir-academy-server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId")?.trim() ?? SHANAH_WORSHIP_GROUP_ID;
  const view = searchParams.get("view")?.trim() ?? "home";

  if (view === "home") {
    const payload = await buildChoirAcademyHomePayload(user, groupId);
    if (!payload) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ payload });
  }

  if (view === "path") {
    const pathId = searchParams.get("pathId")?.trim();
    if (!pathId) return NextResponse.json({ error: "Path id required." }, { status: 400 });
    const payload = await buildChoirAcademyPathPayload(user, groupId, pathId);
    if (!payload) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ payload });
  }

  if (view === "courses") {
    const payload = await buildChoirAcademyCoursesPayload(user, groupId);
    if (!payload) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ payload });
  }

  if (view === "course") {
    const courseId = searchParams.get("courseId")?.trim();
    if (!courseId) return NextResponse.json({ error: "Course id required." }, { status: 400 });
    const payload = await buildChoirAcademyCourseDetailPayload(user, groupId, courseId);
    if (!payload) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ payload });
  }

  if (view === "lesson") {
    const courseId = searchParams.get("courseId")?.trim();
    const lessonId = searchParams.get("lessonId")?.trim();
    if (!courseId || !lessonId) {
      return NextResponse.json({ error: "Course and lesson id required." }, { status: 400 });
    }
    const payload = await buildChoirAcademyLessonPayload(user, groupId, courseId, lessonId);
    if (!payload) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ payload });
  }

  if (view === "my-learning") {
    const payload = await buildChoirAcademyMyLearningPayload(user, groupId);
    if (!payload) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ payload });
  }

  if (view === "achievements") {
    const payload = await buildChoirAcademyAchievementsPayload(user, groupId);
    if (!payload) return NextResponse.json({ error: "Access denied." }, { status: 403 });
    return NextResponse.json({ payload });
  }

  return NextResponse.json({ error: "Unknown view." }, { status: 400 });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = await getUserFromSession(token);

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await handleChoirAcademyAction(user, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400 },
    );
  }
}
