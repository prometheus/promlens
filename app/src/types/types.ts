import { ExportedStateV1, ExportedStateV2orV3 } from '../state/reducers';

export interface License {
  email: string;
  validFrom: number;
  validUntil: number;
}

export interface PageConfig {
  license: License | null;
  now: number;
  grafanaDatasources: GrafanaDataSourceSettings[];
  pageState: ExportedStateV1 | ExportedStateV2orV3 | null;
  defaultPrometheusURL: string;
  defaultGrafanaDatasourceID: number;
}

export interface PathPrefixProps {
  pathPrefix: string;
}

export interface Metric {
  [key: string]: string;
}

export type MetricMetadata = Record<string, { type: string; help: string; unit: string }[]>;

export interface GrafanaDataSourceSettings {
  id: number;
  orgID: number;
  name: string;
  type: string;
  access: 'proxy' | 'direct';
  url: string;
  password: string;
  user: string;
  basicAuth: boolean;
  basicAuthUser?: string;
  basicAuthPassword?: string;
  withCredentials?: boolean;
  isDefault: boolean;
  jsonData: Record<string, string>;
}
