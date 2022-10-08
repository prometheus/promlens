import { valueType } from '../../../promql/ast';

export interface NodeConstraints {
  allowedValueTypes: valueType[];
}
