//quick & dirty client-side search courtesy of: https://stackoverflow.com/questions/8517089/js-search-in-object-values
function trimString(s) {
  var l = 0,
    r = s.length - 1;
  while (l < s.length && s[l] == " ") l++;
  while (r > l && s[r] == " ") r -= 1;
  return s.substring(l, r + 1).toLowerCase();
}

function compareObjects(o1, o2) {
  var k = "";
  for (k in o1) if (o1[k] != o2[k]) return false;
  for (k in o2) if (o1[k] != o2[k]) return false;
  return true;
}

function itemExists(haystack, needle) {
  for (var i = 0; i < haystack.length; i++)
    if (compareObjects(haystack[i], needle)) return true;
  return false;
}

export function searchFor(query, objectsToSearch, keysToSearch) {
  var results = [];
  const toSearch = trimString(query);
  for (var i = 0; i < objectsToSearch.length; i++) {
    for (var x = 0; x < keysToSearch.length; x++) {
      const key = keysToSearch[x];
      const field = objectsToSearch[i][key];
      if (field && field.toLowerCase().indexOf(toSearch) != -1) {
        if (!itemExists(results, objectsToSearch[i]))
          results.push(objectsToSearch[i]);
      }
    }
  }
  return results;
}
