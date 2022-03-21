import * as Bull from 'bull'
import {GoogleTrendsScrapper} from './queues'

const { linksQueue } = GoogleTrendsScrapper

linksQueue.process(async (job: Bull.Job) => {
  console.log(job.id)
})