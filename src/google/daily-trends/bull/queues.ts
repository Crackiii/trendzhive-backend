import * as Bull from 'bull'

// Queues configuration
const defaultJobOptions: Bull.JobOptions  = {
  attempts: 5
}

const queueConfig: Bull.QueueOptions = { defaultJobOptions }


// Realtime trends queues
export const GoogleTrendsScrapper =  {
  linksQueue: new Bull('scrapping:links','', queueConfig),
  storiesQueue : new Bull('scrapping:links:data', '', queueConfig),
  failedTasksQueue : new Bull('scrapping:failed:tasks', '', queueConfig)
}