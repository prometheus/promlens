import {
  nodeType,
  aggregationType,
  binaryOperatorType,
  VectorMatching,
  Func,
  LabelMatcher,
  unaryOperatorType,
  StartOrEnd,
} from '../promql/ast';

// Normalized AST node types. These are mostly copies of the AST nodes defined in `../promql/ast`,
// but they don't contain child nodes. Instead, child in the normalized state, children are tracked
// separately for each node via the `childIDs` property of the wrapping Node state object.

export interface Aggregation {
  type: nodeType.aggregation;
  op: aggregationType;
  grouping: string[];
  without: boolean;
}

export interface BinaryExpr {
  type: nodeType.binaryExpr;
  op: binaryOperatorType;
  matching: VectorMatching | null;
  bool: boolean;
}

export interface Call {
  type: nodeType.call;
  func: Func;
}

export interface MatrixSelector {
  type: nodeType.matrixSelector;
  name: string;
  matchers: LabelMatcher[];
  range: number;
  offset: number;
  timestamp: number | null;
  startOrEnd: StartOrEnd;
}

export interface Subquery {
  type: nodeType.subquery;
  range: number;
  offset: number;
  step: number;
  timestamp: number | null;
  startOrEnd: StartOrEnd;
}

export interface NumberLiteral {
  type: nodeType.numberLiteral;
  val: string; // Can't be 'number' because JS doesn't support NaN/Inf/-Inf etc.
}

export interface ParenExpr {
  type: nodeType.parenExpr;
}

export interface StringLiteral {
  type: nodeType.stringLiteral;
  val: string;
}

export interface UnaryExpr {
  type: nodeType.unaryExpr;
  op: unaryOperatorType;
}

export interface VectorSelector {
  type: nodeType.vectorSelector;
  name: string;
  matchers: LabelMatcher[];
  offset: number;
  timestamp: number | null;
  startOrEnd: StartOrEnd;
}

export interface Placeholder {
  type: nodeType.placeholder;
}

type ASTNode =
  | Aggregation
  | BinaryExpr
  | Call
  | MatrixSelector
  | Subquery
  | NumberLiteral
  | ParenExpr
  | StringLiteral
  | UnaryExpr
  | VectorSelector
  | Placeholder;

export default ASTNode;
