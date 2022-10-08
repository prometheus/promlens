import { binaryOperatorType } from '../../../../promql/ast';

export const scalarBinOp = (op: binaryOperatorType, lhs: number, rhs: number): number => {
  switch (op) {
    case '+':
      return lhs + rhs;
    case '-':
      return lhs - rhs;
    case '*':
      return lhs * rhs;
    case '/':
      return lhs / rhs;
    case '^':
      return Math.pow(lhs, rhs);
    case '%':
      return lhs % rhs;
    case '==':
      return Number(lhs === rhs);
    case '!=':
      return Number(lhs !== rhs);
    case '>':
      return Number(lhs > rhs);
    case '<':
      return Number(lhs < rhs);
    case '>=':
      return Number(lhs >= rhs);
    case '<=':
      return Number(lhs <= rhs);
    default:
      throw new Error('invalid binop');
  }
};

export const vectorElemBinop = (op: binaryOperatorType, lhs: number, rhs: number): { value: number; keep: boolean } => {
  switch (op) {
    case '+':
      return { value: lhs + rhs, keep: true };
    case '-':
      return { value: lhs - rhs, keep: true };
    case '*':
      return { value: lhs * rhs, keep: true };
    case '/':
      return { value: lhs / rhs, keep: true };
    case '^':
      return { value: Math.pow(lhs, rhs), keep: true };
    case '%':
      return { value: lhs % rhs, keep: true };
    case '==':
      return { value: lhs, keep: lhs === rhs };
    case '!=':
      return { value: lhs, keep: lhs !== rhs };
    case '>':
      return { value: lhs, keep: lhs > rhs };
    case '<':
      return { value: lhs, keep: lhs < rhs };
    case '>=':
      return { value: lhs, keep: lhs >= rhs };
    case '<=':
      return { value: lhs, keep: lhs <= rhs };
    default:
      throw new Error('invalid binop');
  }
};
