import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

const SESSION_KEY = 'omnia.session.v1';
const DEVICE_KEY = 'omnia.device.v1';

export type Session = {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
  deviceId: string;
};

export type SessionStatus = 'loading' | 'empty' | 'ready';

type SessionContextValue = {
  session: Session | null;
  status: SessionStatus;
  createSession: (input: { name: string; emoji: string }) => Promise<void>;
  updateSession: (patch: Partial<Pick<Session, 'name' | 'emoji'>>) => Promise<void>;
  endSession: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export const sessionEmojis = ['🌤️', '🛰️', '🪐', '🦊', '🌵', '⚡', '🎧', '📚'];

function randomId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function makeDeviceId(): string {
  return randomId('dev').toUpperCase();
}

function sanitize(value: unknown): Session | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<Session>;
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string' || !raw.name.trim()) {
    return null;
  }
  return {
    id: raw.id,
    name: raw.name.slice(0, 32),
    emoji: typeof raw.emoji === 'string' && raw.emoji ? raw.emoji : sessionEmojis[0],
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    deviceId: typeof raw.deviceId === 'string' && raw.deviceId ? raw.deviceId : makeDeviceId(),
  };
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  useEffect(() => {
    let active = true;
    AsyncStorage.multiGet([SESSION_KEY, DEVICE_KEY])
      .then(([[, storedSession], [, storedDevice]]) => {
        if (!active) return;
        const parsed = storedSession ? sanitize(JSON.parse(storedSession)) : null;
        if (parsed) {
          const withDevice = storedDevice
            ? { ...parsed, deviceId: storedDevice }
            : parsed;
          setSession(withDevice);
          setStatus('ready');
        } else {
          setStatus('empty');
        }
      })
      .catch(() => {
        if (active) setStatus('empty');
      });
    return () => {
      active = false;
    };
  }, []);

  const createSession = useCallback(async (input: { name: string; emoji: string }) => {
    const storedDevice = await AsyncStorage.getItem(DEVICE_KEY).catch(() => null);
    const deviceId = storedDevice ?? makeDeviceId();
    if (!storedDevice) {
      await AsyncStorage.setItem(DEVICE_KEY, deviceId).catch(() => undefined);
    }
    const next: Session = {
      id: randomId('ses'),
      name: input.name.trim().slice(0, 32) || 'Friend',
      emoji: input.emoji,
      createdAt: new Date().toISOString(),
      deviceId,
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
    setStatus('ready');
  }, []);

  const updateSession = useCallback(
    async (patch: Partial<Pick<Session, 'name' | 'emoji'>>) => {
      if (!session) return;
      const next: Session = {
        ...session,
        ...patch,
        name: (patch.name ?? session.name).trim().slice(0, 32) || session.name,
      };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
      setSession(next);
    },
    [session]
  );

  const endSession = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY).catch(() => undefined);
    setSession(null);
    setStatus('empty');
  }, []);

  const value = useMemo(
    () => ({ session, status, createSession, updateSession, endSession }),
    [session, status, createSession, updateSession, endSession]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside SessionProvider');
  return context;
}
