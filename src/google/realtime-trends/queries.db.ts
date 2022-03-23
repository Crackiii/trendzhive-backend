import { realtime_categories, realtime_countries } from "../../config"
import { getPostgresClient } from "../../postgres/client"
import { setGlobalError } from "./utils"

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
    setGlobalError(`Error database getLinks() : ${error.message}`)
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
            VALUES('-', '${category}', '${countryName.trim()}', '${countryCode.trim()}')
        `)
      }
    }
  } catch (error) {
    setGlobalError(`Error database putLinks() : ${error.message}`)
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
    setGlobalError(`Error database getStoriesIds(): ${error.message}`)
    throw new Error(error)
  }
}


interface PutStoryIdsParams {
  country: string
  category: string
  id: string
}

export const putStoriesIds = async ({ country, category, id }: PutStoryIdsParams) => {

  const query = {
    text: `INSERT INTO story_ids (country, category, story_id, related_link) VALUES ($1, $2, $3, $4)`,
    values: [country, category, id, '-']
  }

  try {
    await postgresClient.query(query)

    return true
  } catch (error) {
    setGlobalError(`Error database putStoriesIds(): ${error.message}`)
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
    setGlobalError(`Error database getStoriesDetails(): ${error.message}`)
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
      `${JSON.stringify(queries)}`,
      `${JSON.stringify(articles)}`,
      `${id}`
    ]
  }

  try {
    await postgresClient.query(query)

    return true
  } catch (error) {
    setGlobalError(`Error database putStoryDetails(): ${error.message}`)
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
    setGlobalError(`Error database getQueryResults(): ${error.message}`)
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
      `${JSON.stringify(links)}`,
      `${id}`
    ]
  }

  try {
    await postgresClient.query(sqlQuery)
    return true
  } catch (error) {
    setGlobalError(`Error database putQueryResults(): ${error.message}`)
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
    setGlobalError(`Error database getWebsitesData(): ${error.message}`)
    throw new Error(error)
  }
}


interface PutWebsiteDataParams {
  title: string[]
  descriptions: string[]
  keywords: string
  social: any[]
  images: string[]
  html: string
  related_query_id: string
}
export const putWebsiteData = async ({ title, descriptions, keywords, social, images, html, related_query_id }: PutWebsiteDataParams) => {

  const query = {
    text: `INSERT INTO website_data(titles, descriptions, keywords, social, images, html, related_query_id, favicon) 
            VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
    values: [
      `${JSON.stringify(title)}`,
      `${JSON.stringify(descriptions)}`,
      `${keywords}`,
      `${JSON.stringify(social)}`,
      `${JSON.stringify(images)}`,
      `${html}`,
      `${related_query_id}`,
      `-`
    ]
  }
  try {
    await postgresClient.query(query)
    return true
  } catch (error) {
    setGlobalError(`Error database putWebsiteData(): ${error.message}`)
    throw new Error(error)
  }
}