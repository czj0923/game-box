import axios,{ type AxiosInstance, type AxiosRequestConfig } from 'axios'

const env = import.meta.env;
const BASE_URL: string = env.VITE_BASE_URL || '/';
const DEFAULT_TIMEOUT = 5000;

const instance:AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: DEFAULT_TIMEOUT,
})

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token') || '';
  config.headers['TOKEN'] = token;
  if (!config.method || config.method.toLowerCase() === 'get') {
    const { params, data } = config;
    if (params == undefined && data) {
      config.params = data;
      delete config.data;
    }
  }
  return config;
}, err => Promise.reject(err));

instance.interceptors.response.use(response => {
  const { data = {} } = response;
  const { code, data: responseData } = data;
  if (code !== 200) {
    return Promise.reject(data);
  }
  return responseData;
}, err => Promise.reject(err));

function request(config: AxiosRequestConfig) {
  return instance.request(config);
}

export {
  request
}