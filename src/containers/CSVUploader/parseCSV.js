import Papa from "papaparse";
import _ from "lodash";

function papaParse(file) {
  return new Promise(resolve => {
    Papa.parse(file, {
      skipEmptyLines: true,
      header: true,
      complete: resolve
    });
  });
}

function formatPapaParseErrors(errors) {
  const errorsHuman = errors.map(e => {
    if (e.row != null) {
      return `${e.message} (row ${e.row + 1})`;
    }

    return e.message;
  });

  return errorsHuman.join("; ");
}

function buildAliasTranslator(columnConfig) {
  const aliasMap = {};
  columnConfig.forEach(({ inputName, aliases }) => {
    (aliases || []).forEach(alias => {
      aliasMap[alias] = inputName;
    });
  });

  return row => {
    const rowCopy = { ...row };
    _.each(aliasMap, (inputName, alias) => {
      if (rowCopy[alias] && !rowCopy[inputName]) {
        rowCopy[inputName] = rowCopy[alias];
      }
      delete rowCopy[alias];
    });

    return rowCopy;
  };
}

function buildValidatorAndTransformer(columnConfig) {
  // Unify validate() and transformAndValidate() into just
  // a transformAndValidate() for each column.
  //
  // Accumulate a map of [inputName] -> { transformAndValidate, apiName }
  const normalizedConfig = {};
  columnConfig.forEach(
    ({ inputName, apiName, validate, transformAndValidate }) => {
      let transformAndValidateFn = val => ({ valid: true, value: val });
      if (transformAndValidate) {
        transformAndValidateFn = transformAndValidate;
      } else if (validate) {
        transformAndValidateFn = (val, row) => {
          if (!validate(val, row)) {
            throw new Error(`Invalid ${inputName}: ${val}`);
          }
          return { valid: true, value: val };
        };
      }

      normalizedConfig[inputName] = {
        apiName,
        transformAndValidate: transformAndValidateFn
      };
    }
  );

  // Return a validator/transformer. Any configured columns will be run through
  // transformAndValidate; other columns will be left as-is.
  return row => {
    const newRow = {};
    let allValid = true;

    _.each(row, (val, key) => {
      const config = normalizedConfig[key];
      if (!config) {
        newRow[key] = val;
      } else {
        const { valid, value } = config.transformAndValidate(val, row);
        if (valid) {
          newRow[config.apiName] = value;
        } else {
          allValid = false;
        }
      }
    });

    if (!allValid) {
      return { valid: false };
    }
    return { valid: true, value: newRow };
  };
}

export default async function parseCSV(
  file,
  { maxRows, columnConfig, dedupeOn }
) {
  const { data, meta, errors } = await papaParse(file);

  // Handle CSV parse errors
  if (errors.length > 0) {
    return { errors: [formatPapaParseErrors(errors)] };
  }

  if (data.length > maxRows) {
    return {
      error: `You may not upload a CSV with more than ${maxRows} rows. You uploaded a CSV with ${data.length} rows`
    };
  }

  // validate, transform, and deduplicate data
  let nValid = 0;
  let nInvalid = 0;
  let dupeCount = 0;
  const validatedAndTransformedData = [];
  let validationErrors = [];
  const dupeKeys = new Set();

  const translateAliases = buildAliasTranslator(columnConfig);
  const validateAndTransformRow = buildValidatorAndTransformer(columnConfig);

  data.forEach((rawRow, i) => {
    const row = translateAliases(rawRow);

    // deduplicate
    if (dedupeOn && row[dedupeOn]) {
      const dupeKey = row[dedupeOn];
      if (dupeKeys.has(dupeKey)) {
        dupeCount += 1;
        return;
      }

      dupeKeys.add(dupeKey);
    }
    try {
      const { valid, value } = validateAndTransformRow(row);

      if (valid) {
        // valid row
        validatedAndTransformedData.push(value);
        nValid += 1;
      } else {
        console.log("Filtering out row due to invalid values", row);

        // invalid, but not an error -- just mark
        // it as invalid so it gets filtered out
        nInvalid += 1;
      }
    } catch (e) {
      // hard error -- keep parsing so we can give a full report
      // to the user, and mark this run as errored.
      console.log(e);
      nInvalid += 1;

      const rowNumber = i + 2;
      validationErrors.push(`Invalid data on row ${rowNumber}: ${e.message}`);
    }
  });

  // compute list of extra columns
  const configuredFields = [];
  columnConfig.forEach(({ inputName, aliases }) => {
    configuredFields.push(inputName);
    (aliases || []).forEach(a => configuredFields.push(a));
  });

  const extraColumns = _.without(meta.fields, ...configuredFields);

  return {
    data: validatedAndTransformedData,
    // use the alias-transformed keys rather than the raw keys
    fields:
      data.length === 0 ? meta.fields : Object.keys(translateAliases(data[0])),
    validationStats: {
      nValid,
      nInvalid,
      dupeCount,
      extraColumns
    },
    fileName: file.name,
    errors: validationErrors
  };
}
