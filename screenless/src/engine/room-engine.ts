import { objectName } from '../data/room-objects';
import { roomTemplates, type RoomTemplate } from '../data/room-missions';
import { LANGUAGES, type Localized } from '../i18n/types';
import type {
  ChildProfile,
  Mission,
  RoomObjectId,
  RoomScan,
  TaskContent,
} from '../state/types';

/** Placeholder names, in slot order. */
const SLOT_KEYS = ['a', 'b', 'c'] as const;

/**
 * Chooses one object per slot, all different.
 *
 * The slot lists are short and there are at most three of them, so a plain
 * backtracking search is both exact and instant. Returns null when the room
 * simply does not hold what this template needs.
 */
function fillSlots(template: RoomTemplate, available: RoomObjectId[]): RoomObjectId[] | null {
  const chosen: RoomObjectId[] = [];

  const place = (index: number): boolean => {
    if (index === template.slots.length) return true;
    for (const candidate of template.slots[index]) {
      if (!available.includes(candidate) || chosen.includes(candidate)) continue;
      chosen.push(candidate);
      if (place(index + 1)) return true;
      chosen.pop();
    }
    return false;
  };

  return place(0) ? chosen : null;
}

/** Swaps `{{a}}`, `{{b}}` and `{{c}}` for the chosen objects, in every language. */
function fillText(text: Localized, objects: RoomObjectId[]): Localized {
  const filled = {} as Localized;
  for (const language of LANGUAGES) {
    let value = text[language];
    objects.forEach((object, index) => {
      const key = SLOT_KEYS[index];
      if (!key) return;
      value = value.split(`{{${key}}}`).join(objectName(object)[language]);
    });
    filled[language] = value;
  }
  return filled;
}

export type RoomMissionOptions = {
  scan: RoomScan;
  profile: ChildProfile;
  missions: Mission[];
  /** Duo templates are left out when a grown up is not available. */
  allowDuo?: boolean;
  /** Never return these template ids, used when swapping a mission out. */
  exclude?: string[];
};

/**
 * Builds a mission out of what the camera actually found.
 *
 * Returns null when nothing fits, and the caller falls back to the curated
 * library, exactly as it does when a generated mission fails.
 */
export function buildRoomMission(options: RoomMissionOptions): TaskContent | null {
  const { scan, profile, missions, allowDuo = true, exclude = [] } = options;
  if (scan.objects.length === 0) return null;

  const recentIds = new Set(missions.slice(-10).map((m) => m.task.id));

  let best: { template: RoomTemplate; objects: RoomObjectId[] } | null = null;
  let bestScore = -Infinity;

  for (const template of roomTemplates) {
    if (!template.ageBands.includes(profile.ageBand)) continue;
    if (!allowDuo && template.mode === 'duo') continue;
    if (exclude.includes(template.id)) continue;

    const objects = fillSlots(template, scan.objects);
    if (!objects) continue;

    let score = 4;
    // The mission id carries the objects, so a repeat means the same template
    // on the same things. A different room makes it a different mission.
    if (recentIds.has(missionId(template, objects))) score -= 12;
    // Templates that use more of the room feel more like a real discovery.
    score += template.slots.length * 1.5;
    score += Math.random() * 4;

    if (score > bestScore) {
      bestScore = score;
      best = { template, objects };
    }
  }

  if (!best) return null;
  return toTask(best.template, best.objects, profile);
}

function missionId(template: RoomTemplate, objects: RoomObjectId[]): string {
  return `${template.id}:${objects.join('-')}`;
}

function toTask(
  template: RoomTemplate,
  objects: RoomObjectId[],
  profile: ChildProfile,
): TaskContent {
  return {
    id: missionId(template, objects),
    category: template.category,
    minutes: template.minutes,
    stars: template.stars,
    emoji: template.emoji,
    interests: profile.interests,
    ageBands: [profile.ageBand],
    title: fillText(template.title, objects),
    body: fillText(template.body, objects),
    steps: template.steps.map((step) => fillText(step, objects)),
    mode: template.mode,
    proof: template.proof,
    motion: template.motion,
    parentBrief: template.parentBrief ? fillText(template.parentBrief, objects) : undefined,
    objects,
    place: 'indoor',
    source: 'room',
  };
}
