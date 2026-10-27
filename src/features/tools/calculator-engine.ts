export type AngleMode = 'deg' | 'rad';

export type CalculatorHistoryEntry = {
  expression: string;
  result: string;
};

type Token =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: string }
  | { type: 'function'; value: string }
  | { type: 'constant'; value: number }
  | { type: 'left' }
  | { type: 'right' };

const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'sqrt', 'abs']);
const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E, 'π': Math.PI };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < input.length) {
    const char = input[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let end = index;
      let dots = 0;
      while (end < input.length && /[0-9.]/.test(input[end])) {
        if (input[end] === '.') dots += 1;
        end += 1;
      }
      if (dots > 1) throw new Error('Invalid number');
      const raw = input.slice(index, end);
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error('Invalid number');
      tokens.push({ type: 'number', value });
      index = end;
      continue;
    }

    if (/[a-zA-Z]/.test(char)) {
      let end = index;
      while (end < input.length && /[a-zA-Z]/.test(input[end])) end += 1;
      const word = input.slice(index, end).toLowerCase();
      if (word === 'pi') tokens.push({ type: 'constant', value: Math.PI });
      else if (word === 'e') tokens.push({ type: 'constant', value: Math.E });
      else if (FUNCTIONS.has(word)) tokens.push({ type: 'function', value: word });
      else throw new Error(`Unknown name: ${word}`);
      index = end;
      continue;
    }

    if (char === 'π') {
      tokens.push({ type: 'constant', value: Math.PI });
      index += 1;
      continue;
    }

    if ('+-*/^%!'.includes(char)) {
      tokens.push({ type: 'operator', value: char });
      index += 1;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'left' });
      index += 1;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'right' });
      index += 1;
      continue;
    }

    throw new Error(`Unexpected character: ${char}`);
  }

  return tokens;
}

function factorial(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 170) {
    throw new Error('Factorial needs a whole number from 0 to 170');
  }
  let result = 1;
  for (let index = 2; index <= value; index += 1) result *= index;
  return result;
}

function trig(value: number, mode: AngleMode, fn: (input: number) => number) {
  return fn(mode === 'deg' ? (value * Math.PI) / 180 : value);
}

function inverseTrig(value: number, mode: AngleMode, fn: (input: number) => number) {
  const result = fn(value);
  return mode === 'deg' ? (result * 180) / Math.PI : result;
}

class Parser {
  private position = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly angleMode: AngleMode
  ) {}

  parse(): number {
    if (this.tokens.length === 0) throw new Error('Empty expression');
    const value = this.expression();
    if (this.position < this.tokens.length) throw new Error('Unexpected token');
    if (!Number.isFinite(value)) throw new Error('Result is not finite');
    return value;
  }

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private take(): Token {
    const token = this.tokens[this.position];
    if (!token) throw new Error('Unexpected end of expression');
    this.position += 1;
    return token;
  }

  private expression(): number {
    let value = this.term();
    for (;;) {
      const token = this.peek();
      if (token?.type !== 'operator' || (token.value !== '+' && token.value !== '-')) break;
      this.take();
      const right = this.term();
      value = token.value === '+' ? value + right : value - right;
    }
    return value;
  }

  private term(): number {
    let value = this.unary();
    for (;;) {
      const token = this.peek();
      if (token?.type === 'operator' && (token.value === '*' || token.value === '/')) {
        this.take();
        const right = this.unary();
        if (token.value === '/' && right === 0) throw new Error('Cannot divide by zero');
        value = token.value === '*' ? value * right : value / right;
        continue;
      }
      // Implicit multiplication: 2(3 + 4), 2π, 3sin(30)
      if (token?.type === 'number' || token?.type === 'constant' || token?.type === 'left' || token?.type === 'function') {
        value *= this.unary();
        continue;
      }
      break;
    }
    return value;
  }

  private unary(): number {
    const token = this.peek();
    if (token?.type === 'operator' && (token.value === '+' || token.value === '-')) {
      this.take();
      const value = this.unary();
      return token.value === '-' ? -value : value;
    }
    return this.power();
  }

  private power(): number {
    const base = this.postfix();
    const token = this.peek();
    if (token?.type === 'operator' && token.value === '^') {
      this.take();
      return base ** this.unary();
    }
    return base;
  }

  private postfix(): number {
    let value = this.primary();
    for (;;) {
      const token = this.peek();
      if (token?.type !== 'operator' || (token.value !== '%' && token.value !== '!')) break;
      this.take();
      value = token.value === '%' ? value / 100 : factorial(value);
    }
    return value;
  }

  private primary(): number {
    const token = this.take();

    if (token.type === 'number' || token.type === 'constant') return token.value;

    if (token.type === 'left') {
      const value = this.expression();
      const close = this.take();
      if (close.type !== 'right') throw new Error('Missing closing parenthesis');
      return value;
    }

    if (token.type === 'function') {
      const open = this.take();
      if (open.type !== 'left') throw new Error('Function needs parentheses');
      const argument = this.expression();
      const close = this.take();
      if (close.type !== 'right') throw new Error('Missing closing parenthesis');
      return this.applyFunction(token.value, argument);
    }

    throw new Error('Expected a number');
  }

  private applyFunction(name: string, value: number): number {
    switch (name) {
      case 'sin':
        return trig(value, this.angleMode, Math.sin);
      case 'cos':
        return trig(value, this.angleMode, Math.cos);
      case 'tan':
        return trig(value, this.angleMode, Math.tan);
      case 'asin':
        return inverseTrig(value, this.angleMode, Math.asin);
      case 'acos':
        return inverseTrig(value, this.angleMode, Math.acos);
      case 'atan':
        return inverseTrig(value, this.angleMode, Math.atan);
      case 'ln':
        if (value <= 0) throw new Error('ln needs a positive number');
        return Math.log(value);
      case 'log':
        if (value <= 0) throw new Error('log needs a positive number');
        return Math.log10(value);
      case 'sqrt':
        if (value < 0) throw new Error('Square root needs a positive number');
        return Math.sqrt(value);
      case 'abs':
        return Math.abs(value);
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }
}

export function evaluateExpression(input: string, angleMode: AngleMode = 'deg'): number {
  const tokens = tokenize(input);
  return new Parser(tokens, angleMode).parse();
}

export function formatCalculatorResult(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) < 1e-12) return '0';
  if (Math.abs(value) >= 1e12 || Math.abs(value) < 1e-9) {
    return value.toExponential(6).replace(/e\+/, 'e').replace(/\.?0+e/, 'e');
  }
  const rounded = Number(value.toPrecision(12));
  return String(rounded);
}

export function evaluateAndFormat(input: string, angleMode: AngleMode = 'deg'): string | null {
  try {
    return formatCalculatorResult(evaluateExpression(input, angleMode));
  } catch {
    return null;
  }
}
