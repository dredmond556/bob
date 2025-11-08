import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useScreenStreak } from '@/context/ScreenStreakContext';

type GoalOption = 15 | 10 | 5;

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const {
    state,
    isHydrated,
    todaysActivities,
    setPermissionGranted,
    setReductionGoal,
    logUsage,
    refreshActivities,
  } = useScreenStreak();

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [usageDraft, setUsageDraft] = useState<string>('');

  const progress = useMemo(() => {
    if (state.dailyLimit <= 0) {
      return state.todaysUsageMinutes > 0 ? 1 : 0;
    }
    return Math.min(1, state.todaysUsageMinutes / state.dailyLimit);
  }, [state.dailyLimit, state.todaysUsageMinutes]);

  const minutesRemaining = Math.max(0, state.dailyLimit - state.todaysUsageMinutes);
  const savedToday = Math.max(0, state.dailyLimit - state.todaysUsageMinutes);
  const overallSaved = state.totalTimeSavedMinutes + savedToday;
  const limitExceeded = state.todaysUsageMinutes > state.dailyLimit && state.dailyLimit > 0;

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    if (!state.permissionGranted) {
      setShowPermissionModal(true);
    } else if (!state.reductionGoal) {
      setShowGoalModal(true);
    }
  }, [isHydrated, state.permissionGranted, state.reductionGoal]);

  useEffect(() => {
    if (showLogModal) {
      setUsageDraft(String(Math.round(state.todaysUsageMinutes)));
    }
  }, [showLogModal, state.todaysUsageMinutes]);

  const handleSelectGoal = async (goal: GoalOption) => {
    await setReductionGoal(goal);
    setShowGoalModal(false);
  };

  const handleConfirmUsage = async () => {
    const parsed = Number(usageDraft);
    if (Number.isNaN(parsed)) {
      return;
    }
    await logUsage(parsed);
    setShowLogModal(false);
  };

  const formattedStreak = state.streakCount === 0 ? 'Start your streak' : `${state.streakCount} day streak`;

  const gradientColors =
    colorScheme === 'dark'
      ? (['#12131F', '#111225', '#1F2136'] as const)
      : (['#F5F3FF', '#F1EEFF', '#E8E6FF'] as const);

  if (!isHydrated) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.tint} />
      </View>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={styles.flexOne}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: 32, paddingTop: Platform.select({ ios: 60, android: 50, default: 40 }) },
        ]}
        showsVerticalScrollIndicator={false}>
        <BrandingHeader palette={palette} />

        <View style={[styles.card, { backgroundColor: palette.surface }]}>
          <Text style={[styles.cardLabel, { color: palette.mutedText }]}>{formattedStreak}</Text>
          <Text style={[styles.dailyLimit, { color: palette.text }]}>
            Daily limit {Math.round(state.dailyLimit)} mins
          </Text>
          <ProgressBar progress={progress} palette={palette} />
          <View style={styles.progressMetaRow}>
            <Text style={[styles.progressMeta, { color: limitExceeded ? palette.warning : palette.mutedText }]}>
              {limitExceeded ? 'Above limit' : `${Math.round(minutesRemaining)} mins remaining`}
            </Text>
            <Pressable onPress={() => setShowLogModal(true)}>
              <Text style={[styles.linkText, { color: palette.tint }]}>Update usage</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatsPill
            label="Today"
            value={formatMinutes(state.todaysUsageMinutes)}
            highlight={limitExceeded}
            palette={palette}
          />
          <StatsPill
            label="Saved today"
            value={formatMinutes(savedToday)}
            highlight={false}
            palette={palette}
          />
          <StatsPill
            label="Time saved overall"
            value={formatMinutes(overallSaved)}
            highlight={false}
            palette={palette}
          />
          <StatsPill
            label="Days tracked"
            value={`${state.daysTracked}`}
            highlight={false}
            palette={palette}
          />
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Daily stats</Text>
          <View style={styles.detailRow}>
            <DetailLine
              label="Average daily screen time"
              value={formatMinutes(state.averageDailyMinutes)}
              palette={palette}
            />
            <DetailLine
              label="Reduction goal"
              value={state.reductionGoal ? `${state.reductionGoal} mins / day` : 'Set a goal'}
              palette={palette}
            />
            <DetailLine
              label="Daily limit"
              value={formatMinutes(state.dailyLimit)}
              palette={palette}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>Things to do instead</Text>
            <Pressable onPress={refreshActivities}>
              <Text style={[styles.linkText, { color: palette.accent }]}>Refresh</Text>
            </Pressable>
          </View>
          {todaysActivities.map((activity, index) => (
            <View
              key={`${activity}-${index}`}
              style={[
                styles.activityItem,
                {
                  borderColor: palette.border,
                  backgroundColor: index === todaysActivities.length - 1 ? palette.surfaceMuted : 'transparent',
                },
              ]}>
              <Text
                style={[
                  styles.activityText,
                  { color: index === todaysActivities.length - 1 ? palette.text : palette.mutedText },
                ]}>
                {index + 1}. {activity}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <PermissionModal
        visible={showPermissionModal}
        palette={palette}
        onDismiss={() => setShowPermissionModal(false)}
        onGrant={async () => {
          await setPermissionGranted(true);
          setShowPermissionModal(false);
          setShowGoalModal(true);
        }}
      />

      <GoalModal
        visible={showGoalModal}
        palette={palette}
        onSelect={handleSelectGoal}
        onClose={() => setShowGoalModal(false)}
      />

      <LogUsageModal
        visible={showLogModal}
        onClose={() => setShowLogModal(false)}
        palette={palette}
        usageDraft={usageDraft}
        setUsageDraft={setUsageDraft}
        onConfirm={handleConfirmUsage}
      />
    </LinearGradient>
  );
}

function BrandingHeader({ palette }: { palette: typeof Colors.light }) {
  return (
    <View style={styles.brandingContainer}>
      <View style={[styles.logoBadge, { backgroundColor: palette.tint }]}>
        <Text style={styles.logoLetter}>S</Text>
      </View>
      <View style={styles.brandingTextContainer}>
        <Text style={[styles.appName, { color: palette.text }]}>ScreenStreak</Text>
        <Text style={[styles.tagline, { color: palette.mutedText }]}>
          Taper off your smartphone addiction (if you want to)
        </Text>
      </View>
    </View>
  );
}

function ProgressBar({
  progress,
  palette,
}: {
  progress: number;
  palette: typeof Colors.light;
}) {
  return (
    <View style={[styles.progressTrack, { backgroundColor: palette.surfaceMuted }]}>
      <View
        style={[
          styles.progressFill,
          {
            backgroundColor: palette.tint,
            width: `${Math.max(5, progress * 100)}%`,
          },
        ]}
      />
    </View>
  );
}

function StatsPill({
  label,
  value,
  highlight,
  palette,
}: {
  label: string;
  value: string;
  highlight: boolean;
  palette: typeof Colors.light;
}) {
  return (
    <View
      style={[
        styles.statsPill,
        {
          backgroundColor: highlight ? palette.accent : palette.surface,
        },
      ]}>
      <Text
        style={[
          styles.statsLabel,
          { color: highlight ? '#fff' : palette.mutedText },
        ]}>
        {label}
      </Text>
      <Text
        style={[
          styles.statsValue,
          { color: highlight ? '#fff' : palette.text },
        ]}>
        {value}
      </Text>
    </View>
  );
}

function DetailLine({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: typeof Colors.light;
}) {
  return (
    <View style={styles.detailLine}>
      <Text style={[styles.detailLabel, { color: palette.mutedText }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

function PermissionModal({
  visible,
  palette,
  onDismiss,
  onGrant,
}: {
  visible: boolean;
  palette: typeof Colors.light;
  onDismiss: () => void;
  onGrant: () => void | Promise<void>;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: palette.surface }]}>
          <Text style={[styles.modalTitle, { color: palette.text }]}>Connect Screen Time?</Text>
          <Text style={[styles.modalBody, { color: palette.mutedText }]}>
            ScreenStreak reads your Screen Time totals so you can taper with intention. We never block apps and
            you stay in full control.
          </Text>
          <View style={styles.modalActions}>
            <Pressable onPress={onDismiss} style={[styles.secondaryButton, { borderColor: palette.border }]}>
              <Text style={[styles.secondaryButtonText, { color: palette.mutedText }]}>Maybe later</Text>
            </Pressable>
            <Pressable onPress={onGrant} style={[styles.primaryButton, { backgroundColor: palette.tint }]}>
              <Text style={styles.primaryButtonText}>Allow access</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function GoalModal({
  visible,
  palette,
  onSelect,
  onClose,
}: {
  visible: boolean;
  palette: typeof Colors.light;
  onSelect: (value: GoalOption) => void;
  onClose: () => void;
}) {
  const options: GoalOption[] = [15, 10, 5];
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: palette.surface }]}>
          <Text style={[styles.modalTitle, { color: palette.text }]}>Pick a reduction stride</Text>
          <Text style={[styles.modalBody, { color: palette.mutedText }]}>
            Each day we’ll encourage you to shave off a little time.
          </Text>
          <View style={styles.goalOptionsRow}>
            {options.map((option) => (
              <Pressable
                key={option}
                onPress={() => onSelect(option)}
                style={[styles.goalChip, { borderColor: palette.tint }]}>
                <Text style={[styles.goalChipText, { color: palette.tint }]}>{option} min</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onClose}>
            <Text style={[styles.linkText, { color: palette.mutedText }]}>I’ll decide later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function LogUsageModal({
  visible,
  onClose,
  palette,
  usageDraft,
  setUsageDraft,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  palette: typeof Colors.light;
  usageDraft: string;
  setUsageDraft: (value: string) => void;
  onConfirm: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="slide">
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.modalCard, { backgroundColor: palette.surface }]}>
          <Text style={[styles.modalTitle, { color: palette.text }]}>Log today’s usage</Text>
          <Text style={[styles.modalBody, { color: palette.mutedText }]}>
            Enter the total minutes you spent on your phone today.
          </Text>
          <TextInput
            keyboardType="numeric"
            returnKeyType="done"
            value={usageDraft}
            onChangeText={setUsageDraft}
            placeholder="150"
            placeholderTextColor={palette.mutedText}
            style={[
              styles.input,
              {
                borderColor: palette.border,
                color: palette.text,
              },
            ]}
          />
          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={[styles.secondaryButton, { borderColor: palette.border }]}>
              <Text style={[styles.secondaryButtonText, { color: palette.mutedText }]}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={[styles.primaryButton, { backgroundColor: palette.tint }]}>
              <Text style={styles.primaryButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function formatMinutes(minutes: number): string {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remaining = safeMinutes % 60;
  if (hours === 0) {
    return `${remaining} min`;
  }
  return `${hours}h ${remaining.toString().padStart(2, '0')}m`;
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    gap: 24,
  },
  brandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logoLetter: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  brandingTextContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  cardLabel: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  dailyLimit: {
    fontSize: 24,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 16,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressMeta: {
    fontSize: 14,
    fontWeight: '500',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statsPill: {
    width: '48%',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  statsLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  detailRow: {
    gap: 12,
  },
  detailLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  activityText: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 13, 22, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  modalBody: {
    fontSize: 16,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  goalOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  goalChip: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalChipText: {
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.select({ ios: 14, android: 10, default: 12 }),
    fontSize: 18,
    fontWeight: '600',
  },
});
