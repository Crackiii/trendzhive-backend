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
import { createTitle, getGlobalErrors, getRedisValue, queueJobsCompleted, setGlobalError, setQueueStatus } from "./utils"
import * as os from 'os-utils'

const getCpuUsage = async () => {
  const usage = await new Promise((resolve) => os.cpuUsage(resolve))
  const loadAvg = await new Promise((resolve) => resolve(os.loadavg(1)))
  const sysUpTime = await new Promise((resolve) => resolve(os.sysUptime()))
  const processUptime = await new Promise((resolve) => resolve(os.processUptime()))

  return {usage, loadAvg, sysUpTime, processUptime}
}





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
    setQueueStatus(constants.LINKS_QUEUE_JOB_RUNNING, `${job.data.country_short} - ${job.data.category_short}`)
  ]).catch(console.log)

  const category = job.data.category_short
  const country = job.data.country_short

  try {
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
} catch(error) {
  setGlobalError(`Error linksQueue - Job # ${job.id} : ${error.message}`)
}
})

// Processing ids queue jobs
idsQueue.process(1, async (job) => {

  await Promise.all([
    setQueueStatus(constants.IDS_QUEUE_CURRENT_JOBS_PROCESSED, await queueJobsCompleted(idsQueue)),
    setQueueStatus(constants.IDS_QUEUE_JOB_RUNNING, job.data.story_id)
  ])
  try {
  const storyDetails = await getStoryDetailById(
    job.data.story_id,
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
} catch(error) {
  setGlobalError(`Error idsQueue - Job # ${job.id} : ${error.message}`)
}
})

// Processing stories queue jobs
storiesQueue.process(1, async (job) => {

  await Promise.all([
    setQueueStatus(constants.STORIES_QUEUE_CURRENT_JOBS_PROCESSED, await queueJobsCompleted(storiesQueue)),
    setQueueStatus(constants.STORIES_QUEUE_JOB_RUNNING, `Queries to scrap: ${job.data.queries.length}`)
  ])
  try {
  const googleSearchResults = await getGoogleSearchResultsByQueries(job.data.queries)

  for (const result of googleSearchResults) {
    await putQueryResults({
      query: result.query,
      links: result.links,
      id: job.data.story_id,
    })
  }
} catch(error) {
  setGlobalError(`Error storiesQueue - Job # ${job.id} : ${error.message}`)
}
})

// Processing queries queue jobs
queriesQueue.process(1, async (job) => {

  await Promise.all([
    setQueueStatus(constants.QUERIES_QUEUE_CURRENT_JOBS_PROCESSED, await queueJobsCompleted(queriesQueue)),
    setQueueStatus(constants.QUERIES_QUEUE_JOB_RUNNING, `Links to process: ${job.data.links.length}`)
  ])

  try {
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
} catch(error) {
  setGlobalError(`Error queriesQueue - Job # ${job.id} : ${error.message}`)
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

  const linksQueueTotalJobsProcessed = await getRedisValue(constants.LINKS_QUEUE_TOTAL_JOBS_PROCESSED);
  const idsQueueTotalJobsProcessed = await getRedisValue(constants.IDS_QUEUE_TOTAL_JOBS_PROCESSED);
  const storiesQueueTotalJobsProcessed = await getRedisValue(constants.STORIES_QUEUE_TOTAL_JOBS_PROCESSED);
  const queriesQueueTotalJobsProcessed = await getRedisValue(constants.QUERIES_QUEUE_TOTAL_JOBS_PROCESSED);

  const map = await getGlobalErrors()

  const {usage, loadAvg} = await getCpuUsage()

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
    [createTitle('linksQueueTotalJobsProcessed')]: JSON.parse(linksQueueTotalJobsProcessed) || 0,
    [createTitle('idsQueueTotalJobsProcessed')]: JSON.parse(idsQueueTotalJobsProcessed) || 0,
    [createTitle('storiesQueueTotalJobsProcessed')]: JSON.parse(storiesQueueTotalJobsProcessed) || 0,
    [createTitle('queriesQueueTotalJobsProcessed')]: JSON.parse(queriesQueueTotalJobsProcessed) || 0,
  })

  console.table({
    'Error 400 - idsQueue': map?.['idsQueue']?.['400'] || '-',
    'Error 400 - linksQueue': map?.['linksQueue']?.['400'] || '-',
    'Error 400 - storiesQueue': map?.['storiesQueue']?.['400'] || '-',
    'Error 400 - queriesQueue': map?.['queriesQueue']?.['400'] || '-',
    'Error 429 - idsQueue': map?.['idsQueue']?.['429'] || '-',
    'Error 429 - linksQueue': map?.['linksQueue']?.['429'] || '-',
    'Error 429 - storiesQueue': map?.['storiesQueue']?.['429'] || '-',
    'Error 429 - queriesQueue': map?.['queriesQueue']?.['429'] || '-',
    'Error 429 - getGoogleSearchResultsByQueries':  map?.['getGoogleSearchResultsByQueries']?.['429'] || '-',
    'Error 429 - getWebsiteDataByLink':  map?.['getWebsiteDataByLink']?.['429'] || '-',
    'Error database - getLinks': map?.['getLinks']?.['db'] || '-',
    'Error database - putLinks': map?.['putLinks']?.['db'] || '-',
    'Error database - getStoriesIds': map?.['getStoriesIds']?.['db'] || '-',
    'Error database - putStoriesIds': map?.['putStoriesIds']?.['db'] || '-',
    'Error database - getStoriesDetails': map?.['getStoriesDetails']?.['db'] || '-',
    'Error database - putStoryDetails': map?.['putStoryDetails']?.['db'] || '-',
    'Error database - getQueryResults': map?.['getQueryResults']?.['db'] || '-',
    'Error database - putQueryResults': map?.['getLinks']?.['db'] || '-',
    'Error database - getWebsitesData': map?.['getWebsitesData']?.['db'] || '-',
    'Error database - putWebsiteData': map?.['putWebsiteData']?.['db'] || '-',
    'Error crawler - getGoogleSearchResultsByQueries':  map?.['getGoogleSearchResultsByQueries'] || '-',
    'Error crawler - getWebsiteDataByLink':  map?.['getWebsiteDataByLink'] || '-',
  })

  console.table({
    'CPU Usage': Number((Number(usage) * 100).toFixed(2)),
    'Load Average': Number(Number(loadAvg).toFixed(2)),
  })



}
