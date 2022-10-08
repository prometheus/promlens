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

import React, { PureComponent, SyntheticEvent } from 'react';
import { GraphSeries } from './Graph';
import SeriesName from '../../../utils/SeriesName';

interface LegendProps {
  chartData: GraphSeries[];
  shouldReset: boolean;
  onLegendMouseOut: (ev: SyntheticEvent<HTMLDivElement>) => void;
  onSeriesToggle: (selected: number[], index: number) => void;
  onHover: (index: number) => (ev: SyntheticEvent<HTMLDivElement>) => void;
}

interface LegendState {
  selectedIndexes: number[];
}

export class Legend extends PureComponent<LegendProps, LegendState> {
  state = {
    selectedIndexes: [] as number[],
  };
  componentDidUpdate(prevProps: LegendProps) {
    if (this.props.shouldReset && prevProps.shouldReset !== this.props.shouldReset) {
      this.setState({ selectedIndexes: [] });
    }
  }
  handleSeriesSelect = (index: number) => (ev: any) => {
    // TODO: add proper event type
    const { selectedIndexes } = this.state;

    let selected = [index];
    if (ev.ctrlKey) {
      const { chartData } = this.props;
      if (selectedIndexes.includes(index)) {
        selected = selectedIndexes.filter((idx) => idx !== index);
      } else {
        selected =
          // Flip the logic - In case none is selected ctrl + click should deselect clicked series.
          selectedIndexes.length === 0
            ? chartData.reduce<number[]>((acc, _, i) => (i === index ? acc : [...acc, i]), [])
            : [...selectedIndexes, index]; // Select multiple.
      }
    } else if (selectedIndexes.length === 1 && selectedIndexes.includes(index)) {
      selected = [];
    }

    this.setState({ selectedIndexes: selected });
    this.props.onSeriesToggle(selected, index);
  };

  render() {
    const { chartData, onLegendMouseOut, onHover } = this.props;
    const { selectedIndexes } = this.state;
    const canUseHover = chartData.length > 1 && selectedIndexes.length === 0;

    return (
      <div className="graph-legend" onMouseOut={canUseHover ? onLegendMouseOut : undefined}>
        {chartData.map(({ index, color, labels }) => (
          <div
            style={{ opacity: selectedIndexes.length === 0 || selectedIndexes.includes(index) ? 1 : 0.5 }}
            onClick={chartData.length > 1 ? this.handleSeriesSelect(index) : undefined}
            onMouseOver={canUseHover ? onHover(index) : undefined}
            key={index}
            className="legend-item"
          >
            <span className="legend-swatch" style={{ backgroundColor: color }}></span>
            <SeriesName labels={labels} format />
          </div>
        ))}
        {chartData.length > 1 && (
          <div className="pl-1 mt-1 text-muted" style={{ fontSize: 13 }}>
            Click: select series, CTRL + click: toggle multiple series
          </div>
        )}
      </div>
    );
  }
}
