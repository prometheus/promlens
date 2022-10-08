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

import { useLocalStorage } from './useLocalStorage';
import { renderHook, act } from '@testing-library/react-hooks';

describe('useLocalStorage', () => {
  it('returns the initialState', () => {
    const initialState = { a: 1, b: 2 };
    const { result } = renderHook(() => useLocalStorage('mystorage', initialState));
    expect(result.current[0]).toEqual(initialState);
  });
  it('stores the initialState as serialized json in localstorage', () => {
    const key = 'mystorage';
    const initialState = { a: 1, b: 2 };
    renderHook(() => useLocalStorage(key, initialState));
    expect(localStorage.getItem(key)).toEqual(JSON.stringify(initialState));
  });
  it('returns a setValue function that can reset local storage', () => {
    const key = 'mystorage';
    const initialState = { a: 1, b: 2 };
    const { result } = renderHook(() => useLocalStorage(key, initialState));
    const newValue = { a: 2, b: 5 };
    act(() => {
      result.current[1](newValue);
    });
    expect(result.current[0]).toEqual(newValue);
    expect(localStorage.getItem(key)).toEqual(JSON.stringify(newValue));
  });
});
