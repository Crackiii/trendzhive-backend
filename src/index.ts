import axios from 'axios-https-proxy-fix';
import * as express from 'express'
import { getGoogleSearchResultsByQueries } from './google/common/google-search';
const app = express()
const port = 3003

// interface Proxy {
//   host: string,
//   port: number,
//   auth: {
//     username: string,
//     password: string
//   }
// }

// const proxies: Proxy[] = [
//   {
//     host: '165.231.37.254',
//     port: 7777,
//     auth: {
//       username: 'nadeemahmad',
//       password: 'Ndim2229'
//     }
//   },
//   {
//     host: '165.231.37.98',
//     port: 7777,
//     auth: {
//       username: 'nadeemahmad',
//       password: 'Ndim2229'
//     }
//   },
//   {
//     host: '185.104.218.48',
//     port: 7777,
//     auth: {
//       username: 'nadeemahmad',
//       password: 'Ndim2229'
//     }
//   },
//   {
//     host: '185.104.219.37',
//     port: 7777,
//     auth: {
//       username: 'nadeemahmad',
//       password: 'Ndim2229'
//     }
//   },
//   {
//     host: '196.245.244.231',
//     port: 7777,
//     auth: {
//       username: 'nadeemahmad',
//       password: 'Ndim2229'
//     }
//   }
// ]

// Add headers before the routes are defined
app.use(function (_, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Pass to next layer of middleware
  next();
});


app.get('/all', async (req, res) => {

  const results = await getGoogleSearchResultsByQueries([req.query['q'] as string])

  res.send(results[0]?.links || [])
})

const call = async () => {

  const client = axios.create()

  try {
    const data = await client.get('https://api.myip.com')

    console.log(data.data)
  } catch (error) {
    console.log(error.message)
  }
}

call()


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})