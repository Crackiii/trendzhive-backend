import * as Bull from 'bull'
import {
  STORY_DATA_QUEUE,
  IDS_DATA_QUEUE,
  LINKS_DATA_QUEUE,
  QUERY_DATA_QUEUE,
  BROWSERLESS
} from '../constants'

const defaultJobOptions: Bull.JobOptions = {
  attempts: 3
}

const queueConfig: Bull.QueueOptions = {
  defaultJobOptions,
  redis: {
    host: '127.0.0.1',
    port: 6379
  }
}

// Realtime trends queues
export const linksQueue = new Bull(LINKS_DATA_QUEUE, '', queueConfig);
export const idsQueue = new Bull(IDS_DATA_QUEUE, '', queueConfig);
export const storiesQueue = new Bull(STORY_DATA_QUEUE, '', queueConfig);
export const queriesQueue = new Bull(QUERY_DATA_QUEUE, '', queueConfig);
export const browserlessQueue = new Bull(BROWSERLESS, '', queueConfig)

