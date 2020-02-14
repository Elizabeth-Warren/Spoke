import { PhoneNumberUtil, PhoneNumberFormat } from "google-libphonenumber";

// Allow fake numbers in test and local development
const skipValidation =
  process.env.NODE_ENV !== "production" &&
  (global.SUPPRESS_PHONE_VALIDATION || process.env.SUPPRESS_PHONE_VALIDATION);

export const getFormattedPhoneNumber = (cell, country = "US") => {
  const phoneUtil = PhoneNumberUtil.getInstance();
  // we return an empty string vs null when the phone number is inValid
  // because when the cell is null, batch inserts into campaign contacts fail
  // then when contacts have cell.length < 12 (+1), it's deleted before assignments are created
  try {
    const inputNumber = phoneUtil.parse(cell, country);

    if (skipValidation && phoneUtil.isPossibleNumber(inputNumber)) {
      return phoneUtil.format(inputNumber, PhoneNumberFormat.E164);
    }

    const isValid = phoneUtil.isValidNumber(inputNumber);
    if (isValid) {
      return phoneUtil.format(inputNumber, PhoneNumberFormat.E164);
    }
    return "";
  } catch (e) {
    console.error(e);
    return "";
  }
};

export const getDisplayPhoneNumber = (e164Number, country = "US") => {
  const phoneUtil = PhoneNumberUtil.getInstance();
  const parsed = phoneUtil.parse(e164Number, country);
  return phoneUtil.format(parsed, PhoneNumberFormat.NATIONAL);
};
