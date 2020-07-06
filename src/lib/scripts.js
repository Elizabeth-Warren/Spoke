import _ from "lodash";
import { allFields, getFieldValue } from "./fields-helpers";

export const delimiters = {
  startDelimiter: "{",
  endDelimiter: "}"
};

export function delimit(text) {
  const { startDelimiter, endDelimiter } = delimiters;
  return `${startDelimiter}${text}${endDelimiter}`;
}

export function applyScript({ script, contact, customFields, texter }) {
  const scriptFields = allFields(customFields);
  console.log("scriptFields: ");
  console.log(scriptFields);
  console.log(contact);
  let appliedScript = script;

  scriptFields.forEach(field => {
    const re = new RegExp(`${delimit(field)}`, "g");
    appliedScript = appliedScript.replace(
      re,
      getFieldValue(contact, texter, field)
    );
    appliedScript = appliedScript.replace(/  +/g, " ");
  });

  return appliedScript;
}

export function validateScript({ script, customFields }) {
  const regex = /{(.*?)}/;
  const arr = script.trim().split(" ");
  const allVars = arr.reduce((acc, string) => {
    const match = string.match(regex);
    if (match) {
      acc.push(match[1]);
    }
    return acc;
  }, []);

  const validCustomFields = allFields(customFields);
  const sortedFields = _.partition(
    allVars,
    item => validCustomFields.indexOf(item) >= 0
  );

  const missing = sortedFields[1] || [];
  const isValid = missing.length === 0;

  if (isValid) {
    return { field: script };
  }
  return {
    field: "",
    missingFields: missing
  };
}
