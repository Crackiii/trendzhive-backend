import config from "../../config"
import { getAxiosClient } from "../../api/client"
import {
  Configs,
  DEFAULT_LANGUAGE,
  DEFAULT_LOCATION,
  DEFAULT_TIMEZONE,
  DEFAULT_CATEGORY
} from "../../api/client"
import * as constants from './constants'
import { createTitle, getRedisValue, setQueueStatus } from "./utils"
import { idsQueue, linksQueue, queriesQueue, storiesQueue } from "./bull/queues"
import { putQueryData, putStoriesIds, putStoryData, putWebsiteData, setGlobalError } from "./queries.db"
import { getStoryDetailById } from "../../api/common"
import { Job } from "bull"
import axios from "axios"

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

  await setQueueStatus(constants.LINKS_QUEUE_JOB_RUNNING, `${job.data.country_short} - ${job.data.category_short}`)

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
        country,
        related_link: job.data.id
      })
    }
  } catch (error) {
    setGlobalError({
      status: 'Links Queue',
      status_code: error.statusCode,
      reason: error.message,
      job_id: `${job.id}`,
      data: job.data
    })
  }
})

// Processing ids queue jobs
idsQueue.process(1, async (job) => {

  await setQueueStatus(constants.IDS_QUEUE_JOB_RUNNING, job.data.story_id)

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

    await putStoryData({
      queries: relatedQueries,
      articles,
      id: job.data.id
    })
  } catch (error) {
    setGlobalError({
      status: 'IDS Queue',
      status_code: error.statusCode,
      reason: error.message,
      job_id: `${job.id}`,
      data: job.data
    })
  }
})

// Processing stories queue jobs
storiesQueue.process(1, async (job) => {

  await setQueueStatus(constants.STORIES_QUEUE_JOB_RUNNING, `Queries to scrap: ${job.data.queries.length}`)

  try {
    const googleSearchResults = await axios.post('https://google.trendscads.com/google-search/queries', { queries: job.data.queries })

    if(googleSearchResults.data.errors)  {
      for(const error of googleSearchResults.data.errors) {
        setGlobalError({
          status: 'Stories Queue',
          status_code: null,
          reason: error,
          job_id: `${job.id}`,
          data: job.data
        })
      }
    }

    if (/Failed to launch the browser process/gmi.test(googleSearchResults.data.queriesData)) {
      setGlobalError({
        status: 'Stories Queue',
        status_code: 500,
        reason: googleSearchResults.data,
        job_id: `${job.id}`,
        data: job.data.queries
      })
      return;
    }

    for (const result of googleSearchResults.data.queriesData) {
      await putQueryData({
        query: result.query,
        links: result.links,
        id: job.data.story_id,
      })
    }
  } catch (error) {
    setGlobalError({
      status: 'Stories Queue',
      status_code: error.statusCode,
      reason: error.message,
      job_id: `${job.id}`,
      data: job.data.queries
    })
  }
})

// Processing queries queue jobs
queriesQueue.process(1, async (job) => {

  await setQueueStatus(constants.QUERIES_QUEUE_JOB_RUNNING, `Links to process: ${job.data.links.length}`)

  try {
    const links = job.data.links
      .map((o: any) => o.link)
      .filter((link: string) => link.slice(link.length - 4) !== '.pdf'); // get rid of pdf links
    const query_id = job.data.query_id;

    const results = await axios.post('https://google.trendscads.com/google-search/links', { links })
    
    if(results.data.errors)  {
      for(const error of results.data.errors) {
        setGlobalError({
          status: 'Queries Queue',
          status_code: null,
          reason: error,
          job_id: `${job.id}`,
          data: job.data
        })
      }
    }

    if (/Failed to launch the browser process/gmi.test(results.data.websiteData)) {
      setGlobalError({
        status: 'Queries Queue',
        status_code: 500,
        reason: results.data.websiteData,
        job_id: `${job.id}`,
        data: job.data.links
      })
      return;
    }

    for (const website of results.data.websiteData) {
      await putWebsiteData({
        title: [website.metaData.title],
        keywords: website.metaData.keywords,
        social: [website.metaData.facebook, website.metaData.twitter],
        images: website.metaData.images,
        html: website.html,
        short_description: website.short_description,
        descriptions: website.metaData.description,
        url: website.metaData.url,
        favicon: website.metaData.favicon,
        allImages: website.metaData.allImages,
        related_query_id: query_id
      })
    }
  } catch (error) {
    setGlobalError({
      status: 'Queries Queue',
      status_code: error.statusCode,
      reason: error.message,
      job_id: `${job.id}`,
      data: job.data
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

  const linksQueueTotalJobsProcessed = await getRedisValue(constants.LINKS_QUEUE_TOTAL_JOBS_PROCESSED);
  const idsQueueTotalJobsProcessed = await getRedisValue(constants.IDS_QUEUE_TOTAL_JOBS_PROCESSED);
  const storiesQueueTotalJobsProcessed = await getRedisValue(constants.STORIES_QUEUE_TOTAL_JOBS_PROCESSED);
  const queriesQueueTotalJobsProcessed = await getRedisValue(constants.QUERIES_QUEUE_TOTAL_JOBS_PROCESSED);


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

}
