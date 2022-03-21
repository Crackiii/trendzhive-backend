
import { getItemNameId } from '../utils'
import config from '../config'
import {
  Configs,
  DEFAULT_CATEGORY,
  DEFAULT_LANGUAGE,
  DEFAULT_LOCATION,
  DEFAULT_PROPERTY,
  DEFAULT_TIMERANGE_TEXT,
  DEFAULT_TIMEZONE,
  getAxiosClient
} from './client'
import { getStoryDetailById, sleep } from './common'

export let cookieValue = ''

const getTokenRequest = async (configs?: Configs): Promise<any> => {
  const client = getAxiosClient()

  const requestBody = {
    comparisonItem: [
      {
        geo: configs?.LOCATION ?? DEFAULT_LOCATION,
        time: configs?.TIME_RANGE_TEXT ?? DEFAULT_TIMERANGE_TEXT
      }
    ],
    category: Number(configs?.CATGEORY) ?? DEFAULT_CATEGORY,
    property: configs?.PROPERTY ?? DEFAULT_PROPERTY
  }

  const URL = [
    config.EXPLORE_ENDPOINT,
    `?hl=${configs?.LANGUAGE ?? DEFAULT_LANGUAGE}`,
    `&tz=${configs?.TIMEZONE ?? DEFAULT_TIMEZONE}`,
    `&req=${JSON.stringify(requestBody)}`,
    `&tz=${configs?.TIMEZONE ?? DEFAULT_TIMEZONE}`
  ].join('')

  try {
    const response = await client.get(URL)
    const data = response?.data
    return data.slice(4)
  } catch (error) {
    const response = error.response
    console.log("getTokenRequest() - ", error.data)
    if (response.status === 429) {
      console.log("SLEEP ...")
      await sleep(5000)
      if (response.headers['set-cookie']) {
        cookieValue = response.headers['set-cookie'][0].split(';')[0]
      }

      return getTokenRequest(configs)
    }
  }

}

export const getRelatedQueries = async (token: string, request: object, configs?: Configs) => {
  const client = getAxiosClient()

  const relatedQueries = await client.post([
    config.RELATED_QUERIES_ENDPOINT,
    `?hl=${configs?.LANGUAGE || DEFAULT_LANGUAGE}`,
    `&tz=${configs?.TIMEZONE || DEFAULT_TIMEZONE}`,
    `&lq=true`,
    `&token=${token}`,
  ].join(''), request)

  return relatedQueries.data.slice(5);
}

export const getRelatedSearchCountries = async (configs?: Configs) => {
  const client = getAxiosClient()

  const { data } = await client.get([
    config.EXPLORE_ENDPOINT,
    config.PICKERS_ENDPOINT,
    config.COUNTRIES_ENDPOINT,
    `?hl=${configs?.LANGUAGE ?? DEFAULT_LANGUAGE}`,
    `&tz=${configs?.TIMEZONE ?? DEFAULT_TIMEZONE}`].join(""))
  
  return getItemNameId(JSON.parse(data.slice(4)).children)
}

export const getRelatedSearchCategories = async (configs?: Configs) => {
  const client = getAxiosClient()

  const { data } = await client.get([
    config.EXPLORE_ENDPOINT,
    config.PICKERS_ENDPOINT,
    config.CATEGORIES_ENDPOINT,
    `?hl=${configs?.LANGUAGE ?? DEFAULT_LANGUAGE}`,
    `&tz=${configs?.TIMEZONE ?? DEFAULT_TIMEZONE}`].join(""))

  return getItemNameId(JSON.parse(data.slice(4)).children, true)
}

export const getRelatedSearchProperties = async () => {

  const properties = [
    { name: 'Images', id: 'images' },
    { name: 'Web', id: '' },
    { name: 'News', id: 'news' },
    { name: 'Shopping', id: 'froogle' },
    { name: 'Youtube', id: 'youtube' }
  ]

  return properties
}

export const getRelatedSearchesTimeRanges = async () => {

  const properties = [
    { name: '1 Month', id: 'today 1-m' },
    { name: '3 Months', id: 'today 3-m' },
    { name: '12 Months', id: 'today 12-m' },
  ]

  return properties
}

export const getRelatedTrendsSearchQueries = async (configs?: Configs) => {
  const client = getAxiosClient()

  const data = await getTokenRequest(configs)

  const { token, request } = JSON.parse(data).widgets.find((widget: any) => widget.id === 'RELATED_QUERIES')

  try {
    const queries = await client.get([
      config.RELATED_SEARCHES_ENDPOINT,
      `?hl=${configs?.LANGUAGE ?? DEFAULT_LANGUAGE}`,
      `&tz=${configs?.TIMEZONE ?? DEFAULT_TIMEZONE}`,
      `&req=${JSON.stringify(request)}`,
      `&token=${token}`
    ].join(''))

    const filteredQueries = JSON.parse(queries.data.slice(5))
      .default.rankedList[1]
      .rankedKeyword.map(({ query }: any) => ({ query }))

    return filteredQueries
  } catch (error) {
    console.log("getRelatedTrendsSearchQueries() - ", error)
  }
}


export const getRelatedTrendsSearchTopics = async (configs?: Configs) => {
  const client = getAxiosClient()

  const data = await getTokenRequest(configs)

  const { token, request } = JSON.parse(data).widgets.find((widget: any) => widget.id === 'RELATED_TOPICS')
  try {
    const topics = await client.get([
      config.RELATED_SEARCHES_ENDPOINT,
      `?hl=${configs?.LANGUAGE ?? DEFAULT_LANGUAGE}`,
      `&tz=${configs?.TIMEZONE ?? DEFAULT_TIMEZONE}`,
      `&req=${JSON.stringify(request)}`,
      `&token=${token}`
    ].join(''))

    const filteredTopics = JSON.parse(topics.data.slice(5))
      .default.rankedList[1]
      .rankedKeyword.map(({ topic }: any) => ({ title: topic.title, type: topic.type }))

    return filteredTopics

  } catch (error) {
    console.log("getRelatedTrendsSearchTopics() - ", error)
  }
}


export const getDailyTrends = async (configs?: Configs) => {
  const client = getAxiosClient()

  const dailyTrends = await client.get([
    config.DAILY_TRENDS_ENDPOINT,
    `?hl=${configs?.LANGUAGE ?? DEFAULT_LANGUAGE}`,
    `&tz=${configs?.TIMEZONE ?? DEFAULT_TIMEZONE}`,
    `&geo=${configs?.LOCATION ?? DEFAULT_LOCATION}`
  ].join(''))

  return dailyTrends.data.slice(5)
}


/*
  * Get realtime trends IDS
  * Search summary of each ID seperately
  * Get related queries (API)
  * Get related topics (API)
  * Get related articles (API)
*/



export const getRealTimeTrends = async (configs?: Configs) => {
  const client = getAxiosClient()

  const URL = [
    config.REALTIME_TRENDS_ENDPOINT,
    `?hl=${configs?.LANGUAGE || DEFAULT_LANGUAGE}`,
    `&tz=${configs?.TIMEZONE || DEFAULT_TIMEZONE}`,
    `&cat=all`,
    `&fi=0`,
    `&fs=0`,
    `&geo=${configs?.LOCATION || DEFAULT_LOCATION}`,
    `&ri=300`,
    `&rs=20`,
  ].join('')

  const realtimeTrends = await client.get(URL)

  //Get trending story IDS
  const trendingStoriesIDs = JSON.parse(realtimeTrends.data.slice(5)).trendingStoryIds

  const storyDetails = await getStoryDetailById(trendingStoriesIDs[0])

  console.log(storyDetails)
}

