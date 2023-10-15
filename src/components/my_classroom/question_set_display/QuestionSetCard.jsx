import React, { useState, useEffect } from "react";
import {
  Backdrop,
  Box,
  Button,
  Card,
  CircularProgress,
  Fade,
  Link,
  Modal,
  Typography,
} from "@material-ui/core";
import {
  ChevronLeft,
  ChevronRight,
  ReportProblemOutlined,
} from "@material-ui/icons";
import { Alert, Pagination } from "@material-ui/lab";
import { Field, Formik, Form } from "formik";
import {
  addReportProblem,
  fetchResponses,
  saveQuestionSetGradeSummary,
  saveResponse,
  updateAssignmentFirstResultSubmitted,
} from "../../../app/firestoreClient.js";
import {
  MultipleChoice,
  ShortAnswer,
  FreeResponse,
  TitleCard,
  Upload,
  InfoCard,
  MultipartHeader,
} from "./qSetDisplayCpnts.jsx";
import { pickInitialValues, tidyResponse } from "./qSetDisplayValues.js";
import { DescriptionField } from "../../../app/utils/CustomInputFields.jsx";
import { grade } from "./questionGrading.js";
import { alphabet, renderQuestionSnippet } from "../../../app/utils/utils.js";
import { generateEarnedPointsID } from "./qSetDisplayUtils";
import PreviewPDF from "../../preview_modals/PreviewPDF.jsx";
import firebase from "../../../app/config/firebaseConfig.js";

export default function QuestionSetCard({
  assignmentGrade,
  assignmentID,
  assignmentInfo,
  collection,
  courseID,
  courseTitle,
  instructorView,
  pastDue,
  questionSet,
  setAssignmentGrade,
  userEmail,
  userID,
  userDisplayName,
  updateModuleAssignment,
  selectedItemIndex,
  setActiveStep,
  activeStep,
  setInARowCount,
  inARowCount,
  currentSkill,
  setCurrentSkill,
  setCongratulationsModalOpen,
  incorrectCounter,
  setIncorrectCounter,
  setHelpfulResourceModalOpen,
  studentGradebook,
  setNoRemainingQuestionsModalOpen,
  reportAProblemQuestionID,
}) {
  const [qIndex, setQIndex] = useState(0);
  const [submittedPart, setSubmittedPart] = useState(-1);
  const [submissionHistory, setSubmissionHistory] = useState({});
  const [message, setMessage] = useState("");
  const [adaptiveAssignmentCompleted, setAdaptiveAssignmentCompleted] =
    useState(false);
  const currentQuestion = getCurrentQuestion(
    questionSet,
    qIndex,
    currentSkill,
    reportAProblemQuestionID
  );
  const questionID = currentQuestion?.id;

  function getCurrentQuestion(
    questionSet,
    qIndex,
    currentSkill = 0,
    reportAProblemQuestionID = null
  ) {
    if (reportAProblemQuestionID) {
      return questionSet?.questions?.find(
        (question) => question.id === reportAProblemQuestionID
      );
    }

    if (questionSet?.mode !== "adaptive") {
      return questionSet?.questions
        ? questionSet?.questions[qIndex]
        : undefined;
    }

    return questionSet?.questions.find(
      (question) =>
        question.id ===
        questionSet?.adaptiveParams?.skills[currentSkill]?.questionIDs[qIndex]
    );
  }

  // Currently checking for and replacing the following characters: ˆ
  function replaceInternationalCharacters(submittedResponse) {
    if (typeof submittedResponse === "string") {
      return submittedResponse.replace(/ˆ/g, "^");
    }

    for (const key in submittedResponse) {
      if (submittedResponse.hasOwnProperty(key)) {
        const element = submittedResponse[key];
        if (typeof element === "string") {
          submittedResponse[key] = element.replace(/ˆ/g, "^");
        }
      }
    }
    return submittedResponse;
  }

  const questionProps = {
    assignmentGrade: assignmentGrade,
    assignmentID: assignmentID,
    assignmentInfo: assignmentInfo,
    courseID: courseID,
    instructorView: instructorView,
    pastDue: pastDue,
    setAssignmentGrade: setAssignmentGrade,
    submissionHistory: submissionHistory,
    userID: userID,
  };

  useEffect(() => {
    setQIndex(0);
    const unsubscribe = fetchResponses(
      collection,
      courseID,
      assignmentID,
      userID,
      questionSet.id,
      setSubmissionHistory
    );
    return unsubscribe;
    // eslint-disable-next-line
  }, [questionSet]);

  function getCurrentSkill(currentActiveStep, skills) {
    let currentSkill = 0;
    let skillAccumulator = 0;

    if (currentActiveStep === 0) {
      return currentSkill;
    }

    for (let i = 0; i < skills.length; i++) {
      currentActiveStep >= skills[i].completeValue + skillAccumulator
        ? (currentSkill = i)
        : (skillAccumulator += skills[i].completeValue);
    }

    return currentSkill;
  }

  function unitIsInvalid(studentUnit, correctUnit) {
    let unitmessage = "";

    const ustrSub = {
      V: "(kg)*m^2/(s^3 *A)",
      C: "(s*A)",
      N: "(kg)*m/s^2",
      W: "(kg) m^2/s^3",
      J: "(kg) m^2/s^2",
      Hz: "1/s",
      T: "kg/(s^2*A)",
      Kg: "(kg)",
      sec: "s",
      Sec: "s",
      meter: "m",
      Pa: "(kg)/(m*s^2)",
      Ohm: "kg m^2/(s^3 A^2)",
      "[CapitalOmega]": "kg m^2/(s^3 A^2)",
      "\\[CapitalOmega]": "kg m^2/(s^3 A^2)",
    };

    if (studentUnit in ustrSub) {
      studentUnit = ustrSub[studentUnit];
    }

    if (correctUnit in ustrSub) {
      correctUnit = ustrSub[correctUnit];
    }

    unitmessage =
      studentUnit === correctUnit
        ? false
        : "Units are incorrect or in nonstandard form. Please check your units";

    return unitmessage;
  }

  function hasCurrentSkillObjectiveBeenCompleted(
    responseGrade,
    submissionHistory,
    questionSet,
    inARowCount,
    currentSkill,
    setCurrentSkill
  ) {
    if (
      responseGrade.answeredCorrectly === false &&
      questionSet?.adaptiveParams?.completeRule !== "inARow"
    ) {
      return false;
    }

    switch (questionSet?.adaptiveParams?.completeRule) {
      case "totalCorrect": {
        if (
          currentSkillTotalCorrectCompleted(
            responseGrade,
            submissionHistory,
            questionSet,
            currentSkill
          )
        ) {
          setCurrentSkill(() => {
            return currentSkill < questionSet?.adaptiveParams?.skills.length - 1
              ? currentSkill + 1
              : currentSkill;
          });
          return true;
        }

        return false;
      }
      case "inARow": {
        if (
          inARowCount + 1 >=
          questionSet?.adaptiveParams?.skills[currentSkill].completeValue
        ) {
          setCurrentSkill(() => {
            return currentSkill < questionSet?.adaptiveParams?.skills.length - 1
              ? currentSkill + 1
              : currentSkill;
          });
          setInARowCount(() => 0);
          return true;
        }

        setInARowCount(() => inARowCount + 1);
        return false;
      }
      default:
        break;
    }

    return false;
  }

  return (
    <Formik
      enableReinitialize={true}
      initialValues={pickInitialValues(currentQuestion, submissionHistory)}
      onSubmit={async (values, { setSubmitting }) => {
        setSubmitting(true);

        let submittedQuestion = getSubmittedQuestion();
        let submittedResponse = getSubmittedResponse(values);

        submittedResponse = replaceInternationalCharacters(submittedResponse);

        if (
          submittedQuestion?.subtype === "measurement with feedback" &&
          unitIsInvalid(
            submittedResponse?.unit,
            submittedQuestion?.correctAnswer?.unit
          )
        ) {
          setMessage(
            "Units are incorrect or in nonstandard form. Please check your units"
          );
          return;
        } else {
          setMessage("");
        }

        const responseGrade = await grade(
          submittedQuestion,
          submittedResponse,
          userID,
          questionSet.totalPossiblePoints
        );

        const tidiedResponse = tidyResponse(
          submittedPart,
          submittedQuestion,
          submittedResponse,
          responseGrade,
          submissionHistory,
          questionSet
        );

        if (questionSet?.mode === "adaptive") {
          processAdaptiveQuestions(
            tidiedResponse,
            responseGrade,
            currentSkill,
            questionSet,
            incorrectCounter,
            setIncorrectCounter,
            setHelpfulResourceModalOpen,
            submittedPart
          );
        }

        saveResponse(
          tidiedResponse,
          courseID,
          assignmentID,
          userID,
          questionSet.id,
          collection
        );

        saveQuestionSetGradeSummary(
          tidiedResponse,
          courseID,
          assignmentID,
          userID,
          userDisplayName,
          submittedQuestion,
          pastDue,
          assignmentInfo?.dueDateExceededPenaltyPercentage
        );

        //Used as an attribute to prevent instructors from removing modules/assignments that have already begun.
        if (assignmentInfo?.firstResultSubmitted == null) {
          updateAssignmentFirstResultSubmitted(courseID, assignmentID);
          assignmentInfo.firstResultSubmitted = Date(Date.now());
          updateModuleAssignment(assignmentInfo, selectedItemIndex);
        }

        setSubmittedPart(-1);
        setSubmitting(false);
      }}
    >
      {({ values, isSubmitting, setFieldValue, resetForm }) => (
        <Form autoComplete="off">
          {pastDue && (
            <Box
              className={
                assignmentInfo?.dueDateExceededPenaltyPercentage
                  ? "padding-light past-due-penalty"
                  : "padding-light past-due"
              }
            >
              <Typography>The assignment due date has passed.</Typography>
              {assignmentInfo?.dueDateExceededPenaltyPercentage && (
                <Typography>
                  You will be penalized{" "}
                  {assignmentInfo?.dueDateExceededPenaltyPercentage}% of the
                  total points for this assignment.
                </Typography>
              )}
            </Box>
          )}
          <Card
            className="question-set-display-card margin-auto relative"
            style={{ overflow: "auto" }}
          >
            {currentQuestion?.type === "multiple choice" && (
              <MultipleChoice
                currentQuestion={currentQuestion}
                isSubmitting={isSubmitting}
                responseHistory={getResponseHistory(questionID, -1)}
                values={values}
                {...questionProps}
              />
            )}
            {currentQuestion?.type === "short answer" && (
              <>
                {message?.length > 0 && (
                  <Alert severity="error" style={{ marginTop: "-15px" }}>
                    {message}
                  </Alert>
                )}
                <ShortAnswer
                  currentQuestion={currentQuestion}
                  isSubmitting={isSubmitting}
                  responseHistory={getResponseHistory(questionID, -1)}
                  setFieldValue={setFieldValue}
                  values={values}
                  {...questionProps}
                />
              </>
            )}
            {currentQuestion?.type === "free response" && (
              <FreeResponse
                currentQuestion={currentQuestion}
                isSubmitting={isSubmitting}
                responseHistory={getResponseHistory(questionID, -1)}
                values={values}
                {...questionProps}
              />
            )}
            {currentQuestion?.type === "title card" && (
              <TitleCard currentQuestion={currentQuestion} />
            )}
            {currentQuestion?.type === "file upload" && (
              <Upload
                collection={collection}
                currentQuestion={currentQuestion}
                questionSet={questionSet}
                responseHistory={getResponseHistory(questionID, -1)}
                {...questionProps}
              />
            )}
            {currentQuestion?.type === "multipart" &&
              currentQuestion.header && (
                <MultipartHeader currentQuestion={currentQuestion} />
              )}
            {currentQuestion?.type === "multipart" &&
              currentQuestion.parts.map((question, partIndex) => (
                <Box key={partIndex} style={{ paddingBottom: "120px" }}>
                  {question.type === "multiple choice" && (
                    <MultipleChoice
                      currentQuestion={{
                        id: currentQuestion.id,
                        ...question,
                      }}
                      isSubmitting={isSubmitting}
                      isMultipart
                      partIndex={partIndex}
                      responseHistory={getResponseHistory(
                        questionID,
                        partIndex
                      )}
                      setSubmittedPart={setSubmittedPart}
                      values={values}
                      {...questionProps}
                    />
                  )}
                  {question.type === "short answer" && (
                    <ShortAnswer
                      currentQuestion={{
                        id: currentQuestion.id,
                        ...question,
                      }}
                      isMultipart
                      isSubmitting={isSubmitting}
                      partIndex={partIndex}
                      responseHistory={getResponseHistory(
                        questionID,
                        partIndex
                      )}
                      setFieldValue={setFieldValue}
                      setSubmittedPart={setSubmittedPart}
                      values={values}
                      {...questionProps}
                    />
                  )}
                  {question.type === "free response" && (
                    <FreeResponse
                      currentQuestion={{
                        id: currentQuestion.id,
                        ...question,
                      }}
                      isMultipart
                      isSubmitting={isSubmitting}
                      partIndex={partIndex}
                      responseHistory={getResponseHistory(
                        questionID,
                        partIndex
                      )}
                      setSubmittedPart={setSubmittedPart}
                      values={values}
                      {...questionProps}
                    />
                  )}
                  {question.type === "info card" && (
                    <InfoCard
                      currentQuestion={question}
                      isMultipart
                      partIndex={partIndex}
                    />
                  )}
                  {question.type === "file upload" && (
                    <Upload
                      collection={collection}
                      currentQuestion={{
                        id: currentQuestion.id,
                        ...question,
                      }}
                      questionSet={questionSet}
                      isMultipart={true}
                      partIndex={partIndex}
                      responseHistory={getResponseHistory(
                        questionID,
                        partIndex
                      )}
                      {...questionProps}
                    />
                  )}
                </Box>
              ))}

            {currentQuestion?.type === "multipart" ? (
              <SolutionViewerMultipart
                assignmentInfo={assignmentInfo}
                currentQuestion={currentQuestion}
                getResponseHistory={getResponseHistory}
                pastDue={pastDue}
              />
            ) : (
              <SolutionViewer
                assignmentInfo={assignmentInfo}
                currentQuestion={currentQuestion}
                getResponseHistory={getResponseHistory}
                pastDue={pastDue}
              />
            )}
            <ReportAProblem
              assignmentInfo={assignmentInfo}
              courseID={courseID}
              courseTitle={courseTitle}
              currentQuestion={currentQuestion}
              getResponseHistory={getResponseHistory}
              userEmail={userEmail}
              userID={userID}
              userDisplayName={userDisplayName}
            />
            {process.env.REACT_APP_WEBSITE_URL ===
              "koral-development.community" && (
              <pre>{JSON.stringify(values, null, 2)}</pre>
            )}
          </Card>
          {!reportAProblemQuestionID && (
            <QuestionNavigator
              qIndex={qIndex}
              questionSet={questionSet}
              resetForm={resetForm}
              setQIndex={setQIndex}
              submissionHistory={submissionHistory}
              currentQuestion={currentQuestion}
              currentSkill={currentSkill}
              setCurrentSkill={setCurrentSkill}
              instructorView={instructorView}
              studentGradebook={studentGradebook}
              setNoRemainingQuestionsModalOpen={
                setNoRemainingQuestionsModalOpen
              }
              setMessage={setMessage}
            />
          )}
        </Form>
      )}
    </Formik>
  );

  function generateTotalEarnedPointsForSkill(tidiedResponse, responseGrade) {
    if (!submissionHistory) {
      return responseGrade.earnedPoints;
    }

    return "totalEarnedPointsForSkill_" + currentSkill in submissionHistory
      ? submissionHistory["totalEarnedPointsForSkill_" + currentSkill] +
          responseGrade.earnedPoints
      : responseGrade.earnedPoints;
  }

  function generateTotalPossiblePointsForSkill(
    currentQuestionID,
    questionSet,
    submittedPart
  ) {
    if (!submissionHistory) {
      if (submittedPart >= 0) {
        return questionSet.questions.find(
          (question) => question.id === currentQuestionID
        ).parts[submittedPart].possiblePoints;
      }

      return questionSet.questions.find(
        (question) => question.id === currentQuestionID
      ).possiblePoints;
    }

    let currentQuestionPossiblePoints = questionSet.questions.find(
      (question) => question.id === currentQuestionID
    ).possiblePoints;

    return "totalPossiblePointsForSkill_" + currentSkill in submissionHistory
      ? submissionHistory["totalPossiblePointsForSkill_" + currentSkill] +
          currentQuestionPossiblePoints
      : currentQuestionPossiblePoints;
  }

  function processAdaptiveQuestions(
    tidiedResponse,
    responseGrade,
    currentSkill,
    questionSet,
    incorrectCounter,
    setIncorrectCounter,
    setHelpfulResourceModalOpen,
    submittedPart
  ) {
    const NUMBER_OF_INCORRECT_ANSWERS_NEEDED_FOR_HELPFUL_RESOURCE = 2;

    tidiedResponse.mode = "adaptive";

    tidiedResponse.adaptiveSubmittedQuestionIDs =
      getAdaptiveSubmittedQuestionIDs(submissionHistory, questionID);

    tidiedResponse["totalEarnedPointsForSkill_" + currentSkill] =
      generateTotalEarnedPointsForSkill(tidiedResponse, responseGrade);

    tidiedResponse["totalPossiblePointsForSkill_" + currentSkill] =
      generateTotalPossiblePointsForSkill(
        currentQuestion.id,
        questionSet,
        submittedPart
      );

    if (responseGrade.answeredCorrectly) {
      setIncorrectCounter(0);
      setActiveStep(() => activeStep + 1);
      tidiedResponse.activeStep = activeStep + 1;
      tidiedResponse.currentSkill = getCurrentSkill(
        activeStep + 1,
        questionSet?.adaptiveParams?.skills
      );

      let currentSkillCompleted = hasCurrentSkillObjectiveBeenCompleted(
        responseGrade,
        submissionHistory,
        questionSet,
        inARowCount,
        currentSkill,
        setCurrentSkill
      );

      if (currentSkillCompleted) {
        tidiedResponse.completedSkills = {
          name: questionSet?.adaptiveParams?.skills[currentSkill].title,
        };
      }

      tidiedResponse.totalEarnedPoints = sumEarnedPoints(
        tidiedResponse,
        submissionHistory
      );

      if (completedLastSkill(currentSkillCompleted)) {
        tidiedResponse["allSkillsCompleted"] = true;
        setAdaptiveAssignmentCompleted(true);
        setCongratulationsModalOpen(true);
      }
    }

    if (!responseGrade.answeredCorrectly) {
      setIncorrectCounter(incorrectCounter + 1);
      if (
        incorrectCounter >=
          NUMBER_OF_INCORRECT_ANSWERS_NEEDED_FOR_HELPFUL_RESOURCE &&
        questionSet?.adaptiveParams?.skills[currentSkill]?.resource?.length > 0
      ) {
        setHelpfulResourceModalOpen(true);
        setIncorrectCounter(0);
      }
    }

    if (
      questionSet?.adaptiveParams?.completeRule === "inARow" &&
      !responseGrade.answeredCorrectly
    ) {
      setActiveStep((activeStep) => (activeStep ? activeStep - 1 : 0));
      tidiedResponse.activeStep = activeStep ? activeStep - 1 : 0;
      setInARowCount(() => 0);
    }
  }

  function completedLastSkill(currentSkillCompleted) {
    return (
      currentSkillCompleted &&
      currentSkill === questionSet?.adaptiveParams?.skills?.length - 1
    );
  }

  function currentSkillTotalCorrectCompleted(
    responseGrade,
    submissionHistory,
    questionSet,
    currentSkill
  ) {
    if (!submissionHistory) {
      return false;
    }

    let currentSkillTotalPointsEarned =
      "totalEarnedPointsForSkill_" + currentSkill in submissionHistory
        ? submissionHistory["totalEarnedPointsForSkill_" + currentSkill]
        : 0;

    return (
      responseGrade.earnedPoints + currentSkillTotalPointsEarned >=
      questionSet?.adaptiveParams?.skills[currentSkill].completeValue
    );
  }

  function getAdaptiveSubmittedQuestionIDs(submissionHistory, questionID) {
    return submissionHistory?.adaptiveSubmittedQuestionIDs?.length > 0
      ? submissionHistory?.adaptiveSubmittedQuestionIDs.concat(questionID)
      : [questionID];
  }

  function getResponseHistory(questionID, partIndex) {
    const multipartID = `${questionID}_${alphabet[partIndex]}`;
    if (partIndex < 0)
      return {
        answeredCorrectly:
          submissionHistory?.[`${questionID}_answeredCorrectly`] || false,
        attemptsUsed:
          submissionHistory?.[`${questionID}_responses`]?.length || 0,
        earnedPoints: submissionHistory?.[`${questionID}_earnedPoints`] || 0,
        timestamps: submissionHistory?.[`${questionID}_timestamps`] || null,
        lastTimestamp: submissionHistory?.[`${questionID}_timestamp`] || null,
        responses: submissionHistory?.[`${questionID}_responses`] || null,
        lastResponse: submissionHistory?.[`${questionID}_response`] || false,
        lastUpload: submissionHistory?.[`${questionID}_upload`] || null,
      };
    else if (partIndex >= 0)
      return {
        answeredCorrectly:
          submissionHistory?.[`${multipartID}_answeredCorrectly`] || false,
        attemptsUsed:
          submissionHistory?.[`${multipartID}_responses`]?.length || 0,
        earnedPoints: submissionHistory?.[`${multipartID}_earnedPoints`] || 0,
        timestamps: submissionHistory?.[`${multipartID}_timestamps`] || null,
        lastTimestamp: submissionHistory?.[`${multipartID}_timestamp`] || null,
        responses: submissionHistory?.[`${multipartID}_responses`] || null,
        lastResponse: submissionHistory?.[`${multipartID}_response`] || false,
        lastUpload: submissionHistory?.[`${multipartID}_upload`] || null,
      };
  }

  function getSubmittedQuestion() {
    if (currentQuestion.type !== "multipart") return currentQuestion;
    if (currentQuestion.type === "multipart")
      return {
        id: currentQuestion.id,
        ...currentQuestion.parts[submittedPart],
      };
  }

  function getSubmittedResponse(values) {
    return currentQuestion.type === "multipart"
      ? values.parts[submittedPart].response
      : values.response;
  }

  function attachPartLabel(question) {
    return question.parts.map(
      (part, index) => `${question.id}_${alphabet[index]}`
    );
  }

  function sumEarnedPoints(tidiedResponse, submissionHistory) {
    const questionIDs = questionSet.questions.map((question) =>
      question.type === "multipart" ? attachPartLabel(question) : question.id
    );

    const flattenedQuestionIDs = questionIDs.flat();

    const earnedPointsIDs = flattenedQuestionIDs.map((questionID) =>
      generateEarnedPointsID(questionID, -1)
    );

    const pointsArray = earnedPointsIDs.map((earnedPointsID) => {
      if (tidiedResponse[earnedPointsID]) {
        return tidiedResponse[earnedPointsID];
      }
      if (submissionHistory && submissionHistory[earnedPointsID]) {
        return submissionHistory[earnedPointsID];
      }
      return 0;
    });

    return pointsArray.reduce(
      (accumulatedPoints, points) => accumulatedPoints + points
    );
  }
}

export function SolutionViewer({
  assignmentInfo,
  currentQuestion,
  getResponseHistory,
  pastDue,
}) {
  const [url, setUrl] = useState("");
  const [previewPDFOpen, setPreviewPDFOpen] = useState(false);

  const openPDFPreview = () => {
    setPreviewPDFOpen(true);
  };
  const closePDFPreview = () => {
    setPreviewPDFOpen(false);
    setUrl("");
  };

  const responseHistory = getResponseHistory(currentQuestion?.id, -1);
  const showSolution = makeSolutionAvailable(
    currentQuestion,
    responseHistory,
    assignmentInfo,
    pastDue
  );

  if (!showSolution) return null;

  return (
    <>
      <PreviewPDF
        open={previewPDFOpen}
        handleOpen={openPDFPreview}
        handleClose={closePDFPreview}
        url={url}
      />
      <Link
        variant="subtitle1"
        className="hover-pointer absolute"
        style={
          currentQuestion.type === "free response"
            ? { right: "59px", top: "400px" }
            : { right: "59px", top: "385px" }
        }
        onClick={() => {
          if (currentQuestion.solution.type === "application/pdf") {
            setUrl(currentQuestion.solution.url);
            openPDFPreview();
          }
        }}
      >
        view solution
      </Link>
    </>
  );
}

function SolutionViewerMultipart({
  assignmentInfo,
  currentQuestion,
  getResponseHistory,
  pastDue,
}) {
  const [url, setUrl] = useState("");
  const [previewPDFOpen, setPreviewPDFOpen] = useState(false);
  const completedQuestions = [];
  const historyArr = [];

  const openPDFPreview = () => {
    setPreviewPDFOpen(true);
  };
  const closePDFPreview = () => {
    setPreviewPDFOpen(false);
    setUrl("");
  };

  const solutionExists =
    currentQuestion?.solution && currentQuestion?.solution?.type;
  const hasDueDate = assignmentInfo?.hasDueDate || false;
  const hideSolutions = assignmentInfo?.hideSolutions || false;

  if (!solutionExists) return null;
  if (hideSolutions && hasDueDate && !pastDue) return null;

  currentQuestion.parts.map((part, partIndex) =>
    historyArr.push(getResponseHistory(currentQuestion.id, partIndex) || false)
  );

  for (let i = 0; i < currentQuestion.parts.length; i++) {
    const answeredCorrectly = historyArr[i]?.answeredCorrectly;
    const attemptsExhausted =
      historyArr[i]?.attemptsUsed >= currentQuestion.parts[i]?.attemptsAllowed;
    const lastResponseExists = historyArr[i]?.lastResponse ? true : false;

    if (currentQuestion?.parts[i]?.type === "info card") {
      completedQuestions.push(true);
    } else if (answeredCorrectly || attemptsExhausted || lastResponseExists) {
      completedQuestions.push(true);
    } else if (
      assignmentInfo?.unlimitedAttempts &&
      historyArr[i]?.attemptsUsed > 0
    ) {
      completedQuestions.push(true);
    } else completedQuestions.push(false);
  }

  const allPartsCompleted = completedQuestions.every((part) => part === true);
  if (!allPartsCompleted) return null;

  return (
    <>
      <PreviewPDF
        open={previewPDFOpen}
        handleOpen={openPDFPreview}
        handleClose={closePDFPreview}
        url={url}
      />
      <Link
        variant="subtitle1"
        className="hover-pointer flex-justify-center relative"
        style={{ bottom: "50px" }}
        onClick={() => {
          if (currentQuestion.solution.type === "application/pdf") {
            setUrl(currentQuestion.solution.url);
            openPDFPreview();
          }
        }}
      >
        view solution
      </Link>
    </>
  );
}

function makeSolutionAvailable(
  currentQuestion,
  responseHistory,
  assignmentInfo,
  pastDue
) {
  const solutionExists =
    currentQuestion?.solution && currentQuestion?.solution?.type;
  const attemptsAllowed = currentQuestion?.attemptsAllowed || 1;
  const attemptsUsed = responseHistory?.attemptsUsed || 0;
  const attemptsExhausted = attemptsUsed >= attemptsAllowed;
  const answeredCorrectly = responseHistory?.answeredCorrectly || false;
  const lastResponse = responseHistory?.lastResponse || null;
  const hasDueDate = assignmentInfo?.hasDueDate || false;
  const hideSolutions = assignmentInfo?.hideSolutions || false;

  if (!solutionExists) return false;

  if (hideSolutions && hasDueDate && !pastDue) return false;

  if (currentQuestion.type === "free response" && lastResponse) return true;

  if (!attemptsExhausted && !answeredCorrectly) return false;

  return true;
}

function QuestionNavigator({
  qIndex,
  questionSet,
  resetForm,
  setQIndex,
  submissionHistory,
  currentQuestion,
  currentSkill,
  setCurrentSkill,
  instructorView,
  studentGradebook,
  setNoRemainingQuestionsModalOpen,
  setMessage,
}) {
  function pickAdaptiveQuestion(
    questionSet,
    submissionHistory,
    currentSkill,
    index = 0
  ) {
    // if objectiveCompleted(questionSet)  //TODO
    // return

    let submissionHistoryQuestionIDs =
      getSubmissionHistoryQuestionIDs(submissionHistory);

    if (submissionHistoryQuestionIDs.length === 0) {
      setQIndex(index);
      return;
    }

    let randomQuestionIndex = getRandomQuestionIndex(
      questionSet,
      submissionHistoryQuestionIDs,
      currentSkill
    );

    if (randomQuestionIndex === -1) {
      setNoRemainingQuestionsModalOpen(true);
      return;
    }

    setQIndex(randomQuestionIndex);
    resetForm();
  }

  const getPreviousAdaptiveQuestion = (event, selectedPage) => {
    let questionID =
      questionSet?.adaptiveParams?.skills[currentSkill].questionIDs[qIndex];

    let previousQuestionID =
      submissionHistory?.adaptiveSubmittedQuestionIDs?.find(
        (question) => question === questionID
      )
        ? submissionHistory.adaptiveSubmittedQuestionIDs[
            submissionHistory.adaptiveSubmittedQuestionIDs.indexOf(questionID) -
              1
          ]
        : submissionHistory.adaptiveSubmittedQuestionIDs[
            submissionHistory.adaptiveSubmittedQuestionIDs.length - 1
          ];

    let previousQuestionExistsInCurrentSkill =
      questionSet?.adaptiveParams?.skills[currentSkill].questionIDs.findIndex(
        (questionID) => questionID === previousQuestionID
      ) !== -1;

    setQIndex(() => {
      return previousQuestionExistsInCurrentSkill
        ? questionSet?.adaptiveParams?.skills[
            currentSkill
          ].questionIDs.findIndex(
            (questionID) => previousQuestionID === questionID
          )
        : questionSet?.adaptiveParams?.skills[
            currentSkill - 1
          ].questionIDs.findIndex(
            (questionID) => previousQuestionID === questionID
          );
    });

    if (!previousQuestionExistsInCurrentSkill) {
      setCurrentSkill(currentSkill - 1);
    }
  };

  function getNextAdaptiveQuestion() {
    if (
      submissionHistory?.adaptiveSubmittedQuestionIDs.indexOf(
        questionSet?.adaptiveParams?.skills[currentSkill].questionIDs[qIndex]
      ) +
        1 !==
      submissionHistory.adaptiveSubmittedQuestionIDs.length
    ) {
      let nextAdaptiveQuestionIndex =
        submissionHistory.adaptiveSubmittedQuestionIDs.indexOf(
          questionSet?.adaptiveParams?.skills[currentSkill].questionIDs[qIndex]
        ) + 1;
      let nextAdaptiveQuestionID =
        submissionHistory.adaptiveSubmittedQuestionIDs[
          nextAdaptiveQuestionIndex
        ];

      let questionExistsInCurrentSkill =
        questionSet?.adaptiveParams?.skills[currentSkill].questionIDs.findIndex(
          (questionID) => questionID === nextAdaptiveQuestionID
        ) !== -1;

      setQIndex(() => {
        return questionExistsInCurrentSkill
          ? questionSet?.adaptiveParams?.skills[
              currentSkill
            ].questionIDs.findIndex(
              (questionID) => questionID === nextAdaptiveQuestionID
            )
          : questionSet?.adaptiveParams?.skills[
              currentSkill + 1
            ].questionIDs.findIndex(
              (questionID) => questionID === nextAdaptiveQuestionID
            );
      });

      if (!questionExistsInCurrentSkill) {
        setCurrentSkill(currentSkill + 1);
      }
      return;
    } else {
      if (!instructorView && !studentGradebook) {
        pickAdaptiveQuestion(questionSet, submissionHistory, currentSkill);
        resetForm();
      }
      return;
    }
  }

  const handleChange = (event, selectedPage) => {
    setMessage("");
    setQIndex((prevIndex) => qIndex + 1);

    if (selectedPage === qIndex + 1) return;
    setQIndex((prevIndex) => selectedPage - 1);
    resetForm();
  };

  if (!questionSet) return null;
  if (questionSet?.questions?.length === 0) return null;

  function isFirstAdaptiveQuestion() {
    return submissionHistory?.adaptiveSubmittedQuestionIDs?.length > 0
      ? questionSet?.adaptiveParams?.skills[currentSkill]?.questionIDs[
          qIndex
        ] === submissionHistory?.adaptiveSubmittedQuestionIDs[0]
      : true;
  }

  function isLastAdaptiveQuestion() {
    return submissionHistory?.adaptiveSubmittedQuestionIDs?.length > 0 &&
      submissionHistory?.allSkillsCompleted
      ? questionSet?.adaptiveParams?.skills[currentSkill]?.questionIDs[
          qIndex
        ] ===
          submissionHistory?.adaptiveSubmittedQuestionIDs[
            submissionHistory?.adaptiveSubmittedQuestionIDs?.length - 1
          ]
      : false;
  }

  return (
    <Box className="flex-justify-center" style={{ marginTop: "20px" }}>
      {questionSet.mode === "adaptive" && (
        <>
          {(instructorView || studentGradebook) && (
            <ChevronLeft
              style={
                isFirstAdaptiveQuestion()
                  ? { color: "grey" }
                  : { cursor: "pointer" }
              }
              onClick={() =>
                isFirstAdaptiveQuestion() ? null : getPreviousAdaptiveQuestion()
              }
              fontSize="large"
            >
              Previous Question
            </ChevronLeft>
          )}

          <ChevronRight
            style={
              isLastAdaptiveQuestion()
                ? { color: "grey" }
                : { cursor: "pointer" }
            }
            onClick={() => {
              if (isLastAdaptiveQuestion()) {
                return null;
              }

              getSubmissionHistoryQuestionIDs(submissionHistory).find(
                (questionID) => questionID === currentQuestion.id
              )
                ? getNextAdaptiveQuestion()
                : alert("You have not submitted a response to this question.");
            }}
            fontSize="large"
          />
        </>
      )}
      {questionSet.mode !== "adaptive" && (
        <Pagination
          count={questionSet?.questions?.length}
          onChange={handleChange}
          page={qIndex + 1}
        />
      )}
    </Box>
  );

  function getSubmissionHistoryQuestionIDs(submissionHistory) {
    let submissionHistoryQuestionIDs = submissionHistory
      ? Object.keys(submissionHistory).filter((key) =>
          key.includes("_responses")
        )
      : [];

    submissionHistoryQuestionIDs = submissionHistoryQuestionIDs.map((key) => {
      return key.replace("_responses", "");
    });

    return submissionHistoryQuestionIDs;
  }

  function getRandomQuestionIndex(
    questionSet,
    submissionHistoryQuestionIDs,
    currentSkill
  ) {
    let remainingQuestionIDs = questionSet?.adaptiveParams?.skills[
      currentSkill
    ].questionIDs.filter(
      (questionID) => !submissionHistoryQuestionIDs.includes(questionID)
    );

    let randomQuestionID =
      remainingQuestionIDs[
        Math.floor(Math.random() * remainingQuestionIDs.length)
      ];

    let randomQuestionIndex = questionSet?.adaptiveParams?.skills[
      currentSkill
    ].questionIDs.findIndex((question) => question === randomQuestionID);

    return randomQuestionIndex;
  }
}

function ReportAProblem({
  assignmentInfo,
  courseID,
  courseTitle,
  currentQuestion,
  getResponseHistory,
  userEmail,
  userDisplayName,
  userID,
}) {
  const questionID = currentQuestion?.id || null;
  const type = currentQuestion?.type || null;
  const parts = currentQuestion?.parts || null;

  const responseHistory =
    type === "multipart"
      ? parts.map((part, ind) => getResponseHistory(questionID, ind) || null)
      : getResponseHistory(questionID, -1) || null;
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        className="report-a-problem"
        onClick={handleOpen}
        startIcon={<ReportProblemOutlined />}
        style={{
          color: "gray",
          position: "relative",
          bottom: "25px",
          left: "35px",
        }}
      >
        REPORT A PROBLEM
      </Button>
      <Modal
        className="flex-center-all"
        open={open}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={open}>
          <Box
            className="padding-medium modal-common-styling"
            style={{ minWidth: "400px", maxWidth: "500px" }}
          >
            <Typography variant="h5" color="primary">
              Report a Problem
            </Typography>
            <Formik
              initialValues={{
                assignmentID: assignmentInfo?.assignmentID || null,
                docRef: assignmentInfo?.docRef || null,
                created: firebase.firestore.Timestamp.now() || null,
                courseID: courseID || null,
                courseTitle: courseTitle || null,
                description: "" || null,
                libraryID: currentQuestion?.libraryID || null,
                libraryType: currentQuestion?.libraryType || null,
                question: currentQuestion,
                questionID: currentQuestion?.id || null,
                resolved: false,
                responseHistory: responseHistory || null,
                userDisplayName: userDisplayName || null,
                userEmail: userEmail || null,
                userID: userID || null,
                userAgent: window.navigator.userAgent || null,
              }}
              onSubmit={async (values, { setSubmitting }) => {
                setSubmitting(true);
                await addReportProblem(values);
                await new Promise((r) => setTimeout(r, 800));
                setSubmitting(false);
                handleClose();
              }}
            >
              {({ values, isSubmitting, dirty }) => (
                <Form autoComplete="off">
                  <Box className="flex-column report-a-problem">
                    <Typography>
                      {renderQuestionSnippet(currentQuestion)}
                    </Typography>
                    <Field
                      name="description"
                      as={DescriptionField}
                      style={{ marginTop: "10px" }}
                    />
                    <Box className="flex justify-end padding-tiny">
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting}
                        style={{ marginTop: "10px" }}
                      >
                        {isSubmitting ? (
                          <CircularProgress size={25} />
                        ) : (
                          "Submit"
                        )}
                      </Button>
                    </Box>
                  </Box>
                </Form>
              )}
            </Formik>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
