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
  campaignIsBetweenTextingHours,
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
import { getFormattedPhoneNumber } from "../lib";
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
import { validateCustomFieldsInBody } from "./custom-fields-helpers";
const topLevelUploadFields = {
  first_name: "first_name",
  last_name: "last_name",
  phone_number: "cell",
  external_id: "external_id",
  external_id_type: "external_id_type",
  state_code: "state_code"
};

const requiredResponseFields = ["Title", "Body"];

export {
  ROLE_HIERARCHY,
  getHighestRole,
  hasRole,
  isRoleGreater
} from "./permissions";

const getValidatedResponsesData = (data, customFields) => {
  let validatedData;
  let result;
  result = _.partition(data, row => !!row.Body && !!row.Title);
  validatedData = result[0];
  const missingFieldCount = result[1];

  validatedData = _.map(validatedData, row => {
    const { field, missingFields } = validateCustomFieldsInBody(
      row.Body,
      customFields
    );
    return Object.assign({}, row, {
      missingFields,
      Body: field
    });
  });
  result = _.partition(validatedData, row => !!row.Body && !!row.Title);
  validatedData = result[0];
  const invalidFieldRows = result[1];

  const invalidCustomFields = invalidFieldRows.reduce(
    (acc, row) => _.union(acc, row.missingFields),
    []
  );

  // if there are any invalid fields, return no responses
  validatedData =
    !invalidFieldRows.length && !missingFieldCount.length ? validatedData : [];

  return {
    validatedData,
    validationStats: {
      invalidFieldCount: invalidFieldRows.length,
      missingFieldCount: missingFieldCount.length,
      invalidCustomFields
    }
  };
};

export const parseResponsesCSV = (file, customFields, callback) => {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
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
          fields,
          validationStats,
          responses: validatedData
        });
      }
    }
  });
};

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

export const convertRowToContact = row => {
  const customFields = {};
  const contact = {};

  _.each(row, (val, key) => {
    const fieldName = topLevelUploadFields[key];
    if (fieldName) {
      // top-level field
      contact[fieldName] = val;
    } else {
      // custom field
      customFields[key] = val;
    }
  });

  contact.customFields = customFields;
  return contact;
};

export const parseCSV = (
  file,
  { optOuts = [], maxContacts } = {},
  callback
) => {
  Papa.parse(file, {
    skipEmptyLines: true,
    header: true,
    // eslint-disable-next-line no-shadow, no-unused-vars
    complete: ({ data, meta, errors }, file) => {
      if (errors.length > 0) {
        const errorsHuman = errors.map(e => {
          if (e.row != null) {
            return `${e.message} (row ${e.row + 1})`;
          }

          return e.message;
        });

        callback({
          error: errorsHuman.join("; ")
        });

        return;
      }

      if (data.length > maxContacts) {
        callback({
          error: `You can only have ${maxContacts} contacts in a single campaign. You uploaded a CSV with ${data.length} contacts.`
        });

        return;
      }

      const convertedData = data.map(convertRowToContact);

      const fields = meta.fields;
      const { validationStats, validatedData } = getValidatedData(
        convertedData,
        optOuts
      );

      const fileName = file && file.name;
      callback({
        fields,
        fileName,
        validationStats,
        contacts: validatedData
      });
    }
  });
};
