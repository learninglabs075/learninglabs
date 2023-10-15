import React, { useState } from "react";
import { Box, Divider, Typography } from "@material-ui/core";
import { PromptField } from "../../../app/utils/CustomInputFields";
import {
  makeSunEditorReadable,
  updatePrompt,
} from "../../../app/utils/utils.js";
import {
  MultChoiceAnswerChoices,
  MultChoiceScoringOptions,
  Tags,
  PossiblePoints,
  AttemptsAllowed,
  SaveButton,
} from "./CommonQuestCpnts.jsx";
import { questionDividerA } from "../../../app/utils/stylingSnippets";

export default function MultipleChoice({
  values,
  isSubmitting,
  setFieldValue,
  handleChange,
  isMultipart,
  partIndex,
  dirty,
}) {
  const defaultPrompt = makeSunEditorReadable(values.prompt);
  const [numCorrectChoices, setNumCorrectChoices] = useState(0);

  return (
    <>
      <Box className="flex-row question-form-secondary-container">
        <Box className="question-form-left-column">
          <Box height={40} />
          <PromptField
            height={150}
            onChange={(content) =>
              updatePrompt(content, setFieldValue, isMultipart, partIndex)
            }
            defaultValue={defaultPrompt}
          />

          <Divider style={questionDividerA} />
          <Box className="flex justify-end">
            <Typography variant="subtitle2">correct</Typography>
          </Box>
          <MultChoiceAnswerChoices
            values={values}
            handleChange={handleChange}
            setNumCorrectChoices={setNumCorrectChoices}
            setFieldValue={setFieldValue}
            isMultipart={isMultipart}
            partIndex={partIndex}
          />
        </Box>
        <Box className="question-form-right-column">
          <Box className="scoring-container">
            <PossiblePoints isMultipart={isMultipart} partIndex={partIndex} />
            {numCorrectChoices > 1 && (
              <MultChoiceScoringOptions
                values={values}
                numCorrectChoices={numCorrectChoices}
                isMultipart={isMultipart}
                partIndex={partIndex}
              />
            )}
          </Box>
          <Box className="scoring-container">
            <AttemptsAllowed isMultipart={isMultipart} partIndex={partIndex} />
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
