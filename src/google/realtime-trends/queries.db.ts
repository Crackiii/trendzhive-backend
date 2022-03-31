import { realtime_categories, realtime_countries } from "../../config"
import { getPostgresClient } from "../../postgres/client"

const postgresClient = getPostgresClient()

export const getLinks = async (offset: number) => {

  try {
    const results = await postgresClient.query(`
      SELECT *
      FROM scrapping_links
      ORDER BY id asc
      LIMIT 30
      OFFSET ${offset}
    `)

    return results.rows
  } catch (error) {
    setGlobalError({
      status: 'Database getLinks()',
      status_code: error.statusCode,
      reason: error.message,
      job_id: 'GET',
      data: '-'
    })
    throw new Error(error)
  }
}

export const putLinks = async () => {

  try {
    for (const country of realtime_countries) {
      for (const category of realtime_categories) {
        const [countryName, countryCode] = country.split('-')

        await postgresClient.query(`
          INSERT INTO 
          scrapping_links(category, category_short, country, country_short)
            VALUES('${category.split('-')[1].trim()}', '${category.split('-')[0].trim()}', '${countryName.trim()}', '${countryCode.trim()}')
        `)
      }
    }
  } catch (error) {
    setGlobalError({
      status: 'Database putLinks()',
      status_code: error.statusCode,
      reason: error.message,
      job_id: 'PUT',
      data: '-'
    })
    throw new Error(error)
  }
}


export const getStoriesIds = async (offset: number) => {
  try {
    const results = await postgresClient.query(`SELECT *
      FROM story_ids
      ORDER BY id asc
      LIMIT 30
      OFFSET ${offset}
    `)

    return results.rows
  } catch (error) {
    setGlobalError({
      status: 'Database getStoriesIds()',
      status_code: error.statusCode,
      reason: error.message,
      job_id: 'GET',
      data: '-'
    })
    throw new Error(error)
  }
}


interface PutStoryIdsParams {
  country: string
  category: string
  id: string
  related_link: string
}

export const putStoriesIds = async ({ country, category, id, related_link }: PutStoryIdsParams) => {

  const query = {
    text: `INSERT INTO story_ids (country, category, story_id, related_link) VALUES ($1, $2, $3, $4)`,
    values: [country, category, id, related_link]
  }

  try {
    await postgresClient.query(query)

    return true
  } catch (error) {
    setGlobalError({
      status: 'Database putStoriesIds()',
      status_code: error.statusCode,
      reason: error.message,
      job_id: 'PUT',
      data: '-'
    })
    throw new Error(error)
  }
}

export const getStoriesDetails = async (offset: number) => {
  try {
    const results = await postgresClient.query(
      `SELECT id, related_queries FROM story_data 
       ORDER BY id asc
       LIMIT 30
       OFFSET ${offset}`
    )

    return results.rows
  } catch (error) {
    setGlobalError({
      status: 'Database getStoriesDetails()',
      status_code: error.statusCode,
      reason: error.message,
      job_id: 'GET',
      data: '-'
    })
    throw new Error(error)
  }
}

interface PutStoryDetailsParams {
  queries: string[]
  articles: any[]
  id: string
}
export const putStoryDetails = async ({ queries, articles, id }: PutStoryDetailsParams) => {

  const query = {
    text: `INSERT INTO story_data(related_queries, related_articles, related_story_id) VALUES($1, $2, $3)`,
    values: [
      {queries},
      {articles},
      `${id}`
    ]
  }

  try {
    await postgresClient.query(query)

    return true
  } catch (error) {
    setGlobalError({
      status: 'Database putStoryDetails()',
      status_code: error.statusCode,
      reason: error.message,
      job_id: 'PUT',
      data: '-'
    })
    throw new Error(error)
  }
}


export const getQueryResults = async (offset: number) => {
  try {
    const results = await postgresClient.query(
      `SELECT id, links FROM query_data
       ORDER BY id asc
       LIMIT 30
       OFFSET ${offset}`
    )

    return results.rows
  } catch (error) {
    setGlobalError({
      status: 'Database getQueryResults()',
      status_code: error.statusCode,
      reason: error.message,
      job_id: 'GET',
      data: '-'
    })
    throw new Error(error)
  }
}

interface PutQueryResultsParams {
  query: string
  links: any[]
  id: string
}
export const putQueryResults = async ({ query, links, id }: PutQueryResultsParams) => {

  const sqlQuery = {
    text: `INSERT INTO query_data(query, links, related_story) VALUES($1, $2, $3)`,
    values: [
      `${query}`,
      {links},
      `${id}`
    ]
  }

  try {
    await postgresClient.query(sqlQuery)
    return true
  } catch (error) {
    setGlobalError({
      status: 'Database putQueryResults()',
      status_code: error.statusCode,
      reason: error.message,
      job_id: 'PUT',
      data: '-'
    })
    throw new Error(error)
  }
}



export const getWebsitesData = async (offset: number) => {

  try {
    const results = await postgresClient.query(`
      SELECT * FROM website_data
      ORDER BY id asc
      LIMIT 30
      OFFSET ${offset}
    `)

    const cols = ['descriptions', 'images', 'social', 'title']

    return results.rows.map(row => {
      Object.keys(row).forEach(key => {
        if (cols.includes(key)) {
          row[key] = JSON.parse(row[key])
        }
      })
      return row
    })
  } catch (error) {
    setGlobalError({
      status: 'Database getWebsitesData()',
      status_code: error.statusCode,
      reason: error.message,
      job_id: 'GET',
      data: '-'
    })
    throw new Error(error)
  }
}


interface PutWebsiteDataParams {
  title: string[]
  descriptions: string[]
  short_description: string;
  keywords: string
  social: any[]
  images: string[]
  html: string
  related_query_id: string
  url: string
  favicon: string
  allImages: string[]
}
export const putWebsiteData = async ({ title, descriptions, keywords, social, images, html, related_query_id, url, favicon, allImages, short_description }: PutWebsiteDataParams) => {

  const query_data =  await postgresClient.query(`SELECT related_story, links, query FROM query_data WHERE id = $1`, [related_query_id]);
  const related_queries_articles = await postgresClient.query(`SELECT related_articles, related_queries, related_story_id FROM story_data WHERE id = $1`, [query_data.rows[0].related_story]);
  const category_country = await postgresClient.query(`SELECT related_link FROM story_ids WHERE id = $1`, [related_queries_articles.rows[0].related_story_id]);
  const related_link_data = await postgresClient.query(`SELECT country, country_short, category, category_short FROM scrapping_links WHERE id = $1`, [category_country.rows[0].related_link]);

    const related_links = query_data.rows[0].links;
    const related_query = query_data.rows[0].query;
    const related_articles =   related_queries_articles.rows[0].related_articles;
    const related_queries =   related_queries_articles.rows[0].related_queries;
    const related_country = related_link_data.rows[0].country;
    const related_country_short = related_link_data.rows[0].country_short;
    const related_category = related_link_data.rows[0].category;
    const related_category_short = related_link_data.rows[0].category_short;

  const query = {
    text: `INSERT INTO website_data(
              keywords            ,  
              favicon             ,
              social              ,
              url                 ,
              titles              ,
              images              ,
              all_images          ,
              descriptions        ,
              short_description   ,
              related_country     ,
              related_category    ,
              related_links       ,
              related_articles    ,
              related_queries     ,
              related_videos      ,
              related_news        ,
              related_products    ,
              html                ,
              is_trending         ,
              related_query
            ) 
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
    values: [
      `${keywords}`,
      `${favicon}`,
      {social},
      `${url}`,
      {titles: title},
      {images},
      {allImages},
      {descriptions},
      `${short_description}`,
      `${related_country} - ${related_country_short}`,
      `${related_category} - ${related_category_short}`,
        {related_links}, // no need to stringify
        {related_articles},// no need to stringify
        {related_queries},// no need to stringify
      {},
      {},
      {},
      `${html}`,
      `${true}`,
      `${related_query}`,
    ]
  }
  try {
    await postgresClient.query(query)
    return true
  } catch (error) {
    setGlobalError({
      status: 'Database putWebsiteData()',
      status_code: error.statusCode,
      reason: error.message,
      job_id: 'PUT',
      data: '-'
    })
    throw new Error(error)
  }
}




interface ErrorParams {
  status: string
  status_code: number
  reason: string
  job_id: string
  data: any
}
export const setGlobalError = async ({status, status_code, reason, job_id, data}: ErrorParams) => {

  const query = {
    text: `INSERT INTO scrapping_errors(
              status            ,  
              status_code       ,  
              reason            ,  
              job_id            ,  
              data               
            ) 
            VALUES($1, $2, $3, $4, $5)`,
    values: [
      `${status || '-'}`,
      `${status_code || '-'}`,
      `${reason || '-'}`,
      `${job_id || '-'}`,
      `${data || '-'|| '-'}`,
    ]
  }
  try {
    await postgresClient.query(query)
  } catch (error) {
    throw new Error(error)
  }
}

export const getGlobalErrors = async () => {
  try {
    return (await postgresClient.query(`SELECT * FROM scrapping_errors`)).rows
  } catch (error) {
    throw new Error(error)
  }
}