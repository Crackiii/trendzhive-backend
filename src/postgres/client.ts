import { Client } from 'pg'


export const getPostgresClient = () => {
  const postgresClient = new Client({
    user: 'root',
    password: '123456',
    port: 8089,
    host: 'localhost',
    database: 'scrapper_2022'
  })

  postgresClient.connect().then(() => console.log("Connected to Postgres")).catch(err => {
    throw new Error(err)
  })


  return postgresClient;
}
