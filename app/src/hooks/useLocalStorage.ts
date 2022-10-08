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

import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export function useLocalStorage<S>(localStorageKey: string, initialState: S): [S, Dispatch<SetStateAction<S>>] {
  const localStorageState = JSON.parse(localStorage.getItem(localStorageKey) || JSON.stringify(initialState));
  const [value, setValue] = useState(localStorageState);

  useEffect(() => {
    const serializedState = JSON.stringify(value);
    localStorage.setItem(localStorageKey, serializedState);
  }, [localStorageKey, value]);

  return [value, setValue];
}
