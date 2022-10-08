// Some of the code below was adapted from Prometheus:
//
// Copyright 2020 The Prometheus Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

declare namespace jquery.flot {
  interface plot extends jquery.flot.plot {
    destroy: () => void;
  }
  interface plotOptions extends jquery.flot.plotOptions {
    tooltip: {
      show?: boolean;
      cssClass?: string;
      content: (
        label: string,
        xval: number,
        yval: number,
        flotItem: jquery.flot.item & {
          series: {
            labels: { [key: string]: string };
            color: string;
            data: (number | null)[][]; // [x,y][]
            index: number;
          };
        }
      ) => string | string;
      xDateFormat?: string;
      yDateFormat?: string;
      monthNames?: string;
      dayNames?: string;
      shifts?: {
        x: number;
        y: number;
      };
      defaultTheme?: boolean;
      lines?: boolean;
      onHover?: () => string;
      $compat?: boolean;
    };
    crosshair: Partial<jquery.flot.axisOptions, 'mode' | 'color'>;
    xaxis: { [K in keyof jquery.flot.axisOptions]: jquery.flot.axisOptions[K] } & {
      showTicks: boolean;
      showMinorTicks: boolean;
      timeBase: 'milliseconds';
    };
    series: { [K in keyof jquery.flot.seriesOptions]: jq.flot.seriesOptions[K] } & {
      stack: boolean;
    };
  }
}

interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
  add: (c: string, d: number) => Color;
  scale: (c: string, f: number) => Color;
  toString: () => string;
  normalize: () => Color;
  clone: () => Color;
}

interface JQueryStatic {
  color: {
    extract: (el: JQuery<HTMLElement>, css?: CSSStyleDeclaration) => Color;
    make: (r?: number, g?: number, b?: number, a?: number) => Color;
    parse: (c: string) => Color;
    scale: () => Color;
  };
}
