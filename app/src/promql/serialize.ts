import ASTNode, {
  VectorSelector,
  matchType,
  vectorMatchCardinality,
  nodeType,
  StartOrEnd,
  MatrixSelector,
  LabelMatcher,
} from './ast';
import { formatDuration, formatDurationOrExpr } from '../utils/utils';
import {
  aggregatorsWithParam,
  maybeParenthesizeBinopChild,
  escapeString,
  isLegacyMetricName,
  maybeQuoteLabelName,
} from './utils';

const serializeAtAndOffset = (
  timestamp: number | null,
  startOrEnd: StartOrEnd,
  offset: number,
  offsetExpr: string | null
): string =>
  `${timestamp !== null ? ` @ ${(timestamp / 1000).toFixed(3)}` : startOrEnd !== null ? ` @ ${startOrEnd}()` : ''}${
    offsetExpr != null
      ? ` offset ${offsetExpr}`
      : offset === 0
      ? ''
      : offset > 0
      ? ` offset ${formatDuration(offset)}`
      : ` offset -${formatDuration(-offset)}`
  }`;

const serializeSelector = (node: VectorSelector | MatrixSelector): string => {
  const matchers = node.matchers
    .filter((m) => !(m.name === '__name__' && m.type === matchType.equal && m.value === node.name))
    .map((m) => `${maybeQuoteLabelName(m.name)}${m.type}"${escapeString(m.value)}"`);

  // A metric name that is not legacy-valid cannot be printed as a prefix and has
  // to go into the braces as a leading quoted string instead.
  let name = node.name;
  if (node.name !== '' && !isLegacyMetricName(node.name)) {
    matchers.unshift(`"${escapeString(node.name)}"`);
    name = '';
  }

  const range = node.type === nodeType.matrixSelector ? `[${formatDurationOrExpr(node.range, node.rangeExpr)}]` : '';
  const extendedAttribute = node.anchored ? ' anchored' : node.smoothed ? ' smoothed' : '';
  const atAndOffset = serializeAtAndOffset(node.timestamp, node.startOrEnd, node.offset, node.offsetExpr);

  return `${name}${matchers.length > 0 ? `{${matchers.join(',')}}` : ''}${range}${extendedAttribute}${atAndOffset}`;
};

const serializeNode = (node: ASTNode, indent = 0, pretty = false, initialIndent = true): string => {
  const childListSeparator = pretty ? '\n' : '';
  const childSeparator = pretty ? '\n' : ' ';
  const childIndent = indent + 2;
  const ind = pretty ? ' '.repeat(indent) : '';
  // Needed for unary operators.
  const initialInd = initialIndent ? ind : '';

  switch (node.type) {
    case nodeType.aggregation:
      return `${initialInd}${node.op}${
        node.without
          ? ` without(${node.grouping.map(maybeQuoteLabelName).join(', ')}) `
          : node.grouping.length > 0
          ? ` by(${node.grouping.map(maybeQuoteLabelName).join(', ')}) `
          : ''
      }(${childListSeparator}${
        aggregatorsWithParam.includes(node.op) && node.param !== null
          ? `${serializeNode(node.param, childIndent, pretty)},${childSeparator}`
          : ''
      }${serializeNode(node.expr, childIndent, pretty)}${childListSeparator}${ind})`;

    case nodeType.subquery:
      return `${initialInd}${serializeNode(node.expr, indent, pretty)}[${formatDurationOrExpr(node.range, node.rangeExpr)}:${
        node.stepExpr != null ? node.stepExpr : node.step !== 0 ? formatDuration(node.step) : ''
      }]${serializeAtAndOffset(node.timestamp, node.startOrEnd, node.offset, node.offsetExpr)}`;

    case nodeType.parenExpr:
      return `${initialInd}(${childListSeparator}${serializeNode(
        node.expr,
        childIndent,
        pretty
      )}${childListSeparator}${ind})`;

    case nodeType.call:
      const sep = node.args.length > 0 ? childListSeparator : '';

      return `${initialInd}${node.func.name}(${sep}${node.args
        .map((arg) => serializeNode(arg, childIndent, pretty))
        .join(',' + childSeparator)}${sep}${node.args.length > 0 ? ind : ''})`;

    case nodeType.matrixSelector:
      return `${initialInd}${serializeSelector(node)}`;

    case nodeType.vectorSelector:
      return `${initialInd}${serializeSelector(node)}`;

    case nodeType.numberLiteral:
      return `${initialInd}${node.val}`;

    case nodeType.stringLiteral:
      return `${initialInd}"${escapeString(node.val)}"`;

    case nodeType.unaryExpr:
      return `${initialInd}${node.op}${serializeNode(node.expr, indent, pretty, false)}`;

    case nodeType.binaryExpr:
      let matching = '';
      let grouping = '';
      let fill = '';
      const vm = node.matching;
      if (vm !== null) {
        if (vm.labels.length > 0 || vm.on) {
          if (vm.on) {
            matching = ` on(${vm.labels.map(maybeQuoteLabelName).join(', ')})`;
          } else {
            matching = ` ignoring(${vm.labels.map(maybeQuoteLabelName).join(', ')})`;
          }

          if (vm.card === vectorMatchCardinality.manyToOne || vm.card === vectorMatchCardinality.oneToMany) {
            grouping = ` group_${vm.card === vectorMatchCardinality.manyToOne ? 'left' : 'right'}(${vm.include
              .map(maybeQuoteLabelName)
              .join(', ')})`;
          }
        }

        if (vm.fillLHS !== undefined || vm.fillRHS !== undefined) {
          if (vm.fillLHS !== undefined && vm.fillRHS !== undefined && vm.fillLHS === vm.fillRHS) {
            fill = ` fill(${vm.fillLHS})`;
          } else {
            if (vm.fillLHS !== undefined) {
              fill += ` fill_left(${vm.fillLHS})`;
            }
            if (vm.fillRHS !== undefined) {
              fill += ` fill_right(${vm.fillRHS})`;
            }
          }
        }
      }

      return `${serializeNode(maybeParenthesizeBinopChild(node.op, node.lhs), childIndent, pretty)}${childSeparator}${ind}${
        node.op
      }${node.bool ? ' bool' : ''}${matching}${grouping}${fill}${childSeparator}${serializeNode(
        maybeParenthesizeBinopChild(node.op, node.rhs),
        childIndent,
        pretty
      )}`;

    case nodeType.placeholder:
      // TODO: Should we just throw an error when trying to serialize an AST containing a placeholder node?
      // (that would currently break editing-as-text of ASTs that contain placeholders)
      return `${initialInd}…${
        node.children.length > 0
          ? `(${childListSeparator}${node.children
              .map((child) => serializeNode(child, childIndent, pretty))
              .join(',' + childSeparator)}${childListSeparator}${ind})`
          : ''
      }`;

    default:
      throw new Error('unsupported node type');
  }
};

export default serializeNode;
