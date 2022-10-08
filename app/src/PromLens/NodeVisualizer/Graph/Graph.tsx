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
import React, { PureComponent } from 'react';
import ReactResizeDetector from 'react-resize-detector';

import { Legend } from './Legend';
import { normalizeData, getOptions, toHoverColor } from './GraphHelpers';
import { RangeSamples } from '../../QueryList/QueryView/QueryResultTypes';

require('flot');
require('flot/source/jquery.flot.crosshair');
require('flot/source/jquery.flot.legend');
require('flot/source/jquery.flot.time');
require('flot/source/jquery.canvaswrapper');
require('jquery.flot.tooltip');

export interface GraphProps {
  data: RangeSamples[];
  stacked: boolean;
  queryParams: {
    startTime: number;
    endTime: number;
    resolution: number;
  };
}

export interface GraphSeries {
  labels: { [key: string]: string };
  color: string;
  data: (number | null)[][]; // [x,y][]
  index: number;
}

interface GraphState {
  chartData: GraphSeries[];
}

class Graph extends PureComponent<GraphProps, GraphState> {
  private chartRef = React.createRef<HTMLDivElement>();
  private $chart?: jquery.flot.plot;
  private rafID = 0;
  private selectedSeriesIndexes: number[] = [];

  state = {
    chartData: normalizeData(this.props),
  };

  componentDidUpdate(prevProps: GraphProps) {
    const { data, stacked } = this.props;
    if (prevProps.data !== data) {
      this.selectedSeriesIndexes = [];
      this.setState({ chartData: normalizeData(this.props) }, this.plot);
    } else if (prevProps.stacked !== stacked) {
      this.setState({ chartData: normalizeData(this.props) }, () => {
        if (this.selectedSeriesIndexes.length === 0) {
          this.plot();
        } else {
          this.plot(this.state.chartData.filter((_, i) => this.selectedSeriesIndexes.includes(i)));
        }
      });
    }
  }

  componentDidMount() {
    this.plot();
  }

  componentWillUnmount() {
    this.destroyPlot();
  }

  plot = (data: GraphSeries[] = this.state.chartData) => {
    if (!this.chartRef.current) {
      return;
    }
    this.destroyPlot();

    this.$chart = $.plot($(this.chartRef.current), data, getOptions(this.props.stacked));
  };

  destroyPlot = () => {
    if (this.$chart) {
      this.$chart.destroy();
    }
  };

  plotSetAndDraw(data: GraphSeries[] = this.state.chartData) {
    if (this.$chart) {
      this.$chart.setData(data);
      this.$chart.draw();
    }
  }

  handleSeriesSelect = (selected: number[], selectedIndex: number) => {
    const { chartData } = this.state;
    this.plot(
      this.selectedSeriesIndexes.length === 1 && this.selectedSeriesIndexes.includes(selectedIndex)
        ? chartData.map(toHoverColor(selectedIndex, this.props.stacked))
        : chartData.filter((_, i) => selected.includes(i)) // draw only selected
    );
    this.selectedSeriesIndexes = selected;
  };

  handleSeriesHover = (index: number) => () => {
    if (this.rafID) {
      cancelAnimationFrame(this.rafID);
    }
    this.rafID = requestAnimationFrame(() => {
      this.plotSetAndDraw(this.state.chartData.map(toHoverColor(index, this.props.stacked)));
    });
  };

  handleLegendMouseOut = () => {
    cancelAnimationFrame(this.rafID);
    this.plotSetAndDraw();
  };

  handleResize = () => {
    if (this.$chart) {
      this.plot(this.$chart.getData() as GraphSeries[]);
    }
  };

  render() {
    const { chartData } = this.state;
    return (
      <ReactResizeDetector handleWidth onResize={this.handleResize} skipOnMount>
        <div className="graph">
          <div className="graph-chart" ref={this.chartRef} />
          <Legend
            shouldReset={this.selectedSeriesIndexes.length === 0}
            chartData={chartData}
            onHover={this.handleSeriesHover}
            onLegendMouseOut={this.handleLegendMouseOut}
            onSeriesToggle={this.handleSeriesSelect}
          />
        </div>
      </ReactResizeDetector>
    );
  }
}

export default Graph;
