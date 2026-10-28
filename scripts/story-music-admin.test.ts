import assert from "node:assert/strict";
import { storyMusicAdminWriteEnabled } from "../src/lib/story-music/story-music-admin-access";

process.env.STORY_MUSIC_ADMIN_WRITE_ENABLED = "";

assert.equal(storyMusicAdminWriteEnabled(), false);

process.env.STORY_MUSIC_ADMIN_WRITE_ENABLED = "1";
assert.equal(storyMusicAdminWriteEnabled(), true);

console.log("story-music-admin.test.ts OK");
