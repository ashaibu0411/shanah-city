import type { Comment, CommunityPost, UnavailabilityRequest } from "@/lib/member-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getMemberGroupIds } from "@/lib/admin-people-server";
import { getUserById } from "@/lib/auth-server";
import { useDatabase } from "@/lib/use-database";
import * as memberDb from "@/lib/stores/member-db";
import * as memberJson from "@/lib/stores/member-json";

const store = () => (useDatabase() ? memberDb : memberJson);

export const getCommunityPosts = () => store().getCommunityPosts();

export async function getCommunityPostsForViewer(viewerId?: string | null) {
  const posts = await getCommunityPosts();
  if (!viewerId) {
    return posts.filter((post) => !post.targetGroupId);
  }

  const viewer = await getUserById(viewerId);
  if (viewer && (await canManageAsAdmin(viewer))) {
    return posts;
  }

  const groupIds = await getMemberGroupIds(viewerId);
  return posts.filter((post) => {
    if (!post.targetGroupId) return true;
    return groupIds.includes(post.targetGroupId);
  });
}
export const saveCommunityPosts = (posts: CommunityPost[]) => store().saveCommunityPosts(posts);
export const addCommunityPost = (post: CommunityPost) => store().addCommunityPost(post);
export const addCommentToPost = (postId: string, comment: Comment) =>
  store().addCommentToPost(postId, comment);
export const reactToPost = (postId: string) => store().reactToPost(postId);
export const getCommunityPostById = (postId: string) => store().getCommunityPostById(postId);
export const updateCommunityPost = (
  postId: string,
  update: Partial<Pick<CommunityPost, "content" | "type" | "targetGroupId" | "targetGroupName">>,
) => store().updateCommunityPost(postId, update);
export const deleteCommunityPost = (postId: string) => store().deleteCommunityPost(postId);
export const getVolunteerCheckIns = () => store().getVolunteerCheckIns();
export const addVolunteerCheckIn = (
  entry: Parameters<typeof memberJson.addVolunteerCheckIn>[0],
) => store().addVolunteerCheckIn(entry);
export const getKidCheckIns = () => store().getKidCheckIns();
export const addKidCheckIn = (entry: Parameters<typeof memberJson.addKidCheckIn>[0]) =>
  store().addKidCheckIn(entry);
export const checkoutKid = (id: string, checkedOutBy?: string) => store().checkoutKid(id, checkedOutBy);
export const verifyCheckoutKid = (
  id: string,
  input: { securityCode: string; checkedOutBy: string },
) => store().verifyCheckoutKid(id, input);
export const getUnavailabilityRequests = () => store().getUnavailabilityRequests();
export const addUnavailabilityRequest = (
  request: Parameters<typeof memberJson.addUnavailabilityRequest>[0],
) => store().addUnavailabilityRequest(request);
export const updateUnavailabilityRequest = (
  id: string,
  update: Partial<UnavailabilityRequest>,
) => store().updateUnavailabilityRequest(id, update);

export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isAtChurch(lat: number, lng: number, churchLat: number, churchLng: number) {
  const meters = distanceMeters(lat, lng, churchLat, churchLng);
  return { atChurch: meters <= 200, distanceMeters: Math.round(meters) };
}
