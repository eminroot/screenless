import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen, Sticker, TopBar, Txt } from '../../components/ui';
import { eligibleTasks } from '../../engine/task-engine';
import { useI18n } from '../../i18n';
import { useApp } from '../../state/app-state';
import type { TaskCategory, TaskContent } from '../../state/types';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';

/**
 * Every mission this child could be given, and a way to start any one of them.
 *
 * A development tool, not a feature. Missions are handed out by the engine on
 * purpose — a child who can browse the list picks the five-star one every time
 * and the whole variety mechanism stops working — so this screen is only
 * reachable under `__DEV__` and the route renders nothing in a release build.
 *
 * It exists because the alternative when testing or demoing is pressing
 * "another one" forty times hoping the mission you wrote comes up.
 */
export default function Library() {
  const router = useRouter();
  const { pick } = useI18n();
  const { profile, assignMission, activeMission } = useApp();
  const [filter, setFilter] = useState<TaskCategory | 'all'>('all');
  const [query, setQuery] = useState('');

  const tasks = useMemo(() => {
    if (!profile) return [];
    const all = eligibleTasks(profile);
    return all.filter((task) => {
      if (filter !== 'all' && task.category !== filter) return false;
      if (!query) return true;
      const hay = `${task.id} ${pick(task.title)} ${pick(task.body)}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    });
  }, [profile, filter, query, pick]);

  if (!__DEV__) return null;

  if (!profile) {
    return (
      <Screen>
        <TopBar title="Mission library" />
        <Txt variant="body">No profile yet.</Txt>
      </Screen>
    );
  }

  const start = (task: TaskContent) => {
    assignMission(task);
    router.replace('/mission');
  };

  const groups: (TaskCategory | 'all')[] = ['all', 'move', 'outdoor', 'create', 'social', 'calm'];

  return (
    <Screen>
      <TopBar title="Mission library" />

      <Sticker background={colors.surfaceAlt} style={{ padding: spacing.md, gap: spacing.xs }}>
        <Txt variant="small">
          {tasks.length} missions for age {profile.ageBand}
          {activeMission ? ' — starting one replaces the current mission' : ''}
        </Txt>
        <Txt variant="tiny" color={colors.textFaint}>
          Development only. This screen is not in a release build.
        </Txt>
      </Sticker>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
        {groups.map((group) => (
          <Pressable
            key={group}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === group }}
            onPress={() => setFilter(group)}
            style={{
              backgroundColor: filter === group ? colors.info : colors.surface,
              borderRadius: radii.pill,
              borderWidth: borderWidth.thick,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: 4,
            }}
          >
            <Txt variant="tiny" color={filter === group ? colors.surface : colors.text}>
              {group}
            </Txt>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
        {['', 'little-', 'duo-', 'motion-', 'photo-'].map((prefix) => (
          <Pressable
            key={prefix || 'any'}
            accessibilityRole="button"
            accessibilityState={{ selected: query === prefix }}
            onPress={() => setQuery(prefix)}
            style={{
              backgroundColor: query === prefix ? colors.accent : colors.surface,
              borderRadius: radii.pill,
              borderWidth: borderWidth.thick,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: 4,
            }}
          >
            <Txt variant="tiny">{prefix || 'any id'}</Txt>
          </Pressable>
        ))}
      </View>

      <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        {tasks.map((task) => (
          <Sticker
            key={task.id}
            background={colors.surface}
            offset={3}
            style={{ padding: spacing.md, gap: spacing.xs }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Txt variant="subheading">{task.emoji}</Txt>
              <Txt variant="bodyStrong" style={{ flex: 1 }}>
                {pick(task.title)}
              </Txt>
            </View>
            <Txt variant="tiny" color={colors.textFaint}>
              {task.id} · {task.category} · {task.minutes}m · {task.stars}★
              {task.mode === 'duo' ? ' · duo' : ''}
              {task.proof ? ` · ${task.proof}` : ''}
              {task.check ? ` · ${task.check.options.length}-answer question` : ''}
              {task.steps ? ` · ${task.steps.length} steps` : ''}
            </Txt>
            <Txt variant="small" color={colors.textSoft}>
              {pick(task.body)}
            </Txt>
            <Button label="Start this one" tone="info" size="md" onPress={() => start(task)} />
          </Sticker>
        ))}
      </View>
    </Screen>
  );
}
