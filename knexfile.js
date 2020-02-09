module.exports = {
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    user: process.env.DB_USER
  },
  pool: {
    min: parseInt(process.env.DB_MIN_POOL || 2, 10),
    max: parseInt(process.env.DB_MAX_POOL || 10, 10)
  }
};
