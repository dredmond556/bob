import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useScreenStreak } from '@/context/ScreenStreakContext';

const SUPPORT_MESSAGE =
  "Withdrawal from compulsive phone use is real. If you're in distress, call or text 988 in the United States (Lifeline). If you feel unsafe, contact emergency services immediately. International resources: the International Association for Suicide Prevention maintains helplines worldwide.";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const {
    state,
    setPermissionGranted,
    setAverageDailyMinutes,
    toggleNotifications,
    resetTodayUsage,
  } = useScreenStreak();

  const [averageInput, setAverageInput] = useState('');
  const [showSupport, setShowSupport] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    setAverageInput(String(Math.round(state.averageDailyMinutes)));
  }, [state.averageDailyMinutes]);

  const infoItems = useMemo(
    () => [
      { label: 'Daily limit', value: formatMinutes(state.dailyLimit) },
      { label: 'Reduction goal', value: state.reductionGoal ? `${state.reductionGoal} mins` : 'Not set' },
      { label: 'Current streak', value: `${state.streakCount} days` },
    ],
    [state.dailyLimit, state.reductionGoal, state.streakCount],
  );

  const handleSaveAverage = async () => {
    const parsed = Number(averageInput);
    if (Number.isNaN(parsed) || parsed <= 0) {
      Alert.alert('Enter a valid number', 'Please provide your average daily minutes (must be greater than 0).');
      return;
    }
    await setAverageDailyMinutes(parsed);
    Alert.alert('Updated', 'Your average daily screen time has been updated.');
  };

  const handleEmail = () => {
    const url = 'mailto:screenstreak@gmail.com';
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open email', 'Please email screenstreak@gmail.com directly.');
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Account & Device</Text>
        <SettingRow
          palette={palette}
          title="Allow Screen Time access"
          description="Enable to sync with your iPhone Screen Time app."
          control={
            <Switch
              value={state.permissionGranted}
              onValueChange={async (value) => {
                await setPermissionGranted(value);
              }}
              trackColor={{ true: palette.tint, false: palette.border }}
              thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
            />
          }
        />
        <SettingRow
          palette={palette}
          title="Annual Screen Time upload"
          description="Email us your yearly Screen Time PDF to refresh your baseline."
          onPress={() =>
            Alert.alert(
              'Upload instructions',
              'Export your yearly Screen Time report on iOS and email it to screenstreak@gmail.com with the subject “Annual Upload”. We will send you next steps.',
            )
          }
        />
        <SettingRow
          palette={palette}
          title="Reset today’s usage"
          description="Clear the minutes logged today if you made a mistake."
          onPress={async () => {
            await resetTodayUsage();
            Alert.alert('Usage reset', 'Your logged minutes for today have been cleared.');
          }}
        />
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Daily Summary</Text>
        <SettingRow
          palette={palette}
          title="Daily notification"
          description="Receive an evening recap of how you did."
          control={
            <Switch
              value={state.notificationsEnabled}
              onValueChange={async (enabled) => {
                await toggleNotifications(enabled);
              }}
              trackColor={{ true: palette.tint, false: palette.border }}
              thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
            />
          }
        />
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Your Baseline</Text>
        <Text style={[styles.helperText, { color: palette.mutedText }]}>
          Adjust your average daily screen time so we can tailor your tapering plan.
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            value={averageInput}
            onChangeText={setAverageInput}
            keyboardType="numeric"
            style={[
              styles.input,
              {
                borderColor: palette.border,
                color: palette.text,
                backgroundColor: palette.surfaceMuted,
              },
            ]}
          />
          <Text style={[styles.inputSuffix, { color: palette.mutedText }]}>mins</Text>
        </View>
        <Pressable onPress={handleSaveAverage} style={[styles.primaryButton, { backgroundColor: palette.tint }]}>
          <Text style={styles.primaryButtonText}>Save baseline</Text>
        </Pressable>

        <View style={styles.infoList}>
          {infoItems.map((item) => (
            <View key={item.label} style={[styles.infoItem, { borderColor: palette.border }]}>
              <Text style={[styles.infoLabel, { color: palette.mutedText }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: palette.text }]}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Support & Care</Text>
        <SettingRow
          palette={palette}
          title="Contact us"
          description="We read every note at screenstreak@gmail.com."
          onPress={handleEmail}
        />
        <SettingRow
          palette={palette}
          title="Privacy settings"
          description="Understand how ScreenStreak uses your data."
          onPress={() => setShowPrivacy(true)}
        />
        <SettingRow
          palette={palette}
          title="Withdrawal guidance"
          description="Know what to do if tapering feels overwhelming."
          onPress={() => setShowSupport(true)}
        />
      </View>

      {showPrivacy && (
        <InlineModal
          title="Privacy at ScreenStreak"
          body={
            'ScreenStreak keeps everything on your device. We do not sell, rent, or share your data. Screen Time statistics never leave your phone unless you choose to email them to us. Delete the app to delete your data.'
          }
          palette={palette}
          onClose={() => setShowPrivacy(false)}
        />
      )}

      {showSupport && (
        <InlineModal title="Withdrawal support" body={SUPPORT_MESSAGE} palette={palette} onClose={() => setShowSupport(false)} />
      )}
    </ScrollView>
  );
}

function SettingRow({
  palette,
  title,
  description,
  control,
  onPress,
}: {
  palette: typeof Colors.light;
  title: string;
  description: string;
  control?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.rowContainer,
        {
          backgroundColor: pressed ? palette.surfaceMuted : 'transparent',
        },
      ]}>
      <View style={styles.rowTextContainer}>
        <Text style={[styles.rowTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.rowDescription, { color: palette.mutedText }]}>{description}</Text>
      </View>
      {control}
    </Pressable>
  );
}

function InlineModal({
  title,
  body,
  onClose,
  palette,
}: {
  title: string;
  body: string;
  onClose: () => void;
  palette: typeof Colors.light;
}) {
  return (
    <View style={[styles.inlineModal, { borderColor: palette.border, backgroundColor: palette.surfaceMuted }]}>
      <Text style={[styles.inlineModalTitle, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.inlineModalBody, { color: palette.mutedText }]}>{body}</Text>
      <Pressable onPress={onClose}>
        <Text style={[styles.linkText, { color: palette.tint }]}>Close</Text>
      </Pressable>
    </View>
  );
}

function formatMinutes(minutes: number): string {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const rem = safeMinutes % 60;
  if (hours === 0) {
    return `${rem} mins`;
  }
  return `${hours}h ${rem.toString().padStart(2, '0')}m`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  card: {
    borderRadius: 22,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
  },
  rowContainer: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  rowTextContainer: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowDescription: {
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: Platform.select({ ios: 12, android: 10, default: 12 }),
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  inputSuffix: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoList: {
    gap: 10,
  },
  infoItem: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  inlineModal: {
    borderRadius: 22,
    padding: 20,
    gap: 12,
  },
  inlineModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  inlineModalBody: {
    fontSize: 15,
    lineHeight: 21,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
