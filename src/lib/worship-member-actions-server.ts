import {
  createSuggestionId,
  getSongPartNotes,
  normalizeMemberSuggestions,
  normalizeSongParts,
  upsertPracticeStem,
  type WorshipMemberSuggestion,
  type WorshipPracticeStem,
  type WorshipServicePlan,
} from "@/lib/worship-types";
import { updateWorshipPlanContent } from "@/lib/worship-server";

export async function submitMemberSuggestion(input: {
  serviceDate: string;
  serviceTime: string;
  userId: string;
  userName: string;
  songId?: string;
  songTitle?: string;
  partRole?: string;
  notes: string;
}) {
  const notes = input.notes.trim();
  if (!notes) {
    throw new Error("Add a note about your part or recommendation.");
  }

  return updateWorshipPlanContent(input.serviceDate, input.serviceTime, (plan) => {
    const memberIndex = plan.team.findIndex((member) => member.userId === input.userId);
    if (memberIndex === -1) {
      throw new Error("You are not on the team for this service.");
    }

    const song = input.songId
      ? plan.songs.find((entry) => entry.id === input.songId)
      : undefined;
    if (input.songId && !song) {
      throw new Error("Song not found on this plan.");
    }

    const suggestion: WorshipMemberSuggestion = {
      id: createSuggestionId(),
      userId: input.userId,
      userName: input.userName,
      songId: song?.id,
      songTitle: song?.title ?? input.songTitle,
      partRole: input.partRole?.trim() || plan.team[memberIndex].partRole,
      notes,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    return {
      ...plan,
      memberSuggestions: [...normalizeMemberSuggestions(plan.memberSuggestions), suggestion],
    };
  });
}

export async function reviewMemberSuggestion(input: {
  serviceDate: string;
  serviceTime: string;
  suggestionId: string;
  action: "approve" | "dismiss";
  reviewer: { id: string; name: string };
}) {
  return updateWorshipPlanContent(input.serviceDate, input.serviceTime, (plan) => {
    const suggestions = normalizeMemberSuggestions(plan.memberSuggestions);
    const index = suggestions.findIndex((entry) => entry.id === input.suggestionId);
    if (index === -1) {
      throw new Error("Suggestion not found.");
    }

    const suggestion = suggestions[index];
    if (suggestion.status !== "pending") {
      throw new Error("This suggestion was already reviewed.");
    }

    const reviewedAt = new Date().toISOString();
    suggestions[index] = {
      ...suggestion,
      status: input.action === "approve" ? "approved" : "dismissed",
      reviewedBy: input.reviewer.id,
      reviewedByName: input.reviewer.name,
      reviewedAt,
    };

    let songs = plan.songs;
    if (input.action === "approve" && suggestion.songId && suggestion.partRole) {
      songs = plan.songs.map((song) => {
        if (song.id !== suggestion.songId) return song;
        const parts = normalizeSongParts(song.parts);
        const existingNotes = getSongPartNotes(song, suggestion.partRole!);
        const mergedNotes = existingNotes
          ? `${existingNotes}\n\n${suggestion.userName}: ${suggestion.notes}`
          : `${suggestion.userName}: ${suggestion.notes}`;
        return {
          ...song,
          parts: parts.map((part) =>
            part.role === suggestion.partRole ? { ...part, notes: mergedNotes } : part,
          ),
        };
      });
    }

    return {
      ...plan,
      songs,
      memberSuggestions: suggestions,
    };
  });
}

export async function attachMemberPracticeStem(input: {
  serviceDate: string;
  serviceTime: string;
  songId: string;
  userId: string;
  userName: string;
  partRole: string;
  stem: Omit<WorshipPracticeStem, "role" | "status">;
  isManager: boolean;
}) {
  return updateWorshipPlanContent(input.serviceDate, input.serviceTime, (plan) => {
    const member = plan.team.find((entry) => entry.userId === input.userId);
    if (!member && !input.isManager) {
      throw new Error("You are not on the team for this service.");
    }
    if (!input.isManager && member?.partRole !== input.partRole) {
      throw new Error("You can only upload a recording for your assigned part.");
    }

    const songIndex = plan.songs.findIndex((song) => song.id === input.songId);
    if (songIndex === -1) {
      throw new Error("Song not found on this plan.");
    }

    const song = plan.songs[songIndex];
    const nextStem = upsertPracticeStem(song.practiceStems, input.partRole, {
      ...input.stem,
      uploadedBy: input.userId,
      uploadedByName: input.userName,
      status: input.isManager ? "approved" : "pending",
    });

    const songs = [...plan.songs];
    songs[songIndex] = { ...song, practiceStems: nextStem };
    return { ...plan, songs };
  });
}

export async function reviewMemberPracticeStem(input: {
  serviceDate: string;
  serviceTime: string;
  songId: string;
  partRole: string;
  action: "approve" | "remove";
}) {
  return updateWorshipPlanContent(input.serviceDate, input.serviceTime, (plan) => {
    const songIndex = plan.songs.findIndex((song) => song.id === input.songId);
    if (songIndex === -1) {
      throw new Error("Song not found on this plan.");
    }

    const song = plan.songs[songIndex];
    const stems = (song.practiceStems ?? []).filter((stem) => stem.role !== input.partRole);

    if (input.action === "approve") {
      const target = (song.practiceStems ?? []).find((stem) => stem.role === input.partRole);
      if (!target) {
        throw new Error("Practice recording not found.");
      }
      stems.push({ ...target, status: "approved" });
    }

    const songs = [...plan.songs];
    songs[songIndex] = { ...song, practiceStems: stems };
    return { ...plan, songs };
  });
}

export function pendingSuggestionsForPlan(plan: WorshipServicePlan) {
  return normalizeMemberSuggestions(plan.memberSuggestions).filter(
    (entry) => entry.status === "pending",
  );
}
