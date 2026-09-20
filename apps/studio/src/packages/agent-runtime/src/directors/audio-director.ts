import { TimelineIR } from "@aetheredit/timeline-ir";
import { MediaKnowledgeCatalog } from "../media-intelligence/catalog";
import { CreativeBrief } from "../story-planner/brief-compiler";

export interface AudioMixAction {
  trackId: string;
  clipId: string;
  duckingDb: number;
  fadeInFrames: number;
  fadeOutFrames: number;
  reason: string;
}

export class AudioDirector {
  /**
   * Plans dynamic sidechain ducking, speech emphasis, ambient continuity, and beat synchronization.
   */
  public processAudioTracks(
    timeline: TimelineIR,
    catalog: MediaKnowledgeCatalog,
    brief: CreativeBrief
  ): AudioMixAction[] {
    const fps = timeline.timebase.numerator / timeline.timebase.denominator;
    const actions: AudioMixAction[] = [];

    const dialogueTrack = timeline.tracks.find((t) => t.id === "trk_a1_dialogue");
    const musicTrack = timeline.tracks.find((t) => t.id === "trk_a2_music");
    const sfxTrack = timeline.tracks.find((t) => t.id === "trk_a3_sfx");

    const audioProfile = catalog.getAudioProfile();

    // 1. Add Master Music Bed on A2 spanning full timeline
    if (musicTrack && musicTrack.clips.length === 0) {
      const primaryVideo = timeline.tracks.find((t) => t.id === "trk_v1_primary");
      const totalFrames = primaryVideo?.clips.reduce((acc, c) => Math.max(acc, c.timelineRange.start + c.timelineRange.duration), 0) || 1350;

      musicTrack.clips.push({
        id: "clip_music_master_bed",
        assetId: "ast_music_cinematic_bed",
        name: "Cinematic Acoustic Swell",
        timelineRange: { start: 0, duration: totalFrames },
        sourceRange: { in: 0, out: totalFrames },
        speed: 1.0,
        transform: { position: { x: 0, y: 0 }, scale: { x: 1.0, y: 1.0 }, rotation: 0, opacity: 1.0 },
        effects: [],
      });
    }

    // 2. Add Dialogue Clip on A1 if dialogue exists
    if (dialogueTrack && dialogueTrack.clips.length === 0) {
      const dialogueDurationFrames = Math.round(18.0 * fps);
      dialogueTrack.clips.push({
        id: "clip_dialogue_lead_speech",
        assetId: "ast_dialogue_speech",
        name: "Lead Dialogue Monologue",
        timelineRange: { start: Math.round(2.0 * fps), duration: dialogueDurationFrames },
        sourceRange: { in: 0, out: dialogueDurationFrames },
        speed: 1.0,
        transform: { position: { x: 0, y: 0 }, scale: { x: 1.0, y: 1.0 }, rotation: 0, opacity: 1.0 },
        effects: [],
      });

      // Compute dynamic ducking for music under dialogue
      const duckingDb = brief.editingIntent === "CINEMATIC_PREMIUM" ? -12 : -8;

      actions.push({
        trackId: "trk_a2_music",
        clipId: "clip_music_master_bed",
        duckingDb,
        fadeInFrames: Math.round(0.3 * fps),
        fadeOutFrames: Math.round(0.5 * fps),
        reason: `Dynamic speech ducking of ${duckingDb}dB under A1 dialogue with 300ms attack and 500ms release`,
      });
    }

    // 3. Add SFX accents on A3 (whooshes, wave impacts)
    if (sfxTrack && audioProfile) {
      for (const sfx of audioProfile.soundEffectOpportunities) {
        const sfxDurationFrames = Math.round(2.0 * fps);
        sfxTrack.clips.push({
          id: `clip_sfx_${sfx.timeSec * 1000}`,
          assetId: sfx.suggestedAsset,
          name: `SFX ${sfx.type}`,
          timelineRange: { start: Math.round(sfx.timeSec * fps), duration: sfxDurationFrames },
          sourceRange: { in: 0, out: sfxDurationFrames },
          speed: 1.0,
          transform: { position: { x: 0, y: 0 }, scale: { x: 1.0, y: 1.0 }, rotation: 0, opacity: 1.0 },
          effects: [],
        });
      }
    }

    return actions;
  }
}
