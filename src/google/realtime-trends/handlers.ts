import * as cron from 'node-cron'
import * as constants from './constants'
import { getLinks, getQueryResults, getStoriesDetails, getStoriesIds, putLinks } from './queries.db'
import {
  emptyQueue,
  fillQueueWithData,
  getOffset,
  getQueueTotalJobs,
  isQueueBusy,
  setOffset,
  setQueueStatus,
} from './utils'
import { idsQueue, linksQueue, queriesQueue, storiesQueue } from './bull/queues'
import { checkScrappingStatus } from './services'

/** 
 * Check if we have jobs in linksQueue
 * Refill it if not
*/
export const checkLinksQueue = cron.schedule('*/1 * * * * *', async () => {
  const isBusy = await isQueueBusy(constants.LINKS_DATA_QUEUE)

  await setQueueStatus(constants.LINKS_QUEUE_STATUS, isBusy ? 'Busy' : 'Idle')

  if (isBusy) return

  await setQueueStatus(
    constants.LINKS_QUEUE_TOTAL_JOBS_PROCESSED,
    await getQueueTotalJobs(linksQueue, 'completed', constants.LINKS_QUEUE_TOTAL_JOBS_PROCESSED)
  )

  await emptyQueue(constants.LINKS_DATA_QUEUE)

  const linksOffset = await getOffset(constants.REALTIME_LINKS_OFFSET_KEY)
  const links = await getLinks(linksOffset)
  
  if (!links.length) await putLinks()

  if (links.length < 30) return

  for (const link of links) {
    fillQueueWithData(constants.LINKS_DATA_QUEUE, link)
  }

  await setOffset(constants.REALTIME_LINKS_OFFSET_KEY)
})

/**
 * Check if we have IDs in queue
 * Refill it if not
*/
export const checkIdsQueue = cron.schedule('*/1 * * * * *', async () => {
  const isBusy = await isQueueBusy(constants.IDS_DATA_QUEUE)

  await setQueueStatus(constants.IDS_QUEUE_STATUS, isBusy ? 'Busy' : 'Idle')

  if (isBusy) return

  await setQueueStatus(
    constants.IDS_QUEUE_TOTAL_JOBS_PROCESSED,
    await getQueueTotalJobs(idsQueue, 'completed', constants.IDS_QUEUE_TOTAL_JOBS_PROCESSED)
  )

  await emptyQueue(constants.IDS_DATA_QUEUE)

  const idsOffset = await getOffset(constants.REALTIME_IDS_OFFSET_KEY)
  const ids = await getStoriesIds(idsOffset)

  if (!ids.length || ids.length < 30) return

  for (const id of ids) {
    fillQueueWithData(constants.IDS_DATA_QUEUE, id)
  }

  await setOffset(constants.REALTIME_IDS_OFFSET_KEY)
})

/** 
 * Check if we have stories in queue
 * Scrap topics data 
*/
export const checkStoriesQueue = cron.schedule('*/1 * * * * *', async () => {
  const isBusy = await isQueueBusy(constants.STORY_DATA_QUEUE)

  await setQueueStatus(constants.STORIES_QUEUE_STATUS, isBusy ? 'Busy' : 'Idle')

  if (isBusy) return

  await setQueueStatus(
    constants.STORIES_QUEUE_TOTAL_JOBS_PROCESSED,
    await getQueueTotalJobs(storiesQueue, 'completed', constants.STORIES_QUEUE_TOTAL_JOBS_PROCESSED)
  )

  await emptyQueue(constants.STORY_DATA_QUEUE)

  const storiesOffset = await getOffset(constants.REALTIME_STORIES_OFFSET_KEY)
  const stories: any = await getStoriesDetails(storiesOffset)

  if (!Boolean(stories.length) || stories.length < 30) return


  for (const story of stories) {
    const related_queries = JSON.parse((story['related_queries']))

    fillQueueWithData(constants.STORY_DATA_QUEUE, { queries: related_queries, story_id: story.id })
  }

  await setOffset(constants.REALTIME_STORIES_OFFSET_KEY)
})


/** 
 * Check if we have websites links in queue
 * Scrap website data 
*/
export const checkQueriesQueue = cron.schedule('*/1 * * * * *', async () => {
  const isBusy = await isQueueBusy(constants.QUERY_DATA_QUEUE)

  await setQueueStatus(constants.QUERIES_QUEUE_STATUS, isBusy ? 'Busy' : 'Idle')

  if (isBusy) return

  await setQueueStatus(
    constants.QUERIES_QUEUE_TOTAL_JOBS_PROCESSED,
    await getQueueTotalJobs(queriesQueue, 'completed', constants.QUERIES_QUEUE_TOTAL_JOBS_PROCESSED)
  )

  await emptyQueue(constants.QUERY_DATA_QUEUE)

  const queriesOffset = await getOffset(constants.REALTIME_QUERIES_OFFSET_KEY)
  const queriesWebsites = await getQueryResults(queriesOffset)

  if (!queriesWebsites.length || queriesWebsites.length < 30) return

  for (const query of queriesWebsites) {
    const links = JSON.parse((query['links']))
    fillQueueWithData(constants.QUERY_DATA_QUEUE, { links, query_id: query.id })
  }

  await setOffset(constants.REALTIME_QUERIES_OFFSET_KEY)
})



/** 
 * Check scrapping status
*/
cron.schedule('*/1 * * * * *', checkScrappingStatus)