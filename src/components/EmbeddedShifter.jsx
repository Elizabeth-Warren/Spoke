import React from "react";

const wrapperStyles = {
  height: "100%",
  padding: "10px"
};
const iframeStyles = {
  height: "100%",
  width: "100%",
  border: "none",
  paddingBottom: "50px"
};

function cleanPhoneNumber(phone) {
  // take the last 10 digits
  return phone
    .replace(/[^\d]/g, "")
    .split("")
    .reverse()
    .slice(0, 10)
    .reverse()
    .join("");
}

export default function EmbeddedShifter({ shiftingConfiguration, contact }) {
  console.log({ shiftingConfiguration, contact });

  let customFields = {};
  if (contact.customFields) {
    customFields = JSON.parse(contact.customFields) || {};
  }

  const urlParams = {
    event: customFields.event_id || shiftingConfiguration.eventId || "",
    shift: customFields.timeslot_id || shiftingConfiguration.timeslotId || "",
    first_name: contact.firstName || "",
    last_name: contact.lastName || "",
    phone: cleanPhoneNumber(contact.cell || ""),
    email: customFields.email || "",
    zip: customFields.zip || ""
  };

  const urlParamString = _.map(
    urlParams,
    (val, key) => `${key}=${encodeURIComponent(val)}`
  ).join("&");

  return (
    <div style={wrapperStyles}>
      <iframe
        style={iframeStyles}
        src={`${window.EMBEDDED_SHIFTER_URL}?${urlParamString}`}
      />
    </div>
  );
}
