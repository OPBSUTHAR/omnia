export type Cell = string | null;

export type Board = Cell[][];

export type TetrominoKind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type Rotation = 0 | 1 | 2 | 3;

export type Piece = {
  kind: TetrominoKind;
  rotation: Rotation;
  x: number;
  y: number;
};

export type Point = { x: number; y: number };

export const COLS = 10;
export const ROWS = 20;

export const COLORS: Record<TetrominoKind, string> = {
  I: '#45d4ff',
  O: '#ffd166',
  T: '#a78bfa',
  S: '#6ee7a8',
  Z: '#ff8ea0',
  J: '#8cb4ff',
  L: '#ffb347',
};

export const GHOST_COLOR = 'rgba(255,255,255,0.18)';

export const SHAPES: Record<TetrominoKind, Point[][]> = {
  I: [
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ],
    [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ],
    [
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
    ],
  ],
  O: [
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  ],
  T: [
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
  S: [
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
  Z: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
    ],
  ],
  J: [
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  ],
  L: [
    [
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
};

export const KINDS: TetrominoKind[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));
}

export function getCells(piece: Piece): Point[] {
  return SHAPES[piece.kind][piece.rotation].map((point) => ({
    x: piece.x + point.x,
    y: piece.y + point.y,
  }));
}

export function collides(board: Board, piece: Piece): boolean {
  return getCells(piece).some((cell) => {
    if (cell.x < 0 || cell.x >= COLS || cell.y >= ROWS) return true;
    if (cell.y < 0) return false;
    return board[cell.y][cell.x] !== null;
  });
}

export function rotatePiece(piece: Piece, board: Board, direction: 1 | -1 = 1): Piece {
  let nextRot = (direction === 1 ? piece.rotation + 1 : piece.rotation - 1 + 4) % 4;
  if (piece.kind === 'O') {
    const next = { ...piece, rotation: nextRot as Rotation };
    return collides(board, next) ? piece : next;
  }

  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    const next: Piece = {
      ...piece,
      rotation: nextRot as Rotation,
      x: piece.x + kick,
    };
    if (!collides(board, next)) return next;
  }
  return piece;
}

export function movePiece(board: Board, piece: Piece, dx: number, dy: number): Piece {
  const next = { ...piece, x: piece.x + dx, y: piece.y + dy };
  if (collides(board, next)) return piece;
  return next;
}

export function mergePiece(board: Board, piece: Piece): Board {
  const next = board.map((row) => row.slice());
  for (const cell of getCells(piece)) {
    if (cell.y >= 0 && cell.y < ROWS && cell.x >= 0 && cell.x < COLS) {
      next[cell.y][cell.x] = COLORS[piece.kind];
    }
  }
  return next;
}

export function clearLines(board: Board): { board: Board; cleared: number } {
  const keptRows = board.filter((row) => row.some((cell) => cell === null));
  const cleared = ROWS - keptRows.length;
  const emptyRows = Array.from({ length: cleared }, () =>
    Array.from({ length: COLS }, () => null)
  );
  return { board: [...emptyRows, ...keptRows], cleared: cleared };
}

export function getGhostPiece(board: Board, piece: Piece): Piece {
  let ghost = { ...piece };
  while (true) {
    const next = { ...ghost, y: ghost.y + 1 };
    if (collides(board, next)) break;
    ghost = next;
  }
  return ghost;
}

export function spawnPiece(kind: TetrominoKind): Piece {
  return { kind, rotation: 0, x: 3, y: -1 };
}

export function isGameOver(board: Board, piece: Piece): boolean {
  return collides(board, piece);
}

export function getDropSpeed(level: number): number {
  const table = [1000, 793, 618, 473, 355, 262, 190, 135, 100, 71, 50];
  const idx = Math.max(0, Math.min(table.length - 1, level - 1));
  return table[idx];
}

export function calculateScore(cleared: number, level: number, combo: number, hardDrop: number, softDrop: number): number {
  const base =
    cleared === 1 ? 40 : cleared === 2 ? 100 : cleared === 3 ? 300 : cleared >= 4 ? 500 : 0;
  return (
    base * level * (cleared === 4 && combo > 0 ? 1.5 : 1) +
    hardDrop * 2 +
    softDrop * 1 +
    combo * 50 * level
  );
}
