import React from "react";
import Dropzone from "react-dropzone";
import classNames from "classnames";
import UploadIcon from "material-ui/svg-icons/file/cloud-upload";
import { StyleSheet, css } from "aphrodite";
import theme from "src/styles/theme";
import { Card } from "material-ui";

const styles = StyleSheet.create({
  uploadColumnRight: {
    flex: "1",
    padding: "20px",
    outline: "none"
  },
  dropCard: {
    padding: "20px",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    ":hover": {
      backgroundColor: theme.colors.lightGray
    }
  },
  dropCardActive: {
    backgroundColor: theme.colors.EWlightLibertyGreen
  },
  uploadIcon: {
    height: "48px",
    width: "48px"
  }
});

export default function FilePicker({ onPick }) {
  return (
    <Dropzone onDrop={onPick} accept="text/csv">
      {({ getRootProps, getInputProps, isDragActive }) => (
        <div
          {...getRootProps()}
          className={css(styles.uploadColumn, styles.uploadColumnRight)}
        >
          <Card
            className={classNames(css(styles.dropCard), {
              [css(styles.dropCardActive)]: isDragActive
            })}
          >
            <input {...getInputProps()} />
            <UploadIcon className={css(styles.uploadIcon)} />
          </Card>
        </div>
      )}
    </Dropzone>
  );
}
