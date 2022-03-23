export const LINKS_DATA_QUEUE = "realtime:links"
export const IDS_DATA_QUEUE = "realtime:ids"
export const STORY_DATA_QUEUE = "realtime:stories"
export const QUERY_DATA_QUEUE = "realtime:websites"

/** 
 * Setting offsets for database
 * To check from where to select the data from DB
*/
export const REALTIME_LINKS_DATA_KEY = "realtime:links"
export const REALTIME_IDS_DATA_KEY = "realtime:ids"
export const REALTIME_STORY_DATA_KEY = "realtime:stories"
export const REALTIME_QUERIES_DATA_KEY = "realtime:websites"

/** 
 * Setting offsets for database
 * To check from where to select the data from DB
*/
export const REALTIME_LINKS_OFFSET_KEY = "realtime:links_offset"
export const REALTIME_IDS_OFFSET_KEY = "realtime:ids_offset"
export const REALTIME_STORIES_OFFSET_KEY = "realtime:stories_offset"
export const REALTIME_QUERIES_OFFSET_KEY = "realtime:queries_offset"

/** 
 * Scrapping statuses for:
 * 1 - Queues - working, idle
 * 2 - Jobs processed by each queue
 * 3 - Current running job in each queue
 * 4 - Number of failed jobs in each queue
*/
export const LINKS_QUEUE_STATUS = "scrapper:links_queue:status"
export const IDS_QUEUE_STATUS = "scrapper:ids_queue:status"
export const STORIES_QUEUE_STATUS = "scrapper:stories_queue:status"
export const QUERIES_QUEUE_STATUS = "scrapper:queries_queue:status"

export const LINKS_QUEUE_CURRENT_JOBS_PROCESSED = "scrapper:links_queue:current:jobs"
export const IDS_QUEUE_CURRENT_JOBS_PROCESSED = "scrapper:ids_queue:current:jobs"
export const STORIES_QUEUE_CURRENT_JOBS_PROCESSED = "scrapper:stories_queue:current:jobs"
export const QUERIES_QUEUE_CURRENT_JOBS_PROCESSED = "scrapper:queries_queue:current:jobs"

export const LINKS_QUEUE_TOTAL_JOBS_PROCESSED = "scrapper:links_queue:total:jobs"
export const IDS_QUEUE_TOTAL_JOBS_PROCESSED = "scrapper:ids_queue:total:jobs"
export const STORIES_QUEUE_TOTAL_JOBS_PROCESSED = "scrapper:stories_queue:total:jobs"
export const QUERIES_QUEUE_TOTAL_JOBS_PROCESSED = "scrapper:queries_queue:total:jobs"

export const LINKS_QUEUE_JOB_RUNNING = "scrapper:links_queue:running"
export const IDS_QUEUE_JOB_RUNNING = "scrapper:ids_queue:running"
export const STORIES_QUEUE_JOB_RUNNING = "scrapper:stories_queue:running"
export const QUERIES_QUEUE_JOB_RUNNING = "scrapper:queries_queue:running"

// await cluster.idle()
// await cluster.close()

export const GLOBAL_ERRORS_KEY = "scrapper:errors"