const presetFields = [
  "firstName",
  "lastName",
  "texterFirstName",
  "texterLastName"
];

export const validateCustomFieldsInBody = (field, customFields = []) => {
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
  const sortedFields = _.partition(
    allVars,
    item => validCustomFields.indexOf(item) >= 0
  );

  const missing = sortedFields[1] || [];
  const isValid = missing.length === 0;

  if (isValid) {
    return { field };
  }
  return {
    field: "",
    missingFields: missing
  };
};
