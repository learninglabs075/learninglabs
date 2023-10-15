import React from "react";
import { Box, Typography } from "@material-ui/core";
import { Field } from "formik";
import { TitleField, BodyField } from "../../../app/utils/CustomInputFields";
import { TitleCardPreview } from "./CommonQuestCpnts.jsx";
import { extractInner } from "../../../app/utils/utils.js";
import { SaveButton } from "./CommonQuestCpnts.jsx";

export default function TitleCard({
  values,
  isSubmitting,
  setFieldValue,
  dirty,
}) {
  return (
    <>
      <Box className="flex-row">
        <Box style={{ minWidth: "400px", marginRight: "25px" }}>
          <Box className="title-card-input-fields">
            <Box className="title-card-input-header">
              <Typography color="textSecondary">CARD INPUTS</Typography>
            </Box>
            <Field name="title" as={TitleField} />
            <BodyField
              height={250}
              onChange={(editorContent) =>
                setFieldValue("body", extractInner(editorContent))
              }
              defaultValue={values.body ? `<p>${values.body}</p>` : `<p></p>`}
            />
          </Box>
        </Box>
        <Box display="inline-block" width={570}>
          <TitleCardPreview values={values} />
        </Box>
      </Box>
      <Box className="flex-justify-center">
        <SaveButton isSubmitting={isSubmitting} dirty={dirty} />
      </Box>
    </>
  );
}
