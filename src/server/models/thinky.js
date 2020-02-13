import dumbThinky from "rethink-knex-adapter";
import redis from "redis";
import bluebird from "bluebird";

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

let config;

const use_ssl =
  process.env.DB_USE_SSL &&
  (process.env.DB_USE_SSL.toLowerCase() === "true" ||
    process.env.DB_USE_SSL === "1");

if (process.env.DB_JSON || global.DB_JSON) {
  config = JSON.parse(process.env.DB_JSON || global.DB_JSON);
} else if (process.env.DB_TYPE) {
  config = {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      user: process.env.DB_USER,
      ssl: use_ssl
    },
    pool: {
      min: parseInt(process.env.DB_MIN_POOL || 2, 10),
      max: parseInt(process.env.DB_MAX_POOL || 10),
      // TODO[matteosb]: figure out preflight failures, this fixes
      //  them but isn't recommended.
      propagateCreateError: !process.env.SUPPRESS_DB_PROPAGATE_ERROR
    }
  };
} else if (process.env.DATABASE_URL) {
  const databaseType = process.env.DATABASE_URL.match(/^\w+/)[0];
  config = {
    client: /postgres/.test(databaseType) ? "pg" : databaseType,
    connection: process.env.DATABASE_URL,
    pool: {
      min: parseInt(process.env.DB_MIN_POOL || 2, 10),
      max: parseInt(process.env.DB_MAX_POOL || 10, 10)
    },
    ssl: use_ssl
  };
} else {
  throw Error("Missing database configuration");
}

const thinkyConn = dumbThinky(config);

thinkyConn.r.getCount = async query => {
  if (Array.isArray(query)) {
    return query.length;
  }
  return Number((await query.count("* as count").first()).count);
};

const REDIS_URL = process.env.REDIS_URL || global.REDIS_URL;
if (REDIS_URL) {
  thinkyConn.r.redis = redis.createClient({ url: REDIS_URL });
}

export default thinkyConn;
export const r = thinkyConn.r;
