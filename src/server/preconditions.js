/**
 * Check that a given value is truthy, returning it if it is.
 */
function check(value, errorMessage) {
  if (!value) {
    throw Error(errorMessage || `Precondition failed: ${value} is not truthy`);
  }
  return value;
}

/**
 * Check that all the values in an object are truthy, returning the object if they are
 */
function checkMany(obj, errorMessage) {
  for (const k of Object.keys(obj)) {
    check(obj[k], errorMessage || `Precondition failed: ${k} is not truthy`);
  }
  return obj;
}

/**
 * Check that a given value is in a list of values.
 */
function checkEnum(value, validValues) {
  if (validValues.indexOf(value) === -1) {
    throw Error(
      `Precondition failed: ${value} is not a member of ${validValues}`
    );
  }
  return value;
}

export default {
  checkEnum,
  checkMany,
  check
};
