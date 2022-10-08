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

import React, { Component } from 'react';
import TimeInput from '../../NodeVisualizer/TimeInput';
import { parseDuration, formatDuration } from '../../../utils/utils';
import { Form, InputGroup, Button, ButtonGroup } from 'react-bootstrap';
import { FaMinus, FaPlus, FaChartArea, FaChartLine } from 'react-icons/fa';
import ReactDOM from 'react-dom';

interface GraphControlsProps {
  // Time range in milliseconds.
  range: number;
  endTime: number | null;
  useLocalTime: boolean;
  resolution: number | null;
  stacked: boolean;

  onChangeRange: (range: number) => void;
  onChangeEndTime: (endTime: number | null) => void;
  onChangeResolution: (resolution: number | null) => void;
  onChangeStacking: (stacked: boolean) => void;
}

class GraphControls extends Component<GraphControlsProps> {
  private rangeRef = React.createRef<HTMLInputElement>();
  private resolutionRef = React.createRef<HTMLInputElement>();

  rangeSteps = [
    1,
    10,
    60,
    5 * 60,
    15 * 60,
    30 * 60,
    60 * 60,
    2 * 60 * 60,
    6 * 60 * 60,
    12 * 60 * 60,
    24 * 60 * 60,
    48 * 60 * 60,
    7 * 24 * 60 * 60,
    14 * 24 * 60 * 60,
    28 * 24 * 60 * 60,
    56 * 24 * 60 * 60,
    365 * 24 * 60 * 60,
    730 * 24 * 60 * 60,
  ].map((s) => s * 1000);

  onChangeRangeInput = (rangeText: string): void => {
    try {
      const range = parseDuration(rangeText);
      this.props.onChangeRange(range);
    } catch {
      this.changeRangeInput(this.props.range);
    }
  };

  changeRangeInput = (range: number): void => {
    const rangeNode = ReactDOM.findDOMNode(this.rangeRef.current!) as HTMLInputElement;
    rangeNode.value = formatDuration(range);
  };

  increaseRange = (): void => {
    for (const range of this.rangeSteps) {
      if (this.props.range < range) {
        this.changeRangeInput(range);
        this.props.onChangeRange(range);
        return;
      }
    }
  };

  decreaseRange = (): void => {
    for (const range of this.rangeSteps.slice().reverse()) {
      if (this.props.range > range) {
        this.changeRangeInput(range);
        this.props.onChangeRange(range);
        return;
      }
    }
  };

  componentDidUpdate(prevProps: GraphControlsProps) {
    if (prevProps.range !== this.props.range) {
      this.changeRangeInput(this.props.range);
    }
    if (prevProps.resolution !== this.props.resolution) {
      const resNode = ReactDOM.findDOMNode(this.resolutionRef.current!) as HTMLInputElement;
      resNode.value = this.props.resolution !== null ? this.props.resolution.toString() : '';
    }
  }

  render() {
    return (
      <Form inline className="graph-controls" onSubmit={(e: React.FormEvent) => e.preventDefault()}>
        <InputGroup className="range-input" size="sm">
          <InputGroup.Prepend>
            <Button variant="outline-secondary" title="Decrease range" onClick={this.decreaseRange}>
              <FaMinus />
            </Button>
          </InputGroup.Prepend>

          <Form.Control
            defaultValue={formatDuration(this.props.range)}
            ref={this.rangeRef}
            onBlur={() => this.onChangeRangeInput((ReactDOM.findDOMNode(this.rangeRef.current!) as HTMLInputElement).value)}
          />

          <InputGroup.Append>
            <Button variant="outline-secondary" title="Increase range" onClick={this.increaseRange}>
              <FaPlus />
            </Button>
          </InputGroup.Append>
        </InputGroup>

        <TimeInput
          time={this.props.endTime}
          useLocalTime={this.props.useLocalTime}
          range={this.props.range}
          placeholder="End time"
          onChangeTime={this.props.onChangeEndTime}
        />

        <Form.Control
          size="sm"
          placeholder="Res. (s)"
          className="resolution-input"
          defaultValue={this.props.resolution !== null ? this.props.resolution.toString() : ''}
          ref={this.resolutionRef}
          onBlur={() => {
            const res = parseInt((ReactDOM.findDOMNode(this.resolutionRef.current!) as HTMLInputElement).value);
            this.props.onChangeResolution(res ? res : null);
          }}
        />

        <ButtonGroup className="stacked-input" size="sm">
          <Button
            variant="outline-secondary"
            title="Show unstacked line graph"
            onClick={() => this.props.onChangeStacking(false)}
            active={!this.props.stacked}
          >
            <FaChartLine />
          </Button>
          <Button
            variant="outline-secondary"
            title="Show stacked graph"
            onClick={() => this.props.onChangeStacking(true)}
            active={this.props.stacked}
          >
            <FaChartArea />
          </Button>
        </ButtonGroup>
      </Form>
    );
  }
}

export default GraphControls;
