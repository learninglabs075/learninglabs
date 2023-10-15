import React from "react";
import { Box } from "@material-ui/core";
import { InfoField } from "../../../app/utils/CustomInputFields";
import { extractInner } from "../../../app/utils/utils.js";

export default function InfoCard({ values, setFieldValue, partIndex }) {
  return (
    <Box
      className="question-form-secondary-container"
      style={{ marginLeft: "10px" }}
    >
      <Box className="question-form-left-column" style={{ paddingTop: "50px" }}>
        <InfoField
          height={300}
          onChange={(editorContent) =>
            setFieldValue(
              `parts.${partIndex}.info`,
              extractInner(editorContent)
            )
          }
          defaultValue={values.info ? `<p>${values.info}</p>` : `<p></p>`}
        />
      </Box>
    </Box>
  );
}
