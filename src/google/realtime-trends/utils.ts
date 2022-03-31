import Bull = require("bull")
import { getRedisClient } from "../../redis/client"
import { storiesQueue, idsQueue, linksQueue, queriesQueue, browserlessQueue } from "./bull/queues"
import { BROWSERLESS, IDS_DATA_QUEUE, LINKS_DATA_QUEUE, QUERY_DATA_QUEUE, STORY_DATA_QUEUE } from "./constants"


/** 
 * Add jobs to a queue
*/
export const fillQueueWithData = async (queue: string, data: any) => {
  switch (queue) {
    case LINKS_DATA_QUEUE: {
      return linksQueue.add(data)
    }
    case IDS_DATA_QUEUE: {
      return idsQueue.add(data)
    }
    case STORY_DATA_QUEUE: {
      return storiesQueue.add(data)
    }
    case QUERY_DATA_QUEUE: {
      return queriesQueue.add(data)
    }
    case BROWSERLESS: {
      return browserlessQueue.add(data)
    }
  }
}

/** 
 * Check Total jobs completed + failed
*/
export const queueJobsCompleted = async (queue: Bull.Queue<any>) => {
  const completed = Number((await queue.getJobCounts()).completed)
  return completed
}

export const queueJobsFailed = async (queue: Bull.Queue<any>) => {
  const failed = Number((await queue.getJobCounts()).failed)
  return failed
}

export const getQueueTotalJobs = async (queue: Bull.Queue<any>, type: 'completed' | 'failed', key: string) => {
  const redisValue = await getRedisValue(key)

  if (!redisValue) return 0

  const count = Number((await queue.getJobCounts())[type])
  const totalJobsCompleted = Number(redisValue) + count

  setRedisValue(key, totalJobsCompleted)

  return totalJobsCompleted
}


/** 
 * Check if a queue has jobs to process
*/
export const queueHasWaitingJobs = async (queue: string) => {
  switch (queue) {
    case LINKS_DATA_QUEUE: {
      return Boolean((await linksQueue.getJobCounts()).waiting)
    }
    case IDS_DATA_QUEUE: {
      return Boolean((await idsQueue.getJobCounts()).waiting)
    }
    case STORY_DATA_QUEUE: {
      return Boolean((await storiesQueue.getJobCounts()).waiting)
    }
    case QUERY_DATA_QUEUE: {
      return Boolean((await queriesQueue.getJobCounts()).waiting)
    }
  }
}

export const emptyQueue = async (queue: string) => {
  switch (queue) {
    case LINKS_DATA_QUEUE: {
      return await linksQueue.clean(0)
    }
    case IDS_DATA_QUEUE: {
      return await idsQueue.clean(0)
    }
    case STORY_DATA_QUEUE: {
      return await storiesQueue.clean(0)
    }
    case QUERY_DATA_QUEUE: {
      return await queriesQueue.clean(0)
    }
  }
}

/** 
 * Checks if
 * 1 - Queue has any data
 * 2 - Has waiting jobs to process
*/
export const isQueueBusy = async (key: string) => {
  const hasWaitingJobs = await queueHasWaitingJobs(key)

  if (hasWaitingJobs) return true

  return false
}

/** 
 * Checks the current offset of a key in redis
 * If offset is set then return incremented new offset
 * Otherwise return initial offset - 0
*/
export const getOffset = async (key: string) => {
  const offset = await getRedisValue(key)

  return offset ? Number(offset) : 0
}
export const setOffset = async (key: string) => {
  const offset = await getRedisValue(key)

  if (!offset) {
    setRedisValue(key, 0)

    return 0
  }

  const newOffset = Number(offset) + 30
  setRedisValue(key, newOffset)
}


const redisCient = getRedisClient()
export const setRedisValue = (key: string, value: any) => redisCient.set(key, JSON.stringify(value))
export const getRedisValue = (key: string) => redisCient.get(key)



//create title from joint string
export const createTitle = (title: string) => {
  return title.split(/(?=[A-Z])/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}


export const setQueueStatus = async (queue: string, value: any) => {
  await setRedisValue(queue, value)
}
