import Axios, { type AxiosRequestConfig } from 'axios'

export const SPORED_AXIOS_INSTANCE = Axios.create({
  baseURL: (import.meta.env.VITE_SPORED_API_URL || 'http://localhost:8083') + '/api/v1/spored',
})

// Add auth token to requests
SPORED_AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const sporedInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = Axios.CancelToken.source()
  const promise = SPORED_AXIOS_INSTANCE({
    ...config,
    cancelToken: source.token,
  }).then(({ data }) => data)

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled')
  }

  return promise
}
