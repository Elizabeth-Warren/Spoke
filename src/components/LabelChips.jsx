import React from "react";
import _ from "lodash";
import { Chip } from "material-ui";
import theme from "src/styles/theme";

export default function LabelChips({ labels, labelIds, onRequestDelete }) {
  const labelsById = _.keyBy(labels, "id");

  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {(labelIds || []).map(labelId => {
        const label = labelsById[labelId];

        let onDelete;
        if (onRequestDelete) {
          onDelete = () => onRequestDelete(label);
        }

        return (
          <Chip
            key={labelId}
            onRequestDelete={onDelete}
            style={{
              marginBottom: "5px",
              marginRight: "10px",
              backgroundColor: theme.colors.EWdarkLibertyGreen
            }}
          >
            <span
              style={{
                color: theme.colors.EWnavy
              }}
            >
              {label.displayValue}
            </span>
          </Chip>
        );
      })}
    </div>
  );
}
