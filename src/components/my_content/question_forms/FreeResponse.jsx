import React from "react";
import { Box, Divider } from "@material-ui/core";
import { Field } from "formik";
import {
  PromptField,
  FreeResponseExample,
} from "../../../app/utils/CustomInputFields";
import {
  makeSunEditorReadable,
  updatePrompt,
} from "../../../app/utils/utils.js";
import { Tags, PossiblePoints } from "./CommonQuestCpnts.jsx";
import { SaveButton } from "./CommonQuestCpnts.jsx";
import { FreeResponseCharacterLimit } from "./CommonQuestCpnts";
import { questionDividerA } from "../../../app/utils/stylingSnippets";

export default function FreeResponse({
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
          <Field name="correctAnswer.example" as={FreeResponseExample} />
          <FreeResponseCharacterLimit
            isMultipart={isMultipart}
            partIndex={partIndex}
          />
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
          <SaveButton isSubmitting={isSubmitting} dirty={dirty} />
        </Box>
      )}
    </>
  );
}
