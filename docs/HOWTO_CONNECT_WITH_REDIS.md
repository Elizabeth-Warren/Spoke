# Instructions for using Redis in Development and Production

- To add a caching layer to your development and production environments, follow the below instructions to get setup. Initial Redis setup is included in `src/server/models/thinky.js`.

## Development

- Using Redis in development can be achieved by connecting a local Redis server.

### To use a Local Redis Server

- Run `npm install`
- docker-compose up -d
- Add `REDIS_URL=//127.0.0.1:6379` to your `.env` file

## Production

- Point REDIS_URL in production environment variables configuration to production Redis instance url. For example `redis://[url]:6379`.
