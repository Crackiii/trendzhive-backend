import * as express from 'express'
import { getGoogleSearchResultsByQueries } from './google/common/google-search';
const app = express()
const port = 3003


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


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})