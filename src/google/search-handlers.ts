import { getGoogleSearchResultsByQueries } from "./common/google-search";
import { addGoogleSearchLinks, getSearchTrendsLinksData } from "../database";


export const getSearchTrendsLinksDataFromDB = async () => {
  try {
    const data = await getSearchTrendsLinksData({ limit: 100, offset: 0 })

    const mappedData = data.map((datum: any) => {
      const queries = datum.related_queries.split(',')
      const topics = JSON.parse(datum.related_topics)

      return {
        queries,
        topics,
        data_id: datum.id,
        link_id: datum.link_id
      }
    })

    return mappedData
  } catch (error) {
    throw new error
  }
}



export const scrapGoogleSearch = async () => {
  const linksData = await getSearchTrendsLinksDataFromDB()

  for (const { topics, queries, data_id, link_id } of linksData) {
    if (!queries.length && !topics.length) continue;

    const topicsToSearch = topics.map((topic: any) => topic.title)

    const googleSearchLinks = await getGoogleSearchResultsByQueries([...queries, ...topicsToSearch])

    for (const { data } of googleSearchLinks) {
      if (!data.length) continue;
      for (const { link, title } of data) {
        await addGoogleSearchLinks({
          link, title, data_id, link_id
        })
      }

    }
  }
}


