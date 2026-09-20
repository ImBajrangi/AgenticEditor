import {
  ShotDescriptor,
  SetupDescriptor,
  SceneDescriptor,
  TranscriptSegment,
  AudioIntelligenceProfile,
  BenchmarkGroundTruthAnnotation,
} from "./types";

export interface ShotQueryFilter {
  sceneId?: string;
  setupId?: string;
  shotType?: string;
  actionPhase?: string;
  emotion?: string;
  requiredSubject?: string;
  minVisualQuality?: number;
  screenDirection?: string;
  excludeShotIds?: string[];
  limit?: number;
}

export class MediaKnowledgeCatalog {
  private scenes = new Map<string, SceneDescriptor>();
  private setups = new Map<string, SetupDescriptor>();
  private shots = new Map<string, ShotDescriptor>();
  private transcripts: TranscriptSegment[] = [];
  private audioProfile?: AudioIntelligenceProfile;

  public addScene(scene: SceneDescriptor): void {
    this.scenes.set(scene.sceneId, scene);
    for (const setup of scene.setups) {
      this.setups.set(setup.setupId, setup);
      for (const shot of setup.shots) {
        this.shots.set(shot.shotId, shot);
      }
    }
  }

  public addShot(shot: ShotDescriptor): void {
    this.shots.set(shot.shotId, shot);
  }

  public setTranscripts(transcripts: TranscriptSegment[]): void {
    this.transcripts = transcripts;
  }

  public setAudioProfile(profile: AudioIntelligenceProfile): void {
    this.audioProfile = profile;
  }

  public getScenes(): SceneDescriptor[] {
    return Array.from(this.scenes.values());
  }

  public getSetups(): SetupDescriptor[] {
    return Array.from(this.setups.values());
  }

  public getAllShots(): ShotDescriptor[] {
    return Array.from(this.shots.values());
  }

  public getShot(shotId: string): ShotDescriptor | undefined {
    return this.shots.get(shotId);
  }

  public getTranscripts(): TranscriptSegment[] {
    return this.transcripts;
  }

  public getAudioProfile(): AudioIntelligenceProfile | undefined {
    return this.audioProfile;
  }

  public queryShots(filter: ShotQueryFilter): ShotDescriptor[] {
    let result = Array.from(this.shots.values());

    if (filter.sceneId) {
      result = result.filter((s) => s.sceneId === filter.sceneId);
    }
    if (filter.setupId) {
      result = result.filter((s) => s.setupId === filter.setupId);
    }
    if (filter.shotType) {
      result = result.filter((s) => s.shotType === filter.shotType);
    }
    if (filter.actionPhase) {
      result = result.filter((s) => s.actionPhase === filter.actionPhase);
    }
    if (filter.emotion) {
      result = result.filter((s) => s.emotion.toLowerCase().includes(filter.emotion!.toLowerCase()));
    }
    if (filter.requiredSubject) {
      result = result.filter((s) =>
        s.subjects.some((sub) => sub.toLowerCase().includes(filter.requiredSubject!.toLowerCase()))
      );
    }
    if (filter.minVisualQuality !== undefined) {
      result = result.filter((s) => s.visualQuality >= filter.minVisualQuality!);
    }
    if (filter.screenDirection) {
      result = result.filter((s) => s.continuityFeatures.screenDirection === filter.screenDirection);
    }
    if (filter.excludeShotIds && filter.excludeShotIds.length > 0) {
      const set = new Set(filter.excludeShotIds);
      result = result.filter((s) => !set.has(s.shotId));
    }

    if (filter.limit && filter.limit > 0) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }

  /**
   * Generates a realistic 100-clip adversarial footage pool with an isolated benchmark ground truth store.
   * Ground truth annotations are NOT placed on ShotDescriptor objects to ensure clean benchmarking.
   */
  public static generateAdversarialFootagePool(): {
    catalog: MediaKnowledgeCatalog;
    groundTruth: Map<string, BenchmarkGroundTruthAnnotation>;
  } {
    const catalog = new MediaKnowledgeCatalog();
    const groundTruth = new Map<string, BenchmarkGroundTruthAnnotation>();

    const scenesData = [
      { id: "scene_01_arrival", name: "Coastal Arrival", loc: "Beach & Cliffs", time: "MORNING" as const, mood: "Awe & Wonder" },
      { id: "scene_02_village", name: "Old Harbor Town", loc: "Cobblestone Streets", time: "AFTERNOON" as const, mood: "Vibrant Culture" },
      { id: "scene_03_surf", name: "Surfing Barrel Session", loc: "Ocean Reef Break", time: "GOLDEN_HOUR" as const, mood: "Peak Adrenaline" },
      { id: "scene_04_sunset_bonfire", name: "Clifftop Sunset Gathering", loc: "Sunset Overlook", time: "SUNSET" as const, mood: "Emotional Release" },
    ];

    let totalShotCount = 0;

    for (let sIdx = 0; sIdx < scenesData.length; sIdx++) {
      const sData = scenesData[sIdx];
      const setups: SetupDescriptor[] = [];

      for (let uIdx = 1; uIdx <= 4; uIdx++) {
        const setupId = `${sData.id}_setup_0${uIdx}`;
        const shots: ShotDescriptor[] = [];

        // Generate ~6-7 shots per setup to reach ~100 total
        for (let k = 1; k <= 6; k++) {
          totalShotCount++;
          const shotId = `shot_${totalShotCount < 10 ? "00" : totalShotCount < 100 ? "0" : ""}${totalShotCount}`;

          // Adversarial category distribution:
          // 1-20: Excellent Narrative Shots
          // 21-50: Mediocre Coverage
          // 51-70: Shaky / Low Technical Quality
          // 71-80: Duplicate Setups
          // 81-90: Irrelevant B-Roll
          // 91-95: Beauty Traps (Visually stunning 0.98 quality, but narratively empty/useless)
          // 96-100: Imperfect Vital (Slightly shaky 0.65 quality, but critical emotional story event)

          let isExcellent = false;
          let isMediocre = false;
          let isShaky = false;
          let isDuplicate = false;
          let isIrrelevant = false;
          let isBeautyTrap = false;
          let isImperfectVital = false;

          let shotType: ShotDescriptor["shotType"] = "MEDIUM";
          let actionPhase: ShotDescriptor["actionPhase"] = "ENTER";
          let visualQuality = 0.85;
          let technicalQuality = 0.88;
          let emotion = "wonder";
          let subjects = ["traveler"];
          let action = "walking along coastline";
          let storyPotential = 0.8;

          if (totalShotCount <= 20) {
            isExcellent = true;
            shotType = totalShotCount % 3 === 0 ? "AERIAL" : totalShotCount % 2 === 0 ? "CLOSE_UP" : "WIDE";
            actionPhase = totalShotCount % 2 === 0 ? "PEAK_ACTION" : "ENTER";
            visualQuality = 0.94;
            technicalQuality = 0.96;
            emotion = "exhilaration";
            subjects = ["surfer", "traveler"];
            action = "catching wave and smiling at horizon";
            storyPotential = 0.95;
          } else if (totalShotCount <= 50) {
            isMediocre = true;
            shotType = "MEDIUM";
            actionPhase = "ANTICIPATION";
            visualQuality = 0.72;
            technicalQuality = 0.75;
            emotion = "neutral";
            subjects = ["background person"];
            action = "sitting on bench";
            storyPotential = 0.5;
          } else if (totalShotCount <= 70) {
            isShaky = true;
            shotType = "HANDHELD" as unknown as ShotDescriptor["shotType"];
            actionPhase = "RECOVERY";
            visualQuality = 0.55;
            technicalQuality = 0.48;
            emotion = "confused";
            subjects = ["feet"];
            action = "unfocused walking";
            storyPotential = 0.3;
          } else if (totalShotCount <= 80) {
            isDuplicate = true;
            shotType = "WIDE";
            actionPhase = "COMPLETION";
            visualQuality = 0.80;
            technicalQuality = 0.82;
            emotion = "neutral";
            subjects = ["temple exterior"];
            action = "static street scene";
            storyPotential = 0.4;
          } else if (totalShotCount <= 90) {
            isIrrelevant = true;
            shotType = "EXTREME_CLOSE_UP";
            actionPhase = "STATIC" as unknown as ShotDescriptor["actionPhase"];
            visualQuality = 0.86;
            technicalQuality = 0.88;
            emotion = "unrelated";
            subjects = ["stray cat"];
            action = "sleeping in shadow";
            storyPotential = 0.2;
          } else if (totalShotCount <= 95) {
            isBeautyTrap = true;
            shotType = "DRONE_SWEEP" as unknown as ShotDescriptor["shotType"];
            actionPhase = "COMPLETION";
            visualQuality = 0.99; // Ultra gorgeous
            technicalQuality = 0.99;
            emotion = "pretty";
            subjects = ["empty flower garden"];
            action = "slow rotation over flowers";
            storyPotential = 0.15; // Visually stunning, narratively empty
          } else {
            isImperfectVital = true;
            shotType = "CLOSE_UP";
            actionPhase = "PEAK_ACTION";
            visualQuality = 0.68; // Lower technical score
            technicalQuality = 0.65;
            emotion = "triumphant tearful embrace";
            subjects = ["traveler", "local friend"];
            action = "climactic emotional reunion at summit";
            storyPotential = 0.98; // Narratively indispensable
          }

          const shot: ShotDescriptor = {
            shotId,
            assetId: `asset_${sData.id}_${k}`,
            sceneId: sData.id,
            setupId,
            startTimeSec: (k - 1) * 6.0,
            endTimeSec: k * 6.0,
            durationSec: 6.0,
            visualQuality,
            technicalQuality,
            shotType,
            cameraAngle: "EYE_LEVEL",
            framing: "SINGLE",
            cameraMovement: isShaky ? "HANDHELD" : "TRACKING",
            depthOfField: "SHALLOW",
            subjectPosition: "CENTER",
            dominantColors: ["#e06d53", "#1e3a5f", "#f4a261"],
            visualStyle: "cinematic warm 35mm",
            action,
            actionPhase: actionPhase || "ENTER",
            beginningState: "neutral stance",
            endingState: "forward momentum",
            subjects,
            emotion,
            location: sData.loc,
            lighting: sData.time === "SUNSET" ? "Golden Hour backlight" : "Soft daylight",
            faceCount: subjects.includes("traveler") ? 1 : 0,
            hasSpeech: isExcellent || isImperfectVital,
            speakerIds: isExcellent || isImperfectVital ? ["speaker_01"] : [],
            transcriptRefs: isExcellent || isImperfectVital ? ["ts_01"] : [],
            continuityFeatures: {
              eyeline: "RIGHT",
              screenDirection: "LEFT_TO_RIGHT",
              dominantColorHex: "#e06d53",
            },
            storyPotential,
            bRollPotential: isBeautyTrap ? 0.9 : 0.4,
            establishingPotential: shotType === "WIDE" ? 0.9 : 0.2,
            emotionalIntensity: isImperfectVital ? 0.98 : isExcellent ? 0.88 : 0.3,
            semanticTags: [sData.loc, sData.mood, action],
          };

          shots.push(shot);

          // Store isolated ground truth
          groundTruth.set(shotId, {
            shotId,
            isAdversarialTrap: isBeautyTrap,
            isImperfectVital: isImperfectVital,
            isDuplicate,
            isShakyOrNoisy: isShaky,
            isIrrelevant,
            isExcellent,
            idealRole: isImperfectVital ? "CLIMAX_EMOTIONAL_PAYOFF" : isExcellent ? "PRIMARY_NARRATIVE" : undefined,
          });
        }

        setups.push({
          setupId,
          sceneId: sData.id,
          setupName: `${sData.name} Angle ${uIdx}`,
          cameraPlacement: `Camera Pos ${uIdx}`,
          focalPoint: "Action Focus",
          coverageType: uIdx === 1 ? "ESTABLISHING" : uIdx === 2 ? "PRIMARY_COVERAGE" : "B_ROLL",
          shots,
          confidence: 0.92,
        });
      }

      catalog.addScene({
        sceneId: sData.id,
        sceneIndex: sIdx + 1,
        location: sData.loc,
        timeOfDay: sData.time,
        narrativeObjective: `Establish and develop ${sData.name}`,
        dominantMood: sData.mood,
        setups,
        confidence: 0.94,
      });
    }

    // Add audio intelligence profile
    catalog.setAudioProfile({
      bpm: 120,
      key: "D Major",
      energyCurve: [
        { timeSec: 0, energy: 0.4 },
        { timeSec: 15, energy: 0.7 },
        { timeSec: 30, energy: 0.95 },
        { timeSec: 45, energy: 0.5 },
      ],
      musicSections: [
        { section: "INTRO", startSec: 0, endSec: 8, intensity: 0.4 },
        { section: "BUILD", startSec: 8, endSec: 25, intensity: 0.75 },
        { section: "CLIMAX", startSec: 25, endSec: 38, intensity: 0.98 },
        { section: "OUTRO", startSec: 38, endSec: 45, intensity: 0.5 },
      ],
      beatTimestampsSec: [0.5, 2.0, 4.0, 8.0, 12.0, 16.0, 20.0, 25.0, 30.0, 35.0, 40.0, 44.0],
      soundEffectOpportunities: [
        { timeSec: 8.0, type: "WHOOSH", suggestedAsset: "sfx_coastal_swell" },
        { timeSec: 25.0, type: "IMPACT", suggestedAsset: "sfx_wave_barrel_crash" },
      ],
    });

    return { catalog, groundTruth };
  }
}
