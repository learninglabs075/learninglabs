import React from "react";
import { Box, Divider, Typography, Checkbox } from "@material-ui/core";
import { Field } from "formik";
import { PromptField } from "../../../app/utils/CustomInputFields";
import {
  makeSunEditorReadable,
  updatePrompt,
} from "../../../app/utils/utils.js";
import { Tags, PossiblePoints, SaveButton } from "./CommonQuestCpnts.jsx";
import { questionDividerA } from "../../../app/utils/stylingSnippets";

export default function FileUpload({
  values,
  isSubmitting,
  setFieldValue,
  isMultipart,
  partIndex,
  dirty,
}) {
  const defaultPrompt = makeSunEditorReadable(values.prompt);
  return (
    <>
      <Box className="flex-row question-form-secondary-container">
        <Box
          className="question-form-left-column"
          style={{ paddingTop: "50px" }}
        >
          <PromptField
            height={150}
            onChange={(content) =>
              updatePrompt(content, setFieldValue, isMultipart, partIndex)
            }
            defaultValue={defaultPrompt}
          />
          <Divider style={questionDividerA} />
          <Box className="flex-column padding-left-medium">
            <Typography color="textSecondary">
              choose which file types to accept
            </Typography>
            <Box display="flex" alignItems="center">
              <Field
                name={isMultipart ? `parts.${partIndex}.accept` : "accept"}
                color="primary"
                value="application/pdf"
                as={Checkbox}
                checked={values?.accept?.includes("application/pdf")}
              />

              <Typography display="inline">PDF</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Field
                name={isMultipart ? `parts.${partIndex}.accept` : "accept"}
                value="image/png"
                color="primary"
                as={Checkbox}
                checked={values?.accept?.includes("image/png")}
              />
              <Typography display="inline">PNG (image)</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Field
                name={isMultipart ? `parts.${partIndex}.accept` : "accept"}
                value="image/jpeg"
                color="primary"
                as={Checkbox}
                checked={values?.accept?.includes("image/jpeg")}
              />
              <Typography display="inline">JPEG (image)</Typography>
            </Box>
          </Box>
        </Box>
        <Box className="question-form-right-column">
          <Box className="scoring-container">
            <PossiblePoints isMultipart={isMultipart} partIndex={partIndex} />
          </Box>
          {!isMultipart && (
            <Tags values={values} setFieldValue={setFieldValue} />
          )}
        </Box>
      </Box>
      {!isMultipart && (
        <Box className="flex-justify-center padding-top-medium">
          <SaveButton
            isSubmitting={isSubmitting}
            dirty={dirty && values?.accept?.length > 0}
          />
        </Box>
      )}
    </>
  );
}
