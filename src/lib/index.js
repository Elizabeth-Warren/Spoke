import zlib from "zlib";
export { getFormattedPhoneNumber, getDisplayPhoneNumber } from "./phone-format";
export {
  getFormattedZip,
  zipToTimeZone,
  findZipRanges,
  getCommonZipRanges
} from "./zip-format";
export {
  convertOffsetsToStrings,
  getLocalTime,
  isBetweenTextingHours,
  defaultTimezoneIsBetweenTextingHours,
  getOffsets,
  getContactTimezone,
  getUtcFromTimezoneAndHour,
  getUtcFromOffsetAndHour,
  getSendBeforeTimeUtc
} from "./timezones";
export { getProcessEnvTz } from "./tz-helpers";
export { DstHelper } from "./dst-helper";
export { isClient } from "./is-client";
import Papa from "papaparse";
import _ from "lodash";
import { getFormattedPhoneNumber, getFormattedZip } from "../lib";
export {
  findParent,
  getInteractionPath,
  getInteractionTree,
  sortInteractionSteps,
  interactionStepForId,
  getTopMostParent,
  getChildren,
  makeTree
} from "./interaction-step-helpers";
const requiredUploadFields = ["firstName", "lastName", "cell"];
const requiredResponseFields = ["Title", "Body"];

const presetFields = [
  "firstName",
  "lastName",
  "texterFirstName",
  "texterLastName",
  "texterFirstName",
  "texterLastName"
];

const topLevelUploadFields = [
  "firstName",
  "lastNamFe",
  "cell",
  // "zip",
  "external_id",
  "external_id_type",
  "state_code"
];

export {
  ROLE_HIERARCHY,
  getHighestRole,
  hasRole,
  isRoleGreater
} from "./permissions";

const getValidatedData = (data, optOuts) => {
  const optOutCells = optOuts.map(optOut => optOut.cell);
  let validatedData;
  let result;
  // For some reason destructuring is not working here
  result = _.partition(data, row => !!row.cell);
  validatedData = result[0];
  const missingCellRows = result[1];

  validatedData = _.map(validatedData, row =>
    _.extend(row, {
      cell: getFormattedPhoneNumber(
        row.cell,
        process.env.PHONE_NUMBER_COUNTRY || "US"
      )
    })
  );
  result = _.partition(validatedData, row => !!row.cell);
  validatedData = result[0];
  const invalidCellRows = result[1];

  const count = validatedData.length;
  validatedData = _.uniqBy(validatedData, row => row.cell);
  const dupeCount = count - validatedData.length;

  result = _.partition(
    validatedData,
    row => optOutCells.indexOf(row.cell) === -1
  );
  validatedData = result[0];
  const optOutRows = result[1];

  // WARREN fork: no support for zips
  // validatedData = _.map(validatedData, row =>
  //   _.extend(row, {
  //     zip: row.zip ? getFormattedZip(row.zip) : null
  //   })
  // );
  // const zipCount = validatedData.filter(row => !!row.zip).length;

  return {
    validatedData,
    validationStats: {
      dupeCount,
      optOutCount: optOutRows.length,
      invalidCellCount: invalidCellRows.length,
      missingCellCount: missingCellRows.length
      // zipCount
    }
  };
};

const getFormattedField = (field, customFields = []) => {
  const regex = /{(.*?)}/;
  const arr = field.trim().split(" ");
  const allVars = arr.reduce((acc, string) => {
    const match = string.match(regex);
    if (match) {
      acc.push(match[1]);
    }
    return acc;
  }, []);

  const validCustomFields = [...customFields, ...presetFields];
  const isValid = allVars.every(item => validCustomFields.indexOf(item) >= 0);

  if (isValid) {
    return field;
  }
  return "";
};

const getValidatedResponsesData = (data, customFields) => {
  let validatedData;
  let result;
  result = _.partition(data, row => !!row.Body && !!row.Title);
  validatedData = result[0];
  const missingFieldCount = result[1];

  validatedData = _.map(validatedData, row =>
    _.extend(row, {
      Body: getFormattedField(row.Body, customFields)
    })
  );

  result = _.partition(validatedData, row => !!row.Body && !!row.Title);
  validatedData = result[0];
  const invalidCellRows = result[1];

  return {
    validatedData,
    validationStats: {
      invalidCellCount: invalidCellRows.length,
      missingFieldCount: missingFieldCount.length
    }
  };
};

// move to backend
export const gzip = str =>
  new Promise((resolve, reject) => {
    zlib.gzip(str, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });

export const gunzip = buf =>
  new Promise((resolve, reject) => {
    zlib.gunzip(buf, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });

export const parseResponsesCSV = (file, customFields, callback) => {
  Papa.parse(file, {
    header: true,
    // eslint-disable-next-line no-shadow, no-unused-vars
    complete: ({ data, meta, errors }, file) => {
      const fields = meta.fields;
      const missingFields = [];

      for (const field of requiredResponseFields) {
        if (fields.indexOf(field) === -1) {
          missingFields.push(field);
        }
      }
      if (missingFields.length > 0) {
        const error = `Missing fields: ${missingFields.join(", ")}`;
        callback({ error });
      } else {
        const { validationStats, validatedData } = getValidatedResponsesData(
          data,
          customFields
        );
        callback({
          validationStats,
          responses: validatedData
        });
      }
    }
  });
};

export const parseCSV = (file, optOuts, callback) => {
  Papa.parse(file, {
    header: true,
    // eslint-disable-next-line no-shadow, no-unused-vars
    complete: ({ data, meta, errors }, file) => {
      const fields = meta.fields;

      const missingFields = [];

      for (const field of requiredUploadFields) {
        if (fields.indexOf(field) === -1) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        const error = `Missing fields: ${missingFields.join(", ")}`;
        callback({ error });
      } else {
        const { validationStats, validatedData } = getValidatedData(
          data,
          optOuts
        );

        const customFields = fields.filter(
          field => topLevelUploadFields.indexOf(field) === -1
        );

        callback({
          customFields,
          validationStats,
          contacts: validatedData
        });
      }
    }
  });
};

export const convertRowToContact = row => {
  const customFields = row;
  const contact = {};
  for (const field of topLevelUploadFields) {
    if (_.has(row, field)) {
      contact[field] = row[field];
    }
  }

  contact.customFields = customFields;
  return contact;
};
