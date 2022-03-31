import { getSearchTrendsLinksData } from "../database";


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




