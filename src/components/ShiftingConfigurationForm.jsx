import React from "react";
import yup from "yup";
import Toggle from "material-ui/Toggle";
import GSForm from "./forms/GSForm";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import Form from "react-formal";

export default class ShiftingConfigurationForm extends React.Component {
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
        <CampaignFormSectionHeading
          title="Embedded Shifter"
          subtitle={message}
        />
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
