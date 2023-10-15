import { numberifyArray } from "../../../app/utils/utils.js";
import { findIndexesOfCorrect } from "./qSetDisplayUtils.js";

//==========================================================================//
//======================= Main Grading Function ============================//

export function grade(submittedQuestion, submittedResponse, userID) {
  switch (submittedQuestion.type) {
    case "multiple choice":
      return gradeMultipleChoice(submittedQuestion, submittedResponse);
    case "short answer":
      return gradeShortAnswer(submittedQuestion, submittedResponse, userID);
    default:
      break;
  }
}

//==========================================================================//
//====================== Multiple Choice Grading ===========================//

function gradeMultipleChoice(submittedQuestion, submittedResponse) {
  const numCorrectChoices = submittedQuestion.answerChoices?.reduce(
    (acc, cur) => (cur.isCorrect === true ? ++acc : acc),
    0
  );

  if (numCorrectChoices === 1) {
    const selectedResponseIndex = Number(submittedResponse);
    const correctResponseIndex = findIndexesOfCorrect(
      submittedQuestion.answerChoices
    )[0];

    return selectedResponseIndex === correctResponseIndex
      ? {
          earnedPoints: submittedQuestion.possiblePoints,
          answeredCorrectly: true,
        }
      : { earnedPoints: 0, answeredCorrectly: false };
  }

  if (numCorrectChoices > 1) {
    const selectedIndexes = numberifyArray(submittedResponse).sort((a, b) => {
      return a - b;
    });

    const correctIndexes = findIndexesOfCorrect(
      submittedQuestion.answerChoices
    ).sort((a, b) => {
      return a - b;
    });

    let numCorrectSelected = 0;

    selectedIndexes.forEach((element, index) => {
      if (correctIndexes.includes(element)) {
        numCorrectSelected = numCorrectSelected + 1;
      }
      return numCorrectSelected;
    });

    const numIncorrectSelected = selectedIndexes.length - numCorrectSelected;

    switch (submittedQuestion.scoringMethod) {
      case "allOrNothing":
        return numCorrectSelected === correctIndexes.length &&
          numIncorrectSelected === 0
          ? {
              earnedPoints: submittedQuestion.possiblePoints,
              answeredCorrectly: true,
            }
          : { earnedPoints: 0, answeredCorrectly: false };
      case "partial":
        switch (true) {
          case numCorrectSelected === correctIndexes.length &&
            numIncorrectSelected === 0:
            return {
              earnedPoints: submittedQuestion.possiblePoints,
              answeredCorrectly: true,
            };
          case numCorrectSelected > numIncorrectSelected:
            return {
              earnedPoints:
                (numCorrectSelected - numIncorrectSelected) *
                (submittedQuestion.possiblePoints / correctIndexes.length),
              answeredCorrectly: "partial",
            };
          case numCorrectSelected > 0:
            return {
              earnedPoints: 0,
              answeredCorrectly: "partial",
            };

          default:
            return { earnedPoints: 0, answeredCorrectly: false };
        }

      default:
        break;
    }
  }
}

//==========================================================================//
//======================= Short Answer Grading ============================//

async function gradeShortAnswer(submittedQuestion, submittedResponse, userID) {
  const authorizedEditors = [
    "CjqOSwViY1a92rU5BGlDP1Mz6Uz1", //Stanley Koral ID
    "2K6wd4ymDdhJKNby73c7OXf9WvU2", //Peter Koral ID
    "MathugtWtXfaFvXcBHmBDGwoUXD3", //David Koral
    "EgM9bQZnzlPJn8gRL6bJF5JAjKG3", //Randy Koral gmail
    "JOQBKdzXSJgsT3rrC7uyAdB4PmG3", //Rand Koral uci
  ];
  const logResponse =
    process.env.REACT_APP_WEBSITE_URL === "koral-development.community" ||
    authorizedEditors.includes(userID);

  switch (submittedQuestion.subtype) {
    case "wordOrPhrase":
    case "text": {
      const correctAnswer = submittedQuestion?.correctAnswer;
      const acceptAlternateSpacing =
        correctAnswer?.acceptAlternateSpacing ||
        submittedQuestion.acceptAlternateSpacing;
      const acceptAlternateCapitalization =
        correctAnswer?.acceptAlternateCapitalization ||
        submittedQuestion.acceptAlternateCapitalization;
      const correctText =
        correctAnswer?.text || submittedQuestion.correctWordOrPhrase;

      if (acceptAlternateCapitalization && acceptAlternateSpacing) {
        const answeredCorrectly =
          submittedResponse.text.toLowerCase().replace(/\s+/g, "") ===
          correctText.toLowerCase().replace(/\s+/g, "");
        return tidyPoints(submittedQuestion, answeredCorrectly);
      } else if (acceptAlternateCapitalization) {
        const answeredCorrectly =
          submittedResponse.text.toLowerCase() === correctText.toLowerCase();
        return tidyPoints(submittedQuestion, answeredCorrectly);
      } else if (acceptAlternateSpacing) {
        const answeredCorrectly =
          submittedResponse.text.replace(/\s+/g, "") ===
          correctText.replace(/\s+/g, "");
        return tidyPoints(submittedQuestion, answeredCorrectly);
      } else {
        const answeredCorrectly = submittedResponse.text === correctText;
        return tidyPoints(submittedQuestion, answeredCorrectly);
      }
    }
    //**************************************************//
    case "number": {
      const mathematicaResponse = await gradeNumberUsingMathematica(
        submittedQuestion,
        submittedResponse,
        logResponse
      );
      const answeredCorrectly = extractAnsweredCorrectly(mathematicaResponse);
      return tidyPoints(submittedQuestion, answeredCorrectly);
    }
    case "measurement": {
      const mathematicaResponse = await gradeMeasurementUsingMathematica(
        submittedQuestion,
        submittedResponse,
        logResponse
      );
      const answeredCorrectly = extractAnsweredCorrectly(mathematicaResponse);
      return tidyPoints(submittedQuestion, answeredCorrectly);
    }
    case "measurement with feedback": {
      const mathematicaResponse = await gradeMeasurementUsingMathematica(
        submittedQuestion,
        submittedResponse,
        logResponse
      );
      const answeredCorrectly = extractAnsweredCorrectly(mathematicaResponse);
      return tidyPoints(submittedQuestion, answeredCorrectly);
    }
    case "measurement with rule": {
      const mathematicaResponse =
        await gradeMeasurementWithRuleUsingMathematica(
          submittedQuestion,
          submittedResponse,
          logResponse
        );
      const answeredCorrectly = extractAnsweredCorrectly(mathematicaResponse);
      return tidyPoints(submittedQuestion, answeredCorrectly);
    }
    case "expr with rule": {
      const mathematicaResponse = await gradeExprWithRuleUsingMathematica(
        submittedQuestion,
        submittedResponse,
        logResponse
      );
      const answeredCorrectly = extractAnsweredCorrectly(mathematicaResponse);
      return tidyPoints(submittedQuestion, answeredCorrectly);
    }
    case "vector": {
      const mathematicaResponse = await gradeVectorUsingMathematica(
        submittedQuestion,
        submittedResponse,
        logResponse
      );
      const answeredCorrectly = extractAnsweredCorrectly(mathematicaResponse);
      return tidyPoints(submittedQuestion, answeredCorrectly);
    }
    case "vector with unit": {
      const mathematicaResponse = await gradeVectorWithUnitUsingMathematica(
        submittedQuestion,
        submittedResponse,
        logResponse
      );
      const answeredCorrectly = extractAnsweredCorrectly(mathematicaResponse);
      return tidyPoints(submittedQuestion, answeredCorrectly);
    }
    case "vector expr":
    case "vector symbolic": {
      const mathematicaResponse = await gradeVectorExprUsingMathematica(
        submittedQuestion,
        submittedResponse,
        logResponse
      );
      const answeredCorrectly = extractAnsweredCorrectly(mathematicaResponse);
      return tidyPoints(submittedQuestion, answeredCorrectly);
    }
    case "expr":
    case "symbolic": {
      const mathematicaResponse = await gradeExprUsingMathematica(
        submittedQuestion,
        submittedResponse,
        logResponse
      );
      const answeredCorrectly = extractAnsweredCorrectly(mathematicaResponse);
      return tidyPoints(submittedQuestion, answeredCorrectly);
    }
    case "mathematica expression": {
      const mathematicaResponse = await gradeMathematicaExprUsingMathematica(
        submittedQuestion,
        submittedResponse,
        logResponse
      );
      const answeredCorrectly = extractAnsweredCorrectly(mathematicaResponse);
      return tidyPoints(submittedQuestion, answeredCorrectly);
    }
    case "mathematica list": {
      const mathematicaResponse = await gradeListUsingMathematica(
        submittedQuestion,
        submittedResponse,
        logResponse
      );
      const answeredCorrectly = extractAnsweredCorrectly(mathematicaResponse);
      return tidyPoints(submittedQuestion, answeredCorrectly);
    }
    case "chemical formula": {
      const mathematicaResponse = await gradeChemFormulaUsingMathematica(
        submittedQuestion,
        submittedResponse,
        logResponse
      );
      const answeredCorrectly = extractAnsweredCorrectly(mathematicaResponse);
      return tidyPoints(submittedQuestion, answeredCorrectly);
    }
    //**************************************************//
    default:
      break;
  }
}

function gradeNumberUsingMathematica(question, response, logResponse) {
  const studentVal = encodeURIComponent(response.number);
  const correctVal = encodeURIComponent(
    question.correctAnswer?.number || question.correctNumber
  );
  const percentTolerance = encodeURIComponent(
    question.correctAnswer?.percentTolerance || question.percentTolerance || 1
  );

  const request = require("request");

  const options = {
    method: "GET",
    url: question.correctAnswer
      ? chooseMathematicaBetaURL(question.subtype)
      : chooseMathematicaURL(question.subtype),
  };

  logResponse && console.log("request sent to: " + options.url);

  logResponse && console.log(`The following data was sent to mathematica: `);

  logResponse &&
    console.table({
      studentVal: studentVal,
      correctVal: correctVal,
      percentTolerance: percentTolerance,
    });

  options.url =
    options.url +
    `studentval=${studentVal}&correctval=${correctVal}&percentTolerance=${percentTolerance}`;

  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (response) {
        logResponse &&
          console.log(`response from mathematica: ${response.body}`);
        resolve(response.body);
      } else if (error) {
        console.log(error);
        reject(error);
      }
    });
  });
}

function gradeMeasurementUsingMathematica(question, response, logResponse) {
  const studentVal = encodeURIComponent(response.number);
  const studentUnit = encodeURIComponent(response.unit);
  const correctVal = encodeURIComponent(
    question.correctAnswer?.number || question.correctNumber
  );
  const correctUnit = encodeURIComponent(
    question.correctAnswer?.unit || question.correctUnit
  );
  const percentTolerance = encodeURIComponent(
    question.correctAnswer?.percentTolerance || question.percentTolerance || 1
  );

  const request = require("request");
  const options = {
    method: "GET",
    url: question.correctAnswer
      ? chooseMathematicaBetaURL(question.subtype)
      : chooseMathematicaURL(question.subtype),
  };

  logResponse && console.log("request sent to: " + options.url);

  logResponse && console.log(`The following data was sent to mathematica: `);

  logResponse &&
    console.table({
      studentVal: studentVal,
      correctVal: correctVal,
      studentUnit: studentUnit,
      correctUnit: correctUnit,
      percentTolerance: percentTolerance,
    });

  options.url =
    options.url +
    `studentval=${studentVal}&studentunit=${studentUnit}&correctval=${correctVal}&correctunit=${correctUnit}&percentTolerance=${percentTolerance}`;

  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (response) {
        logResponse &&
          console.log(`response from mathematica: ${response.body}`);
        resolve(response.body);
      } else if (error) {
        console.log(error);
        reject(error);
      }
    });
  });
}

function gradeMeasurementWithRuleUsingMathematica(
  question,
  response,
  logResponse
) {
  const studentVal = encodeURIComponent(response.number);
  const studentUnit = encodeURIComponent(response.unit);
  const correctVal = encodeURIComponent(
    question.correctAnswer?.number || question.correctNumber
  );
  const correctUnit = encodeURIComponent(
    question.correctAnswer?.unit || question.correctUnit
  );
  const percentTolerance = encodeURIComponent(
    question.correctAnswer?.percentTolerance || question?.percentTolerance || 1
  );
  const rule = encodeURIComponent(question?.correctAnswer?.rule);
  const unitRule = encodeURIComponent(question?.correctAnswer?.unitRule);

  const request = require("request");
  const options = {
    method: "GET",
    url: question.correctAnswer
      ? chooseMathematicaBetaURL(question.subtype)
      : chooseMathematicaURL(question.subtype),
  };

  logResponse && console.log("request sent to: " + options.url);

  logResponse && console.log(`The following data was sent to mathematica: `);

  logResponse &&
    console.table({
      studentVal: studentVal,
      correctVal: correctVal,
      studentUnit: studentUnit,
      correctUnit: correctUnit,
      correctRule: rule,
      correctUnitRule: unitRule,
      percentTolerance: percentTolerance,
    });

  options.url =
    options.url +
    `studentval=${studentVal}&studentunit=${studentUnit}&correctval=${correctVal}&correctunit=${correctUnit}&percentTolerance=${percentTolerance}&fRule=${rule}&unitRule=${unitRule}`;

  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (response) {
        logResponse &&
          console.log(`response from mathematica: ${response.body}`);
        resolve(response.body);
      } else if (error) {
        console.log(error);
        reject(error);
      }
    });
  });
}

function gradeVectorUsingMathematica(question, response, logResponse) {
  const studentVal = encodeURIComponent(response.vector);
  const correctVal = encodeURIComponent(
    question.correctAnswer?.vector || question.correctNumber
  );
  const percentTolerance = encodeURIComponent(
    question.correctAnswer?.percentTolerance || question.percentTolerance || 1
  );

  const request = require("request");

  const options = {
    method: "GET",
    url: question.correctAnswer
      ? chooseMathematicaBetaURL(question.subtype)
      : chooseMathematicaURL(question.subtype),
  };

  logResponse && console.log("request sent to: " + options.url);

  logResponse && console.log(`The following data was sent to mathematica: `);

  logResponse &&
    console.table({
      studentVal: studentVal,
      correctVal: correctVal,
      percentTolerance: percentTolerance,
    });

  options.url =
    options.url +
    `studentval=${studentVal}&correctval=${correctVal}&percentTolerance=${percentTolerance}`;

  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (response) {
        logResponse &&
          console.log(`response from mathematica: ${response.body}`);
        resolve(response.body);
      } else if (error) {
        console.log(error);
        reject(error);
      }
    });
  });
}

function gradeVectorWithUnitUsingMathematica(question, response, logResponse) {
  const studentVal = encodeURIComponent(response.vector.trim());
  const studentUnit = encodeURIComponent(response.unit);
  const correctVal = encodeURIComponent(
    question.correctAnswer?.vector || question.correctNumber
  );
  const correctUnit = encodeURIComponent(
    question.correctAnswer?.unit || question.correctUnit
  );
  const percentTolerance = encodeURIComponent(
    question.correctAnswer?.percentTolerance || question.percentTolerance || 1
  );

  const request = require("request");
  const options = {
    method: "GET",
    url: question.correctAnswer
      ? chooseMathematicaBetaURL(question.subtype)
      : chooseMathematicaURL(question.subtype),
  };

  logResponse && console.log("request sent to: " + options.url);

  logResponse && console.log(`The following data was sent to mathematica: `);

  logResponse &&
    console.table({
      studentVal: studentVal,
      correctVal: correctVal,
      studentUnit: studentUnit,
      correctUnit: correctUnit,
      percentTolerance: percentTolerance,
    });

  //Peter has inconsistent field names for correctvalue and correctval
  options.url =
    options.url +
    `studentval=${studentVal}&studentunit=${studentUnit}&correctval=${correctVal}&correctunit=${correctUnit}&percentTolerance=${percentTolerance}`;

  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (response) {
        logResponse &&
          console.log(`response from mathematica: ${response.body}`);
        resolve(response.body);
      } else if (error) {
        console.log(error);
        reject(error);
      }
    });
  });
}

function gradeVectorExprUsingMathematica(question, response, logResponse) {
  const studentVal = encodeURIComponent(response.vectorExpr);
  const correctVal = encodeURIComponent(
    question.correctAnswer?.vectorExpr || question.correctNumber
  );

  const request = require("request");

  const options = {
    method: "GET",
    url: question.correctAnswer
      ? chooseMathematicaBetaURL(question.subtype)
      : chooseMathematicaURL(question.subtype),
  };

  logResponse && console.log("request sent to: " + options.url);

  logResponse && console.log(`The following data was sent to mathematica: `);

  logResponse &&
    console.table({
      studentVal: studentVal,
      correctVal: correctVal,
    });

  options.url =
    options.url + `studentval=${studentVal}&correctval=${correctVal}`;

  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (response) {
        logResponse &&
          console.log(`response from mathematica: ${response.body}`);
        resolve(response.body);
      } else if (error) {
        console.log(error);
        reject(error);
      }
    });
  });
}

function gradeExprUsingMathematica(question, response, logResponse) {
  const studentVal = encodeURIComponent(response.expr);
  const correctVal = encodeURIComponent(
    question.correctAnswer?.expr || question.correctNumber
  );

  const request = require("request");

  const options = {
    method: "GET",
    url: question.correctAnswer
      ? chooseMathematicaBetaURL(question.subtype)
      : chooseMathematicaURL(question.subtype),
  };

  logResponse && console.log("request sent to: " + options.url);

  logResponse && console.log(`The following data was sent to mathematica: `);

  logResponse &&
    console.table({
      studentVal: studentVal,
      correctVal: correctVal,
    });

  options.url =
    options.url + `studentval=${studentVal}&correctval=${correctVal}`;

  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (response) {
        logResponse &&
          console.log(`response from mathematica: ${response.body}`);
        resolve(response.body);
      } else if (error) {
        console.log(error);
        reject(error);
      }
    });
  });
}

function gradeExprWithRuleUsingMathematica(question, response, logResponse) {
  const studentVal = encodeURIComponent(response.expr);
  const correctVal = encodeURIComponent(question.correctAnswer?.expr);
  const rule = encodeURIComponent(question.correctAnswer?.rule);

  const request = require("request");

  const options = {
    method: "GET",
    url: question.correctAnswer
      ? chooseMathematicaBetaURL(question.subtype)
      : chooseMathematicaURL(question.subtype),
  };

  logResponse && console.log("request sent to: " + options.url);

  logResponse && console.log(`The following data was sent to mathematica: `);

  logResponse &&
    console.table({
      studentVal: studentVal,
      correctVal: correctVal,
      rule: rule,
    });

  options.url =
    options.url +
    `studentval=${studentVal}&correctval=${correctVal}&fRule=${rule}`;

  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (response) {
        logResponse &&
          console.log(`response from mathematica: ${response.body}`);
        resolve(response.body);
      } else if (error) {
        console.log(error);
        reject(error);
      }
    });
  });
}

function gradeMathematicaExprUsingMathematica(question, response, logResponse) {
  const studentVal = encodeURIComponent(response.expr);
  const correctVal = encodeURIComponent(
    question.correctAnswer?.expr || question.correctExpression
  );

  const request = require("request");

  const options = {
    method: "GET",
    url: chooseMathematicaURL(question.subtype),
  };

  logResponse && console.log("request sent to: " + options.url);

  logResponse && console.log(`The following data was sent to mathematica: `);

  logResponse &&
    console.table({
      studentVal: studentVal,
      correctVal: correctVal,
    });

  options.url =
    options.url + `studentval=${studentVal}&correctval=${correctVal}`;

  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (response) {
        logResponse &&
          console.log(`response from mathematica: ${response.body}`);
        resolve(response.body);
      } else if (error) {
        console.log(error);
        reject(error);
      }
    });
  });
}

function gradeListUsingMathematica(question, response, logResponse) {
  const studentVal = encodeURIComponent(response.text);
  const correctVal = encodeURIComponent(question.correctAnswer?.text);

  const request = require("request");

  const options = {
    method: "GET",
    url: chooseMathematicaURL(question.subtype),
  };

  logResponse && console.log("request sent to: " + options.url);

  logResponse && console.log(`The following data was sent to mathematica: `);

  logResponse &&
    console.table({
      studentVal: studentVal,
      correctVal: correctVal,
    });

  options.url =
    options.url + `studentval=${studentVal}&correctval=${correctVal}`;

  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (response) {
        logResponse &&
          console.log(`response from mathematica: ${response.body}`);
        resolve(response.body);
      } else if (error) {
        console.log(error);
        reject(error);
      }
    });
  });
}

function gradeChemFormulaUsingMathematica(question, response, logResponse) {
  const studentVal = encodeURIComponent(response.chemFormula);
  const correctVal = encodeURIComponent(
    question.correctAnswer?.chemFormula || question.chemFormula
  );

  console.log(studentVal);
  console.log(correctVal);

  const request = require("request");

  const options = {
    method: "GET",
    url: question.correctAnswer
      ? chooseMathematicaBetaURL(question.subtype)
      : chooseMathematicaURL(question.subtype),
  };

  logResponse && console.log("request sent to: " + options.url);

  logResponse && console.log(`The following data was sent to mathematica: `);

  logResponse &&
    console.table({
      studentVal: studentVal,
      correctVal: correctVal,
    });

  options.url =
    options.url + `studentval=${studentVal}&correctval=${correctVal}`;

  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (response) {
        logResponse &&
          console.log(`response from mathematica: ${response.body}`);
        resolve(response.body);
      } else if (error) {
        console.log(error);
        reject(error);
      }
    });
  });
}

function chooseMathematicaURL(subtype) {
  const endpoint = process.env.REACT_APP_MATHEMATICA_API_ENDPOINT;
  switch (subtype) {
    case "number":
      return `${endpoint}/valueOnlyGradingFunc?`;
    case "measurement":
      return `${endpoint}/valueUnitGradingFunc?`;
    case "measurement with feedback":
      return `${endpoint}/gradeMeasurementFB?`;
    case "measurement with rule":
      return `${endpoint}/gradeWithRule?`;
    case "expr with rule":
      return `${endpoint}/gradeWithRule?`;
    case "vector":
      return `${endpoint}/vecsGradingFunc?`;
    case "vector with unit":
      return `${endpoint}/vecsWunitsGradingFunc?`;
    case "vector symbolic":
      return `${endpoint}/symbolicVecGradingFunc?`;
    case "symbolic":
      return `${endpoint}/symbolicGradingFunc?`;
    case "mathematica expression":
      return `${endpoint}/MMAGradingFunc?`;
    case "mathematica list":
      return `${endpoint}/gradeMMAList?`;
    case "chemical formula":
      return `${endpoint}/gradeChemFormula?`;
    default:
      break;
  }
}

function chooseMathematicaBetaURL(subtype) {
  const endpoint = process.env.REACT_APP_MATHEMATICA_API_ENDPOINT;
  switch (subtype) {
    case "number":
      return `${endpoint}/gradeNumberBeta?`;
    case "measurement":
      return `${endpoint}/gradeMeasurementBeta?`;
    case "measurement with feedback":
      return `${endpoint}/gradeMeasurementFB?`;
    case "measurement with rule":
      return `${endpoint}/gradeWithRule?`;
    case "expr with rule":
      return `${endpoint}/gradeWithRule?`;
    case "vector":
      return `${endpoint}/vecsBeta?`;
    case "vector with unit":
      return `${endpoint}/vecsWunitsBeta?`;
    case "vector expr":
      return `${endpoint}/symbolicVecsBeta?`;
    case "expr":
      return `${endpoint}/symbolicGradingFunc?`;
    case "mathematica expression":
      return `${endpoint}/MMAGradingFunc?`;
    case "chemical formula":
      return `${endpoint}/gradeChemFormula?`;
    default:
      break;
  }
}

function extractAnsweredCorrectly(response) {
  const responseArray = response.substring(1, response.length - 1).split(",");
  if (!responseArray[0]) return false;
  return responseArray[0] === "true" ? true : false;
}

function tidyPoints(submittedQuestion, answeredCorrectly) {
  switch (answeredCorrectly) {
    case true:
      return {
        earnedPoints: submittedQuestion.possiblePoints,
        answeredCorrectly: true,
      };
    case false:
      return { earnedPoints: 0, answeredCorrectly: false };
    default:
      break;
  }
}
