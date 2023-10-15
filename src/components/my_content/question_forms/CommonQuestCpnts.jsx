import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Radio,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { Delete } from "@material-ui/icons/";
import { Field, FieldArray } from "formik";
import {
  AnswerChoiceField,
  AttemptsAllowedField,
  CharacterLimitField,
  ExpressionInputField,
  PointsField,
  PositiveNumberInputField,
  TagField,
  SimpleTextField,
  WordOrPhraseField,
  ListInputField,
} from "../../../app/utils/CustomInputFields";
import { parseHTMLandTeX } from "../../../app/utils/customParsers.js";
import {
  makeSunEditorReadable,
  updateAnswerChoice,
} from "../../../app/utils/utils.js";

//===============================================================================//
//===================== Multiple Choice Specific Components =====================//

export function MultChoiceAnswerChoices({
  values,
  handleChange,
  setNumCorrectChoices,
  setFieldValue,
  isMultipart,
  partIndex,
}) {
  return (
    <FieldArray
      name={isMultipart ? `parts.${partIndex}.answerChoices` : "answerChoices"}
    >
      {({ remove, push }) => (
        <>
          {setNumCorrectChoices((prevNum) =>
            values.answerChoices?.reduce(
              (acc, cur) => (cur.isCorrect === true ? ++acc : acc),
              0
            )
          )}
          {values.answerChoices?.map((answerChoice, answerIndex) => (
            <Box key={answerIndex} className="flex-row padding-vertical-tiny">
              <Box width={450}>
                <AnswerChoiceField
                  width="100%"
                  height={50}
                  onChange={(content) =>
                    updateAnswerChoice(
                      content,
                      setFieldValue,
                      isMultipart,
                      partIndex,
                      answerIndex
                    )
                  }
                  defaultValue={makeSunEditorReadable(
                    values.answerChoices[answerIndex].answerChoice
                  )}
                  // defaultValue={
                  //   values.answerChoices[answerIndex].answerChoice
                  //     ? `<p>${values.answerChoices[answerIndex].answerChoice}</p>`
                  //     : `<p></p>`
                  // }
                />
              </Box>
              <Checkbox
                name={
                  isMultipart
                    ? `parts.${partIndex}.answerChoices.${answerIndex}.isCorrect`
                    : `answerChoices.${answerIndex}.isCorrect`
                }
                color="primary"
                disableRipple
                onChange={handleChange}
                checked={values.answerChoices[answerIndex].isCorrect}
                style={{ marginLeft: "20px" }}
              />
            </Box>
          ))}
          {values.answerChoices?.length > 0 && (
            <button
              type="button"
              className="delete-button hover-pointer-default"
              onClick={() => remove(values.answerChoices.length - 1)}
            >
              <Box className="flex align-center relative remove-last-entry-container">
                remove last entry <Delete />
              </Box>
            </button>
          )}

          <Box className="add-choice-button-container">
            <button
              type="button"
              className="add-choice-button hover-pointer-default"
              onClick={() =>
                push({
                  answerChoice: "",
                  isCorrect: false,
                })
              }
            >
              ADD ANSWER CHOICE
            </button>
          </Box>
        </>
      )}
    </FieldArray>
  );
}

export function MultChoiceScoringOptions({
  values,
  numCorrectChoices,
  isMultipart,
  partIndex,
}) {
  return (
    <>
      <Box className="flex-align-center">
        <Field
          name={
            isMultipart ? `parts.${partIndex}.scoringMethod` : "scoringMethod"
          }
          type="radio"
          value="allOrNothing"
          color="primary"
          as={Radio}
        />
        <Typography variant="body1" display="inline">
          ALL OR NOTHING
        </Typography>
      </Box>
      <Box position="relative" bottom={8} marginLeft={6} maxWidth={300}>
        {values.possiblePoints > 0 ? (
          <Typography variant="caption">
            {values.possiblePoints} points awarded if student selects all
            correct answers and no incorrect answers.
          </Typography>
        ) : (
          <Typography variant="caption">
            full points awarded if student selects all correct answers and no
            incorrect answers
          </Typography>
        )}
      </Box>
      <Box className="flex-align-center">
        <Field
          name={
            isMultipart ? `parts.${partIndex}.scoringMethod` : "scoringMethod"
          }
          type="radio"
          value="partial"
          color="primary"
          as={Radio}
        />
        <Typography variant="body1" display="inline">
          PARTIAL
        </Typography>
      </Box>
      <Box position="relative" bottom={8} marginLeft={6} maxWidth={300}>
        {values.possiblePoints > 0 ? (
          <Typography variant="caption">
            {Math.round((values.possiblePoints / numCorrectChoices) * 100) /
              100}{" "}
            points awarded for each correct answer
          </Typography>
        ) : (
          <Typography variant="caption">
            points awarded for each correct answer
          </Typography>
        )}
      </Box>
    </>
  );
}

//===============================================================================//
//======================= ShortAnswer Specific Components =======================//

export function WordOrPhraseInput({ isMultipart, partIndex }) {
  return (
    <Field
      name={
        isMultipart
          ? `parts.${partIndex}.correctAnswer.text`
          : "correctAnswer.text"
      }
      as={WordOrPhraseField}
    />
  );
}

export function TextInput({ isMultipart, partIndex }) {
  return (
    <Field
      name={
        isMultipart
          ? `parts.${partIndex}.correctAnswer.text`
          : "correctAnswer.text"
      }
      as={SimpleTextField}
    />
  );
}

export function MathematicaInput({ isMultipart, partIndex }) {
  return (
    <Field
      name={
        isMultipart
          ? `parts.${partIndex}.correctAnswer.expr`
          : "correctAnswer.expr"
      }
      as={ExpressionInputField}
    />
  );
}

export function ListInput({ isMultipart, partIndex }) {
  return (
    <Field
      name={
        isMultipart
          ? `parts.${partIndex}.correctAnswer.text`
          : "correctAnswer.text"
      }
      as={ListInputField}
    />
  );
}

export function ExactMatchRadioButton({ isMultipart, partIndex }) {
  return (
    <Field
      name={isMultipart ? `parts.${partIndex}.match` : "match"}
      type="radio"
      value="exact"
      color="primary"
      as={Radio}
    />
  );
}

export function WithinRangeRadioButton({ isMultipart, partIndex }) {
  return (
    <Field
      name={isMultipart ? `parts.${partIndex}.match` : "match"}
      type="radio"
      value="withinRange"
      color="primary"
      as={Radio}
    />
  );
}

export function PercentToleranceField({ isMultipart, partIndex, values }) {
  return (
    <Field
      name={
        isMultipart
          ? `parts.${partIndex}.correctAnswer.percentTolerance`
          : "correctAnswer.percentTolerance"
      }
      as={PositiveNumberInputField}
      match={values.match}
    />
  );
}

export function TextScoringOptions({ values, isMultipart, partIndex }) {
  return (
    <>
      <Box className="flex-align-center">
        <Field
          name={
            isMultipart
              ? `parts.${partIndex}.correctAnswer.acceptAlternateSpacing`
              : "correctAnswer.acceptAlternateSpacing"
          }
          color="primary"
          checked={
            values.correctAnswer
              ? values.correctAnswer?.acceptAlternateSpacing
              : values.acceptAlternateSpacing
          }
          as={Checkbox}
        />
        <Typography variant="subtitle1">accept alternate spacing</Typography>
      </Box>
      <Box className="flex-align-center">
        <Field
          name={
            isMultipart
              ? `parts.${partIndex}.correctAnswer.acceptAlternateCapitalization`
              : "correctAnswer.acceptAlternateCapitalization"
          }
          as={Checkbox}
          color="primary"
          checked={
            values.correctAnswer
              ? values.correctAnswer?.acceptAlternateCapitalization
              : values.acceptAlternateCapitalization
          }
        />
        <Typography variant="subtitle1">
          accept alternate capitalization
        </Typography>
      </Box>
    </>
  );
}

//===============================================================================//
//====================== Free Response Specific Components ======================//

export function FreeResponseCharacterLimit({ isMultipart, partIndex }) {
  return (
    <Box className="flex-align-center justify-end">
      <Typography>character limit: </Typography>{" "}
      <Box width={60} padding={1}>
        <Field
          name={
            isMultipart ? `parts.${partIndex}.characterLimit` : "characterLimit"
          }
          as={CharacterLimitField}
        />
      </Box>
    </Box>
  );
}

//===============================================================================//
//======================= Title Card Specific Components ========================//

export function TitleCardPreview({ values }) {
  return (
    <Card
      className="title-card-preview"
      style={{ backgroundColor: "rgb(240,240,240)" }}
    >
      <CardContent>
        <Box className="flex-center-all column relative">
          <Box className="absolute" left={-5} top={-8}>
            <Typography variant="caption" color="textSecondary">
              PREVIEW
            </Typography>
          </Box>
          <Box className="flex-center-all title-card-title-preview">
            {values.title?.length === 0 && (
              <Typography variant="h6" color="textSecondary">
                (no title entered)
              </Typography>
            )}
            {values.title?.length > 0 && (
              <Typography variant="h6">{values.title}</Typography>
            )}
          </Box>

          <Box className="flex-center-all title-card-body-preview">
            {values.body?.length === 0 && (
              <Typography variant="subtitle1" color="textSecondary">
                (body)
              </Typography>
            )}
            {values.body?.length > 0 && (
              <Typography variant="subtitle1">
                {parseHTMLandTeX(values.body)}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

//===============================================================================//
//============================ Shared Components ================================//

export function PossiblePoints({ isMultipart, partIndex }) {
  return (
    <>
      <Typography variant="h5">Scoring</Typography>
      <Box className="points-field-row flex-align-center">
        <Typography variant="body1" display="inline">
          POINTS:
        </Typography>
        <Box marginLeft={1} width={65}>
          <Field
            name={
              isMultipart
                ? `parts.${partIndex}.possiblePoints`
                : "possiblePoints"
            }
            as={PointsField}
          />
        </Box>
      </Box>
    </>
  );
}

export function AttemptsAllowed({ isMultipart, partIndex }) {
  return (
    <>
      <Typography variant="h5">Attempts</Typography>
      <Box className="points-field-row flex-align-center">
        <Box width={65}>
          <Field
            name={
              isMultipart
                ? `parts.${partIndex}.attemptsAllowed`
                : "attemptsAllowed"
            }
            as={AttemptsAllowedField}
          />
        </Box>
      </Box>
    </>
  );
}

const TagsStyling = makeStyles((theme) => ({
  existingTagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    "& > *": {
      margin: theme.spacing(0.5),
    },
  },
}));

export function Tags({ values, setFieldValue }) {
  const classes = TagsStyling();
  return (
    <Box className="tag-generator">
      <Typography variant="h5">Tags</Typography>
      <Typography variant="caption">
        easily search for this question by topic later
      </Typography>
      <FieldArray name="tags">
        {({ remove, push }) => (
          <>
            <Box className="flex-align-center margin-vertical-light">
              <Field name="currentTag" as={TagField} />
              <Button
                type="button"
                onClick={() => {
                  push(values.currentTag);
                  setFieldValue("currentTag", "");
                }}
              >
                ADD
              </Button>
            </Box>

            <Box className={classes.existingTagsContainer}>
              {values.tags?.length > 0 &&
                values.tags.map((tag, index) => (
                  <div key={index}>
                    <Chip
                      name={`tags.${index}.tag`}
                      label={values.tags[index]}
                      color="primary"
                      onDelete={() => remove(index)}
                    />
                  </div>
                ))}
            </Box>
          </>
        )}
      </FieldArray>
    </Box>
  );
}

export function SaveButton({ isSubmitting, dirty }) {
  return (
    <Button
      type="submit"
      variant="contained"
      color="primary"
      size="large"
      className="save-question-button"
      disabled={isSubmitting || !dirty}
    >
      {isSubmitting ? <CircularProgress size={25} /> : "Save"}
    </Button>
  );
}
