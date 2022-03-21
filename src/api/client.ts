import axios from 'axios-https-proxy-fix'
import { cookieValue } from './google-trends'

export const DEFAULT_LANGUAGE = 'en-US'
export const DEFAULT_TIMEZONE = '-60'
export const DEFAULT_TIMERANGE_TEXT = 'today 1-m'
export const DEFAULT_LOCATION = 'DE'
export const DEFAULT_PROPERTY = ''
export const DEFAULT_CATEGORY = 0

export interface Configs {
  LANGUAGE?: string
  TIMEZONE?: string
  LOCATION?: string
  CATGEORY?: string
  PROPERTY?: string
  TIME_RANGE_TEXT?: 'today 1-m' | 'today 3-m' | 'today 12-m'
}

interface Proxy {
  host: string,
  port: number,
  auth: {
    username: string,
    password: string
  }
}

const proxies: Proxy[] = [
  {
    host: '165.231.130.100',
    port: 7777,
    auth: {
      username: 'nadeemahmad',
      password: 'Ndim2229'
    }
  },
  {
    host: '23.231.12.27',
    port: 7777,
    auth: {
      username: 'nadeemahmad',
      password: 'Ndim2229'
    }
  },
  {
    host: '165.231.130.134',
    port: 7777,
    auth: {
      username: 'nadeemahmad',
      password: 'Ndim2229'
    }
  },
  {
    host: '185.104.218.53',
    port: 7777,
    auth: {
      username: 'nadeemahmad',
      password: 'Ndim2229'
    }
  },
  {
    host: '196.245.239.208',
    port: 7777,
    auth: {
      username: 'nadeemahmad',
      password: 'Ndim2229'
    }
  }
]


export const getAxiosClient = () => {
  const baseURL = 'https://trends.google.com/trends/api'
  const headers: any = {}

  // to get rid of error 429
  if (cookieValue) headers['cookie'] = cookieValue;

  const client = axios.create({
    baseURL,
    headers,
    proxy: {
      ...proxies[Math.floor(Math.random() * proxies.length)]
    }
  })

  return client
}

