import { getFormattedPhoneNumber } from "./phone-format";
import STATE_CODES from "./state-codes";

export const PRESET_FIELDS = [
  {
    inputName: "first_name",
    aliases: ["firstName", "first"],
    apiName: "firstName",
    required: true,
    description: "contact's first name"
  },
  {
    inputName: "last_name",
    aliases: ["lastName", "last"],
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
        return { valid: false };
      }

      return { valid: true, value: phone };
    },
    hideFromEditor: true
  },
  {
    inputName: "source_id_type",
    aliases: ["external_id_type"],
    apiName: "external_id_type",
    description: "external ID type for mapping back to external data sources",
    hideFromEditor: true
  },
  {
    inputName: "source_id",
    aliases: ["external_id"],
    apiName: "external_id",
    description: "external ID for mapping back to external data sources",
    hideFromEditor: true
  },
  {
    inputName: "van_statecode",
    aliases: ["state_code"],
    apiName: "state_code",
    description: "state code for mapping back to external data sources",
    validate(value) {
      if (value) {
        // if a state code is given, make sure it's valid
        return STATE_CODES.has(value.toUpperCase());
      }

      // leaving out a state code is also valid
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

    // We dont want to say "Hello Betty it is your friendly texter" if Betty already told us she had a wrong number
    // So we say "Hello it is your friendly texter"
    if (contact.issues) {
      if (contact.issues.includes("Wrong Number")) {
        console.log("This voter has been identified as wrong number");
        return "";
      }
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
