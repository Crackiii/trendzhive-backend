import config from "../../config"
import { getAxiosClient } from "../../api/client"
import {
  Configs,
  DEFAULT_LANGUAGE,
  DEFAULT_LOCATION,
  DEFAULT_TIMEZONE,
  DEFAULT_CATEGORY
} from "../../api/client"
import { linksQueue, idsQueue, storiesQueue, queriesQueue } from "./bull/queues"
import { Job } from "bull"
import { getStoryDetailById } from "../../api/common"
import { putStoryDetails, putWebsiteData, putQueryResults, putStoriesIds } from "./queries.db"
import { getGoogleSearchResultsByQueries, getWebsiteDataByLink } from "../common/google-search"
import * as constants from './constants'
import { createTitle, getRedisValue, queueJobsCompleted, queueJobsFailed, setQueueStatus } from "./utils"


export const getRealTimeStoryIdsByLink = async (configs?: Configs) => {
  const client = getAxiosClient()

  const URL = [
    config.REALTIME_TRENDS_ENDPOINT,
    `?hl=${configs?.LANGUAGE || DEFAULT_LANGUAGE}`,
    `&tz=${configs?.TIMEZONE || DEFAULT_TIMEZONE}`,
    `&cat=${configs.CATGEORY || DEFAULT_CATEGORY}`,
    `&fi=0`,
    `&fs=0`,
    `&geo=${configs?.LOCATION || DEFAULT_LOCATION}`,
    `&ri=300`,
    `&rs=20`,
  ].join('')

  const realtimeTrends = await client.get(URL)

  //Get trending story IDS
  const trendingStoriesIDs = JSON.parse(realtimeTrends.data.slice(5)).trendingStoryIds

  return trendingStoriesIDs
}

// Processing links queue
linksQueue.process(1, async (job: Job) => {

  await Promise.all([
    setQueueStatus(constants.LINKS_QUEUE_CURRENT_JOBS_PROCESSED, await queueJobsCompleted(linksQueue)),
    setQueueStatus(constants.LINKS_QUEUE_CURRENT_JOBS_FAILED, await queueJobsFailed(linksQueue)),
    setQueueStatus(constants.LINKS_QUEUE_JOB_RUNNING, `${job.data.country_short} - ${job.data.category_short}`)
  ]).catch(console.log)

  const category = job.data.category_short
  const country = job.data.country_short

  const storiesIds = await getRealTimeStoryIdsByLink({
    CATGEORY: category,
    LOCATION: country
  })

  for (const id of storiesIds) {
    await putStoriesIds({
      id,
      category,
      country
    })
  }
})

// Processing ids queue jobs
idsQueue.process(1, async (job) => {

  await Promise.all([
    setQueueStatus(constants.IDS_QUEUE_CURRENT_JOBS_PROCESSED, await queueJobsCompleted(idsQueue)),
    setQueueStatus(constants.IDS_QUEUE_CURRENT_JOBS_FAILED, await queueJobsFailed(idsQueue)),
    setQueueStatus(constants.IDS_QUEUE_JOB_RUNNING, job.data.stories_ids)
  ])

  const storyDetails = await getStoryDetailById(
    job.data.stories_ids,
    {
      CATGEORY: job.data.category,
      LOCATION: job.data.country
    }
  )

  const articles = storyDetails.articles
  const relatedQueries = JSON.parse(storyDetails.relatedQueries).default.queries.map((q: any) => q.query)

  await putStoryDetails({
    queries: relatedQueries,
    articles,
    id: job.data.id
  })
})

// Processing stories queue jobs
storiesQueue.process(1, async (job) => {

  await Promise.all([
    setQueueStatus(constants.STORIES_QUEUE_CURRENT_JOBS_PROCESSED, await queueJobsCompleted(storiesQueue)),
    setQueueStatus(constants.STORIES_QUEUE_CURRENT_JOBS_FAILED, await queueJobsFailed(storiesQueue)),
    setQueueStatus(constants.STORIES_QUEUE_JOB_RUNNING, `Queries to scrap: ${job.data.queries.length}`)
  ])

  const googleSearchResults = await getGoogleSearchResultsByQueries(job.data.queries)

  for (const result of googleSearchResults) {
    await putQueryResults({
      query: result.query,
      links: result.links,
      id: job.data.story_id,
    })
  }
})

// Processing queries queue jobs
queriesQueue.process(1, async (job) => {

  await Promise.all([
    setQueueStatus(constants.QUERIES_QUEUE_CURRENT_JOBS_PROCESSED, await queueJobsCompleted(queriesQueue)),
    setQueueStatus(constants.QUERIES_QUEUE_CURRENT_JOBS_FAILED, await queueJobsFailed(queriesQueue)),
    setQueueStatus(constants.QUERIES_QUEUE_JOB_RUNNING, `Links to process: ${job.data.links.length}`)
  ])

  const links = job.data.links
    .map((o: any) => o.link)
    .filter((link: string) => link.slice(link.length - 4) !== '.pdf'); // get rid of pdf links
  const query_id = job.data.query_id;

  const websitesData = await getWebsiteDataByLink(links)

  for (const website of websitesData) {
    await putWebsiteData({
      title: [website.metaData.title],
      keywords: website.metaData.keywords,
      social: [website.metaData.facebook, website.metaData.twitter],
      images: website.metaData.images,
      html: website.html,
      descriptions: website.metaData.description,
      related_query_id: query_id
    })
  }
})


/** 
 * Check scrapping status
*/
export const checkScrappingStatus = async () => {

  const linksQueueStatus = await getRedisValue(constants.LINKS_QUEUE_STATUS)
  const idsQueueStatus = await getRedisValue(constants.IDS_QUEUE_STATUS)
  const storiesQueueStatus = await getRedisValue(constants.STORIES_QUEUE_STATUS)
  const queriesQueueStatus = await getRedisValue(constants.QUERIES_QUEUE_STATUS)

  const linksQueueJobsProcessed = await getRedisValue(constants.LINKS_QUEUE_CURRENT_JOBS_PROCESSED)
  const idsQueueJobsProcessed = await getRedisValue(constants.IDS_QUEUE_CURRENT_JOBS_PROCESSED)
  const storiesQueueJobsProcessed = await getRedisValue(constants.STORIES_QUEUE_CURRENT_JOBS_PROCESSED)
  const queriesQueueJobsProcessed = await getRedisValue(constants.QUERIES_QUEUE_CURRENT_JOBS_PROCESSED)

  const linksQueueJobRunning = await getRedisValue(constants.LINKS_QUEUE_JOB_RUNNING)
  const idsQueueJobRunning = await getRedisValue(constants.IDS_QUEUE_JOB_RUNNING)
  const storiesQueueJobRunning = await getRedisValue(constants.STORIES_QUEUE_JOB_RUNNING)
  const queriesQueueJobRunning = await getRedisValue(constants.QUERIES_QUEUE_JOB_RUNNING)

  const linksQueueJobsFailed = await getRedisValue(constants.LINKS_QUEUE_CURRENT_JOBS_FAILED)
  const idsQueueJobsFailed = await getRedisValue(constants.IDS_QUEUE_CURRENT_JOBS_FAILED)
  const storiesQueueJobsFailed = await getRedisValue(constants.STORIES_QUEUE_CURRENT_JOBS_FAILED)
  const queriesQueueJobsFailed = await getRedisValue(constants.QUERIES_QUEUE_CURRENT_JOBS_FAILED)

  const linksQueueTotalJobsProcessed = await getRedisValue(constants.LINKS_QUEUE_TOTAL_JOBS_PROCESSED);
  const idsQueueTotalJobsProcessed = await getRedisValue(constants.IDS_QUEUE_TOTAL_JOBS_PROCESSED);
  const storiesQueueTotalJobsProcessed = await getRedisValue(constants.STORIES_QUEUE_TOTAL_JOBS_PROCESSED);
  const queriesQueueTotalJobsProcessed = await getRedisValue(constants.QUERIES_QUEUE_TOTAL_JOBS_PROCESSED);

  const linkQueueTotalJobsFailed = await getRedisValue(constants.LINKS_QUEUE_TOTAL_JOBS_FAILED);
  const idsQueueTotalJobsFailed = await getRedisValue(constants.IDS_QUEUE_TOTAL_JOBS_FAILED);
  const storiesQueueTotalJobsFailed = await getRedisValue(constants.STORIES_QUEUE_TOTAL_JOBS_FAILED);
  const queriesQueueTotalJobsFailed = await getRedisValue(constants.QUERIES_QUEUE_TOTAL_JOBS_FAILED);


  console.clear()
  console.table({
    [createTitle('linksQueueStatus')]: JSON.parse(linksQueueStatus) || '-',
    [createTitle('idsQueueStatus')]: JSON.parse(idsQueueStatus) || '-',
    [createTitle('storiesQueueStatus')]: JSON.parse(storiesQueueStatus) || '-',
    [createTitle('queriesQueueStatus')]: JSON.parse(queriesQueueStatus) || '-',
    [createTitle('linksQueueJobsProcessed')]: JSON.parse(linksQueueJobsProcessed) || '-',
    [createTitle('idsQueueJobsProcessed')]: JSON.parse(idsQueueJobsProcessed) || '-',
    [createTitle('storiesQueueJobsProcessed')]: JSON.parse(storiesQueueJobsProcessed) || '-',
    [createTitle('queriesQueueJobsProcessed')]: JSON.parse(queriesQueueJobsProcessed) || '-',
    [createTitle('linksQueueJobRunning')]: JSON.parse(linksQueueJobRunning) || '-',
    [createTitle('idsQueueJobRunning')]: JSON.parse(idsQueueJobRunning) || '-',
    [createTitle('storiesQueueJobRunning')]: JSON.parse(storiesQueueJobRunning) || '-',
    [createTitle('queriesQueueJobRunning')]: JSON.parse(queriesQueueJobRunning) || '-',
    [createTitle('linksQueueJobsFailed')]: JSON.parse(linksQueueJobsFailed) || 0,
    [createTitle('idsQueueJobsFailed')]: JSON.parse(idsQueueJobsFailed) || 0,
    [createTitle('storiesQueueJobsFailed')]: JSON.parse(storiesQueueJobsFailed) || 0,
    [createTitle('queriesQueueJobsFailed')]: JSON.parse(queriesQueueJobsFailed) || 0,
    [createTitle('linksQueueTotalJobsProcessed')]: JSON.parse(linksQueueTotalJobsProcessed) || 0,
    [createTitle('idsQueueTotalJobsProcessed')]: JSON.parse(idsQueueTotalJobsProcessed) || 0,
    [createTitle('storiesQueueTotalJobsProcessed')]: JSON.parse(storiesQueueTotalJobsProcessed) || 0,
    [createTitle('queriesQueueTotalJobsProcessed')]: JSON.parse(queriesQueueTotalJobsProcessed) || 0,
    [createTitle('linkQueueTotalJobsFailed')]: JSON.parse(linkQueueTotalJobsFailed) || 0,
    [createTitle('idsQueueTotalJobsFailed')]: JSON.parse(idsQueueTotalJobsFailed) || 0,
    [createTitle('storiesQueueTotalJobsFailed')]: JSON.parse(storiesQueueTotalJobsFailed) || 0,
    [createTitle('queriesQueueTotalJobsFailed')]: JSON.parse(queriesQueueTotalJobsFailed) || 0,
  })

}