# db

Simple, ORM-free data access layer, loosely following the repository pattern.

This is replacement for our `models` module, which uses [thinky](https://github.com/neumino/thinky),
an ORM for RethinkDB adapted to work on top of knex by [rethink-knex-adapter](https://github.com/MoveOnOrg/rethink-knex-adapter/).

Going forward, database access and caching should be centralized in this module,
rather than the current mixture of access through `models`, `models.cacheableData`
and direct knex queries. Caching, in particular, should remain an implementation detail
of this module because it is hard to reason about the state of the cache if it is
manipulated directly in several places in the codebase.

## Table definitions and Migrations

Tables are defined in [knex migrations](http://knexjs.org/#Migrations) in `/migrations`.

## Conventions

`db` modules are really just a place to put all your knex queries and can
name their functions anything. That said, we should try to follow the naming
convention below for standard database operations:

- get(pk, opts) -> object or null
- getByXXX(uniqueKey, opts) -> object or null
- list(filterOptions, opts) -> array
- listForXXX(xxxValue, opts) -> array
- create(obj, opts) -> pk
- update(pk, opts) -> pk
- updateXXX(pk, value, opts) -> pk
- delete(pk, opts) -> boolean

None of these functions are required and generic code should not
assume they are defined on an arbitrary model.

### Camel Case

All functions should accept camel case arguments and return objects with camel case keys.

### opts

Functions that talk to the database _should_ accept an `opts` object as their
final argument. There are a few standard opts that should be supported by most
functions.

#### opts.transaction

```javascript
await db.transaction(async (transaction) =>
  await db.SomeModel.create(...stuff, { transaction });
  await db.SomeOtherModel.delete(someOtherModelId, { transaction });
);
```
