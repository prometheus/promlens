import ASTNode, { binaryOperatorType, nodeType, valueType, Call, compOperatorTypes, setOperatorTypes } from './ast';
import { functionArgNames } from './functionMeta';

export const getNonParenNodeType = (n: ASTNode) => {
  let cur: ASTNode;
  for (cur = n; cur.type === 'parenExpr'; cur = cur.expr) {}
  return cur.type;
};

export const isComparisonOperator = (op: binaryOperatorType) => {
  return compOperatorTypes.includes(op);
};

export const isSetOperator = (op: binaryOperatorType) => {
  return setOperatorTypes.includes(op);
};

const binOpPrecedence = {
  [binaryOperatorType.add]: 3,
  [binaryOperatorType.sub]: 3,
  [binaryOperatorType.mul]: 2,
  [binaryOperatorType.div]: 2,
  [binaryOperatorType.mod]: 2,
  [binaryOperatorType.pow]: 1,
  [binaryOperatorType.eql]: 4,
  [binaryOperatorType.neq]: 4,
  [binaryOperatorType.gtr]: 4,
  [binaryOperatorType.lss]: 4,
  [binaryOperatorType.gte]: 4,
  [binaryOperatorType.lte]: 4,
  [binaryOperatorType.and]: 5,
  [binaryOperatorType.or]: 6,
  [binaryOperatorType.unless]: 5,
  [binaryOperatorType.atan2]: 2,
};

export const maybeParenthesizeBinopChild = (op: binaryOperatorType, child: ASTNode): ASTNode => {
  if (child.type !== nodeType.binaryExpr) {
    return child;
  }

  if (binOpPrecedence[op] > binOpPrecedence[child.op]) {
    return child;
  }

  // TODO: Parens aren't necessary for left-associativity within same precedence,
  // or right-associativity between two power operators.
  return {
    type: nodeType.parenExpr,
    expr: child,
  };
};

export const getNodeChildren = (node: ASTNode): ASTNode[] => {
  switch (node.type) {
    case nodeType.aggregation:
      return node.param === null ? [node.expr] : [node.param, node.expr];
    case nodeType.subquery:
      return [node.expr];
    case nodeType.parenExpr:
      return [node.expr];
    case nodeType.call:
      return node.args;
    case nodeType.matrixSelector:
    case nodeType.vectorSelector:
    case nodeType.numberLiteral:
    case nodeType.stringLiteral:
      return [];
    case nodeType.placeholder:
      return node.children;
    case nodeType.unaryExpr:
      return [node.expr];
    case nodeType.binaryExpr:
      return [node.lhs, node.rhs];
    default:
      throw new Error('unsupported node type');
  }
};

export const getNodeChild = (node: ASTNode, idx: number) => {
  switch (node.type) {
    case nodeType.aggregation:
      return node.param === null || idx === 1 ? node.expr : node.param;
    case nodeType.subquery:
      return node.expr;
    case nodeType.parenExpr:
      return node.expr;
    case nodeType.call:
      return node.args[idx];
    case nodeType.unaryExpr:
      return node.expr;
    case nodeType.binaryExpr:
      return idx === 0 ? node.lhs : node.rhs;
    default:
      throw new Error('unsupported node type');
  }
};

export const containsPlaceholders = (node: ASTNode): boolean =>
  node.type === nodeType.placeholder || getNodeChildren(node).some((n) => containsPlaceholders(n));

export const nodeValueType = (node: ASTNode): valueType | null => {
  switch (node.type) {
    case nodeType.aggregation:
      return valueType.vector;
    case nodeType.binaryExpr:
      const childTypes = [nodeValueType(node.lhs), nodeValueType(node.rhs)];

      if (childTypes.includes(null)) {
        // One of the children is or a has a placeholder and thus an undefined type.
        return null;
      }

      if (childTypes.includes(valueType.vector)) {
        return valueType.vector;
      }

      return valueType.scalar;
    case nodeType.call:
      return node.func.returnType;
    case nodeType.matrixSelector:
      return valueType.matrix;
    case nodeType.numberLiteral:
      return valueType.scalar;
    case nodeType.parenExpr:
      return nodeValueType(node.expr);
    case nodeType.placeholder:
      return null;
    case nodeType.stringLiteral:
      return valueType.string;
    case nodeType.subquery:
      return valueType.matrix;
    case nodeType.unaryExpr:
      return nodeValueType(node.expr);
    case nodeType.vectorSelector:
      return valueType.vector;
    default:
      throw new Error('invalid node type');
  }
};

export const childDescription = (node: ASTNode, idx: number): string => {
  switch (node.type) {
    case nodeType.aggregation:
      if (aggregatorsWithParam.includes(node.op) && idx === 0) {
        switch (node.op) {
          case 'topk':
          case 'bottomk':
          case 'limitk':
            return 'k';
          case 'quantile':
            return 'quantile';
          case 'limit_ratio':
            return 'ratio';
          case 'count_values':
            return 'target label name';
        }
      }

      return 'vector to aggregate';
    case nodeType.binaryExpr:
      return idx === 0 ? 'left-hand side' : 'right-hand side';
    case nodeType.call:
      if (functionArgNames.hasOwnProperty(node.func.name)) {
        const argNames = functionArgNames[node.func.name];
        return argNames[Math.min(functionArgNames[node.func.name].length - 1, idx)];
      }
      return 'argument';
    case nodeType.parenExpr:
      return 'expression';
    case nodeType.placeholder:
      return 'argument';
    case nodeType.subquery:
      return 'subquery to execute';
    case nodeType.unaryExpr:
      return 'expression';
    default:
      throw new Error('invalid node type');
  }
};

export const aggregatorsWithParam = ['topk', 'bottomk', 'quantile', 'count_values', 'limitk', 'limit_ratio'];

export const anyValueType = [valueType.scalar, valueType.string, valueType.matrix, valueType.vector];

export const allowedChildValueTypes = (node: ASTNode, idx: number): valueType[] => {
  switch (node.type) {
    case nodeType.aggregation:
      if (aggregatorsWithParam.includes(node.op) && idx === 0) {
        if (node.op === 'count_values') {
          return [valueType.string];
        }
        return [valueType.scalar];
      }

      return [valueType.vector];
    case nodeType.binaryExpr:
      // TODO: Do deeper constraint checking here.
      // - Set ops only between vectors.
      // - Bools only for filter ops.
      // - Advanced: check cardinality.
      return [valueType.scalar, valueType.vector];
    case nodeType.call:
      return [node.func.argTypes[Math.min(idx, node.func.argTypes.length - 1)]];
    case nodeType.parenExpr:
      return anyValueType;
    case nodeType.placeholder:
      return anyValueType;
    case nodeType.subquery:
      return [valueType.vector];
    case nodeType.unaryExpr:
      return anyValueType;
    default:
      throw new Error('invalid node type');
  }
};

export const canAddVarArg = (node: Call): boolean => {
  if (node.func.variadic === -1) {
    return true;
  }

  // TODO: Only works for 1 vararg, but PromQL only has functions with either 1 (not 2, 3, ...) or unlimited (-1) varargs in practice, so this is fine for now.
  return node.args.length < node.func.argTypes.length;
};

export const canRemoveVarArg = (node: Call): boolean => {
  return node.func.variadic !== 0 && node.args.length >= node.func.argTypes.length;
};

export const humanizedValueType: Record<valueType, string> = {
  [valueType.none]: 'none',
  [valueType.string]: 'string',
  [valueType.scalar]: 'number (scalar)',
  [valueType.vector]: 'instant vector',
  [valueType.matrix]: 'range vector',
};

// isPrintableRune approximates Go's unicode.IsPrint: letters, marks, numbers,
// punctuation, symbols and the ASCII space are printable.
const isPrintableRune = (ch: string): boolean => ch === ' ' || /[\p{L}\p{M}\p{N}\p{P}\p{S}]/u.test(ch);

// escapeString approximates the escaping of Go's strconv.Quote (without the
// surrounding quotes): control characters get their named or \xXX escapes, other
// non-printable runes are escaped as \uXXXX / \UXXXXXXXX, printable runes are
// kept literal.
export const escapeString = (str: string) => {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.codePointAt(i) as number;
    if (code > 0xffff) {
      i++;
    }
    switch (String.fromCodePoint(code)) {
      case '\\':
        result += '\\\\';
        break;
      case '"':
        result += '\\"';
        break;
      case '\x07':
        result += '\\a';
        break;
      case '\b':
        result += '\\b';
        break;
      case '\f':
        result += '\\f';
        break;
      case '\n':
        result += '\\n';
        break;
      case '\r':
        result += '\\r';
        break;
      case '\t':
        result += '\\t';
        break;
      case '\v':
        result += '\\v';
        break;
      default:
        if (code < 0x20 || code === 0x7f) {
          result += '\\x' + code.toString(16).padStart(2, '0');
        } else if (!isPrintableRune(String.fromCodePoint(code))) {
          if (code > 0xffff) {
            result += '\\U' + code.toString(16).padStart(8, '0');
          } else {
            result += '\\u' + code.toString(16).padStart(4, '0');
          }
        } else {
          result += String.fromCodePoint(code);
        }
    }
  }
  return result;
};

// isLegacyLabelName mirrors Prometheus' legacy label name validation: names not
// matching this pattern have to be quoted when printed.
export const isLegacyLabelName = (name: string): boolean => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);

// isLegacyMetricName mirrors Prometheus' legacy metric name validation, which
// additionally allows colons for recording rule names.
export const isLegacyMetricName = (name: string): boolean => /^[a-zA-Z_:][a-zA-Z0-9_:]*$/.test(name);

export const maybeQuoteLabelName = (name: string): string => (isLegacyLabelName(name) ? name : `"${escapeString(name)}"`);
