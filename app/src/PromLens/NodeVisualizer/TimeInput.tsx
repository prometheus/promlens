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
import React, { Component } from 'react';
import { InputGroup, Button, Form } from 'react-bootstrap';

import moment from 'moment-timezone';

import 'tempusdominus-core';
import 'tempusdominus-bootstrap-4';
import '../../../node_modules/tempusdominus-bootstrap-4/build/css/tempusdominus-bootstrap-4.min.css';

import { FaChevronRight, FaChevronLeft, FaTimes } from 'react-icons/fa';
import { dom, library } from '@fortawesome/fontawesome-svg-core';
import {
  faChevronLeft,
  faChevronRight,
  faCalendarCheck,
  faArrowUp,
  faArrowDown,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';

library.add(faChevronLeft, faChevronRight, faCalendarCheck, faArrowUp, faArrowDown, faTimes);
// Sadly needed to also replace <i> within the date picker, since it's not a React component.
dom.watch();

interface TimeInputProps {
  time: number | null; // Timestamp in milliseconds.
  useLocalTime: boolean;
  range: number; // Range in milliseconds.
  placeholder: string;
  onChangeTime: (time: number | null) => void;
}

class TimeInput extends Component<TimeInputProps> {
  private timeInputRef = React.createRef<HTMLInputElement>();
  private $time: any = null;

  getBaseTime = (): number => {
    return this.props.time || moment().valueOf();
  };

  calcShiftRange = () => this.props.range / 2;

  increaseTime = (): void => {
    const time = this.getBaseTime() + this.calcShiftRange();
    this.props.onChangeTime(time);
  };

  decreaseTime = (): void => {
    const time = this.getBaseTime() - this.calcShiftRange();
    this.props.onChangeTime(time);
  };

  clearTime = (): void => {
    this.props.onChangeTime(null);
  };

  timezone = (): string => {
    return this.props.useLocalTime ? moment.tz.guess() : 'UTC';
  };

  componentDidMount() {
    this.$time = $(this.timeInputRef.current!);

    this.$time.datetimepicker({
      icons: {
        today: 'fas fa-calendar-check',
      },
      buttons: {
        //showClear: true,
        showClose: true,
        showToday: true,
      },
      sideBySide: true,
      format: 'YYYY-MM-DD HH:mm:ss',
      locale: 'en',
      timeZone: this.timezone(),
      defaultDate: this.props.time,
    });

    this.$time.on('change.datetimepicker', (e: any) => {
      if (e.date) {
        this.props.onChangeTime(e.date.valueOf());
      }
    });
  }

  componentWillUnmount() {
    this.$time.datetimepicker('destroy');
  }

  componentDidUpdate(prevProps: TimeInputProps) {
    const { time, useLocalTime } = this.props;
    if (prevProps.time !== time) {
      this.$time.datetimepicker('date', time ? moment(time) : null);
    }
    if (prevProps.useLocalTime !== useLocalTime) {
      this.$time.datetimepicker('options', { timeZone: this.timezone(), defaultDate: null });
    }
  }

  render() {
    return (
      <InputGroup className="time-input" size="sm">
        <InputGroup.Prepend>
          <Button variant="outline-secondary" title="Decrease time" onClick={this.decreaseTime}>
            <FaChevronLeft />
          </Button>
        </InputGroup.Prepend>

        <Form.Control
          placeholder={this.props.placeholder}
          ref={this.timeInputRef}
          onFocus={() => this.$time.datetimepicker('show')}
          onBlur={() => this.$time.datetimepicker('hide')}
          onKeyDown={(e: React.KeyboardEvent) => ['Escape', 'Enter'].includes(e.key) && this.$time.datetimepicker('hide')}
        />

        {/* CAUTION: While the datetimepicker also has an option to show a 'clear' button,
            that functionality is broken, so we create an external solution instead. */}
        {this.props.time && (
          <InputGroup.Append>
            <Button variant="light" className="clear-time-btn" title="Clear time" onClick={this.clearTime}>
              <FaTimes />
            </Button>
          </InputGroup.Append>
        )}

        <InputGroup.Append>
          <Button variant="outline-secondary" title="Increase time" onClick={this.increaseTime}>
            <FaChevronRight />
          </Button>
        </InputGroup.Append>
      </InputGroup>
    );
  }
}

export default TimeInput;
