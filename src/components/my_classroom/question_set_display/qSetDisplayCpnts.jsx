import React, { useEffect, useState } from "react";
import { Field } from "formik";
import {
  IconButton,
  Checkbox,
  Radio,
  Button,
  CircularProgress,
  Box,
  Typography,
  Divider,
  TextField,
  Link,
  Tooltip,
} from "@material-ui/core";
import {
  Delete,
  Star,
  StarHalf,
  StarBorder,
  CloudUpload,
} from "@material-ui/icons";
import {
  alphabet,
  extractDate,
  makeReadable,
} from "../../../app/utils/utils.js";
import { parseHTMLandTeX } from "../../../app/utils/customParsers.js";
import {
  multipleChoiceRadioStyling,
  questionDividerB,
} from "../../../app/utils/stylingSnippets.js";
import {
  ExpressionInputField,
  FreeResponseField,
  ListInputField,
  SimpleTextField,
} from "../../../app/utils/CustomInputFields.jsx";
import FileUpload from "../../../app/utils/FileUpload.js";
import firebase from "../../../app/config/firebaseConfig.js";
import Alert from "@material-ui/lab/Alert";
import PreviewImage from "../../preview_modals/PreviewImage.jsx";
import PreviewPDF from "../../preview_modals/PreviewPDF.jsx";
import EquationEditor from "../../../app/utils/EquationEditor.jsx";
import InfoIcon from "@material-ui/icons/Info";

export function MultipleChoice({
  assignmentGrade,
  assignmentID,
  assignmentInfo,
  courseID,
  currentQuestion,
  instructorView,
  isMultipart,
  isSubmitting,
  partIndex,
  pastDue,
  responseHistory,
  setAssignmentGrade,
  setSubmittedPart,
  userID,
  values,
}) {
  const studentView = !instructorView;
  const answeredCorrectly = assignmentInfo?.hideCorrectStatus
    ? false
    : responseHistory?.answeredCorrectly;
  const numCorrectChoices = currentQuestion?.answerChoices?.reduce(
    (acc, cur) => (cur.isCorrect === true ? ++acc : acc),
    0
  );

  const attemptsAllowed = currentQuestion.attemptsAllowed || 1;
  const attemptsUsed = responseHistory?.attemptsUsed || 0;
  const attemptsExhausted = assignmentInfo?.unlimitedAttempts
    ? false
    : attemptsUsed >= attemptsAllowed;

  const disabled =
    attemptsExhausted ||
    answeredCorrectly ||
    instructorView ||
    (pastDue && !assignmentInfo?.dueDateExceededPenaltyPercentage);

  const responseArr = responseHistory?.responses;
  const lastResponse = Array.isArray(responseArr)
    ? responseArr[responseArr.length - 1]
    : null;

  const multipartValues = values?.parts ? values?.parts[partIndex] : null;

  const responseValue = isMultipart
    ? multipartValues?.response
    : values?.response || [];

  const responseChanged = detectChange();

  function detectChange() {
    if (numCorrectChoices === 1) {
      if (responseValue?.length === 0) return false;
      else return lastResponse ? lastResponse !== responseValue : true;
    }
    if (numCorrectChoices > 1) {
      if (responseValue?.length === 0) return false;
      const lastResponseArr = lastResponse ? Object.values(lastResponse) : null;
      if (!lastResponseArr) return true;
      if (lastResponseArr?.length !== responseValue?.length) return true;
      const sortedResponseString = lastResponseArr.sort().join("");
      const sortedValuesString = responseValue?.sort().join("");
      return sortedResponseString !== sortedValuesString;
    } else return false;
  }

  const responseFieldname = isMultipart
    ? `parts.${partIndex}.response`
    : "response";

  return (
    <>
      <QuestionHeader
        assignmentGrade={assignmentGrade}
        assignmentID={assignmentID}
        assignmentInfo={assignmentInfo}
        courseID={courseID}
        currentQuestion={currentQuestion}
        instructorView={instructorView}
        isMultipart={isMultipart}
        partIndex={partIndex}
        responseHistory={responseHistory}
        setAssignmentGrade={setAssignmentGrade}
        userID={userID}
      />
      <Box minHeight="68%">
        <Prompt prompt={currentQuestion.prompt} />
        <Divider style={questionDividerB} />
        <Box className="padding-horizontal-medium">
          {currentQuestion.answerChoices.map((element, choiceIndex) => (
            <Box
              key={`ans${choiceIndex}`}
              className="flex-row padding-vertical-light"
            >
              {numCorrectChoices === 1 && (
                <Field
                  name={responseFieldname}
                  type="radio"
                  value={`${choiceIndex}`}
                  color="primary"
                  as={Radio}
                  disabled={disabled}
                  style={multipleChoiceRadioStyling}
                />
              )}
              {numCorrectChoices > 1 && (
                <Field
                  name={responseFieldname}
                  type="checkbox"
                  value={`${choiceIndex}`}
                  color="primary"
                  as={Checkbox}
                  disabled={disabled}
                  style={multipleChoiceRadioStyling}
                />
              )}

              <Typography variant="subtitle1">
                {parseHTMLandTeX(element.answerChoice)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box className="flex-column text-align-center submit-response">
        <AttemptsCounter
          assignmentInfo={assignmentInfo}
          currentQuestion={currentQuestion}
          responseHistory={responseHistory}
        />
        {studentView && (
          <SubmitResponseButton
            assignmentInfo={assignmentInfo}
            currentQuestion={currentQuestion}
            disabled={disabled}
            isMultipart={isMultipart}
            isSubmitting={isSubmitting}
            partIndex={partIndex}
            responseChanged={responseChanged}
            responseHistory={responseHistory}
            setSubmittedPart={setSubmittedPart}
          />
        )}
      </Box>
      {/* {lastResponse && (
        <Box className="absolute" style={{ right: "0px" }}>
          <Typography align="right" style={{ paddingRight: "40px" }}>
            last submitted: {lastSubmitted}
          </Typography>
        </Box>
      )} */}
    </>
  );
}

export function ShortAnswer({
  assignmentGrade,
  assignmentID,
  assignmentInfo,
  courseID,
  currentQuestion,
  instructorView,
  isMultipart,
  isSubmitting,
  partIndex,
  pastDue,
  responseHistory,
  setFieldValue,
  setAssignmentGrade,
  setSubmittedPart,
  userID,
  values,
}) {
  const subtype = currentQuestion.subtype;
  const studentView = !instructorView;
  const answeredCorrectly = assignmentInfo?.hideCorrectStatus
    ? false
    : responseHistory?.answeredCorrectly;

  const attemptsAllowed = currentQuestion.attemptsAllowed || 1;
  const attemptsUsed = responseHistory?.attemptsUsed || 0;
  const attemptsExhausted = assignmentInfo?.unlimitedAttempts
    ? false
    : attemptsUsed >= attemptsAllowed;

  const disabled =
    attemptsExhausted ||
    answeredCorrectly ||
    instructorView ||
    (pastDue && !assignmentInfo?.dueDateExceededPenaltyPercentage);

  const responseArr = responseHistory?.responses;
  const lastResponse = Array.isArray(responseArr)
    ? responseArr[responseArr.length - 1]
    : null;

  const textFieldname = isMultipart
    ? `parts.${partIndex}.response.text`
    : "response.text";

  const numberFieldname = isMultipart
    ? `parts.${partIndex}.response.number`
    : "response.number";

  const unitFieldname = isMultipart
    ? `parts.${partIndex}.response.unit`
    : "response.unit";

  const vectorFieldname = isMultipart
    ? `parts.${partIndex}.response.vector`
    : "response.vector";

  const exprFieldname = isMultipart
    ? `parts.${partIndex}.response.expr`
    : "response.expr";

  const vectorExprFieldname = isMultipart
    ? `parts.${partIndex}.response.vectorExpr`
    : "response.vectorExpr";

  const chemFormulaFieldname = isMultipart
    ? `parts.${partIndex}.response.chemFormula`
    : "response.chemFormula";

  const multipartValues = values?.parts ? values?.parts[partIndex] : null;

  const textValue = isMultipart
    ? multipartValues?.response?.text
    : values?.response?.text || "";

  const numberValue = isMultipart
    ? multipartValues?.response?.number
    : values?.response?.number;

  const unitValue = isMultipart
    ? multipartValues?.response?.unit
    : values?.response?.unit;

  const ruleValue = isMultipart
    ? multipartValues?.response?.rule
    : values?.response?.rule;

  const vectorValue = isMultipart
    ? multipartValues?.response?.vector
    : values?.response?.vector;

  const exprValue = isMultipart
    ? multipartValues?.response?.expr
    : values?.response?.expr;

  const vectorExprValue = isMultipart
    ? multipartValues?.response?.vectorExpr
    : values?.response?.vectorExpr;

  const chemFormulaValue = isMultipart
    ? multipartValues?.response?.chemFormula
    : values?.response?.chemFormula;

  const numberID = isMultipart
    ? `${currentQuestion.id}-${partIndex}-number`
    : `${currentQuestion.id}-number`;

  const unitID = isMultipart
    ? `${currentQuestion.id}-${partIndex}-unit`
    : `${currentQuestion.id}-unit`;

  const vectorID = isMultipart
    ? `${currentQuestion.id}-${partIndex}-vector`
    : `${currentQuestion.id}-vector`;

  const vectorExprID = isMultipart
    ? `${currentQuestion.id}-${partIndex}-vectorExpr`
    : `${currentQuestion.id}-vectorExpr`;

  const exprID = isMultipart
    ? `${currentQuestion.id}-${partIndex}-expr`
    : `${currentQuestion.id}-expr`;

  const chemFormulaID = isMultipart
    ? `${currentQuestion.id}-${partIndex}-chemFormula`
    : `${currentQuestion.id}-chemFormula`;

  const responseChanged = detectChange();

  function detectChange() {
    switch (subtype) {
      case "text":
      case "wordOrPhrase":
        if (!lastResponse && textValue === "") return false;
        return lastResponse ? lastResponse !== textValue : true;
      case "number":
        if (!lastResponse && numberValue === "") return false;
        return lastResponse ? lastResponse.number !== numberValue : true;
      case "measurement":
        if (!lastResponse && numberValue === "" && unitValue === "")
          return false;
        else
          return lastResponse
            ? lastResponse?.number !== numberValue ||
                lastResponse?.unit !== unitValue
            : true;
      case "measurement with rule":
        if (!lastResponse && numberValue === "" && unitValue === "")
          return false;
        else
          return lastResponse
            ? lastResponse?.number !== numberValue ||
                lastResponse?.unit !== unitValue
            : true;
      case "measurement with feedback":
        if (!lastResponse && numberValue === "" && unitValue === "")
          return false;
        else
          return lastResponse
            ? lastResponse?.number !== numberValue ||
                lastResponse?.unit !== unitValue
            : true;
      case "vector":
        if (!lastResponse && vectorValue === "") return false;
        return lastResponse ? lastResponse.vector !== vectorValue : true;
      case "vector with unit":
        if (!lastResponse && vectorValue === "" && unitValue === "")
          return false;
        return lastResponse
          ? lastResponse.vector !== vectorValue ||
              lastResponse.unit !== unitValue
          : true;
      case "expr":
      case "symbolic":
      case "mathematica expression":
        if (!lastResponse && exprValue === "") return false;
        return lastResponse ? lastResponse.expr !== exprValue : true;
      case "expr with rule":
        if (!lastResponse && exprValue === "") return false;
        return lastResponse ? lastResponse?.expr !== exprValue : true;
      case "chemical formula":
        if (!lastResponse && chemFormulaValue === "") return false;
        return lastResponse
          ? lastResponse.chemFormula !== chemFormulaValue
          : true;
      default:
        return true;
    }
  }

  if (!subtype)
    return (
      <>
        <QuestionHeader
          assignmentGrade={assignmentGrade}
          assignmentID={assignmentID}
          assignmentInfo={assignmentInfo}
          courseID={courseID}
          currentQuestion={currentQuestion}
          instructorView={instructorView}
          isMultipart={isMultipart}
          partIndex={partIndex}
          responseHistory={responseHistory}
          setAssignmentGrade={setAssignmentGrade}
          userID={userID}
        />
        <Alert severity="warning" className="padding-x-medium">
          ERROR: this short answer question has an undefined or unrecognized
          subtype - please contact your instructor
        </Alert>
      </>
    );

  return (
    <>
      <QuestionHeader
        assignmentGrade={assignmentGrade}
        assignmentID={assignmentID}
        assignmentInfo={assignmentInfo}
        courseID={courseID}
        currentQuestion={currentQuestion}
        instructorView={instructorView}
        isMultipart={isMultipart}
        partIndex={partIndex}
        responseHistory={responseHistory}
        setAssignmentGrade={setAssignmentGrade}
        userID={userID}
      />
      <Box minHeight="68%">
        <Prompt prompt={currentQuestion.prompt} />
        <Divider style={questionDividerB} />

        {subtype === "wordOrPhrase" && (
          <Box className="flex-justify-center padding-heavy">
            <Field
              name={textFieldname}
              as={SimpleTextField}
              disabled={disabled}
            />
          </Box>
        )}
        {subtype === "text" && (
          <Box className="flex-justify-center padding-heavy">
            <Field
              name={textFieldname}
              as={SimpleTextField}
              disabled={disabled}
            />
          </Box>
        )}
        {subtype === "mathematica list" && (
          <>
            <Box className="flex-justify-center padding-heavy">
              <Field
                name={textFieldname}
                as={ListInputField}
                disabled={disabled}
              />
            </Box>
            {!instructorView && <ListInputHelperText />}
          </>
        )}
        {subtype === "number" && (
          <Box className="flex-center-all">
            <Box minWidth="250px">
              <EquationEditor
                fieldname={numberFieldname}
                id={numberID}
                initVal={lastResponse?.number}
                key={numberID}
                label="number"
                question={currentQuestion}
                setFieldValue={setFieldValue}
              />
            </Box>
          </Box>
        )}
        {subtype === "measurement" && (
          <Box className="flex-center-all">
            <Box minWidth="250px">
              <EquationEditor
                fieldname={numberFieldname}
                id={numberID}
                initVal={lastResponse?.number}
                key={numberID}
                label="number"
                question={currentQuestion}
                setFieldValue={setFieldValue}
              />
            </Box>
            <Box width="20px" />
            <Box minWidth="250px">
              <EquationEditor
                fieldname={unitFieldname}
                id={unitID}
                initVal={lastResponse?.unit}
                key={unitID}
                label="unit"
                question={currentQuestion}
                setFieldValue={setFieldValue}
              />
            </Box>
          </Box>
        )}
        {subtype === "measurement with rule" && (
          <Box className="flex-center-all">
            <Box minWidth="250px">
              <EquationEditor
                fieldname={numberFieldname}
                id={numberID}
                initVal={lastResponse?.number}
                key={numberID}
                label="number"
                question={currentQuestion}
                setFieldValue={setFieldValue}
              />
            </Box>
            <Box width="20px" />
            <Box minWidth="250px">
              <EquationEditor
                fieldname={unitFieldname}
                id={unitID}
                initVal={lastResponse?.unit}
                key={unitID}
                label="unit"
                question={currentQuestion}
                setFieldValue={setFieldValue}
              />
            </Box>
          </Box>
        )}
        {subtype === "measurement with feedback" && (
          <Box className="flex-center-all">
            <Box minWidth="250px">
              <EquationEditor
                fieldname={numberFieldname}
                id={numberID}
                initVal={lastResponse?.number}
                key={numberID}
                label="number"
                question={currentQuestion}
                setFieldValue={setFieldValue}
              />
            </Box>
            <Box width="20px" />
            <Box minWidth="250px">
              <EquationEditor
                fieldname={unitFieldname}
                id={unitID}
                initVal={lastResponse?.unit}
                key={unitID}
                label="unit"
                question={currentQuestion}
                setFieldValue={setFieldValue}
              />
            </Box>
          </Box>
        )}
        {subtype === "vector" && (
          <>
            <Box className="flex-center-all">
              <Box minWidth="250px">
                <EquationEditor
                  fieldname={vectorFieldname}
                  id={vectorID}
                  initVal={lastResponse?.vector}
                  key={vectorID}
                  label="vector"
                  question={currentQuestion}
                  setFieldValue={setFieldValue}
                />
              </Box>
            </Box>
            {!instructorView && <VectorHelperText />}
          </>
        )}
        {subtype === "vector with unit" && (
          <>
            <Box className="flex-center-all">
              <Box minWidth="250px">
                <EquationEditor
                  fieldname={vectorFieldname}
                  id={vectorID}
                  initVal={lastResponse?.vector}
                  key={vectorID}
                  label="vector"
                  question={currentQuestion}
                  setFieldValue={setFieldValue}
                />
              </Box>
              <Box width="20px" />
              <Box minWidth="250px">
                <EquationEditor
                  fieldname={unitFieldname}
                  id={unitID}
                  initVal={lastResponse?.unit}
                  key={unitID}
                  label="unit"
                  question={currentQuestion}
                  setFieldValue={setFieldValue}
                />
              </Box>
            </Box>
            {!instructorView && <VectorHelperText />}
          </>
        )}
        {(subtype === "vector expr" || subtype === "vector symbolic") && (
          <>
            <Box className="flex-center-all">
              <Box minWidth="250px">
                <EquationEditor
                  fieldname={vectorExprFieldname}
                  id={vectorExprID}
                  initVal={lastResponse?.vectorExpr}
                  key={vectorExprID}
                  label="vector (expression)"
                  question={currentQuestion}
                  setFieldValue={setFieldValue}
                />
              </Box>
            </Box>
            {!instructorView && <VectorHelperText />}
          </>
        )}
        {(subtype === "expr" || subtype === "symbolic") && (
          <>
            <Box className="flex-center-all">
              <Box minWidth="250px">
                <EquationEditor
                  fieldname={exprFieldname}
                  id={exprID}
                  initVal={lastResponse?.expr}
                  key={exprID}
                  label="symbolic expression"
                  question={currentQuestion}
                  setFieldValue={setFieldValue}
                />
              </Box>
            </Box>
            {!instructorView && <ExpressionHelperText />}
          </>
        )}
        {subtype === "expr with rule" && (
          <>
            <Box className="flex-center-all">
              <Box minWidth="250px">
                <EquationEditor
                  fieldname={exprFieldname}
                  id={exprID}
                  initVal={lastResponse?.expr}
                  key={exprID}
                  label="symbolic expression"
                  question={currentQuestion}
                  setFieldValue={setFieldValue}
                />
              </Box>
              <Box width="20px" />
            </Box>
            {!instructorView && <ExpressionHelperText />}
          </>
        )}
        {subtype === "mathematica expression" && (
          <Box className="flex-justify-center padding-heavy">
            <Field
              name={exprFieldname}
              as={ExpressionInputField}
              disabled={disabled}
            />
          </Box>
        )}
        {subtype === "chemical formula" && (
          <>
            <Box className="flex-center-all">
              <Box minWidth="250px">
                <EquationEditor
                  fieldname={chemFormulaFieldname}
                  id={chemFormulaID}
                  initVal={lastResponse.chemFormula}
                  key={chemFormulaID}
                  label="chemical formula"
                  question={currentQuestion}
                  setFieldValue={setFieldValue}
                />
              </Box>
            </Box>
          </>
        )}
      </Box>

      <Box className="flex-column text-align-center submit-response">
        <AttemptsCounter
          assignmentInfo={assignmentInfo}
          currentQuestion={currentQuestion}
          responseHistory={responseHistory}
        />
        {studentView && (
          <SubmitResponseButton
            assignmentInfo={assignmentInfo}
            currentQuestion={currentQuestion}
            disabled={disabled}
            isMultipart={isMultipart}
            isSubmitting={isSubmitting}
            partIndex={partIndex}
            responseHistory={responseHistory}
            responseChanged={responseChanged}
            setSubmittedPart={setSubmittedPart}
          />
        )}
      </Box>
    </>
  );
}

export function VectorHelperText() {
  return (
    <Typography
      color="textSecondary"
      className="padding-horizontal-medium"
      style={{ textAlign: "center" }}
    >
      {`Please input your vector using curly brace notation: {3, 5, 8} `}
      <br />
      {` or unit vector notation: 3î+5ĵ+8 k̂`}
    </Typography>
  );
}

export function ExpressionHelperText() {
  return (
    <Typography
      color="textSecondary"
      className="padding-horizontal-medium"
      style={{ textAlign: "center" }}
    >
      {`variables must be separated by`} <br />
      {`a space`} <span style={{ textDecoration: "underline" }}>m a</span>
      {` or an asterisk `}
      <span style={{ textDecoration: "underline" }}>m*a</span>
    </Typography>
  );
}

export function ListInputHelperText() {
  return (
    <Typography
      color="textSecondary"
      className="padding-horizontal-medium"
      style={{ textAlign: "center" }}
    >
      {`Please input a list of elements enclosed in curly braces: {a, b, c, ...}`}
    </Typography>
  );
}

export function FreeResponse({
  assignmentGrade,
  assignmentID,
  assignmentInfo,
  courseID,
  currentQuestion,
  instructorView,
  isMultipart,
  isSubmitting,
  partIndex,
  pastDue,
  responseHistory,
  setAssignmentGrade,
  setSubmittedPart,
  userID,
  values,
}) {
  const studentView = !instructorView;
  const lastSaved = extractDate(responseHistory?.lastTimestamp?.toDate());
  const lastResponse = responseHistory?.lastResponse || "";
  const characterlimit = currentQuestion.characterLimit;

  const multipartValues = values?.parts ? values?.parts[partIndex] : null;

  const charactersUsed = isMultipart
    ? multipartValues?.response?.length || 0
    : values?.response?.length || 0;

  const charactersRemaining = characterlimit - charactersUsed;

  const disabled =
    instructorView ||
    (pastDue && !assignmentInfo?.dueDateExceededPenaltyPercentage);

  const currentResponse = isMultipart
    ? multipartValues?.response || ""
    : values?.response || "";

  const responseChanged = detectChange();

  function detectChange() {
    if (lastResponse === currentResponse) return false;
    else return true;
  }

  return (
    <>
      <QuestionHeader
        assignmentGrade={assignmentGrade}
        assignmentID={assignmentID}
        assignmentInfo={assignmentInfo}
        courseID={courseID}
        currentQuestion={currentQuestion}
        instructorView={instructorView}
        isMultipart={isMultipart}
        partIndex={partIndex}
        responseHistory={responseHistory}
        setAssignmentGrade={setAssignmentGrade}
        userID={userID}
      />
      <Box minHeight="74%">
        <Prompt prompt={currentQuestion.prompt} />
        <Divider style={questionDividerB} />
        {!instructorView && (
          <Box width="90%" className="margin-auto">
            <Field
              name={isMultipart ? `parts.${partIndex}.response` : "response"}
              as={FreeResponseField}
              disabled={disabled}
              characterlimit={characterlimit}
            />
            <Typography className="padding-vertical-light" align="right">
              {`characters remaining: ${charactersRemaining} / ${characterlimit}`}
            </Typography>
            {lastSaved && (
              <Typography align="right">last saved: {lastSaved}</Typography>
            )}
            {!lastSaved && (
              <Typography align="right" color="textSecondary">
                (no response saved)
              </Typography>
            )}
          </Box>
        )}

        {instructorView && (
          <Box padding="15px">
            {lastResponse ? (
              <Typography>{lastResponse}</Typography>
            ) : (
              <Typography color="textSecondary">
                (no response submitted)
              </Typography>
            )}
          </Box>
        )}
      </Box>
      {studentView && (
        <Box className="submit-response">
          <SaveFreeformResponseButton
            isMultipart={isMultipart}
            isSubmitting={isSubmitting}
            disabled={disabled}
            partIndex={partIndex}
            responseHistory={responseHistory}
            responseChanged={responseChanged}
            setSubmittedPart={setSubmittedPart}
            values={values}
          />
        </Box>
      )}
    </>
  );
}

export function TitleCard({ currentQuestion }) {
  return (
    <>
      <Title title={currentQuestion.title} />
      <Body body={currentQuestion.body} />
    </>
  );
}

export function Upload({
  assignmentGrade,
  assignmentID,
  collection,
  courseID,
  currentQuestion,
  instructorView,
  isMultipart,
  partIndex,
  pastDue,
  questionSet,
  responseHistory,
  setAssignmentGrade,
  userID,
}) {
  // no support yet for multipart
  const [file, setFile] = useState(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const acceptedFileTypes = currentQuestion?.accept;
  const [url, setUrl] = useState("");

  const studentView = !instructorView;
  const lastUpload = responseHistory?.lastUpload;
  const upload_key = isMultipart
    ? `${currentQuestion.id}_${alphabet[partIndex]}_upload`
    : `${currentQuestion.id}_upload`;

  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const openImagePreview = () => {
    setPreviewImageOpen(true);
  };
  const closeImagePreview = () => {
    setPreviewImageOpen(false);
  };

  const [previewPDFOpen, setPreviewPDFOpen] = useState(false);
  const openPDFPreview = () => {
    setPreviewPDFOpen(true);
  };
  const closePDFPreview = () => {
    setPreviewPDFOpen(false);
  };

  const handleSelectFile = (e) => {
    let selected = e.target.files[0];
    if (selected && acceptedFileTypes.includes(selected.type)) {
      setFile(selected);
      setError(false);
      setErrorMessage("");
    } else {
      setFile(null);
      setError(true);
      setErrorMessage("The file type is not accepted");
    }
  };

  const uploadRef =
    collection === "my_responses"
      ? firebase
          .firestore()
          .collection("user_questions")
          .doc(userID)
          .collection("my_responses")
          .doc(questionSet.id)
      : firebase
          .firestore()
          .collection("courses")
          .doc(courseID)
          .collection("assignments")
          .doc(assignmentID)
          .collection("results")
          .doc(userID);

  async function deleteUpload() {
    const uploadStorageRef =
      collection === "my_responses"
        ? firebase
            .storage()
            .ref()
            .child(`users/${userID}/questionSetUploads/${lastUpload.name}`)
        : firebase
            .storage()
            .ref()
            .child(
              `courses/${courseID}/student_uploads/${assignmentID}/${lastUpload.name}`
            );

    try {
      await uploadStorageRef.delete();
    } catch (error) {
      console.log("an error -unable to delete the image");
    }

    try {
      await uploadRef.update({
        [upload_key]: firebase.firestore.FieldValue.delete(),
      });
    } catch (error) {
      console.log("an error occurred - unable to delete the image");
    }
  }

  return (
    <>
      <PreviewImage
        open={previewImageOpen}
        handleOpen={openImagePreview}
        handleClose={closeImagePreview}
        url={url}
      />
      <PreviewPDF
        open={previewPDFOpen}
        handleOpen={openPDFPreview}
        handleClose={closePDFPreview}
        url={url}
      />
      <QuestionHeader
        assignmentGrade={assignmentGrade}
        assignmentID={assignmentID}
        courseID={courseID}
        currentQuestion={currentQuestion}
        instructorView={instructorView}
        isMultipart={isMultipart}
        partIndex={partIndex}
        responseHistory={responseHistory}
        setAssignmentGrade={setAssignmentGrade}
        userID={userID}
      />
      <Box minHeight="74%">
        <Prompt prompt={currentQuestion.prompt} />
        <Divider style={questionDividerB} />
        {lastUpload && (
          <Box height="200px" className="flex-center-all row">
            <Box className="flex-column" style={{ marginRight: "50px" }}>
              <Link
                variant="subtitle1"
                className="hover-pointer"
                onClick={() => {
                  if (
                    lastUpload.type === "image/png" ||
                    lastUpload.type === "image/jpeg"
                  ) {
                    setUrl(lastUpload.url);
                    openImagePreview();
                  }
                  if (lastUpload.type === "application/pdf") {
                    setUrl(lastUpload.url);
                    openPDFPreview();
                  }
                }}
              >
                {lastUpload.name}
              </Link>

              <Typography variant="subtitle2" color="textSecondary">
                uploaded {extractDate(lastUpload.uploaded.toDate())}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                size: {(lastUpload.size / 1000000).toFixed(2)} MB
              </Typography>
            </Box>
            {studentView && (
              <Box>
                <IconButton align="top">
                  <Delete onClick={() => deleteUpload()} />
                </IconButton>
              </Box>
            )}
          </Box>
        )}
        {!lastUpload && (
          <Box className="flex-center-all column full-width padding-top-medium">
            <Typography color="textSecondary" style={{ margin: "20px" }}>
              (no file uploaded)
            </Typography>
            {studentView && (
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUpload />}
                disabled={pastDue}
              >
                Upload
                <input type="file" hidden onChange={handleSelectFile} />
              </Button>
            )}

            <Box padding={1}>
              {error && <Alert severity="warning">{errorMessage}</Alert>}
              {file && <Typography>{file.name}</Typography>}
              {file && (
                <FileUpload
                  category="questionSetUpload"
                  file={file}
                  setFile={setFile}
                  storagePath={
                    collection === "my_responses"
                      ? `users/${userID}/questionSetUploads/${file.name}`
                      : `courses/${courseID}/student_uploads/${assignmentID}/${file.name}`
                  }
                  firestoreRef={uploadRef}
                  upload_key={upload_key}
                />
              )}
            </Box>
            <Typography variant="subtitle2" color="textSecondary">
              accepted file types: {makeReadable(acceptedFileTypes)}
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
}

export function InfoCard({ currentQuestion, isMultipart, partIndex }) {
  return (
    <>
      <QuestionHeader
        currentQuestion={currentQuestion}
        isMultipart={isMultipart}
        partIndex={partIndex}
      />
      <Info info={currentQuestion.info} />
    </>
  );
}

export function MultipartHeader({ currentQuestion }) {
  return (
    <Box className="padding-medium" style={{ marginBottom: "60px" }}>
      <Typography> {parseHTMLandTeX(currentQuestion.header)}</Typography>
    </Box>
  );
}

function PartLabel({ partIndex }) {
  return (
    <Typography
      display="inline"
      variant="h6"
      style={{ marginLeft: "10px", marginRight: "25px" }}
    >{`PART ${alphabet[partIndex]}`}</Typography>
  );
}

function Prompt({ prompt }) {
  return (
    <Box minHeight="20%" className="padding-horizontal-medium">
      <Typography>{parseHTMLandTeX(prompt)}</Typography>
    </Box>
  );
}

function Title({ title }) {
  return (
    <Box height="30%" className="padding-top-heavy text-align-center">
      <Typography variant="h5">{title}</Typography>
    </Box>
  );
}

function Body({ body }) {
  return (
    <Box height="50%" className="text-align-center">
      <Typography>{parseHTMLandTeX(body)}</Typography>
    </Box>
  );
}

function Info({ info }) {
  return (
    <Box height="50%" className="padding-horizontal-medium">
      <Typography>{parseHTMLandTeX(info)}</Typography>
    </Box>
  );
}

function AttemptsCounter({ assignmentInfo, currentQuestion, responseHistory }) {
  const attemptsAllowed = currentQuestion.attemptsAllowed || 1;
  const attemptsUsed = responseHistory?.attemptsUsed || 0;
  const attemptsHistory = responseHistory?.responses;

  if (assignmentInfo?.unlimitedAttempts) return null;
  return (
    <>
      <Typography
        variant="subtitle1"
        color="textSecondary"
        className="flex-center-all"
      >
        {attemptsUsed} of {attemptsAllowed} attempts
        {currentQuestion.type !== "multiple choice" && attemptsUsed > 1 && (
          <Tooltip
            placement="left"
            title={getAttemptsHistoryTooltipText(
              attemptsHistory,
              currentQuestion?.subtype
            )}
          >
            <InfoIcon
              color="primary"
              style={{ marginLeft: "2px" }}
              fontSize="small"
            ></InfoIcon>
          </Tooltip>
        )}
      </Typography>
    </>
  );
}

function getAttemptsHistoryTooltipText(attemptsHistory, questionSubType) {
  if (!attemptsHistory) return null;
  return (
    <Box>
      {attemptsHistory.map((attempt, index) => {
        const attemptAnswer = extractAnswer(attempt, questionSubType);
        return (
          <Box key={index}>
            <Typography variant="subtitle2">
              {attempt?.expr || attemptAnswer}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function extractAnswer(attempt, questionSubType) {
  switch (questionSubType) {
    case "number":
      return attempt?.number;
    case "expression":
      return attempt?.expr;
    case "vector":
      return attempt?.vector;
    case "measurement":
    case "measurement with rule":
    case "measurement with feedback":
      return `${attempt?.number} ${attempt?.unit}`;
    case "expr":
    case "expr with rule":
      return attempt?.expr;
    case "mathematica expression":
      return attempt?.expr || attempt;
    case "mathematica list":
      return attempt?.text || attempt;
    case "vector with unit":
      return `${attempt?.vector} ${attempt?.unit}`;
    case "vector expr":
      return attempt?.vectorExpr;
    default:
      return null;
  }
}

function QuestionHeader({
  assignmentGrade,
  assignmentID,
  assignmentInfo,
  courseID,
  currentQuestion,
  instructorView,
  isMultipart,
  partIndex,
  responseHistory,
  setAssignmentGrade,
  userID,
}) {
  const answeredCorrectly = responseHistory?.answeredCorrectly || false;
  const hideCorrectStatus = assignmentInfo?.hideCorrectStatus || false;
  const pendingReview =
    assignmentGrade?.pendingFreeResponseReview?.length > 0 &&
    currentQuestion.type === "free response" &&
    assignmentGrade?.pendingFreeResponseReview.includes(currentQuestion.id);

  return (
    <Box
      className="flex space-between align-center padding-bottom-light"
      style={{
        marginLeft: "20px",
        marginRight: "20px",
        marginBottom: "20px",
      }}
    >
      <Box>
        {isMultipart && <PartLabel partIndex={partIndex} />}
        <Typography display="inline" variant="subtitle2" color="textSecondary">
          {currentQuestion.type}
        </Typography>
      </Box>
      <Typography color="textSecondary">
        {process.env.REACT_APP_WEBSITE_URL === "koral-development.community" &&
          currentQuestion?.id}
      </Typography>
      <Box className="flex align-center">
        {responseHistory?.attemptsUsed > 0 && !hideCorrectStatus && (
          <CorrectStatus
            answeredCorrectly={answeredCorrectly}
            isMultipart={isMultipart}
          />
        )}

        {!hideCorrectStatus && (
          <PointsDisplay
            assignmentGrade={assignmentGrade}
            assignmentID={assignmentID}
            courseID={courseID}
            currentQuestion={currentQuestion}
            instructorView={instructorView}
            isMultipart={isMultipart}
            partIndex={partIndex}
            responseHistory={responseHistory}
            setAssignmentGrade={setAssignmentGrade}
            userID={userID}
          />
        )}
        {pendingReview && (
          <Typography
            variant="subtitle2"
            color="primary"
            style={{ marginLeft: "5px" }}
          >
            (Pending Review)
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function CorrectStatus({ answeredCorrectly }) {
  return (
    <Box>
      {answeredCorrectly === true && (
        <Typography
          variant="subtitle2"
          className="flex align-center"
          color="primary"
        >
          <Star />
          CORRECT
        </Typography>
      )}

      {answeredCorrectly === false && (
        <Typography
          variant="subtitle2"
          className="flex align-center"
          style={{ color: "#E2973C" }}
        >
          <StarBorder />
          INCORRECT
        </Typography>
      )}

      {answeredCorrectly === "partial" && (
        <Typography
          variant="subtitle2"
          className="flex align-center"
          style={{ color: "#E2973C" }}
        >
          <StarHalf />
          PARTIAL
        </Typography>
      )}
    </Box>
  );
}

function PointsDisplay({
  assignmentGrade,
  assignmentID,
  courseID,
  currentQuestion,
  instructorView,
  isMultipart,
  partIndex,
  responseHistory,
  setAssignmentGrade,
  userID,
}) {
  const currentQuestionID = isMultipart
    ? `${currentQuestion.id}_${alphabet[partIndex]}`
    : currentQuestion.id;
  const possiblePoints = currentQuestion.possiblePoints;
  const earnedPoints = responseHistory?.earnedPoints || 0;
  const [points, setPoints] = useState(earnedPoints);

  const submissionHistoryRef = firebase
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("assignments")
    .doc(assignmentID)
    .collection("results")
    .doc(userID);

  const gradeSummaryRef = firebase
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("grade_summaries")
    .doc(userID);

  const changePoints = (event) => {
    setPoints(Number(event.target.value));
  };

  useEffect(() => setPoints(earnedPoints), [earnedPoints]);

  if (currentQuestion.type === "info card") return null;

  function countTotalEarnedPoints(updatedSubmissionHistory) {
    if (!updatedSubmissionHistory) return 0;
    const propertiesArr = Object.keys(updatedSubmissionHistory);
    const earnedPointsKeys = propertiesArr.filter(
      (el) => el.slice(-12) === "earnedPoints"
    );
    const earnedPointsArr = [];
    earnedPointsKeys.forEach((key) =>
      earnedPointsArr.push(updatedSubmissionHistory[key])
    );
    const totalEarnedPoints = earnedPointsArr.reduce((acc, cur) => acc + cur);
    return totalEarnedPoints;
  }

  async function updatePoints(assignmentID, currentQuestion) {
    const earnedPointsKey = isMultipart
      ? `${currentQuestion.id}_${alphabet[partIndex]}_earnedPoints`
      : `${currentQuestion.id}_earnedPoints`;

    await submissionHistoryRef.update({
      [earnedPointsKey]: points,
    });

    let submissionHistory = await submissionHistoryRef.get();
    const newTotalEarnedPoints = countTotalEarnedPoints(
      submissionHistory.data()
    );

    await submissionHistoryRef.update({
      totalEarnedPoints: newTotalEarnedPoints,
    });

    await updateGradeSummary(
      assignmentGrade?.pendingFreeResponseReview,
      currentQuestionID,
      points,
      newTotalEarnedPoints
    );

    if (currentQuestion.type === "free response") {
      await removePendingFreeResponseReview(assignmentID, currentQuestion.id);
    }

    let currentAssignmentGrade = await gradeSummaryRef.get();
    if (currentAssignmentGrade.exists) {
      setAssignmentGrade(() => currentAssignmentGrade.data()[assignmentID]);
    }
  }

  async function removePendingFreeResponseReview(assignmentID, questionID) {
    const gradeSummaryRef = firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("grade_summaries")
      .doc(userID);

    await gradeSummaryRef.update({
      [assignmentID + ".pendingFreeResponseReview"]:
        firebase.firestore.FieldValue.arrayRemove(questionID),
    });
  }

  async function updateGradeSummary(
    pendingFreeResponseReview,
    currentQuestionID,
    points,
    newTotalEarnedPoints
  ) {
    const newAssignmentGrade = {
      assignmentType: "question set",
      totalEarnedPoints: newTotalEarnedPoints,
      totalPossiblePoints: assignmentGrade.totalPossiblePoints,
      pendingFreeResponseReview: pendingFreeResponseReview
        ? pendingFreeResponseReview
        : [],
      pointAdjustment: assignmentGrade?.pointAdjustment
        ? assignmentGrade.pointAdjustment
        : 0,
      pointAdjustmentForSpecificQuestions:
        addCurrentQuestionToSpecificQuestionAdjustmentsArray(
          currentQuestionID,
          points
        ),
    };

    setAssignmentGrade(() => newAssignmentGrade);
    await gradeSummaryRef.update(
      { [assignmentID]: newAssignmentGrade },
      { merge: true }
    );
  }

  function addCurrentQuestionToSpecificQuestionAdjustmentsArray(
    currentQuestionID,
    points
  ) {
    const pointAdjustmentForSpecificQuestions =
      assignmentGrade?.pointAdjustmentForSpecificQuestions || [];
    const questionIDs = pointAdjustmentForSpecificQuestions.map(
      (el) => el.questionID
    );

    if (questionIDs.includes(currentQuestionID)) {
      return pointAdjustmentForSpecificQuestions;
    }

    const newPointAdjustmentForSpecificQuestions = [
      ...pointAdjustmentForSpecificQuestions,
      { questionID: currentQuestionID, points: points },
    ];

    return newPointAdjustmentForSpecificQuestions;
  }

  return instructorView ? (
    <span className="flex align-center" style={{ marginLeft: "10px" }}>
      <TextField
        variant="outlined"
        type="number"
        value={points}
        onChange={changePoints}
        inputProps={{ min: 0, style: { padding: 4, textAlign: "center" } }}
        style={{ width: "45px" }}
      />
      <Typography
        variant="subtitle1"
        color="textSecondary"
        style={{ marginLeft: "5px", marginRight: "20px" }}
      >
        {` / ${possiblePoints} points`}{" "}
        {assignmentGrade?.pointAdjustmentForSpecificQuestions?.some(
          (el) => el.questionID === currentQuestionID
        ) ? (
          <Tooltip
            placement="top"
            title={`This question's score has been adjusted ${points} point(s) by the instructor.`}
          >
            <InfoIcon
              color="primary"
              style={{ marginLeft: "5px", height: "20px", width: "20px" }}
            ></InfoIcon>
          </Tooltip>
        ) : null}
      </Typography>

      <Button
        disabled={
          points === earnedPoints && currentQuestion.type !== "free response"
        }
        variant="contained"
        color="primary"
        onClick={() => {
          updatePoints(assignmentID, currentQuestion);
        }}
      >
        UPDATE
      </Button>
    </span>
  ) : (
    <Typography
      variant="subtitle2"
      color="textSecondary"
      style={{ marginLeft: "10px" }}
    >
      {`${earnedPoints} / ${possiblePoints} points`}
      {assignmentGrade?.pointAdjustmentForSpecificQuestions?.some(
        (el) => el.questionID === currentQuestionID
      ) ? (
        <Tooltip
          placement="top"
          title={`This question's score has been adjusted ${points} point(s) by the instructor.`}
        >
          <InfoIcon
            color="primary"
            style={{ marginLeft: "5px", height: "20px", width: "20px" }}
          ></InfoIcon>
        </Tooltip>
      ) : null}
    </Typography>
  );
}

function SubmitResponseButton({
  disabled,
  isMultipart,
  isSubmitting,
  partIndex,
  responseChanged,
  setSubmittedPart,
}) {
  return (
    <Box className="flex align-center">
      <Button
        fullWidth
        style={{ marginTop: "5px" }}
        type="submit"
        variant="contained"
        color="primary"
        disabled={disabled || !responseChanged || isSubmitting}
        onClick={() => {
          if (isMultipart) setSubmittedPart(partIndex);
        }}
      >
        {isSubmitting ? <CircularProgress size={25} /> : "Submit"}
      </Button>
    </Box>
  );
}

function SaveFreeformResponseButton({
  disabled,
  isMultipart,
  isSubmitting,
  partIndex,
  responseChanged,
  setSubmittedPart,
}) {
  return (
    <Button
      fullWidth
      type="submit"
      style={{ marginTop: "5px" }}
      variant="contained"
      color="primary"
      disabled={disabled || !responseChanged}
      onClick={() => {
        if (isMultipart) setSubmittedPart(partIndex);
      }}
    >
      {isSubmitting ? <CircularProgress size={25} /> : "Save"}
    </Button>
  );
}
