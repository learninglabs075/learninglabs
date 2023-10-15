import React from "react";
import {
  Select,
  MenuItem,
  Box,
  Divider,
  Grid,
  Typography,
} from "@material-ui/core";
import {
  PromptField,
  RuleField,
  UnitRuleField,
} from "../../../app/utils/CustomInputFields";
import {
  makeSunEditorReadable,
  updatePrompt,
  updateRule,
} from "../../../app/utils/utils.js";
import {
  AttemptsAllowed,
  ExactMatchRadioButton,
  MathematicaInput,
  PercentToleranceField,
  PossiblePoints,
  SaveButton,
  Tags,
  TextInput,
  WordOrPhraseInput,
  WithinRangeRadioButton,
  TextScoringOptions,
  ListInput,
} from "./CommonQuestCpnts.jsx";
import { questionDividerA } from "../../../app/utils/stylingSnippets";
import EquationEditor from "../../../app/utils/EquationEditor";

export default function ShortAnswer({
  values,
  isSubmitting,
  setFieldValue,
  handleChange,
  isMultipart,
  partIndex,
  dirty,
  initVal,
}) {
  const defaultPrompt = makeSunEditorReadable(values.prompt);

  const subtype = values.subtype;
  const subtypeName = isMultipart ? `parts.${partIndex}.subtype` : "subtype";
  const numberFieldname = isMultipart
    ? `parts.${partIndex}.correctAnswer.number`
    : "correctAnswer.number";
  const unitFieldname = isMultipart
    ? `parts.${partIndex}.correctAnswer.unit`
    : "correctAnswer.unit";
  const ruleFieldname = isMultipart
    ? `parts.${partIndex}.correctAnswer.rule`
    : "correctAnswer.rule";
  const unitRuleFieldname = isMultipart
    ? `parts.${partIndex}.correctAnswer.unitRule`
    : "correctAnswer.unitRule";
  const vectorFieldname = isMultipart
    ? `parts.${partIndex}.correctAnswer.vector`
    : "correctAnswer.vector";
  const vectorExprFieldname = isMultipart
    ? `parts.${partIndex}.correctAnswer.vectorExpr`
    : "correctAnswer.vectorExpr";
  const exprFieldname = isMultipart
    ? `parts.${partIndex}.correctAnswer.expr`
    : "correctAnswer.expr";

  const chemFormulaFieldname = isMultipart
    ? `parts.${partIndex}.correctAnswer.chemFormula`
    : "correctAnswer.chemFormula";

  const numberInitVal = initVal?.correctAnswer
    ? initVal?.correctAnswer?.number
    : initVal?.correctNumber;

  const unitInitVal = initVal?.correctAnswer
    ? initVal?.correctAnswer?.unit
    : initVal?.correctUnit;

  const ruleInitVal = initVal?.correctAnswer
    ? initVal?.correctAnswer?.rule
    : initVal?.correctRule;

  const unitRuleInitVal = initVal?.correctAnswer
    ? initVal?.correctAnswer?.unitRule
    : initVal?.correctUnitRule;

  const vectorInitVal = initVal?.correctAnswer
    ? initVal?.correctAnswer?.vector
    : initVal?.correctNumber;

  const vectorExprInitVal = initVal?.correctAnswer
    ? initVal?.correctAnswer?.vectorExpr
    : initVal?.correctNumber;

  const exprInitVal = initVal?.correctAnswer
    ? initVal?.correctAnswer?.expr
    : initVal?.correctNumber;

  const chemFormulaInitVal = initVal?.correctAnswer
    ? initVal?.correctAnswer?.chemFormula
    : initVal?.chemFormula;

  const numberID = isMultipart ? `${partIndex}-number` : "number";

  const unitID = isMultipart ? `${partIndex}-unit` : "unit";

  const ruleID = isMultipart ? `${partIndex}-rule` : "rule";

  const vectorID = isMultipart ? `${partIndex}-vector` : "vector";

  const vectorExprID = isMultipart ? `${partIndex}-vectorExpr` : "vectorExpr";

  const exprID = isMultipart ? `${partIndex}-expr` : "expr";

  const chemFormulaID = isMultipart
    ? `${partIndex}-chemFormula`
    : "chemFormula";

  return (
    <>
      <Box className="flex-row question-form-secondary-container">
        <Box className="question-form-left-column">
          <Select
            fullWidth
            value={values.subtype || "placeholder"}
            name={subtypeName}
            onChange={handleChange}
            variant="outlined"
            className="margin-bottom-light"
          >
            <MenuItem value="placeholder" disabled>
              select an option
            </MenuItem>
            <MenuItem value="text">word / phrase</MenuItem>
            <MenuItem value="number">number</MenuItem>
            <MenuItem value="measurement">measurement</MenuItem>
            <MenuItem value="measurement with feedback">
              measurement with feedback
            </MenuItem>
            <MenuItem value="measurement with rule">
              measurement with rule
            </MenuItem>
            <MenuItem value="expr">symbolic expression</MenuItem>
            <MenuItem value="expr with rule">
              symbolic expression with rule
            </MenuItem>
            <MenuItem value="mathematica expression">
              Mathematica expression
            </MenuItem>
            <MenuItem value="mathematica list">list</MenuItem>
            <MenuItem value="vector">vector</MenuItem>
            <MenuItem value="vector with unit">vector (with unit)</MenuItem>
            <MenuItem value="vector expr">vector (expression based)</MenuItem>
            <MenuItem value="chemical formula">chemical formula</MenuItem>
          </Select>

          {subtype !== "placeholder" && (
            <>
              <PromptField
                height={150}
                onChange={(content) =>
                  updatePrompt(content, setFieldValue, isMultipart, partIndex)
                }
                defaultValue={defaultPrompt}
              />
              <Divider style={questionDividerA} />
              <Typography color="textSecondary" style={{ marginLeft: "50px" }}>
                response must match:
              </Typography>
            </>
          )}
          {subtype === "wordOrPhrase" && (
            <Box margin={2} className="flex-justify-center">
              <WordOrPhraseInput
                isMultipart={isMultipart}
                partIndex={partIndex}
              />
            </Box>
          )}
          {subtype === "text" && (
            <Box margin={2} className="flex-justify-center">
              <TextInput isMultipart={isMultipart} partIndex={partIndex} />
            </Box>
          )}
          {subtype === "mathematica expression" && (
            <Box margin={2} className="flex-justify-center">
              <MathematicaInput
                isMultipart={isMultipart}
                partIndex={partIndex}
              />
            </Box>
          )}
          {subtype === "mathematica list" && (
            <Box margin={2} className="flex-justify-center">
              <ListInput isMultipart={isMultipart} partIndex={partIndex} />
            </Box>
          )}
          <Box className="flex justify-center" margin={2}>
            {(subtype === "number" || subtype === "number beta") && (
              <Box width="300px">
                <EquationEditor
                  fieldname={numberFieldname}
                  id={numberID}
                  initVal={numberInitVal}
                  label="number"
                  setFieldValue={setFieldValue}
                />
              </Box>
            )}
            {(subtype === "measurement" ||
              subtype === "measurement beta" ||
              subtype === "measurement with feedback") && (
              <>
                <Box width="200px">
                  <EquationEditor
                    fieldname={numberFieldname}
                    id={numberID}
                    initVal={numberInitVal}
                    label="number"
                    setFieldValue={setFieldValue}
                  />
                </Box>
                <Box width="20px" />
                <Box width="200px">
                  <EquationEditor
                    fieldname={unitFieldname}
                    id={unitID}
                    initVal={unitInitVal}
                    label="unit"
                    setFieldValue={setFieldValue}
                  />
                </Box>
              </>
            )}
            {subtype === "measurement with rule" && (
              <>
                <Grid container>
                  <Grid item xs={6}>
                    <Box width="200px">
                      <EquationEditor
                        fieldname={numberFieldname}
                        id={numberID}
                        initVal={numberInitVal}
                        label="number"
                        setFieldValue={setFieldValue}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box width="200px">
                      <EquationEditor
                        fieldname={unitFieldname}
                        id={unitID}
                        initVal={unitInitVal}
                        label="unit"
                        setFieldValue={setFieldValue}
                      />
                    </Box>
                  </Grid>
                  <Grid item>
                    <Box width="450px">
                      <RuleField
                        onChange={(event) =>
                          updateRule(
                            event,
                            setFieldValue,
                            ruleFieldname,
                            isMultipart,
                            partIndex
                          )
                        }
                        label="number rule"
                        defaultValue={ruleInitVal}
                      />
                    </Box>
                  </Grid>
                  <Grid item>
                    <Box width="450px">
                      <UnitRuleField
                        onChange={(event) =>
                          updateRule(
                            event,
                            setFieldValue,
                            unitRuleFieldname,
                            isMultipart,
                            partIndex
                          )
                        }
                        defaultValue={unitRuleInitVal}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </>
            )}

            {(subtype === "symbolic" || subtype === "expr") && (
              <Box width="300px">
                <EquationEditor
                  fieldname={exprFieldname}
                  id={exprID}
                  initVal={exprInitVal}
                  label="expression"
                  setFieldValue={setFieldValue}
                />
              </Box>
            )}
            {subtype === "expr with rule" && (
              <>
                <Grid container>
                  <Grid item>
                    <Box width="200px">
                      <EquationEditor
                        fieldname={exprFieldname}
                        id={exprID}
                        initVal={exprInitVal}
                        label="expression"
                        setFieldValue={setFieldValue}
                      />
                    </Box>
                  </Grid>
                  <Grid item>
                    <Box width="450px">
                      <RuleField
                        onChange={(event) =>
                          updateRule(
                            event,
                            setFieldValue,
                            ruleFieldname,
                            isMultipart,
                            partIndex
                          )
                        }
                        label="expression rule"
                        defaultValue={ruleInitVal}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </>
            )}
            {(subtype === "vector" || subtype === "vector beta") && (
              <Box width="300px">
                <EquationEditor
                  fieldname={vectorFieldname}
                  id={vectorID}
                  initVal={vectorInitVal}
                  label="vector"
                  setFieldValue={setFieldValue}
                />
              </Box>
            )}
            {subtype === "vector with unit" && (
              <>
                <Box width="200px">
                  <EquationEditor
                    fieldname={vectorFieldname}
                    id={vectorID}
                    initVal={vectorInitVal}
                    label="vector"
                    setFieldValue={setFieldValue}
                  />
                </Box>
                <Box width="20px" />
                <Box width="200px">
                  <EquationEditor
                    fieldname={unitFieldname}
                    id={unitID}
                    initVal={unitInitVal}
                    label="unit"
                    setFieldValue={setFieldValue}
                  />
                </Box>
              </>
            )}
            {(subtype === "vector symbolic" || subtype === "vector expr") && (
              <Box width="300px">
                <EquationEditor
                  fieldname={vectorExprFieldname}
                  id={vectorExprID}
                  initVal={vectorExprInitVal}
                  label="vector (expression)"
                  setFieldValue={setFieldValue}
                />
              </Box>
            )}
            {subtype === "chemical formula" && (
              <Box width="300px">
                <EquationEditor
                  fieldname={chemFormulaFieldname}
                  id={chemFormulaID}
                  initVal={chemFormulaInitVal}
                  label="chemical formula"
                  setFieldValue={setFieldValue}
                />
              </Box>
            )}
          </Box>

          {(subtype === "number" ||
            subtype === "number beta" ||
            subtype === "measurement" ||
            subtype === "measurement beta" ||
            subtype === "measurement with feedback" ||
            subtype === "vector" ||
            subtype === "vector beta" ||
            subtype === "vector with unit") && (
            <>
              <Box className="flex-align-center" marginLeft={4}>
                <ExactMatchRadioButton
                  isMultipart={isMultipart}
                  partIndex={partIndex}
                />
                <Typography>exactly</Typography>
              </Box>
              <Box className="flex-align-center" marginLeft={4}>
                <WithinRangeRadioButton
                  isMultipart={isMultipart}
                  partIndex={partIndex}
                />
                <Typography variant="subtitle1" color="textPrimary">
                  within
                </Typography>
                <Box width={65} margin={1}>
                  <PercentToleranceField
                    isMultipart={isMultipart}
                    partIndex={partIndex}
                    values={values}
                  />
                </Box>
                <Typography variant="subtitle1" color="textPrimary">
                  of correct value
                </Typography>
              </Box>
              {/* {values.match === "withinRange" &&
                values.correctNumber > 0 &&
                values.percentTolerance > 0 && (
                  <AcceptableRange
                    correctNumber={
                      values.correctAnswer
                        ? values.correctAnswer?.number
                        : values.correctNumber
                    }
                    correctUnit={
                      values.correctAnswer
                        ? values.correctAnswer?.unit
                        : values.correctUnit
                    }
                    percentTolerance={
                      values.correctAnswer
                        ? values.correctAnswer.percentTolerance
                        : values.percentTolerance
                    }
                  />
                )} */}
            </>
          )}
        </Box>

        <Box className="question-form-right-column">
          <Box className="scoring-container">
            <PossiblePoints isMultipart={isMultipart} partIndex={partIndex} />
            {(values.subtype === "text" || values.subtype === "wordOrPhrase") &&
              values.correctWordOrPhrase !== "" && (
                <TextScoringOptions
                  values={values}
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
