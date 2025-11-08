import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Platform } from 'react-native';

type ReductionGoal = 15 | 10 | 5;

export type ScreenStreakState = {
  permissionGranted: boolean;
  reductionGoal: ReductionGoal | null;
  averageDailyMinutes: number;
  dailyLimit: number;
  todaysUsageMinutes: number;
  streakCount: number;
  totalTimeSavedMinutes: number;
  daysTracked: number;
  lastUpdatedDate: string | null;
  activitiesSeed: number;
  notificationsEnabled: boolean;
};

type ScreenStreakContextValue = {
  state: ScreenStreakState;
  isHydrated: boolean;
  todaysActivities: string[];
  setPermissionGranted: (granted: boolean) => Promise<void>;
  setReductionGoal: (goal: ReductionGoal) => Promise<void>;
  setAverageDailyMinutes: (minutes: number) => Promise<void>;
  logUsage: (minutes: number) => Promise<void>;
  resetTodayUsage: () => Promise<void>;
  refreshActivities: () => void;
  toggleNotifications: (enabled: boolean) => Promise<void>;
};

const STORAGE_KEY = 'screenstreak:state';

const defaultState: ScreenStreakState = {
  permissionGranted: false,
  reductionGoal: null,
  averageDailyMinutes: 210,
  dailyLimit: 210,
  todaysUsageMinutes: 0,
  streakCount: 0,
  totalTimeSavedMinutes: 0,
  daysTracked: 0,
  lastUpdatedDate: null,
  activitiesSeed: Date.now(),
  notificationsEnabled: false,
};

const ScreenStreakContext = createContext<ScreenStreakContextValue | undefined>(undefined);

const ACTIVITIES: string[] = [
  'Write a short journal entry',
  'Call someone you care about',
  'Take a 10-minute walk without your phone',
  'Stretch or do a quick yoga flow',
  'Read a single chapter of a book',
  'Declutter one drawer or shelf',
  'Prepare a nutritious snack',
  'Practice a breathing exercise',
  'Sketch something you see',
  'Plan tomorrow’s top three priorities',
  'Try a mindfulness body scan',
  'Practice an instrument or sing',
  'Review your finances for 10 minutes',
  'Water your plants or tend to a garden',
  'Free-write whatever’s on your mind',
  'Listen to a full song with your eyes closed',
  'Organize your photo library',
  'Do a quick home workout',
  'Learn a new word and use it in a sentence',
  'Write a postcard or letter',
  'Cook something from scratch',
  'Review your goals and progress',
  'Do a random act of kindness',
  'Meditate without an app',
  'Tidy up your workspace',
];

const ANCHOR_ACTIVITY = 'Learn to be bored.';

function todayKey(): string {
  return new Date().toISOString().split('T')[0]!;
}

function applyDailyRollover(state: ScreenStreakState): ScreenStreakState | null {
  const today = todayKey();
  if (state.lastUpdatedDate === today) {
    return null;
  }

  if (!state.lastUpdatedDate) {
    return { ...state, lastUpdatedDate: today };
  }

  const savedMinutes = Math.max(0, state.dailyLimit - state.todaysUsageMinutes);
  const metGoal = state.todaysUsageMinutes <= state.dailyLimit;

  return {
    ...state,
    totalTimeSavedMinutes: state.totalTimeSavedMinutes + savedMinutes,
    daysTracked: state.daysTracked + 1,
    streakCount: metGoal ? state.streakCount + 1 : 0,
    todaysUsageMinutes: 0,
    lastUpdatedDate: today,
  };
}

function seededSelection(seed: number): string[] {
  const pool = [...ACTIVITIES];
  const selected: string[] = [];
  let currentSeed = seed || 1;

  for (let i = 0; i < 5 && pool.length > 0; i++) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    const randomIndex = Math.floor((currentSeed / 233280) * pool.length);
    selected.push(pool.splice(randomIndex, 1)[0]!);
  }

  return selected;
}

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function scheduleDailySummaryNotification(state: ScreenStreakState) {
  if (Platform.OS === 'web') {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'ScreenStreak Daily Recap',
      body: `You used ${Math.round(state.todaysUsageMinutes)} of ${state.dailyLimit} minutes today. Streak: ${state.streakCount} day${state.streakCount === 1 ? '' : 's'}.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
      channelId: Platform.OS === 'android' ? 'daily-summary' : undefined,
    },
  });
}

export function ScreenStreakProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScreenStreakState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);
  const isSchedulingRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: ScreenStreakState = JSON.parse(raw);
          setState({
            ...defaultState,
            ...parsed,
          });
        }
      } catch (error) {
        console.warn('Failed to load ScreenStreak state', error);
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const rollover = applyDailyRollover(state);
    if (rollover) {
      setState(rollover);
    }
  }, [isHydrated, state.lastUpdatedDate]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((error) => {
      console.warn('Failed to persist ScreenStreak state', error);
    });
  }, [state, isHydrated]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    Notifications.setNotificationChannelAsync('daily-summary', {
      name: 'Daily Summary',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: undefined,
      vibrationPattern: [0, 250, 250, 250],
    }).catch((error) => {
      console.warn('Failed to set Android notification channel', error);
    });
  }, []);

  useEffect(() => {
    if (!isHydrated || !state.notificationsEnabled || isSchedulingRef.current) {
      return;
    }

    isSchedulingRef.current = true;
    scheduleDailySummaryNotification(state)
      .catch((error) => {
        console.warn('Failed to schedule notification', error);
      })
      .finally(() => {
        isSchedulingRef.current = false;
      });
  }, [
    isHydrated,
    state.notificationsEnabled,
    state.dailyLimit,
    state.todaysUsageMinutes,
    state.streakCount,
  ]);

  const todaysActivities = useMemo(() => {
    const curated = seededSelection(state.activitiesSeed);
    return [...curated, ANCHOR_ACTIVITY];
  }, [state.activitiesSeed]);

  const setPermissionGranted = useCallback(
    async (granted: boolean) => {
      setState((prev) => ({
        ...prev,
        permissionGranted: granted,
      }));
    },
    [setState],
  );

  const setReductionGoal = useCallback(
    async (goal: ReductionGoal) => {
      setState((prev) => ({
        ...prev,
        reductionGoal: goal,
        dailyLimit: Math.max(0, prev.averageDailyMinutes - goal),
      }));
    },
    [setState],
  );

  const setAverageDailyMinutes = useCallback(
    async (minutes: number) => {
      setState((prev) => {
        const goal = prev.reductionGoal ?? 0;
        return {
          ...prev,
          averageDailyMinutes: minutes,
          dailyLimit: Math.max(0, minutes - goal),
        };
      });
    },
    [setState],
  );

  const logUsage = useCallback(
    async (minutes: number) => {
      setState((prev) => ({
        ...prev,
        todaysUsageMinutes: Math.max(0, minutes),
      }));
    },
    [setState],
  );

  const resetTodayUsage = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      todaysUsageMinutes: 0,
    }));
  }, [setState]);

  const refreshActivities = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activitiesSeed: Date.now(),
    }));
  }, [setState]);

  const toggleNotifications = useCallback(
    async (enabled: boolean) => {
      if (Platform.OS === 'web') {
        Alert.alert('Not available on web', 'Push notifications are only supported on devices.');
        return;
      }

      if (enabled) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission needed',
            'Enable notifications in your settings so we can share your daily ScreenStreak recap.',
          );
          return;
        }

        await scheduleDailySummaryNotification(state);
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }

      setState((prev) => ({
        ...prev,
        notificationsEnabled: enabled,
      }));
    },
    [setState, state],
  );

  const value = useMemo(
    () => ({
      state,
      isHydrated,
      todaysActivities,
      setPermissionGranted,
      setReductionGoal,
      setAverageDailyMinutes,
      logUsage,
      resetTodayUsage,
      refreshActivities,
      toggleNotifications,
    }),
    [
      isHydrated,
      logUsage,
      resetTodayUsage,
      refreshActivities,
      setAverageDailyMinutes,
      setPermissionGranted,
      setReductionGoal,
      state,
      todaysActivities,
      toggleNotifications,
    ],
  );

  return (
    <ScreenStreakContext.Provider value={value}>{children}</ScreenStreakContext.Provider>
  );
}

export function useScreenStreak() {
  const context = useContext(ScreenStreakContext);
  if (!context) {
    throw new Error('useScreenStreak must be used within a ScreenStreakProvider');
  }
  return context;
}
