import { Cluster } from 'puppeteer-cluster'
import { Cluster as ClusterConnect } from 'puppeteer-cluster-connect'
import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'
import { Page } from 'puppeteer'
import * as puppeteer from 'puppeteer'
import * as puppeteerCore from 'puppeteer-core'
import { setGlobalError } from '../realtime-trends/utils'

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

export const getGoogleBrowserlessCluster = async (queries: string[]) => {

  const cluster = await ClusterConnect.connect({
    concurrency: ClusterConnect.CONCURRENCY_BROWSER,
    maxConcurrency: 10,
    monitor: true,
    puppeteer: puppeteerCore, 
    timeout: 60000,
    puppeteerOptions: {
      browserWSEndpoint: 'ws://localhost:8082',
    }
  })

  await cluster.task(async ({ page, data: query }) => {
    await page.goto(`https://google.com/search?q=${query}`)
    await page.waitForSelector("#search", { visible: true, timeout: 30000 });
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.yuRUbf'))
      const data = links.map(link => {
        return {
          link: link.querySelector('a').getAttribute('href'),
          title: link.querySelector('h3').textContent.trim(),
        }
      })
      return data
    })
    await page.close()
  })

  await cluster.idle();
  await cluster.close();
}


export const getGoogleSearchResultsByQueries = async (queries: string[]) => {

  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 50,
    monitor: false,
    timeout: 60000,
    puppeteerOptions: {
      args: [
        '--lang=en-US', 
        '--window-size=1920,1080',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
      defaultViewport: null,
      headless: true,
    }
  })



  const queriesData: any = []

  cluster.on("taskerror", (err, data) => {
    setGlobalError(`Error crawling getGoogleSearchResultsByQueries(): ${data}: ${err.message}`)
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
    await page.close()
  })

  for (const query of queries) cluster.queue(query)

  await cluster.idle()
  await cluster.close()

  return queriesData
}


export const getGoogleSearchResultsByLinksBrowserless = async (links: string[]) => {

  const browser = await browserLessConnect()
  const websiteData: any = []

  for(const link of links) {
    const page = await browser.newPage()
    await page.goto(link)
    if (!Boolean(link)) return;

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US'
    })

    await page.goto(link, { waitUntil: 'load', timeout: 0 })

    const type = websiteType(link)

    if (type === 'youtube') {
      // const data = await evaluateYoutubeData(page)

      websiteData.push([])
    }

    if (type === 'general') {
      const data = await evaluateGeneralWebsite(page)

      websiteData.push(data)
    }
    page.close()

  }

  browser.close()
  return websiteData
}


export const getWebsiteDataByLink = async (links: string[]) => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 50,
    monitor: false,
    timeout: 30000,
    puppeteerOptions: {
      headless: true,
      defaultViewport: null,
      args: ['--lang=en-US', '--window-size=1920,1080']
    }
  })

  const websiteData: any = []

  cluster.on("taskerror", (err, data) => {
    setGlobalError(`Error crawling getWebsiteDataByLink(): ${data}: ${err.message}`)
  })

  await cluster.task(async ({ page, data: url }) => {
    if (!Boolean(url)) return;

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US'
    })

    await page.goto(url, { waitUntil: 'load', timeout: 0 })

    const type = websiteType(url)

    if (type === 'youtube') {
      // const data = await evaluateYoutubeData(page)

      websiteData.push([])
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

const websiteType = (url: string): 'youtube' | 'general' | 'instagram' | 'twitter' | 'facebook' => {
  if (/youtube.com/gmi.test(url)) return 'youtube'
  if (/twitter.com/gmi.test(url)) return 'twitter'
  if (/facebook.com/gmi.test(url)) return 'facebook'
  if (/instagram.com/gmi.test(url)) return 'instagram'

  return 'general'
}


const evaluateGeneralWebsite = async (page: Page) => {

  const data = await page.evaluate(() => {
    return document.body.outerHTML
  })

  const metaData = await getPageMetaData(page)
  await page.close()
  const doc = new JSDOM(data)
  const reader = new Readability(doc.window.document)

  return { html: reader.parse()?.content, metaData }
}

export const evaluateYoutubeData = async (page: Page) => {
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

    const getFavicon = () => {
        var favicon = '';
        var nodeList = document.getElementsByTagName("link");
        for (var i = 0; i < nodeList.length; i++)
        {
            if((nodeList[i].getAttribute("rel") == "icon")||(nodeList[i].getAttribute("rel") == "shortcut icon"))
            {
                favicon = nodeList[i].getAttribute("href");
            }
        }
        return favicon;        
    }

    const validURL = (str: string) =>  {
      var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    
      return !!pattern.test(str);
    }

    const url = location.href

    const allImages = Array.from(document.querySelectorAll('img')).map(img => img.src)

    const favicon = getFavicon()
  
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
    ].map(o => o?.content).filter(validURL)

    const description = [...facebook.filter(o => o.property === 'og:description' || /description/gmi.test(o.property)),
    ...twitter.filter(o => (o.property === 'twitter:image' || /image/gmi.test(o.property)))
    ].map(o => o?.content)

    return { title, keywords, facebook, twitter, images, description: [...description, metaDescription], favicon, url, allImages}
  })

  return metaData
}