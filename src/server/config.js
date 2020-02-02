function optionalInt(stringVal, defaultVal = undefined) {
  return stringVal ? parseInt(stringVal, 10) : defaultVal;
}

export default {
  DEFAULT_CACHE_TTL: optionalInt(process.env.DEFAULT_CACHE_TTL, 3600), // 1 hour
  CACHE_PREFIX: process.env.CACHE_PREFIX || "",
  OPTOUTS_SHARE_ALL_ORGS: !!process.env.OPTOUTS_SHARE_ALL_ORGS
};
