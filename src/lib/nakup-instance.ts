import Axios, { type AxiosRequestConfig } from 'axios'

export const NAKUP_AXIOS_INSTANCE = Axios.create({
  baseURL: (import.meta.env.VITE_NAKUP_API_URL || 'http://localhost:8084') + '/api/v1/nakup',
})

// Add auth token to requests
NAKUP_AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const nakupInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = Axios.CancelToken.source()
  const promise = NAKUP_AXIOS_INSTANCE({
    ...config,
    cancelToken: source.token,
  }).then(({ data }) => data)

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled')
  }

  return promise
}
