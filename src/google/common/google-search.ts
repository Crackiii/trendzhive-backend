import { Cluster } from 'puppeteer-cluster'
import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'
import { Page } from 'puppeteer'

const proxies = [
  '165.231.130.100:7777',
  '23.231.12.27:7777', //worked
  '165.231.130.134:7777',
  '185.104.218.53:7777', //worked
  '196.245.239.208:7777'
]

export const getGoogleSearchResultsByQueries = async (queries: string[]) => {

  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 100,
    monitor: false,
    timeout: 60000,
    puppeteerOptions: {
      args: ['--lang=en-US', '--window-size=1920,1080', `--proxy-server=${proxies[0]}`],
      defaultViewport: null
    }
  })


  const queriesData: any = []

  cluster.on("taskerror", (err, data) => {
    console.log(`Error crawling: ${data}: ${err.message}`)
  })

  await cluster.task(async ({ page, data: query }) => {

    if (!Boolean(query.length)) return [{ links: [], query }];

    await page.authenticate({ username: 'nadeemahmad', password: 'Ndim2229' })

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US'
    })

    await page.goto(`https://google.com/search?q=${query}`)

    await page.screenshot({ path: 'search.png' });

    // Wait for search results container to be available
    try {
      await page.waitForSelector("#search", { visible: true, timeout: 30000 });
    } catch (error) {
      const isTrafficDetected = await page.evaluate(() => {
        return /Our systems have detected unusual traffic from your computer/gim.test(document.body.textContent)
      })

      return { trafficError: isTrafficDetected }
    }

    // Collect all the links
    const data = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.yuRUbf'))
      const data = links.map(link => {
        return {
          link: link.querySelector('a').getAttribute('href'),
          title: link.querySelector('h3').textContent.trim(),
        }
      })

      return data
    })

    queriesData.push({ links: data, query })
  })

  for (const query of queries) cluster.queue(query)

  await cluster.idle()
  await cluster.close()

  return queriesData
}




export const getWebsiteDataByLink = async (links: string[]) => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 100,
    monitor: false,
    timeout: 30000,
    puppeteerOptions: {
      args: ['--lang=en-US', '--window-size=1920,1080']
    }
  })

  const websiteData: any = []

  cluster.on("taskerror", (err, data) => {
    console.log(`Error crawling: ${data}: ${err.message}`)
  })

  await cluster.task(async ({ page, data: url }) => {
    if (!Boolean(url)) return;

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US'
    })

    await page.goto(url, { waitUntil: 'load', timeout: 0 })

    const type = websiteType(url)

    if (type === 'youtube') {
      const data = await evaluateYoutubeData(page)

      websiteData.push(data)
    }

    if (type === 'general') {
      const data = await evaluateGeneralWebsite(page)

      websiteData.push(data)
    }

  })

  for (const url of links) cluster.queue(url)

  await cluster.idle()
  await cluster.close()

  return websiteData
}

const websiteType = (url: string): 'youtube' | 'general' => {
  if (/youtube.com/gmi.test(url)) return 'youtube'

  return 'general'
}


const evaluateGeneralWebsite = async (page: Page) => {

  const data = await page.evaluate(() => {
    return document.body.outerHTML
  })

  const metaData = await getPageMetaData(page)

  const doc = new JSDOM(data)
  const reader = new Readability(doc.window.document)

  return { html: reader.parse()?.content, metaData }
}

const evaluateYoutubeData = async (page: Page) => {
  const data = await page.evaluate(() => {
    var videos = Array.from(document.querySelectorAll('ytd-compact-video-renderer'));

    var data = videos.map(video => {
      const meta = video.querySelectorAll('a')[1]
      const thumbnail = video.querySelector('img').getAttribute('src');
      const author = meta.querySelector('#channel-name').querySelector('#text-container').textContent.trim();
      const link = meta.getAttribute('href');
      const title = meta.querySelector('h3').textContent.trim();

      return { thumbnail, author, link, title }
    })

    return data;
  })

  const metaData = await getPageMetaData(page)

  return { data, metaData }
}

const getPageMetaData = async (page: Page) => {
  const metaData = await page.evaluate(() => {
    const metas = Array.from(document.querySelectorAll('meta'));

    const title = document.title

    const keywords = metas
      .filter(meta => meta?.getAttribute('name') === 'keywords')
      .map(meta => meta?.getAttribute('content')).join(',')

    const metaDescription = metas
      .find(meta => meta?.getAttribute('name') === 'description')?.getAttribute('content')


    const facebook = metas
      .filter(meta => /og:/gmi.test(meta?.getAttribute('property')))
      .map(meta => ({
        property: meta?.getAttribute('property'),
        content: meta?.getAttribute('content')
      }))

    const twitter = metas
      .filter(meta => /twitter:/gmi.test(meta?.getAttribute('name')))
      .map(meta => ({
        property: meta?.getAttribute('name'),
        content: meta?.getAttribute('content')
      }))

    const images = [...facebook.filter(o => o.property === 'og:image' || /image/gmi.test(o.property)),
    ...twitter.filter(o => (o.property === 'twitter:image' || /image/gmi.test(o.property)))
    ].map(o => o?.content)

    const description = [...facebook.filter(o => o.property === 'og:description' || /description/gmi.test(o.property)),
    ...twitter.filter(o => (o.property === 'twitter:image' || /image/gmi.test(o.property)))
    ].map(o => o?.content)

    return { title, keywords, facebook, twitter, images, description: [...description, metaDescription] }
  })

  return metaData
}