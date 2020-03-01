import React from "react";
import pick from "lodash/pick";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import TextField from "material-ui/TextField";

import { dataTest } from "src/lib/attributes";
import { allFields, allInputFields } from "src/lib/fields-helpers";

import ScriptEditor from "../ScriptEditor";
import GSFormField from "./GSFormField";

const styles = {
  dialog: {
    zIndex: 10001
  }
};

export default class GSScriptField extends GSFormField {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      script: props.value
    };
  }

  handleOpenDialog = event => {
    event.stopPropagation();
    event.preventDefault();
    this.setState({
      open: true
    });
  };

  handleCloseDialog = () => {
    this.setState({
      open: false,
      script: this.props.value
    });
  };

  handleSaveScript = () => {
    const value = this.state.script;
    this.props.onChange(value);
    this.handleCloseDialog();
  };

  renderDialog() {
    const { open } = this.state;
    const { customFields, sampleContact } = this.props;
    const scriptFields = allFields(customFields);
    const scriptInputFields = allInputFields(customFields);

    return (
      <Dialog
        style={styles.dialog}
        actions={[
          <FlatButton
            {...dataTest("scriptCancel")}
            label="Cancel"
            onClick={this.handleCloseDialog}
          />,
          <RaisedButton
            {...dataTest("scriptDone")}
            label="Done"
            onClick={this.handleSaveScript}
            primary
          />
        ]}
        modal
        open={open}
        onRequestClose={this.handleCloseDialog}
      >
        <ScriptEditor
          expandable
          ref="dialogScriptInput"
          scriptText={this.state.script}
          sampleContact={sampleContact}
          scriptFields={scriptFields}
          scriptInputFields={scriptInputFields}
          onChange={val => this.setState({ script: val })}
        />
      </Dialog>
    );
  }

  render() {
    const passThroughProps = pick(this.props, [
      "className",
      "fullWidth",
      "hintText",
      "label",
      "multiLine",
      "name",
      "value",
      "data-test",
      "onBlur"
    ]);

    return (
      <div>
        <TextField
          onChange={null}
          multiLine
          onFocus={event => this.handleOpenDialog(event)}
          onClick={event => {
            this.handleOpenDialog(event);
          }}
          floatingLabelText={this.floatingLabelText()}
          floatingLabelStyle={{
            zIndex: 0
          }}
          defaultValue={""}
          {...passThroughProps}
        />
        {this.renderDialog()}
      </div>
    );
  }
}
