export type ShotType =
  | "EXTREME_WIDE"
  | "WIDE"
  | "MEDIUM"
  | "CLOSE_UP"
  | "EXTREME_CLOSE_UP"
  | "AERIAL"
  | "TRACKING"
  | "POV";

export type CameraMovement =
  | "STATIC"
  | "PAN"
  | "TILT"
  | "ZOOM"
  | "TRACKING"
  | "DRONE_SWEEP"
  | "HANDHELD";

export type ActionPhase =
  | "ANTICIPATION"
  | "OPENING"
  | "ENTER"
  | "PEAK_ACTION"
  | "RECOVERY"
  | "COMPLETION";

export type CoverageType =
  | "ESTABLISHING"
  | "PRIMARY_COVERAGE"
  | "REVERSE_ANGLE"
  | "INSERT_DETAIL"
  | "B_ROLL";

export interface ContinuityFeatures {
  eyeline: "LEFT" | "RIGHT" | "DIRECT_CAMERA" | "OFF_SCREEN";
  screenDirection: "LEFT_TO_RIGHT" | "RIGHT_TO_LEFT" | "TOWARDS_CAMERA" | "AWAY_FROM_CAMERA" | "STATIC";
  dominantColorHex: string;
}

export interface ShotDescriptor {
  shotId: string;
  assetId: string;
  sceneId: string;
  setupId: string;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  visualQuality: number; // 0.0 to 1.0
  technicalQuality: number; // 0.0 to 1.0
  shotType: ShotType;
  cameraAngle: "EYE_LEVEL" | "LOW_ANGLE" | "HIGH_ANGLE" | "BIRD_EYE" | "DUTCH";
  framing: "SINGLE" | "TWO_SHOT" | "GROUP" | "OVER_SHOULDER" | "CUTAWAY";
  cameraMovement: CameraMovement;
  depthOfField: "SHALLOW" | "DEEP";
  subjectPosition: "LEFT" | "CENTER" | "RIGHT" | "MOVING";
  dominantColors: string[];
  visualStyle: string;
  action: string;
  actionPhase: ActionPhase;
  beginningState: string;
  endingState: string;
  subjects: string[];
  emotion: string;
  location: string;
  lighting: string;
  faceCount: number;
  hasSpeech: boolean;
  speakerIds: string[];
  transcriptRefs: string[];
  continuityFeatures: ContinuityFeatures;
  storyPotential: number; // 0.0 to 1.0
  bRollPotential: number; // 0.0 to 1.0
  establishingPotential: number; // 0.0 to 1.0
  emotionalIntensity: number; // 0.0 to 1.0
  semanticTags: string[];
}

export interface SetupDescriptor {
  setupId: string;
  sceneId: string;
  setupName: string;
  cameraPlacement: string;
  focalPoint: string;
  coverageType: CoverageType;
  shots: ShotDescriptor[];
  confidence: number;
}

export interface SceneDescriptor {
  sceneId: string;
  sceneIndex: number;
  location: string;
  timeOfDay: "DAWN" | "MORNING" | "AFTERNOON" | "GOLDEN_HOUR" | "SUNSET" | "NIGHT";
  narrativeObjective: string;
  dominantMood: string;
  setups: SetupDescriptor[];
  confidence: number;
}

export interface TranscriptSegment {
  segmentId: string;
  speakerId: string;
  startTimeSec: number;
  endTimeSec: number;
  text: string;
  sentiment: string;
  semanticImportance: "HIGH" | "MEDIUM" | "LOW";
  isSentenceBoundary: boolean;
  isEmphasis: boolean;
}

export interface AudioMusicSection {
  section: "INTRO" | "BUILD" | "DROP" | "CLIMAX" | "OUTRO";
  startSec: number;
  endSec: number;
  intensity: number;
}

export interface SoundEffectOpportunity {
  timeSec: number;
  type: "IMPACT" | "RISER" | "WHOOSH" | "AMBIENCE";
  suggestedAsset: string;
}

export interface AudioIntelligenceProfile {
  bpm: number;
  key: string;
  energyCurve: Array<{ timeSec: number; energy: number }>;
  musicSections: AudioMusicSection[];
  beatTimestampsSec: number[];
  soundEffectOpportunities: SoundEffectOpportunity[];
}

/**
 * Isolated benchmark ground truth annotations (strictly kept hidden from agent runtime).
 */
export interface BenchmarkGroundTruthAnnotation {
  shotId: string;
  isAdversarialTrap: boolean; // e.g. visually stunning but narratively useless
  isImperfectVital: boolean;  // e.g. slightly shaky/noisy but critical story event
  isDuplicate: boolean;
  isShakyOrNoisy: boolean;
  isIrrelevant: boolean;
  isExcellent: boolean;
  idealRole?: string;
}
