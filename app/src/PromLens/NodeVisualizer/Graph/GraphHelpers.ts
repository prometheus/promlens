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

import $ from 'jquery';

import { escapeHTML } from '../../../utils/html';
import { GraphProps, GraphSeries } from './Graph';
import { RangeSamples } from '../../QueryList/QueryView/QueryResultTypes';

export const formatValue = (y: number | null): string => {
  if (y === null) {
    return 'null';
  }
  const absY = Math.abs(y);

  if (absY >= 1e24) {
    return (y / 1e24).toFixed(2) + 'Y';
  } else if (absY >= 1e21) {
    return (y / 1e21).toFixed(2) + 'Z';
  } else if (absY >= 1e18) {
    return (y / 1e18).toFixed(2) + 'E';
  } else if (absY >= 1e15) {
    return (y / 1e15).toFixed(2) + 'P';
  } else if (absY >= 1e12) {
    return (y / 1e12).toFixed(2) + 'T';
  } else if (absY >= 1e9) {
    return (y / 1e9).toFixed(2) + 'G';
  } else if (absY >= 1e6) {
    return (y / 1e6).toFixed(2) + 'M';
  } else if (absY >= 1e3) {
    return (y / 1e3).toFixed(2) + 'k';
  } else if (absY >= 1) {
    return y.toFixed(2);
  } else if (absY === 0) {
    return y.toFixed(2);
  } else if (absY < 1e-23) {
    return (y / 1e-24).toFixed(2) + 'y';
  } else if (absY < 1e-20) {
    return (y / 1e-21).toFixed(2) + 'z';
  } else if (absY < 1e-17) {
    return (y / 1e-18).toFixed(2) + 'a';
  } else if (absY < 1e-14) {
    return (y / 1e-15).toFixed(2) + 'f';
  } else if (absY < 1e-11) {
    return (y / 1e-12).toFixed(2) + 'p';
  } else if (absY < 1e-8) {
    return (y / 1e-9).toFixed(2) + 'n';
  } else if (absY < 1e-5) {
    return (y / 1e-6).toFixed(2) + 'µ';
  } else if (absY < 1e-2) {
    return (y / 1e-3).toFixed(2) + 'm';
  } else if (absY <= 1) {
    return y.toFixed(2);
  }
  throw Error("couldn't format a value, this is a bug");
};

export const getHoverColor = (color: string, opacity: number, stacked: boolean) => {
  const { r, g, b } = $.color.parse(color);
  if (!stacked) {
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  /*
    Unfortunetly flot doesn't take into consideration
    the alpha value when adjusting the color on the stacked series.
    TODO: find better way to set the opacity.
  */
  const base = (1 - opacity) * 255;
  return `rgb(${Math.round(base + opacity * r)},${Math.round(base + opacity * g)},${Math.round(base + opacity * b)})`;
};

export const toHoverColor = (index: number, stacked: boolean) => (series: GraphSeries, i: number) => ({
  ...series,
  color: getHoverColor(series.color, i !== index ? 0.3 : 1, stacked),
});

export const getOptions = (stacked: boolean): jquery.flot.plotOptions => {
  return {
    grid: {
      hoverable: true,
      clickable: true,
      autoHighlight: true,
      mouseActiveRadius: 100,
    },
    legend: {
      show: false,
    },
    xaxis: {
      mode: 'time',
      showTicks: true,
      showMinorTicks: true,
      timeBase: 'milliseconds',
    },
    yaxis: {
      tickFormatter: formatValue,
    },
    crosshair: {
      mode: 'xy',
      color: '#bbb',
    },
    tooltip: {
      show: true,
      cssClass: 'graph-tooltip',
      content: (_, xval, yval, { series }): string => {
        const { labels, color } = series;
        return `
            <div class="date">${new Date(xval).toUTCString()}</div>
            <div>
              <span class="detail-swatch" style="background-color: ${color}"></span>
              <span>${labels.__name__ || 'value'}: <strong>${yval}</strong></span>
            <div>
            <div class="labels mt-1">
              ${Object.keys(labels)
                .map((k) =>
                  k !== '__name__' ? `<div class="mb-1"><strong>${k}</strong>: ${escapeHTML(labels[k])}</div>` : ''
                )
                .join('')}
            </div>
          `;
      },
      defaultTheme: false,
      lines: true,
    },
    series: {
      stack: stacked,
      lines: {
        lineWidth: stacked ? 1 : 2,
        steps: false,
        fill: stacked,
      },
      shadowSize: 0,
    },
  };
};

// This was adapted from Flot's color generation code.
export const getColors = (data: RangeSamples[]) => {
  const colorPool = ['#edc240', '#afd8f8', '#cb4b4b', '#4da74d', '#9440ed'];
  const colorPoolSize = colorPool.length;
  let variation = 0;
  return data.map((_, i) => {
    // Each time we exhaust the colors in the pool we adjust
    // a scaling factor used to produce more variations on
    // those colors. The factor alternates negative/positive
    // to produce lighter/darker colors.

    // Reset the variation after every few cycles, or else
    // it will end up producing only white or black colors.

    if (i % colorPoolSize === 0 && i) {
      if (variation >= 0) {
        variation = variation < 0.5 ? -variation - 0.2 : 0;
      } else {
        variation = -variation;
      }
    }
    return $.color.parse(colorPool[i % colorPoolSize] || '#666').scale('rgb', 1 + variation);
  });
};

export const normalizeData = ({ stacked, queryParams, data }: GraphProps): GraphSeries[] => {
  const colors = getColors(data);
  const { startTime, endTime, resolution } = queryParams;
  return data.map(({ values, metric }, index) => {
    // Insert nulls for all missing steps.
    const data = [];
    let pos = 0;

    for (let t = startTime; t <= endTime; t += resolution) {
      // Allow for floating point inaccuracy.
      const currentValue = values[pos];
      if (values.length > pos && currentValue[0] < t + resolution / 100) {
        data.push([currentValue[0] * 1000, parseValue(currentValue[1], stacked)]);
        pos++;
      } else {
        // TODO: Flot has problems displaying intermittent "null" values when stacked,
        // resort to 0 now. In Grafana this works for some reason, figure out how they
        // do it.
        data.push([t * 1000, stacked ? 0 : null]);
      }
    }

    return {
      labels: metric !== null ? metric : {},
      color: colors[index].toString(),
      data,
      index,
    };
  });
};

export const parseValue = (value: string, stacked: boolean) => {
  const val = parseFloat(value);
  if (isNaN(val)) {
    // "+Inf", "-Inf", "+Inf" will be parsed into NaN by parseFloat(). They
    // can't be graphed, so show them as gaps (null).

    // TODO: Flot has problems displaying intermittent "null" values when stacked,
    // resort to 0 now. In Grafana this works for some reason, figure out how they
    // do it.
    return stacked ? 0 : null;
  }
  return val;
};
