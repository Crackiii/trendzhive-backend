import { Client } from 'pg'


export const getPostgresClient = () => {
  const postgresClient = new Client({
    connectionString: 'postgres://utlezgnlachtqt:acb94691359d2f64361b10e67c14b41e58c1fc6e1a96418405d82e1d20c3643e@ec2-99-80-170-190.eu-west-1.compute.amazonaws.com:5432/d8dfjdrps9onjs',
    ssl: {
      rejectUnauthorized: false
    }
  })

  postgresClient.connect().then(() => console.log("Connected to Postgres")).catch(err => {
    throw new Error(err)
  })


  return postgresClient;
}


// import { PrismaClient } from "@prisma/client";

// let prisma: PrismaClient = null;
// export const getPrismaClient = async (): Promise<PrismaClient> => {
//   if (!prisma) {
//     prisma = new PrismaClient();
//   }

//   try {
//     await prisma.$connect();
//     console.log("Connected to Postgres via Prisma client");
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }

//   return prisma;
// };