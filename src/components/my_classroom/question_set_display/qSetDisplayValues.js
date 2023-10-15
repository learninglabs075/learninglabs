import firebase from "../../../app/config/firebaseConfig";
import { generateResponseID } from "./qSetDisplayUtils";
import { alphabet } from "../../../app/utils/utils";

const titleCardInitValues = {
  type: "title card",
};

const shortAnswerDefaultResponses = {
  text: { text: "" },
  wordOrPhrase: { text: "" },
  "mathematica list": { text: "" },
  number: { number: "" },
  measurement: { number: "", unit: "" },
  "measurement with rule": { number: "", unit: "" },
  "measurement with feedback": { number: "", unit: "" },
  vector: { vector: "" },
  "vector with unit": { vector: "", unit: "" },
  "vector expr": { vectorExpr: "" },
  "vector symbolic": { expr: "" },
  expr: { expr: "" },
  "expr with rule": { expr: "" },
  symbolic: { expr: "" },
  "mathematica expression": { expr: "" },
  "chemical formula": { chemFormula: "" },
};

function multipleChoiceValues(question, submissionHistory, partIndex) {
  if (!submissionHistory) return { type: "multiple choice", response: "" };

  const responses_key =
    partIndex < 0
      ? `${question.id}_responses`
      : `${question.id}_${alphabet[partIndex]}_responses`;
  const pastResponses = submissionHistory[responses_key];
  const lastResponse = pastResponses
    ? pastResponses[pastResponses.length - 1]
    : null;
  const numCorrectChoices = question.answerChoices?.reduce(
    (numCorrect, answerChoice) =>
      answerChoice.isCorrect ? ++numCorrect : numCorrect,
    0
  );

  if (numCorrectChoices === 1)
    return {
      type: "multiple choice",
      response: lastResponse || "",
    };
  else if ((numCorrectChoices > 1) & !lastResponse)
    return {
      type: "multiple choice",
      response: [],
    };
  else if (numCorrectChoices > 1)
    return {
      type: "multiple choice",
      response: Object.values(lastResponse) || [],
    };
}

function shortAnswerValues(question, submissionHistory, partIndex) {
  const subtype = question.subtype;

  if (!subtype) return { type: "short answer", response: {} };

  if (!submissionHistory) {
    return {
      type: "short answer",
      response: shortAnswerDefaultResponses[subtype] || {},
    };
  }
  //==============================================================================//

  const responsesKey =
    partIndex < 0
      ? `${question.id}_responses`
      : `${question.id}_${alphabet[partIndex]}_responses`;

  const pastResponses = submissionHistory[responsesKey];
  const lastResponse = pastResponses
    ? pastResponses[pastResponses.length - 1]
    : null;

  const response = { type: "short answer" };

  switch (subtype) {
    case "text":
    case "wordOrPhrase":
    case "mathematica list":
      response.response = { text: lastResponse || "" };
      break;

    case "number":
      response.response = { number: lastResponse?.number || "" };
      break;

    case "measurement":
    case "measurement with rule":
    case "measurement with feedback":
      response.response = {
        number: lastResponse?.number || "",
        unit: lastResponse?.unit || "",
      };
      break;
    case "vector":
      response.response = {
        vector: lastResponse?.vector || lastResponse?.number || "",
      };
      break;

    case "vector with unit":
      response.response = {
        vector: lastResponse?.vector || lastResponse?.number || "",
        unit: lastResponse?.unit || "",
      };
      break;

    case "vector expr":
    case "vector symbolic":
      response.response = {
        vectorExpr: lastResponse?.vectorExpr || lastResponse?.number || "",
      };
      break;

    case "expr":
    case "expr with rule":
    case "symbolic":
      response.response = {
        expr: lastResponse?.expr || lastResponse?.expression || "",
      };
      break;

    case "mathematica expression":
      response.response = { expr: lastResponse || "" };
      break;

    case "chemical formula":
      response.response = { chemFormula: lastResponse || "" };
      break;

    default:
      break;
  }

  return response;
}

function freeResponseValues(question, submissionHistory, partIndex) {
  if (!submissionHistory) return { type: "free response", response: "" };
  const response_key =
    partIndex < 0
      ? `${question.id}_response`
      : `${question.id}_${alphabet[partIndex]}_response`;
  const lastResponse = submissionHistory[response_key];

  return {
    type: "free response",
    response: lastResponse || "",
  };
}

function fileUploadValues(question, submissionHistory, partIndex) {
  if (!submissionHistory) return { type: "file upload", response: "" };
  const response_key =
    partIndex < 0
      ? `${question.id}_response`
      : `${question.id}_${alphabet[partIndex]}_response`;
  const lastResponse = submissionHistory[response_key];

  return {
    type: "file upload",
    response: lastResponse || "",
  };
}

function multipartValues(question, submissionHistory) {
  // if (!submissionHistory) return { type: "free response", parts: [] };

  const partsInitValues = [];
  question.parts.forEach((part, partIndex) => {
    const partPlusQuestionID = { id: question.id, ...part };
    let lastResponse = {};

    switch (part.type) {
      case "multiple choice":
        lastResponse = multipleChoiceValues(
          partPlusQuestionID,
          submissionHistory,
          partIndex
        );
        break;
      case "short answer":
        lastResponse = shortAnswerValues(
          partPlusQuestionID,
          submissionHistory,
          partIndex
        );
        break;
      case "free response":
        lastResponse = freeResponseValues(
          partPlusQuestionID,
          submissionHistory,
          partIndex
        );
        break;
      default:
        break;
    }

    partsInitValues.push(lastResponse);
  });

  return {
    type: "multipart",
    parts: partsInitValues,
  };
}

export function pickInitialValues(question, submissionHistory) {
  switch (question?.type) {
    case "title card":
      return titleCardInitValues;
    case "multiple choice":
      return multipleChoiceValues(question, submissionHistory, -1);
    case "short answer":
      return shortAnswerValues(question, submissionHistory, -1);
    case "free response":
      return freeResponseValues(question, submissionHistory, -1);
    case "file upload":
      return fileUploadValues(question, submissionHistory, -1);
    case "multipart":
      return multipartValues(question, submissionHistory);
    default:
      break;
  }
}

export function tidyResponse(
  submittedPart,
  question,
  response,
  grade,
  submissionHistory,
  questionSet
) {
  //generate key names based on question number and part (if multipart question) being submitted
  const responseID = generateResponseID(question.id, submittedPart);
  const response_key = `${responseID}_response`;
  const responses_key = `${responseID}_responses`;
  const earnedPoints_key = `${responseID}_earnedPoints`;
  const answeredCorrectly_key = `${responseID}_answeredCorrectly`;
  const timestamp_key = `${responseID}_timestamp`;
  const timestamps_key = `${responseID}_timestamps`;

  const timestampHistory =
    submissionHistory && submissionHistory[timestamps_key]
      ? submissionHistory[timestamps_key]
      : [];

  timestampHistory.push(firebase.firestore.Timestamp.now());

  const responseHistory =
    submissionHistory && submissionHistory[responses_key]
      ? submissionHistory[responses_key]
      : [];

  const subtype = question.subtype;

  let saveData = {};

  switch (question.type) {
    case "multiple choice":
      const numCorrectChoices = question.answerChoices?.reduce(
        (acc, cur) => (cur.isCorrect === true ? ++acc : acc),
        0
      );

      if (numCorrectChoices === 1) {
        responseHistory.push(response);
      }

      if (numCorrectChoices > 1) {
        response.sort(function (a, b) {
          return a - b;
        });
        //firebase does not accept nested arrays like [["1","3","4"],["1","2"]], so converting response array into serialized object
        responseHistory.push({ ...response });
      }

      saveData = {
        [responses_key]: responseHistory,
        [earnedPoints_key]: grade.earnedPoints,
        [answeredCorrectly_key]: grade.answeredCorrectly,
        [timestamps_key]: timestampHistory,
      };

      break;
    case "short answer":
      switch (subtype) {
        case "text":
        case "wordOrPhrase":
        case "mathematica list":
          responseHistory.push(response.text);
          break;
        case "number":
          responseHistory.push({ number: response.number });
          break;
        case "measurement":
        case "measurement with rule":
        case "measurement with feedback":
          responseHistory.push({
            number: response.number,
            unit: response.unit,
          });
          break;
        case "vector":
          responseHistory.push({
            vector: response.vector,
          });
          break;
        case "vector with unit":
          responseHistory.push({
            vector: response.vector,
            unit: response.unit,
          });
          break;
        case "vector expr":
        case "vector symbolic":
          responseHistory.push({ vectorExpr: response.vectorExpr });
          break;
        case "expr":
        case "expr with rule":
        case "symbolic":
          responseHistory.push({ expr: response.expr });
          break;
        case "mathematica expression":
          responseHistory.push(response.expr);
          break;
        case "chemical formula":
          responseHistory.push({ chemFormula: response.chemFormula });
          break;
        default:
          break;
      }

      saveData = {
        [responses_key]: responseHistory,
        [earnedPoints_key]: grade.earnedPoints,
        [answeredCorrectly_key]: grade.answeredCorrectly,
        [timestamps_key]: timestampHistory,
      };
      break;

    case "free response":
      saveData = {
        [response_key]: response,
        [timestamp_key]: firebase.firestore.Timestamp.now(),
      };
      break;

    default:
      break;
  }

  saveData.questionSetID = questionSet.id;
  saveData.questionSetTitle = questionSet.title;
  saveData.totalPossiblePoints = questionSet.totalPossiblePoints;

  return saveData;
}
