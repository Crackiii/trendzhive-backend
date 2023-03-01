import * as express from 'express'

import { getGlobalErrors } from './google/realtime-trends/queries.db';
const app = express()
const port = 3003


// Add headers before the routes are defined
app.use(function (_, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  next();
});


app.get('/errors', async (_, res) => {

  res.sendFile(__dirname + '/public/index.html')
})


app.get('/get-errors', async (_, res) => {
  
    const results = await getGlobalErrors()
  
    res.send(results)
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
