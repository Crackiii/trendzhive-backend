import { createClient, RedisClientType, RedisModules, RedisScripts } from 'redis';

export const getRedisClient = (): RedisClientType<RedisModules, RedisScripts> => {
  const client = createClient({
    url: 'redis://127.0.0.1:6379'
  });

  client.on('error', (err) => console.log('Redis Client Error', err));

  client.connect().then(() => console.log("Connected to redis"))

  return client
}

