import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { SHOWN_KINDS } from '../data/facet-names';
import { dayKey } from '../engine/progress';
import { makeIdeas, type SparkIdea } from '../engine/spark';
import { coolFacets, hasReadableTaste, likedFacets, readTaste, type FacetRead, type Taste } from '../engine/taste';
import { useApp } from '../state/app-state';
import type { Mission, TaskContent } from '../state/types';

/**
 * Everything the "for you" screen needs, worked out once.
 *
 * The three tiers draw this completely differently — a three year old gets
 * two pictures, a twelve year old gets a list with the reasoning attached —
 * but they are all looking at the same numbers, so the arithmetic lives here
 * and only the drawing lives in the tiers.
 */

/** How many made missions are offered at a time. Three is a choice, six is a menu. */
const BATCH = 3;
/** Built behind the three, so turning one down has something to put in its place. */
const POOL = 6;
/** Favourites shown at once, newest first. */
const MAX_FAVOURITES = 6;

export type ForYou = {
  ideas: SparkIdea[];
  /** Facets the child is warm about, strongest first. */
  liked: FacetRead[];
  /** Facets they keep turning down. */
  cool: FacetRead[];
  /** Enough history to say anything out loud yet. */
  readable: boolean;
  /** Missions they gave a thumb up to, most recent first, one per task. */
  favourites: Mission[];
  /** True while a mission is already on, when starting another is not allowed. */
  busy: boolean;
  start: (task: TaskContent) => void;
  refuse: (idea: SparkIdea) => void;
  more: () => void;
};

export function useForYou(): ForYou {
  const router = useRouter();
  const { profile, data, activeMission, assignMission, voteIdea } = useApp();

  const [round, setRound] = useState(0);
  // Ids from the rounds already gone past. Only ever added to when the child
  // asks for more, so it moves in step with the round rather than mid batch.
  const [seen, setSeen] = useState<string[]>([]);

  const taste = useMemo(
    () => readTaste(data.missions, data.ideaVotes),
    [data.missions, data.ideaVotes],
  );

  // What makes this batch this batch: the child, the day, the round. Not the
  // name, so renaming a child does not hand them a different morning.
  const roundKey = `${profile?.createdAt ?? ''}|${dayKey()}|${round}`;

  // The taste as it stood when the round began.
  //
  // Held still on purpose. Thumbing one idea down changes the taste, and if
  // the batch were rebuilt from the new one the other two cards would quietly
  // become different missions as well. A child who says "not that one" means
  // that one.
  const [frozen, setFrozen] = useState<{ key: string; taste: Taste }>({ key: roundKey, taste });
  if (frozen.key !== roundKey) setFrozen({ key: roundKey, taste });
  const roundTaste = frozen.key === roundKey ? frozen.taste : taste;

  const pool = useMemo(() => {
    if (!profile) return [];
    return makeIdeas({
      profile,
      missions: data.missions,
      taste: roundTaste,
      // Refusals are applied when choosing what to show rather than when
      // building, so that a new one does not rebuild the whole batch.
      votes: [],
      seed: roundKey,
      count: POOL,
      exclude: seen,
    });
  }, [profile, data.missions, roundTaste, roundKey, seen]);

  const refused = useMemo(
    () => new Set(data.ideaVotes.filter((vote) => vote.value === -1).map((vote) => vote.id)),
    [data.ideaVotes],
  );

  const ideas = useMemo(
    () => pool.filter((idea) => !refused.has(idea.task.id)).slice(0, BATCH),
    [pool, refused],
  );

  const favourites = useMemo(() => {
    const byTask = new Map<string, Mission>();
    for (const mission of data.missions) {
      if (mission.rating !== 1) continue;
      byTask.set(mission.task.id, mission);
    }
    return [...byTask.values()].reverse().slice(0, MAX_FAVOURITES);
  }, [data.missions]);

  const start = useCallback(
    (task: TaskContent) => {
      if (activeMission) return;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      assignMission(task);
      router.push('/mission');
    },
    [activeMission, assignMission, router],
  );

  const refuse = useCallback(
    (idea: SparkIdea) => {
      void Haptics.selectionAsync();
      voteIdea({ id: idea.task.id, facets: idea.facets, value: -1 });
    },
    [voteIdea],
  );

  const more = useCallback(() => {
    void Haptics.selectionAsync();
    setSeen((previous) => [...previous, ...pool.map((idea) => idea.task.id)]);
    setRound((previous) => previous + 1);
  }, [pool]);

  return {
    ideas,
    liked: likedFacets(taste, SHOWN_KINDS).slice(0, 4),
    cool: coolFacets(taste, SHOWN_KINDS).slice(0, 2),
    readable: hasReadableTaste(taste),
    favourites,
    busy: Boolean(activeMission),
    start,
    refuse,
    more,
  };
}
