import {
  getRelatedSearchCategories,
  getRelatedSearchCountries,
  getRelatedSearchesTimeRanges,
  getRelatedSearchProperties,
  getRelatedTrendsSearchQueries,
  getRelatedTrendsSearchTopics
} from "../../api/google-trends"
import { countries } from "../../config"
import {
  addSearchLinkData,
  addSearchTrendsLinks,
  addSearchTrendsScrappingDetails,
  getSearchTrendsLinks,
  getSearchTrendsScrappingDetails
} from "../../database"
import { consoleTable } from "../../utils"

// Get google related trends search countries
export const createSearchLinks = async () => {

  // Countries
  const searchedCountries = await getRelatedSearchCountries()
  const mappedCountries = searchedCountries.filter((country: any) => countries.find((c) => c === country.name))

  // Categories
  const searchedCategories = await getRelatedSearchCategories()

  // Properties
  const searchedProperties = await getRelatedSearchProperties()

  // Time ranges
  const searchTimeranges = await getRelatedSearchesTimeRanges()

  const linksData: any[] = [];

  for (const category of searchedCategories) {
    for (const country of mappedCountries) {
      for (const property of searchedProperties) {
        for (const time of searchTimeranges) {
          linksData.push({ category, country, property, time })
        }
      }
    }
  }

  for (const link of linksData) {
    await addSearchTrendsLinks({
      category_name: link.category.name,
      category_id: link.category.id.toString(),
      country_name: link.country.name,
      country_id: link.country.id,
      property_name: link.property.name,
      property_id: link.property.id,
      time_name: link.time.name,
      time_id: link.time.id
    })
  }

  return "DONE ... "
}



export const getRelatedQueriesTopics = async () => {
  const [scrappingDetails] = await getSearchTrendsScrappingDetails()

  const offset = scrappingDetails?.link_id ?? 0

  const links = await getSearchTrendsLinks({ offset, limit: 100 })

  for (const link of links) {
    const params = {
      CATGEORY: link.category_id,
      PROPERTY: link.property_id,
      LOCATION: link.country_id,
      TIME_RANGE_TEXT: link.time_id
    }

    const relatedQueries = await getRelatedTrendsSearchQueries(params)
    const relatedTopics = await getRelatedTrendsSearchTopics(params)

    await addSearchLinkData({
      related_queries: relatedQueries.map((r: any) => r.query).join(',').replace(/'/g, "\\'"),
      related_topics: JSON.stringify(relatedTopics).replace(/'/g, "\\'"),
      link_id: link.id.toString()
    })

    await addSearchTrendsScrappingDetails({
      link_id: `${link.id}`,
      scrapped_at: `${Date.now()}`
    })
    consoleTable({
      'Related topics & queries': {
        'Related Queries': relatedQueries.lengtInh,
        'Related Topics': relatedTopics.length,
        'Location': link.country_name + ` (${link.country_id})`,
        'Category': link.category_name + ` (${link.category_id})`,
        'Property': link.property_name + ` (${link.property_id})`,
        'Time Range': link.time_name + ` (${link.time_id})`,
        'Count': link.id,
        'Scrapper log Link id': `${link.id}`,
        'Scrapper logged at': `${Date.now()}`
      },
    })
  }

}

getRelatedQueriesTopics()

