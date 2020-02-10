import type from "prop-types";
import React from "react";
import Slider from "./Slider";
import AutoComplete from "material-ui/AutoComplete";
import IconButton from "material-ui/IconButton";
import RaisedButton from "material-ui/RaisedButton";
import Snackbar from "material-ui/Snackbar";
import GSForm from "../components/forms/GSForm";
import yup from "yup";
import Form from "react-formal";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";
import Toggle from "material-ui/Toggle";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import { dataTest } from "../lib/attributes";
import { dataSourceItem } from "./utils";

const styles = StyleSheet.create({
  sliderContainer: {
    border: `1px solid ${theme.colors.lightGray}`,
    padding: 10,
    borderRadius: 8
  },
  removeButton: {
    width: 50
  },
  messagingServiceRow: {
    display: "flex",
    flexDirection: "row"
  },
  alreadyTextedHeader: {
    textAlign: "right",
    fontWeight: 600,
    fontSize: 16
  },
  availableHeader: {
    fontWeight: 600,
    fontSize: 16
  },
  nameColumn: {
    width: 100,
    textOverflow: "ellipsis",
    marginTop: "auto",
    marginBottom: "auto",
    paddingRight: 10
  },
  splitToggle: {
    ...theme.text.body,
    flex: "1 1 50%"
  },
  slider: {
    flex: "1 1 35%",
    marginTop: "auto",
    marginBottom: "auto",
    paddingRight: 10
  },
  leftSlider: {
    flex: "1 1 35%",
    marginTop: "auto",
    marginBottom: "auto",
    paddingRight: 10
  },
  headerContainer: {
    display: "flex",
    borderBottom: `1px solid ${theme.colors.lightGray}`,
    marginBottom: 20
  },
  assignedCount: {
    width: 40,
    fontSize: 16,
    paddingLeft: 5,
    paddingRight: 5,
    textAlign: "center",
    marginTop: "auto",
    marginBottom: "auto",
    marginRight: 10,
    display: "inline-block",
    backgroundColor: theme.colors.lightGray
  },
  input: {
    width: 50,
    paddingLeft: 0,
    paddingRight: 0,
    marginRight: 10,
    marginTop: "auto",
    marginBottom: "auto",
    display: "inline-block"
  }
});

const inlineStyles = {
  autocomplete: {
    marginBottom: 24
  },
  radioButtonGroup: {
    marginBottom: 12
  },
  header: {
    ...theme.text.header
  }
};

export default class CampaignPhoneNumbersForm extends React.Component {
  formSchema = yup.object({
    enabled: yup.boolean(),
    eventId: yup.number().integer()
  });

  render() {
    let config = { enabled: false };
    const {
      formValues: { shiftingConfiguration },
      customFields
    } = this.props;

    if (shiftingConfiguration) {
      config = JSON.parse(shiftingConfiguration);
    }

    const canEnable =
      _.includes(customFields, "email") && _.includes(customFields, "zip");

    const needsEventId = !_.includes(customFields, "eventId");

    let message;
    if (canEnable) {
      if (needsEventId) {
        message =
          "You can embed a Mobilize America shifter in the texting UI. It will use the contacts' email and zip fields, and the event ID you specify here.";
      } else {
        message =
          "You can embed a Mobilize America shifter in the texting UI. It will use the contacts' email, zip, and eventId fields.";
      }
    } else {
      message =
        'You must have custom fields called "email" and "zip" to use the embedded shifter. You can either have an "eventId" field for per-contact shifting, or specify an event ID for the campaign.';
    }

    return (
      <GSForm
        schema={this.formSchema}
        value={config}
        onChange={val => {
          this.props.onChange({
            shiftingConfiguration: JSON.stringify(val)
          });
        }}
        onSubmit={val => {
          this.props.onSubmit({
            shiftingConfiguration: JSON.stringify(val)
          });
        }}
      >
        <CampaignFormSectionHeading title="Phone Numbers" subtitle={message} />
        {canEnable && (
          <div>
            <Form.Field
              name="enabled"
              type={Toggle}
              label="Enable Embedded Shifter"
              defaultToggled={config.enabled}
              onToggle={(_, isToggled) =>
                this.props.onChange({
                  shiftingConfiguration: JSON.stringify({
                    ...config,
                    enabled: isToggled
                  })
                })
              }
            />

            {needsEventId && (
              <Form.Field name="eventId" label="Mobilize America Event ID" />
            )}

            <Form.Button
              type="submit"
              disabled={this.props.saveDisabled}
              label={this.props.saveLabel}
            />
          </div>
        )}
      </GSForm>
    );
  }
}
