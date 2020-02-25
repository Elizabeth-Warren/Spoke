import React, { Component } from "react";
import types from "prop-types";
import ColumnName from "./ColumnName";
import { RaisedButton, Card, CardHeader, CardText } from "material-ui";
import _ from "lodash";
import theme from "src/styles/theme";
import { StyleSheet, css } from "aphrodite";
import axios from "axios";

import { parseCSV } from "src/lib";
import FilePicker from "./FilePicker";
import ValidationStats from "./ValidationStats";

const styles = StyleSheet.create({
  header: {
    marginBottom: "25px",
    fontSize: "16px"
  },
  cardHeader: {
    backgroundColor: theme.colors.EWlibertyGreen
  },
  uploadColumnsWrapper: {
    display: "flex",
    flexDirection: "row"
  },
  uploadColumn: {
    flex: "1"
  },
  errorMessage: {
    backgroundColor: theme.colors.red,
    padding: "10px 5px"
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
    updateCampaign: types.string,
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
      state: "idle", // idle, parsing, parsed, uploading
      error: this.props.initialError, // Errors from CSV parsing or input -- blocks trying to upload
      uploadError: null, // Errors from upload -- does not block trying to upload again
      parsedData: null,
      shiftConfiguration, // off, perContact, static
      validationStats: null,
      fields: null
    };
  }

  onPickCSV = (acceptedFiles, rejectedFiles) => {
    if (
      rejectedFiles.length > 0 ||
      acceptedFiles.length + rejectedFiles.length > 1
    ) {
      this.setState({ error: "Please upload a single CSV file" });
      return;
    }

    this.setState({
      error: null,
      parsedData: null,
      validationStats: null,
      fields: null,
      state: "parsing"
    });

    parseCSV(
      acceptedFiles[0],
      {
        optOuts: [],
        maxContacts: this.props.organization.organization.maxContacts
      },
      ({ contacts, fields, validationStats, fileName, error }) => {
        if (error) {
          this.setState({
            state: "idle",
            error
          });
        } else {
          this.setState({
            state: "parsed",
            validationStats,
            fields,
            fileName,
            parsedData: contacts,
            error:
              contacts.length > 0
                ? null
                : "Please upload at least one valid contact."
          });
        }
      }
    );
  };

  onDelete = () => {
    this.setState({
      error: null,
      uploadError: null,
      parsedData: null,
      validationStats: null,
      fields: null,
      state: "idle"
    });
  };

  onSave = async () => {
    this.setState({
      state: "uploading",
      uploadError: null,
      uploadProgress: 0
    });

    try {
      const payload = JSON.stringify(this.state.parsedData);

      const { s3Key, presignedPutUrl } = JSON.parse(
        (await this.props.mutations.createUploadUrl()).data
          .createPresignedUploadUrl
      );

      const config = {
        onUploadProgress: progressEvent => {
          if (this.state.state === "uploading") {
            const percentCompleted = Math.round(
              progressEvent.loaded / progressEvent.total
            );

            this.setState({
              uploadProgress: percentCompleted
            });
          }
        }
      };

      await axios.put(presignedPutUrl, payload, config);

      const createOrUpdateResult = await this.props.mutations.createOrUpdateCampaign(
        s3Key,
        this.state.fileName,
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
    } catch (e) {
      console.error(e);

      this.setState({
        state: "parsed",
        uploadError: e.message
      });
    }
  };

  columnIsPresent(name) {
    if (!this.state.fields) {
      return null;
    }

    return this.state.fields.indexOf(name) !== -1;
  }

  render() {
    const requiredColumns = [
      { name: "first_name", desc: "contact's first name", type: "required" },
      { name: "last_name", desc: "contact's last name", type: "required" },
      { name: "phone_number", desc: "contact's phone number", type: "required" }
    ];

    const optionalColumns = [
      {
        name: "external_id",
        desc: "external ID for mapping back to external data sources",
        type: "optional"
      },
      {
        name: "external_id_type",
        desc: "external ID type for mapping back to external data sources",
        type: "optional"
      },
      {
        name: "state_code",
        desc: "state code for mapping back to external data sources",
        type: "optional"
      }
    ];

    if (this.state.shiftConfiguration !== "off") {
      requiredColumns.push(
        {
          name: "email",
          desc: "contact's email address for event shifting",
          type: "required"
        },
        {
          name: "zip",
          desc: "contact's zip code for event shifting",
          type: "required"
        }
      );

      if (this.state.shiftConfiguration === "perContact") {
        requiredColumns.push({
          name: "event_id",
          desc: "the Mobilize America event for the embedded shifter",
          type: "required"
        });

        optionalColumns.push({
          name: "timeslot_id",
          desc:
            "which timeslot of the Mobilize America event the embedded shifter should default to",
          type: "optional"
        });
      }
    }

    const canSaveAndContinue =
      !this.state.error &&
      this.state.state !== "uploading" &&
      _.every(requiredColumns, c => this.columnIsPresent(c.name));

    let customFields = [];
    if (this.state.parsedData) {
      const firstContact = this.state.parsedData[0];
      if (firstContact && firstContact.customFields) {
        customFields = Object.keys(firstContact.customFields);
      }
    }

    const errorMessage = this.state.uploadError || this.state.error;

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
            <h2>Upload CSV</h2>
            <p>
              Upload a CSV of contacts. The first row should be column headings.
            </p>
            {errorMessage && (
              <div className={css(styles.errorMessage)}>{errorMessage}</div>
            )}
            <div className={css(styles.uploadColumnsWrapper)}>
              <div className={css(styles.uploadColumn)}>
                <h3>Required Columns</h3>
                <div>
                  {requiredColumns.map(c => (
                    <ColumnName
                      key={c.name}
                      {...c}
                      present={this.columnIsPresent(c.name)}
                    />
                  ))}
                </div>
                <h3 style={{ paddingTop: "20px" }}>Optional Columns</h3>
                <div>
                  {optionalColumns.map(c => (
                    <ColumnName
                      key={c.name}
                      {...c}
                      present={this.columnIsPresent(c.name)}
                    />
                  ))}
                </div>
              </div>

              {this.state.state === "idle" && (
                <FilePicker onPick={this.onPickCSV} />
              )}

              {(this.state.state === "parsed" ||
                this.state.state === "uploading") && (
                <ValidationStats
                  nContacts={this.state.parsedData.length}
                  customFields={customFields}
                  stats={this.state.validationStats}
                  canDelete={this.state.state === "parsed"}
                  onDelete={this.onDelete}
                />
              )}
            </div>

            <div>
              <RaisedButton
                primary
                label="Save And Goto Next Section"
                disabled={!canSaveAndContinue}
                onClick={() => canSaveAndContinue && this.onSave()}
              />
              <span style={{ marginLeft: "10px" }}>
                {this.state.state === "uploading"
                  ? `Uploading: ${(this.state.uploadProgress * 100).toFixed(
                      1
                    )}%`
                  : ""}
              </span>
            </div>
          </CardText>
        </Card>
      </div>
    );
  }
}
