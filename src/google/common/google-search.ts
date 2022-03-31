import * as puppeteer from 'puppeteer'

let instance: puppeteer.Browser = null;

const browserLessConnect = async () => {
  if(!instance) {
    return await puppeteer.connect({
      browserWSEndpoint: 'ws://localhost:8082'
    })
  }
  
  return instance
}

export const getGoogleSearchResultsByQueriesBrowserless = async (queries: string[]) => {

  const browser = await browserLessConnect()
  const queriesData: any = []

  for(const query of queries) {
    const page = await browser.newPage()
    await page.goto(`https://google.com/search?q=${query}`)
    await page.screenshot({path: 'failed_picture.png'})
    await page.waitForSelector("#search", { visible: true, timeout: 10000 });
    const links = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.yuRUbf'))
      const data = links.map(link => {
        return {
          link: link.querySelector('a').getAttribute('href'),
          title: link.querySelector('h3').textContent.trim(),
        }
      })
      return data
    })
    queriesData.push({ links: links, query })
    await page.close()
  }

  browser.close()
  return queriesData;
}
