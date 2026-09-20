import { z } from "zod";

export const RationalTimeSchema = z.object({
  numerator: z.number().int().positive(),
  denominator: z.number().int().positive(),
});

export const CanvasSettingsSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  pixelAspectRatio: z.enum(["1:1", "16:9", "4:3", "9:16"]),
  colorSpace: z.enum(["Rec.709", "Rec.2020", "DCI-P3"]),
});

export const TimeRangeSchema = z.object({
  start: z.number().int().nonnegative(),
  duration: z.number().int().positive(),
});

export const SourceTimeRangeSchema = z.object({
  in: z.number().int().nonnegative(),
  out: z.number().int().positive(),
});

export const TransformParametersSchema = z.object({
  position: z.object({ x: z.number(), y: z.number() }),
  scale: z.object({ x: z.number().positive(), y: z.number().positive() }),
  rotation: z.number(),
  opacity: z.number().min(0).max(1),
});

export const ClipEffectSchema = z.object({
  id: z.string(),
  pluginId: z.string(),
  enabled: z.boolean(),
  parameters: z.record(z.string(), z.unknown()),
  keyframes: z.record(z.string(), z.array(z.any())).optional(),
});

export const TimelineClipSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  name: z.string(),
  timelineRange: TimeRangeSchema,
  sourceRange: SourceTimeRangeSchema,
  speed: z.number().positive().default(1.0),
  transform: TransformParametersSchema,
  effects: z.array(ClipEffectSchema),
});

export const TimelineTransitionSchema = z.object({
  id: z.string(),
  type: z.enum(["CROSS_DISSOLVE", "DIP_TO_BLACK", "WHIP_PAN", "LIGHT_LEAK"]),
  durationFrames: z.number().int().positive(),
  fromClipId: z.string(),
  toClipId: z.string(),
  alignment: z.enum(["START_ON_EDIT", "CENTER_ON_EDIT", "END_ON_EDIT"]),
});

export const TimelineTrackSchema = z.object({
  id: z.string(),
  type: z.enum(["VIDEO", "AUDIO", "GRAPHICS", "EFFECTS", "SUBTITLE"]),
  name: z.string(),
  index: z.number().int().nonnegative(),
  muted: z.boolean().default(false),
  locked: z.boolean().default(false),
  volume: z.number().min(-60).max(12).optional(),
  pan: z.number().min(-1).max(1).optional(),
  clips: z.array(TimelineClipSchema),
  transitions: z.array(TimelineTransitionSchema),
});

export const TimelineMarkerSchema = z.object({
  id: z.string(),
  frame: z.number().int().nonnegative(),
  label: z.string(),
  color: z.string(),
});

export const TimelineIRSchema = z.object({
  timelineId: z.string(),
  version: z.number().int().positive(),
  timebase: RationalTimeSchema,
  canvas: CanvasSettingsSchema,
  tracks: z.array(TimelineTrackSchema),
  markers: z.array(TimelineMarkerSchema),
});
