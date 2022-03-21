import * as mysql from 'mysql'
// import { v4 as uuid } from 'uuid';

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "N@dim2229"
});

const mysqlQuery = async (query: string) => {
  const promise = new Promise((resolve, reject) => {
    connection.query(query, (err, reesponse) => {
      if (err) reject(err)

      resolve(reesponse)
    })
  })

  return await promise
}


export interface SearchTrendsLinksParams {
  category_name: string;
  category_id: string;
  country_name: string;
  country_id: string;
  property_name: string;
  property_id: string;
  time_name: string;
  time_id: string;
}
export const addSearchTrendsLinks = async (params: SearchTrendsLinksParams) => {

  const {
    category_name,
    category_id,
    country_name,
    country_id,
    property_name,
    property_id,
    time_name, time_id
  } = params

  const query = `INSERT INTO google_trends.search_trends_links 
                 (category_name, category_id, country_name, country_id, property_name, property_id, time_name, time_id) 
                 VALUES ('${category_name.replace(/'/g, "\\'")}', '${category_id}', '${country_name}', '${country_id}', '${property_name}', '${property_id}', '${time_name}', '${time_id}')`

  try {
    const response = await mysqlQuery(query)
    return response;
  } catch (error) {
    console.error(error)
  }
}


export interface RealtimeSearchTrendsLinksParams {
  category_name: string;
  category_id: string;
  country_name: string;
  country_id: string;
}
export const addRealtimeSearchLink = async (params: RealtimeSearchTrendsLinksParams) => {

  const {
    category_name,
    category_id,
    country_name,
    country_id,
  } = params


  const query = `INSERT INTO google_trends.realtime_search_links 
                 (category_name, category_id, country_name, country_id) 
                 VALUES ('${category_name.replace(/'/g, "\\'")}', '${category_id}', '${country_name}', '${country_id}')`

  try {
    return await mysqlQuery(query)
  } catch (error) {
    console.error(error)
  }
}



interface GetSearchTrendsLinksParams {
  limit: number;
  offset: number
}
export const getSearchTrendsLinks = async ({ offset, limit }: GetSearchTrendsLinksParams) => {
  const query = `SELECT * FROM google_trends.search_trends_links
                 LIMIT ${offset ?? 0}, ${limit ?? 100}`
  try {
    const response = await mysqlQuery(query) as any
    return response.map((p: any) => p);
  } catch (error) {
    console.error(error)
  }
}


interface SearchLinkDataParams {
  related_queries: string
  related_topics: string
  link_id: string
}
export const addSearchLinkData = async ({ related_queries, related_topics, link_id }: SearchLinkDataParams) => {
  const query = `INSERT INTO 
                  google_trends.search_trends_data 
                  (related_queries, related_topics, link_id) 
                  VALUES ('${related_queries}', '${related_topics}', '${link_id}')`

  try {
    const response = await mysqlQuery(query) as any
    return response
  } catch (error) {
    console.error(error)
  }
}


interface GetSearchTrendsLinkDataParams {
  limit: number,
  offset: number
}
export const getSearchTrendsLinksData = async ({ limit, offset }: GetSearchTrendsLinkDataParams) => {
  const query = `SELECT * FROM google_trends.search_trends_data
                 LIMIT ${offset ?? 0}, ${limit ?? 100}
                `
  try {
    return await mysqlQuery(query) as any
  } catch (error) {
    console.error(error)
  }
}


interface SearchTrendsScrappingDetailsParams {
  link_id: string;
  scrapped_at: string
}

export const addSearchTrendsScrappingDetails = async ({ link_id, scrapped_at }: SearchTrendsScrappingDetailsParams) => {
  const query = `INSERT INTO 
                  google_trends.search_trends_scrapping 
                  (link_id, scrapped_at) 
                  VALUES ('${link_id}', '${scrapped_at}')`

  try {
    return await mysqlQuery(query) as any
  } catch (error) {
    console.error(error)
  }
}

export const getSearchTrendsScrappingDetails = async () => {
  const query = `SELECT * FROM google_trends.search_trends_scrapping ORDER BY id DESC LIMIT 1`

  try {
    return await mysqlQuery(query) as any
  } catch (error) {
    console.error(error)
  }
}


interface GoogleSearchLinksParams {
  link: string;
  title: string;
  link_id: string;
  data_id: string;
}
export const addGoogleSearchLinks = async ({ link, title, link_id, data_id }: GoogleSearchLinksParams) => {
  const query = `INSERT INTO google_trends.google_search_links 
                  (link, title, link_id, data_id) 
                  VALUES ('${encodeURIComponent(link)}', '${encodeURIComponent(title)}', '${link_id}', '${data_id}')`
  try {
    return await mysqlQuery(query) as any
  } catch (error) {
    console.error(error)
  }
}