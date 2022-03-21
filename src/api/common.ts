import config from "../config"
import { Configs, DEFAULT_LANGUAGE, DEFAULT_TIMEZONE, getAxiosClient } from "./client"
import { getRelatedQueries } from "./google-trends"

export const getStoryDetailById = async (storyId: string, configs?: Configs) => {
  const client = getAxiosClient()

  const URL = [[config.INDIVIDUAL_STORY_ENDPOINT, `${storyId}`].join('/'),
  `?hl=${configs?.LANGUAGE ?? DEFAULT_LANGUAGE}`,
  `&tz=${configs?.TIMEZONE ?? DEFAULT_TIMEZONE}`,
  `&id=${storyId}`
  ].join('')

  const storiesSummary = await client.get(URL)

  const [news, , , queries] = JSON.parse(storiesSummary.data.slice(4)).widgets

  const relatedQueries = await getRelatedQueries(queries.token, queries.request)

  return { articles: news.articles, relatedQueries }

}


export const sleep = async (time: number) => {
  await new Promise(resolve => setTimeout(() => resolve(true), time))
}