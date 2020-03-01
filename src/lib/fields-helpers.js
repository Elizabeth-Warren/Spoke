import { getFormattedPhoneNumber } from "./phone-format";
import STATE_CODES from "./state-codes";

const SOURCE_ID_TYPES = {
  // range is expressed as:
  // [min, max] -> must be an integer >= min and <= max
  // [min] -> must be an integer >= min
  // [] -> no validation
  myc_van_id: {
    idRange: [1],
    stateCodeRequired: true
  },
  myv_van_id: {
    idRange: [1],
    stateCodeRequired: true
  },
  ngp_van_id: {
    idRange: [1]
  },
  bsd_cons_id: {
    idRange: [1]
  },
  custom: {
    idRange: []
  }
};

export const PRESET_FIELDS = [
  {
    inputName: "first_name",
    aliases: ["firstName"],
    apiName: "firstName",
    required: true,
    description: "contact's first name"
  },
  {
    inputName: "last_name",
    aliases: ["lastName"],
    apiName: "lastName",
    required: true,
    description: "contact's last name"
  },
  {
    inputName: "phone_number",
    aliases: ["cell"],
    apiName: "cell",
    required: true,
    description: "contact's phone number",
    transformAndValidate(value) {
      const phone = getFormattedPhoneNumber(value, "US");
      if (!phone) {
        throw new Error(`Invalid phone number: ${value}`);
      }

      return phone;
    },
    hideFromEditor: true
  },
  {
    inputName: "source_id_type",
    aliases: ["external_id_type"],
    apiName: "external_id_type",
    required: true,
    description: "external ID type for mapping back to external data sources",
    validate(value) {
      return value in SOURCE_ID_TYPES;
    },
    hideFromEditor: true
  },
  {
    inputName: "source_id",
    aliases: ["external_id"],
    apiName: "external_id",
    description: "external ID for mapping back to external data sources",
    required: true,
    validate(value, inputRow) {
      const { source_id_type: sourceIdType } = inputRow;
      if (!sourceIdType || !(sourceIdType in SOURCE_ID_TYPES)) {
        // invalid source ID type; let the source_id_type validator handle it
        return true;
      }

      const validRange = SOURCE_ID_TYPES[sourceIdType].idRange;
      if (validRange.length === 0) {
        // no validation for this type
        return true;
      }

      const numValue = Number(value);
      if (!Number.isInteger(numValue)) {
        return false;
      }

      if (validRange.length === 1) {
        return numValue >= validRange[0];
      }

      const [minValue, maxValue] = validRange;
      return numValue >= minValue && numValue <= maxValue;
    },
    hideFromEditor: true
  },
  {
    inputName: "van_statecode",
    aliases: ["state_code"],
    apiName: "state_code",
    description: "state code for mapping back to external data sources",
    validate(value, inputRow) {
      if (value) {
        // if a state code is given, make sure it's valid
        return STATE_CODES.has(value.toUpperCase());
      }

      // no state code -- check if one is required for the
      // source ID type
      const { source_id_type: sourceIdType } = inputRow;
      if (!sourceIdType || !(sourceIdType in SOURCE_ID_TYPES)) {
        // invalid source ID type; let the source_id_type validator handle it
        return true;
      }

      if (SOURCE_ID_TYPES[sourceIdType].stateCodeRequired) {
        // this source ID type requires a state code
        throw new Error(
          `The source_id_type "${sourceIdType}" requires a van_statecode`
        );
      }

      return true;
    }
  },
  {
    inputName: "texter_first_name",
    aliases: ["texterFirstName"],
    virtual: (contact, texter) => texter.firstName
  },
  {
    inputName: "texter_last_name",
    aliases: ["texterLastName"],
    virtual: (contact, texter) => texter.lastName
  }
];

const PRESET_FIELDS_BY_INPUT_NAME = {};
const PRESET_FIELDS_BY_INPUT_NAME_AND_ALIAS = {};
export const PRESET_FIELDS_BY_API_NAME = {};
PRESET_FIELDS.forEach(field => {
  PRESET_FIELDS_BY_INPUT_NAME_AND_ALIAS[field.inputName] = field;
  PRESET_FIELDS_BY_INPUT_NAME[field.inputName] = field;

  (field.aliases || []).forEach(alias => {
    PRESET_FIELDS_BY_INPUT_NAME_AND_ALIAS[alias] = field;
  });

  if (field.apiName) {
    PRESET_FIELDS_BY_API_NAME[field.apiName] = field;
  }
});

export function allFields(customFields) {
  return Object.keys(PRESET_FIELDS_BY_INPUT_NAME_AND_ALIAS).concat(
    customFields
  );
}

export function allInputFields(customFields) {
  return Object.values(PRESET_FIELDS_BY_INPUT_NAME)
    .filter(field => !field.hideFromEditor)
    .map(field => field.inputName)
    .concat(customFields);
}

export function getFieldValue(contact, texter, fieldName) {
  const presetField = PRESET_FIELDS_BY_INPUT_NAME_AND_ALIAS[fieldName];
  if (presetField) {
    if (presetField.virtual) {
      return presetField.virtual(contact, texter);
    }

    return contact[presetField.apiName];
  }

  return JSON.parse(contact.customFields)[fieldName];
}

export function inputNameForColumn(apiName) {
  return PRESET_FIELDS_BY_API_NAME[apiName]
    ? PRESET_FIELDS_BY_API_NAME[apiName].inputName
    : apiName;
}
