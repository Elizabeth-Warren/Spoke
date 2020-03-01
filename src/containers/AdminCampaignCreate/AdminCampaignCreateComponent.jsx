import React, { Component } from "react";
import types from "prop-types";
import { RaisedButton, Card, CardHeader, CardText } from "material-ui";
import theme from "src/styles/theme";
import { StyleSheet, css } from "aphrodite";
import axios from "axios";
import _ from "lodash";

import {
  PRESET_FIELDS,
  PRESET_FIELDS_BY_API_NAME
} from "src/lib/fields-helpers";
import CSVUploader from "../CSVUploader";

const styles = StyleSheet.create({
  header: {
    marginBottom: "25px",
    fontSize: "16px"
  },
  cardHeader: {
    backgroundColor: theme.colors.EWlibertyGreen
  }
});

export default class AdminCampaignCreateComponent extends Component {
  static propTypes = {
    mutations: types.exact({
      createUploadUrl: types.func.isRequired,
      createOrUpdateCampaign: types.func.isRequired
    }).isRequired,
    router: types.object,
    initialError: types.string,
    organizationId: types.string.isRequired,
    copiedCampaign: types.object,
    organization: types.object
  };

  constructor(props) {
    super(props);

    let shiftConfiguration = "off";
    if (this.props.copiedCampaign) {
      const copiedCampaign = this.props.copiedCampaign.campaign;
      if (copiedCampaign.shiftingConfiguration) {
        const copiedShiftingConfiguration = JSON.parse(
          copiedCampaign.shiftingConfiguration
        );
        if (copiedShiftingConfiguration.enabled) {
          shiftConfiguration = copiedShiftingConfiguration.eventId
            ? "static"
            : "perContact";
        }
      }
    }

    this.state = {
      shiftConfiguration // off, perContact, static
    };
  }

  onSave = async ({ data, fileName, onUploadProgress }) => {
    const contacts = data.map(item => {
      const contact = { customFields: {} };

      _.each(item, (val, key) => {
        if (PRESET_FIELDS_BY_API_NAME[key]) {
          contact[key] = val;
        } else {
          contact.customFields[key] = val;
        }
      });

      return contact;
    });

    const payload = JSON.stringify(contacts);

    const { s3Key, presignedPutUrl } = JSON.parse(
      (await this.props.mutations.createUploadUrl()).data
        .createPresignedUploadUrl
    );

    const config = {
      onUploadProgress
    };

    await axios.put(presignedPutUrl, payload, config);

    const createOrUpdateResult = await this.props.mutations.createOrUpdateCampaign(
      s3Key,
      fileName,
      this.state.shiftConfiguration !== "off"
    );

    // If we created a new campaign, go there
    let newCampaignId;
    if (createOrUpdateResult.data.copyCampaign) {
      newCampaignId = createOrUpdateResult.data.copyCampaign.id;
    } else if (createOrUpdateResult.data.createCampaign) {
      newCampaignId = createOrUpdateResult.data.createCampaign.id;
    }

    if (newCampaignId) {
      this.props.router.push(
        `/admin/${this.props.organizationId}/campaigns/${newCampaignId}/edit?new=true`
      );
    }
  };

  render() {
    const fields = PRESET_FIELDS.filter(field => !field.virtual);

    if (this.state.shiftConfiguration !== "off") {
      fields.push(
        {
          inputName: "email",
          apiName: "email",
          required: true,
          description: "contact's email address for event shifting"
        },
        {
          inputName: "zip",
          apiName: "zip",
          required: true,
          description: "contact's zip code for event shifting"
        }
      );

      if (this.state.shiftConfiguration === "perContact") {
        fields.push(
          {
            inputName: "event_id",
            apiName: "event_id",
            required: true,
            description: "the Mobilize America event for the embedded shifter"
          },
          {
            inputName: "timeslot_id",
            apiName: "timeslot_id",
            required: false,
            description:
              "which timeslot of the Mobilize America event the embedded shifter should default to"
          }
        );
      }
    }

    let title = "Create Campaign";
    if (this.props.copiedCampaign) {
      const copiedCampaign = this.props.copiedCampaign.campaign;
      title = `Copy Campaign: ${copiedCampaign.title}`;
    }

    return (
      <div>
        <div className={css(styles.header)}>{title}</div>

        <Card>
          <CardHeader title="Contacts" className={css(styles.cardHeader)} />
          <CardText>
            <h2>Embedded Shifter</h2>
            <p>
              If you include email addresses and zip codes for each contact, you
              can embed a shifter interface for signing contacts up for Mobilize
              America shifts. You can either specify the event and timeslot for
              each contact in your CSV, or specify a single event and timeslot
              for all contacts on the next screen.
            </p>
            <div>
              <RaisedButton
                primary={this.state.shiftConfiguration === "off"}
                onClick={() => {
                  this.setState({ shiftConfiguration: "off" });
                }}
                label="Off"
              />
              <RaisedButton
                primary={this.state.shiftConfiguration === "static"}
                onClick={() => {
                  this.setState({ shiftConfiguration: "static" });
                }}
                label="Single Event"
              />
              <RaisedButton
                primary={this.state.shiftConfiguration === "perContact"}
                onClick={() => {
                  this.setState({ shiftConfiguration: "perContact" });
                }}
                label="Per-Contact Events"
              />
            </div>

            <CSVUploader
              onUpload={this.onSave}
              initialError={this.props.initialError}
              maxRows={this.props.organization.organization.maxContacts}
              dedupeOn="phone_number"
              columnConfig={fields}
            />

            <h2>Contact Data Validation Requirements</h2>
            <p>
              All contact uploads should include source_id and source_id_type
              for each contact. Depending on the source_id_type, there are
              different different requirements for source_id and van_statecode.
            </p>
            <p>
              <ul>
                <li>
                  <strong>
                    <tt>myc_van_id</tt>
                  </strong>
                  <ul>
                    <li>
                      <tt>source_id</tt> must be an integer ≥ 100000000.
                    </li>
                    <li>
                      <tt>van_statecode</tt> must be a valid US state code.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>
                    <tt>myv_van_id</tt>
                  </strong>
                  <ul>
                    <li>
                      <tt>source_id</tt> must be an integer between 1 and
                      9999999.
                    </li>
                    <li>
                      <tt>van_statecode</tt> must be a valid US state code.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>
                    <tt>ngp_van_id</tt>
                  </strong>
                  <ul>
                    <li>
                      <tt>source_id</tt> must be an integer ≥ 100000000.
                    </li>
                    <li>
                      <tt>van_statecode</tt> is optional, but if it&apos;s sent,
                      it must be a valid US state code.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>
                    <tt>bsd_cons_id</tt>
                  </strong>
                  <ul>
                    <li>
                      <tt>source_id</tt> must be an integer ≥ 1.
                    </li>
                    <li>
                      <tt>van_statecode</tt> is optional, but if it&apos;s sent,
                      it must be a valid US state code.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>
                    <tt>custom</tt>
                  </strong>
                  <ul>
                    <li>
                      <tt>source_id</tt> must be any value.{" "}
                    </li>
                    <li>
                      <tt>van_statecode</tt> is optional, but if it&apos;s
                      present, it must be a valid US state code.
                    </li>
                  </ul>
                </li>
              </ul>
            </p>
          </CardText>
        </Card>
      </div>
    );
  }
}
