import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useReducer, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useWindowDimensions } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Badge, IconTile } from '@/components/ui/controls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/features/theme/theme-provider';
import { fonts, radius, space } from '@/features/theme/tokens';
import { tapFeedback, successFeedback, warningFeedback } from '@/lib/haptics';
import { useResponsive } from '@/lib/use-responsive';

import {
  COLS,
  COLORS,
  KINDS,
  ROWS,
  GHOST_COLOR,
  SHAPES,
  type Board,
  type Piece,
  type TetrominoKind,
  clearLines,
  collides,
  createEmptyBoard,
  calculateScore,
  getCells,
  getDropSpeed,
  getGhostPiece,
  mergePiece,
  movePiece,
  rotatePiece,
  spawnPiece,
} from './tetris-engine';

const HIGH_SCORE_KEY = 'omnia.tetris.highscore';

export type TetrisProps = {
  /** Called when the player starts a new game; kept for future deep links. */
  compact?: boolean;
};

type Queue = TetrominoKind[];

function createBag(): Queue {
  const bag = KINDS.slice();
  for (let index = bag.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = bag[index];
    bag[index] = bag[swapIndex];
    bag[swapIndex] = temp;
  }
  return bag;
}

type GameState = {
  board: Board;
  current: Piece;
  next: Queue;
  hold: TetrominoKind | null;
  bag: Queue;
  canHold: boolean;
  score: number;
  lines: number;
  level: number;
  combo: number;
  b2b: boolean;
  status: 'idle' | 'playing' | 'paused' | 'gameover';
  hardDropDistance: number;
  softDropDistance: number;
  highScore: number;
};

type Action =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESTART' }
  | { type: 'GRAVITY' }
  | { type: 'MOVE'; dx: number; dy: number; soft?: boolean }
  | { type: 'ROTATE'; direction?: 1 | -1 }
  | { type: 'HARD_DROP' }
  | { type: 'HOLD' }
  | { type: 'SET_HIGH_SCORE'; value: number };

function ensureQueue(next: Queue, bag: Queue): { next: Queue; bag: Queue } {
  let queue = next.slice();
  let remaining = bag.slice();
  while (queue.length < 12) {
    if (remaining.length === 0) {
      remaining = createBag();
    }
    const piece = remaining.shift();
    if (!piece) break;
    queue.push(piece);
  }
  return { next: queue, bag: remaining };
}

function spawnCurrent(next: Queue, bag: Queue, highScore: number): GameState {
  const refill = ensureQueue(next, bag);
  const current = spawnPiece(refill.next[0]);
  const upcoming = refill.next.slice(1);
  return {
    board: createEmptyBoard(),
    current,
    next: upcoming,
    hold: null,
    bag: refill.bag,
    canHold: true,
    score: 0,
    lines: 0,
    level: 1,
    combo: -1,
    b2b: false,
    status: 'playing',
    hardDropDistance: 0,
    softDropDistance: 0,
    highScore,
  };
}

function lockPiece(state: GameState, hardDropCells: number, softDropCells: number): GameState {
  const board = mergePiece(state.board, state.current);
  const result = clearLines(board);
  const cleared = result.cleared;
  const nextQueue = state.next.slice();
  const bag = state.bag.slice();
  const refill = ensureQueue(nextQueue, bag);

  let combo = cleared > 0 ? state.combo + 1 : -1;
  let b2b = state.b2b;
  let addedScore = hardDropCells * 2 + softDropCells;
  if (cleared > 0) {
    const base =
      cleared === 1 ? 40 : cleared === 2 ? 100 : cleared === 3 ? 300 : cleared >= 4 ? 500 : 0;
    const backToBackMultiplier = cleared >= 4 && b2b ? 1.5 : 1;
    addedScore += base * state.level * backToBackMultiplier + combo * 50 * state.level;
  }
  if (cleared < 4) {
    b2b = false;
  } else if (cleared >= 4) {
    b2b = true;
  }

  const newLines = state.lines + cleared;
  const newLevel = Math.floor(newLines / 10) + 1;
  const current = spawnPiece(refill.next[0]);
  const next = refill.next.slice(1);

  let newStatus: GameState['status'] = 'playing';
  if (collides(state.board, current)) {
    newStatus = 'gameover';
  }

  const newHighScore = Math.max(state.highScore, state.score + addedScore);

  return {
    ...state,
    board: result.board,
    current,
    next,
    bag: refill.bag,
    canHold: true,
    hold: state.hold,
    score: state.score + addedScore,
    lines: newLines,
    level: newLevel,
    combo,
    b2b,
    status: newStatus,
    hardDropDistance: 0,
    softDropDistance: 0,
    highScore: newHighScore,
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_HIGH_SCORE':
      return { ...state, highScore: action.value };
    case 'START':
      return spawnCurrent([], createBag(), state.highScore);
    case 'RESTART':
      return spawnCurrent([], createBag(), state.highScore);
    case 'PAUSE':
      return state.status === 'playing' ? { ...state, status: 'paused' } : state;
    case 'RESUME':
      return state.status === 'paused' ? { ...state, status: 'playing' } : state;
    case 'GRAVITY': {
      if (state.status !== 'playing') return state;
      const moved = movePiece(state.board, state.current, 0, 1);
      if (moved !== state.current) {
        return { ...state, current: moved, softDropDistance: state.softDropDistance };
      }
      return lockPiece(state, 0, 0);
    }
    case 'MOVE': {
      if (state.status !== 'playing') return state;
      const { dx, dy, soft } = action;
      const current = movePiece(state.board, state.current, dx, dy);
      if (current === state.current) {
        // allow lock only on downward moves
        if (dy > 0) return lockPiece(state, 0, soft ? 1 : 0);
        return state;
      }
      let addedSoft = state.softDropDistance;
      if (soft && dy > 0) addedSoft += 1;
      return { ...state, current, softDropDistance: addedSoft };
    }
    case 'ROTATE': {
      if (state.status !== 'playing') return state;
      const next = rotatePiece(state.current, state.board, action.direction ?? 1);
      if (next === state.current) return state;
      return { ...state, current: next };
    }
    case 'HARD_DROP': {
      if (state.status !== 'playing') return state;
      const ghost = getGhostPiece(state.board, state.current);
      const distance = ghost.y - state.current.y;
      return lockPiece({ ...state, current: { ...state.current, y: ghost.y } }, distance, 0);
    }
    case 'HOLD': {
      if (state.status !== 'playing' || !state.canHold) return state;
      const currentKind = state.current.kind;
      let nextCurrent: Piece;
      if (state.hold === null) {
        nextCurrent = spawnPiece(state.next[0]);
        const rest = state.next.slice(1);
        const refill = ensureQueue(rest, state.bag);
        const hold = currentKind;
        if (collides(state.board, nextCurrent)) {
          return { ...state, status: 'gameover', highScore: Math.max(state.highScore, state.score) };
        }
        return {
          ...state,
          current: nextCurrent,
          next: refill.next,
          bag: refill.bag,
          hold,
          canHold: false,
        };
      }
      const holdKind = state.hold as TetrominoKind;
      nextCurrent = spawnPiece(holdKind);
      if (collides(state.board, nextCurrent)) {
        return { ...state, status: 'gameover', highScore: Math.max(state.highScore, state.score) };
      }
      return {
        ...state,
        current: nextCurrent,
        hold: currentKind,
        canHold: false,
      };
    }
    default:
      return state;
  }
}

// Lazy initial state: avoid async storage in reducer; load high score in effect.
function makeInitialState(highScore = 0): GameState {
  return spawnCurrent([], createBag(), highScore);
}

interface TetrisBoardProps {
  state: GameState;
  cellSize: number;
}

function buildDisplayBoard(state: GameState): Board {
  const board = state.board.map((row) => row.slice());
  if (state.status === 'gameover') return board;
  const currentColor = COLORS[state.current.kind];
  const ghost = getGhostPiece(state.board, state.current);
  for (const cell of getCells(ghost)) {
    if (cell.y >= 0 && cell.x >= 0 && cell.x < COLS && board[cell.y][cell.x] === null) {
      board[cell.y][cell.x] = GHOST_COLOR;
    }
  }
  for (const cell of getCells(state.current)) {
    if (cell.y >= 0 && cell.x >= 0 && cell.x < COLS) {
      board[cell.y][cell.x] = currentColor;
    }
  }
  return board;
}

function TetrisBoard({ state, cellSize }: TetrisBoardProps) {
  const { theme } = useTheme();
  const display = useMemo(() => buildDisplayBoard(state), [state]);
  return (
    <View
      style={[
        styles.board,
        {
          width: cellSize * COLS,
          height: cellSize * ROWS,
          backgroundColor: theme.surfaceRaised,
          borderColor: theme.borderStrong,
        },
      ]}>
      {display.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell, cellIndex) => (
            <View
              key={cellIndex}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: cell ? cell : 'transparent',
                  borderColor: theme.isDark ? 'rgba(255,255,255,0.035)' : 'rgba(20,16,35,0.05)',
                },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function PiecePreview({ kind, title, cellSize }: { kind: TetrominoKind | null; title: string; cellSize: number }) {
  const { theme } = useTheme();
  const grid = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => null as string | null));
  if (kind) {
    const cells = SHAPES[kind][0];
    const color = COLORS[kind];
    for (const cell of cells) {
      if (grid[cell.y]?.[cell.x] !== undefined) {
        grid[cell.y][cell.x] = color;
      }
    }
  }
  return (
    <View style={styles.previewWrap}>
      <AppText variant="caption" color={theme.textFaint} style={styles.previewTitle}>
        {title}
      </AppText>
      <View style={[styles.preview, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, cellIndex) => (
              <View
                key={cellIndex}
                style={[
                  styles.previewCell,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: cell ?? 'transparent',
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.stat}>
      <AppText variant="caption" color={theme.textFaint} style={styles.statLabel}>
        {label}
      </AppText>
      <AppText variant="h3" color={theme.text} numberOfLines={1} style={styles.statValue}>
        {value}
      </AppText>
    </View>
  );
}

function RepeatButton({
  label,
  onPress,
  onRepeat,
  style,
}: {
  label: string;
  onPress: () => void;
  onRepeat?: () => void;
  style?: object;
}) {
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.controlButton,
        { opacity: pressed ? 0.72 : 1 },
        style,
      ]}
      onPressIn={() => {
        onPress();
        if (onRepeat) {
          holdTimer.current = setTimeout(() => {
            interval.current = setInterval(onRepeat, 105);
          }, 180);
        }
      }}
      onPressOut={() => {
        if (holdTimer.current) clearTimeout(holdTimer.current);
        if (interval.current) clearInterval(interval.current);
        holdTimer.current = null;
        interval.current = null;
      }}>
      <Text style={styles.controlText}>{label}</Text>
    </Pressable>
  );
}

export function Tetris() {
  const { theme } = useTheme();
  const { isMobile } = useResponsive();
  const { width } = useWindowDimensions();
  const [state, dispatch] = useReducer(reducer, makeInitialState());
  const repeatLastMove = useRef<number | null>(null);
  const boardCellSize = isMobile ? Math.floor(width * 0.16) : 27;
  const clampCell = Math.max(16, Math.min(boardCellSize, Math.floor(((width - (isMobile ? 24 : 120)) / COLS))));
  const finalCell = Math.min(clampCell, 27);
  const previewCell = isMobile ? 11 : 14;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(HIGH_SCORE_KEY)
      .then((value) => {
        const parsed = value ? Number(value) : 0;
        if (active && Number.isFinite(parsed) && parsed > 0) {
          dispatch({ type: 'SET_HIGH_SCORE', value: parsed });
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (state.status === 'gameover' && state.score >= state.highScore && state.highScore > 0) {
      AsyncStorage.setItem(HIGH_SCORE_KEY, String(state.highScore)).catch(() => undefined);
    }
    if (state.status === 'gameover' && state.score > state.highScore) {
      AsyncStorage.setItem(HIGH_SCORE_KEY, String(state.score)).catch(() => undefined);
      dispatch({ type: 'SET_HIGH_SCORE', value: state.score });
    }
  }, [state.status, state.score, state.highScore]);

  useEffect(() => {
    if (state.status !== 'playing') return;
    const speed = getDropSpeed(state.level);
    const timer = setInterval(() => dispatch({ type: 'GRAVITY' }), speed);
    return () => clearInterval(timer);
  }, [state.status, state.level]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (state.status === 'gameover') {
        if (event.code === 'KeyR') {
          dispatch({ type: 'RESTART' });
          tapFeedback();
        }
        return;
      }
      switch (event.code) {
        case 'ArrowLeft':
          dispatch({ type: 'MOVE', dx: -1, dy: 0 });
          tapFeedback();
          event.preventDefault();
          break;
        case 'ArrowRight':
          dispatch({ type: 'MOVE', dx: 1, dy: 0 });
          tapFeedback();
          event.preventDefault();
          break;
        case 'ArrowDown':
          dispatch({ type: 'MOVE', dx: 0, dy: 1, soft: true });
          tapFeedback();
          event.preventDefault();
          break;
        case 'ArrowUp':
        case 'KeyX':
          dispatch({ type: 'ROTATE', direction: 1 });
          tapFeedback();
          event.preventDefault();
          break;
        case 'KeyZ':
          dispatch({ type: 'ROTATE', direction: -1 });
          tapFeedback();
          event.preventDefault();
          break;
        case 'Space':
          dispatch({ type: 'HARD_DROP' });
          tapFeedback();
          event.preventDefault();
          break;
        case 'KeyC':
        case 'ShiftLeft':
          dispatch({ type: 'HOLD' });
          tapFeedback();
          event.preventDefault();
          break;
        case 'KeyP':
          dispatch({ type: state.status === 'playing' ? 'PAUSE' : 'RESUME' });
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.status, dispatch, isMobile]);

  useEffect(() => {
    if (state.status === 'gameover') warningFeedback();
  }, [state.status]);

  const onPause = () => {
    tapFeedback();
    dispatch({ type: state.status === 'playing' ? 'PAUSE' : 'RESUME' });
  };

  const onStart = () => {
    tapFeedback();
    if (state.status === 'idle' || state.status === 'gameover') {
      dispatch({ type: state.status === 'gameover' ? 'RESTART' : 'START' });
    } else {
      dispatch({ type: state.status === 'paused' ? 'RESUME' : 'PAUSE' });
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <IconTile name="grid-outline" tone="coral" size={40} iconSize={19} />
          <View style={styles.headerText}>
            <AppText variant="h3">Tetris</AppText>
            <AppText variant="small" color={theme.textMuted}>
              Full-color puzzle · ghost piece, hold &amp; levels
            </AppText>
          </View>
        </View>
        <Badge label={state.status === 'playing' ? 'Live' : state.status === 'paused' ? 'Paused' : state.status === 'gameover' ? 'Game over' : 'Idle'} tone={state.status === 'playing' ? 'mint' : 'neutral'} dot={state.status === 'playing'} />
      </View>

      <View style={[styles.playField, isMobile ? styles.playFieldMobile : styles.playFieldDesktop]}>
        <TetrisBoard state={state} cellSize={finalCell} />
        <View style={[styles.side, isMobile ? styles.sideMobile : styles.sideDesktop]}>
          <PiecePreview kind={state.hold} title="Hold" cellSize={previewCell} />
          <View style={styles.statsBlock}>
            <Stat label="Score" value={state.score.toLocaleString()} />
            <Stat label="Lines" value={String(state.lines)} />
            <Stat label="Level" value={String(state.level)} />
            <Stat label="Best" value={state.highScore.toLocaleString()} />
          </View>
          <PiecePreview kind={state.next[0] ?? null} title="Next" cellSize={previewCell} />
          <View style={styles.nextQueue}>
            {state.next.slice(1, 4).map((kind, index) => (
              <View key={`${kind}-${index}`} style={styles.nextTiny}>
                <Text style={[styles.tinyPiece, { color: COLORS[kind] }]}>{kind}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <RepeatButton label="←" onPress={() => { dispatch({ type: 'MOVE', dx: -1, dy: 0 }); tapFeedback(); }} onRepeat={() => { dispatch({ type: 'MOVE', dx: -1, dy: 0 }); }} />
          <RepeatButton label="↻" onPress={() => { dispatch({ type: 'ROTATE', direction: 1 }); tapFeedback(); }} />
          <RepeatButton label="→" onPress={() => { dispatch({ type: 'MOVE', dx: 1, dy: 0 }); tapFeedback(); }} onRepeat={() => { dispatch({ type: 'MOVE', dx: 1, dy: 0 }); }} />
          <RepeatButton label="↺" onPress={() => { dispatch({ type: 'ROTATE', direction: -1 }); tapFeedback(); }} />
        </View>
        <View style={styles.controlRow}>
          <RepeatButton label="Hold" onPress={() => { dispatch({ type: 'HOLD' }); tapFeedback(); }} />
          <RepeatButton label="↓" onPress={() => { dispatch({ type: 'MOVE', dx: 0, dy: 1, soft: true }); tapFeedback(); }} onRepeat={() => { dispatch({ type: 'MOVE', dx: 0, dy: 1, soft: true }); }} />
          <Button label="Drop" size="sm" variant="secondary" onPress={() => { dispatch({ type: 'HARD_DROP' }); tapFeedback(); }} style={styles.dropButton} />
          <Button label={state.status === 'playing' ? 'Pause' : state.status === 'paused' ? 'Resume' : state.status === 'gameover' ? 'Retry' : 'Start'} size="sm" variant={state.status === 'playing' ? 'subtle' : 'primary'} onPress={onStart} style={styles.dropButton} />
        </View>
      </View>

      <AppText variant="small" color={theme.textFaint} style={styles.hint}>
        {state.status === 'idle'
          ? 'Press Start or ↑ on the keyboard. ← → to move, ↑ rotate, Space to drop, C to hold, P to pause.'
          : state.status === 'paused'
            ? 'Paused. Resume or start a fresh game anytime.'
            : state.status === 'gameover'
              ? 'Game over. Press Start to play again.'
              : 'Touch controls below or use the keyboard. Clear a full row for points.'}
      </AppText>

      {state.status === 'gameover' ? (
        <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.overlayCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <AppText variant="h2" color={theme.text}>Game over</AppText>
            <AppText variant="body" color={theme.textMuted}>
              Score {state.score.toLocaleString()} · {state.lines} lines · level {state.level}
            </AppText>
            {state.score >= state.highScore && state.score > 0 ? (
              <AppText variant="small" color={theme.mint}>New best score</AppText>
            ) : null}
            <Button label="Play again" variant="primary" onPress={() => { dispatch({ type: 'RESTART' }); tapFeedback(); }} style={styles.playAgain} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

export default Tetris;

const styles = StyleSheet.create({
  card: {
    gap: 18,
    padding: 22,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
  },
  headerText: {
    gap: 1,
    flex: 1,
  },
  playField: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playFieldDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
    justifyContent: 'center',
  },
  playFieldMobile: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 18,
  },
  board: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
  },
  side: {
    gap: 12,
    alignItems: 'center',
  },
  sideDesktop: {
    minWidth: 150,
    alignItems: 'flex-start',
  },
  sideMobile: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  previewWrap: {
    gap: 6,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 9,
    letterSpacing: 1.1,
  },
  preview: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewCell: {
    opacity: 0.95,
  },
  statsBlock: {
    gap: 4,
    minWidth: 96,
  },
  stat: {
    gap: 1,
  },
  statLabel: {
    fontSize: 8.5,
    letterSpacing: 1.2,
  },
  statValue: {
    fontSize: 15,
    lineHeight: 20,
  },
  nextQueue: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  nextTiny: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tinyPiece: {
    fontSize: 9,
    fontWeight: '700',
  },
  controls: {
    gap: 8,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  controlButton: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  controlText: {
    color: '#F7F5FB',
    fontSize: 18,
    fontWeight: '700',
  },
  dropButton: {
    minWidth: 86,
  },
  hint: {
    lineHeight: 16,
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  overlayCard: {
    gap: 10,
    padding: 24,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    maxWidth: 360,
    width: '100%',
  },
  playAgain: {
    minWidth: 160,
  },
});
