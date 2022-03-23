import Bull = require("bull")
import { getRedisClient } from "../../redis/client"
import { storiesQueue, idsQueue, linksQueue, queriesQueue } from "./bull/queues"
import { GLOBAL_ERRORS_KEY, IDS_DATA_QUEUE, LINKS_DATA_QUEUE, QUERY_DATA_QUEUE, STORY_DATA_QUEUE } from "./constants"


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


export const setGlobalError = async (error: string) => {

  const oldErrors = await getRedisValue(GLOBAL_ERRORS_KEY)

  if(!oldErrors) {
    setRedisValue(GLOBAL_ERRORS_KEY, [error])
  } 

  setRedisValue(GLOBAL_ERRORS_KEY, [...JSON.parse(oldErrors), error])
}

export const getGlobalErrors = async (): Promise<any> => {

  const oldErrors = await getRedisValue(GLOBAL_ERRORS_KEY)

  if(!oldErrors) return {}

  const errors = JSON.parse(oldErrors)
  let map: any = {}

  errors.forEach((error: string) => {

    if(/status code 400/gmi.test(error)) {
      if(/idsQueue/gmi.test(error)) {
        const oldValue =  map?.['idsQueue']?.['400']
        if(oldValue) {
          map = {...map, idsQueue: {400: Number(oldValue) + 1}}
        } else {
          map = {...map, idsQueue: {400: 1}}
        }
      }
      if(/linksQueue/gmi.test(error)) {
        const oldValue =  map?.['linksQueue']?.['400']
        if(oldValue) {
          map = {...map, linksQueue: {400: Number(oldValue) + 1}}
        }else {
          map = {...map, linksQueue: {400: 1}}
        }
      }
      if(/storiesQueue/gmi.test(error)) {
        const oldValue =  map?.['storiesQueue']?.['400']
        if(oldValue) {
          map = {...map, storiesQueue: {400: Number(oldValue) + 1}}
        }else {
          map = {...map, storiesQueue: {400: 1}}
        }
      }
      if(/queriesQueue/gmi.test(error)) {
        const oldValue =  map?.['queriesQueue']?.['400']
        if(oldValue) {
          map = {...map, queriesQueue: {400: Number(oldValue) + 1}}
        }else {
          map = {...map, idsQueue: {400: 1}}
        }
      }
    }

    if(/status code 429/gmi.test(error)) {
      if(/idsQueue/gmi.test(error)) {
        const oldValue =  map?.['idsQueue']?.['429']
        if(oldValue) {
          map = {...map, idsQueue: {429: Number(oldValue) + 1}}
        }else {
          map = {...map, idsQueue: {429: 1}}
        }
      }
      if(/linksQueue/gmi.test(error)) {
        const oldValue =  map?.['linksQueue']?.['429']
        if(oldValue) {
          map = {...map, linksQueue: {429: Number(oldValue) + 1}}
        }else {
          map = {...map, linksQueue: {429: 1}}
        }
      }
      if(/storiesQueue/gmi.test(error)) {
        const oldValue =  map?.['storiesQueue']?.['429']
        if(oldValue) {
          map = {...map, storiesQueue: {429: Number(oldValue) + 1}}
        }else {
          map = {...map, storiesQueue: {429: 1}}
        }
      }
      if(/queriesQueue/gmi.test(error)) {
        const oldValue =  map?.['queriesQueue']?.['429']
        if(oldValue) {
          map = {...map, queriesQueue: {429: Number(oldValue) + 1}}
        }else {
          map = {...map, queriesQueue: {429: 1}}
        }
      }
      if(/getGoogleSearchResultsByQueries/gmi.test(error)) {
        const oldValue =  map?.['getGoogleSearchResultsByQueries']
          if(oldValue) {
            map = {...map, getGoogleSearchResultsByQueries:  {429: Number(oldValue) + 1}}
          } else {
            map = {...map, getGoogleSearchResultsByQueries: {429: 1}}
          }
      }
  
      if(/getWebsiteDataByLink/gmi.test(error)) {
        const oldValue =  map?.['getWebsiteDataByLink']
          if(oldValue) {
            map = {...map, getWebsiteDataByLink:  {429: Number(oldValue) + 1}}
          } else {
            map = {...map, getWebsiteDataByLink: {429: 1}}
          }
      }
    }

    if(/getGoogleSearchResultsByQueries/gmi.test(error)) {
      const oldValue =  map?.['getGoogleSearchResultsByQueries']
        if(oldValue) {
          map = {...map, getGoogleSearchResultsByQueries:  Number(oldValue) + 1}
        } else {
          map = {...map, getGoogleSearchResultsByQueries: 1}
        }
    }

    if(/getWebsiteDataByLink/gmi.test(error)) {
      const oldValue =  map?.['getWebsiteDataByLink']
        if(oldValue) {
          map = {...map, getWebsiteDataByLink:  Number(oldValue) + 1}
        } else {
          map = {...map, getWebsiteDataByLink: 1}
        }
    }



    if(/getLinks/gmi.test(error)) {
      const oldValue =  map?.['getLinks']
        if(oldValue) {
          map = {...map, getLinks: {db:  Number(oldValue) + 1}}
        } else {
          map = {...map, getLinks: {db: 1}}
        }
    }

    if(/putLinks/gmi.test(error)) {
      const oldValue =  map?.['putLinks']
        if(oldValue) {
          map = {...map, putLinks:  {db: Number(oldValue) + 1}}
        } else {
          map = {...map, putLinks: {db: 1}}
        }
    }

    if(/getStoriesIds/gmi.test(error)) {
      const oldValue =  map?.['getStoriesIds']
        if(oldValue) {
          map = {...map, getStoriesIds:  {db: Number(oldValue) + 1}}
        } else {
          map = {...map, getStoriesIds: {db: 1}}
        }
    }

    if(/putStoriesIds/gmi.test(error)) {
      const oldValue =  map?.['putStoriesIds']
        if(oldValue) {
          map = {...map, putStoriesIds:  {db: Number(oldValue) + 1}}
        } else {
          map = {...map, putStoriesIds: {db: 1}}
        }
    }

    if(/getStoriesDetails/gmi.test(error)) {
      const oldValue =  map?.['getStoriesDetails']
        if(oldValue) {
          map = {...map, getStoriesDetails:  {db: Number(oldValue) + 1}}
        } else {
          map = {...map, getStoriesDetails: {db: 1}}
        }
    }

    if(/putStoryDetails/gmi.test(error)) {
      const oldValue =  map?.['putStoryDetails']
        if(oldValue) {
          map = {...map, putStoryDetails:  {db: Number(oldValue) + 1}}
        } else {
          map = {...map, putStoryDetails: {db: 1}}
        }
    }

    if(/getQueryResults/gmi.test(error)) {
      const oldValue =  map?.['getQueryResults']
        if(oldValue) {
          map = {...map, getQueryResults:  {db: Number(oldValue) + 1}}
        } else {
          map = {...map, getQueryResults: {db: 1}}
        }
    }

    if(/putQueryResults/gmi.test(error)) {
      const oldValue =  map?.['putQueryResults']
        if(oldValue) {
          map = {...map, putQueryResults:  {db: Number(oldValue) + 1}}
        } else {
          map = {...map, putQueryResults: {db: 1}}
        }
    }

    if(/getWebsitesData/gmi.test(error)) {
      const oldValue =  map?.['getWebsitesData']
        if(oldValue) {
          map = {...map, getWebsitesData:  {db: Number(oldValue) + 1}}
        } else {
          map = {...map, getWebsitesData: {db: 1}}
        }
    }

    if(/putWebsiteData/gmi.test(error)) {
      const oldValue =  map?.['putWebsiteData']
        if(oldValue) {
          map = {...map, putWebsiteData:  {db: Number(oldValue) + 1}}
        } else {
          map = {...map, putWebsiteData: {db: 1}}
        }
    }

  })

  return map
}