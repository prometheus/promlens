import { useState, useEffect } from 'react';
import { ServerSettings } from '../state/state';

interface APIResult<T> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
}

export interface FetchAPIState<T> {
  data?: T;
  error?: Error;
  loading: boolean;
}

const badRequest = 400;
const unprocessableEntity = 422;
const serviceUnavailable = 503;

export class PromAPI {
  private serverSettings: ServerSettings;
  private pathPrefix: string;

  constructor(serverSettings: ServerSettings, pathPrefix: string) {
    this.serverSettings = serverSettings;
    this.pathPrefix = pathPrefix;
  }

  fetch = (resource: RequestInfo, init?: RequestInit): Promise<Response> => {
    const url =
      (this.serverSettings.access === 'proxy'
        ? `${this.pathPrefix}/api/grafana/api/datasources/proxy/${this.serverSettings.datasourceID}`
        : this.serverSettings.url) + resource;

    if (url.startsWith('http:') && window.location.protocol !== 'http:') {
      throw new Error(
        'HTTP-based datasources not supported when using PromLens via HTTPS, please enter an HTTPS-based URL or proxy through Grafana.'
      );
    }

    init = {
      credentials: this.serverSettings.withCredentials ? 'include' : 'same-origin',
      cache: 'no-store',
      ...init,
    };
    return fetch(url, init);
  };

  fetchAPI = async <T>(resource: string, init?: RequestInit): Promise<APIResult<T>> => {
    const res = await this.fetch(resource, init);
    if (!res.ok && ![badRequest, unprocessableEntity, serviceUnavailable].includes(res.status)) {
      throw new Error(res.statusText);
    }
    const apiRes = (await res.json()) as APIResult<T>;
    if (apiRes.status === 'error') {
      throw new Error(apiRes.error !== undefined ? apiRes.error : 'missing "error" field in response JSON');
    }
    if (apiRes.data === undefined) {
      throw new Error('missing "data" field in response JSON');
    }
    return apiRes;
  };

  useFetchAPI = <T>(resource: string, noop?: boolean): FetchAPIState<T> => {
    // ESLint thinks that this class is a class component, in which it is illegal to use hooks.
    // But this is just a regular class, and we just have to make sure that we only ever call this
    // `useFetchAPI()` hook function from a function component.
    //
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [data, setData] = useState<T>();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [error, setError] = useState<Error>();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [loading, setLoading] = useState<boolean>(true);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      setData(undefined);
      setError(undefined);

      if (noop) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const abortController = new AbortController();
      const fetchData = async () => {
        try {
          const apiRes = await this.fetchAPI<T>(resource, { signal: abortController.signal });
          setError(undefined);
          setData(apiRes.data!);
        } catch (error) {
          setError(error as Error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();

      return () => {
        abortController.abort();
      };
    }, [this.serverSettings, resource, noop]);

    return { data, error, loading };
  };
}
