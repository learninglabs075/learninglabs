import { makeTagsSearchable } from "../../../app/utils/utils";

const titleCardValues = {
  type: "title card",
  title: "",
  body: "",
};

export const infoCardValues = {
  type: "info card",
  info: "",
};

export const multipleChoiceValues = {
  type: "multiple choice",
  prompt: "",
  answerChoices: [
    {
      answerChoice: "",
      isCorrect: false,
    },
    {
      answerChoice: "",
      isCorrect: false,
    },
    {
      answerChoice: "",
      isCorrect: false,
    },
    {
      answerChoice: "",
      isCorrect: false,
    },
  ],
  possiblePoints: 1,
  scoringMethod: "allOrNothing",
  attemptsAllowed: 1,
};

export const shortAnswerValues = {
  type: "short answer",
  subtype: "placeholder",
  prompt: "",
  correctAnswer: {
    acceptAlternateSpacing: true,
    acceptAlternateCapitalization: true,
    number: "",
    percentTolerance: "",
    unit: "",
    vector: "",
    vectorExpr: "",
    expr: "",
    chemFormula: "",
  },
  match: "exact",
  possiblePoints: 1,
  attemptsAllowed: 1,
};

export const freeResponseValues = {
  type: "free response",
  prompt: "",
  correctAnswer: { example: "" },
  characterLimit: "1000",
  possiblePoints: 1,
};

export const fileUploadValues = {
  type: "file upload",
  prompt: "",
  possiblePoints: 1,
  accept: [],
};

const secondaryValues = {
  tags: [],
  currentTag: "",
  solution: "",
  auxillaryFiles: [],
};

export function pickInitialValues(selectedTab, question, edit) {
  if (edit && selectedTab === question.type) {
    question.currentTag = "";
    switch (question.type) {
      case "title card":
      case "multiple choice":
      case "free response":
      case "file upload":
      case "multipart":
        return question;
      case "short answer": {
        if (!question.correctAnswer)
          question.correctAnswer = getSavedCorrectAnswer(question);
        question.match =
          question.correctAnswer?.percentTolerance > 0
            ? "withinRange"
            : "exact";
        return question;
      }
      default:
        return question;
    }
  }

  if (!edit)
    switch (selectedTab) {
      case "title card":
        return titleCardValues;
      case "multiple choice":
        return { ...multipleChoiceValues, ...secondaryValues };
      case "short answer":
        return { ...shortAnswerValues, ...secondaryValues };
      case "free response":
        return { ...freeResponseValues, ...secondaryValues };
      case "file upload":
        return { ...fileUploadValues, ...secondaryValues };
      default:
        break;
    }
}

function getSavedCorrectAnswer(question) {
  // for question data in old format
  switch (question.subtype) {
    case "wordOrPhrase":
      return {
        text: question.correctWordOrPhrase || "",
        acceptAlternateSpacing: question.acceptAlternateSpacing || true,
        acceptAlternateCapitalization:
          question.acceptAlternateCapitalization || true,
      };
    case "number":
      return {
        number: question.correctNumber || "",
        percentTolerance: question.percentTolerance || 0,
      };
    case "measurement":
      return {
        number: question.correctNumber || "",
        unit: question.correctUnit || "",
        percentTolerance: question.percentTolerance || 0,
      };
    case "measurement with feedback":
      return {
        number: question.correctNumber || "",
        unit: question.correctUnit || "",
        percentTolerance: question.percentTolerance || 0,
      };
    case "symbolic":
      return {
        vector: question.correctNumber || "",
      };
    case "expr with rule":
      return {
        vector: question.correctNumber || "",
      };
    case "vector symbolic":
      return {
        vectorExpr: question.correctNumber || "",
      };

    case "vector":
      return {
        vector: question.correctNumber || "",
        percentTolerance: question.percentTolerance || 0,
      };
    case "vector with unit":
      return {
        vector: question.correctNumber || "",
        unit: question.correctUnit || "",
        percentTolerance: question.percentTolerance || 0,
      };

    default:
      break;
  }
}

export function tidy(values, addOrEdit) {
  const type = values.type;
  switch (type) {
    case "multiple choice":
      return tidyMultipleChoice(values);
    case "short answer":
      return tidyShortAnswer(values);
    case "free response":
      return tidyFreeResponse(values);
    case "title card":
      return tidyTitleCard(values);
    case "file upload":
      return tidyFileUpload(values);
    case "multipart":
      return tidyMultipart(values);
    default:
      break;
  }
}

//Deal with users who add inlinetex to editor not code behind it.
function removeDuplicateInlineTexTags(str) {
  if (!str) return "";

  let newStr = str;
  newStr = newStr.replaceAll("<inlinetex><inlinetex>", "<inlinetex>");
  newStr = newStr.replaceAll("</inlinetex></inlinetex>", "</inlinetex>");
  return newStr;
}

function removeDuplicateInlineTexTagsFromAnswers(answerChoices) {
  if (!Array.isArray(answerChoices)) return [];

  const modifiedChoices = [];

  answerChoices.forEach((el) => {
    const modifiedChoice = el.answerChoice
      .replaceAll("<inlinetex><inlinetex>", "<inlinetex>")
      .replaceAll("</inlinetex></inlinetex>", "</inlinetex>");

    modifiedChoices.push({
      answerChoice: modifiedChoice,
      isCorrect: el.isCorrect,
    });
  });

  return modifiedChoices;
}

function replacePromptCharEnt(str) {
  if (!str) return "";
  // sunEditor replaces characters like "<" with entities like "&lt;"
  // this function replaces the entity name with its original character
  // so tags like <InlineTeX> can be submitted to firestore
  const modifiedPrompt = str.replaceAll("&lt;", "<").replaceAll("&gt;", ">");
  return modifiedPrompt;
}

function replaceAnsCharEnt(answerChoices) {
  if (!Array.isArray(answerChoices)) return [];

  const modifiedChoices = [];

  answerChoices.forEach((el) => {
    const modifiedChoice = el.answerChoice
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">");

    modifiedChoices.push({
      answerChoice: modifiedChoice,
      isCorrect: el.isCorrect,
    });
  });

  return modifiedChoices;
}

function tidyTitleCard(values) {
  return {
    type: values.type,
    title: values.title,
    body: values.body,
  };
}

function tidyMultipleChoice(values) {
  return {
    type: values.type,
    prompt: removeDuplicateInlineTexTags(replacePromptCharEnt(values.prompt)),
    answerChoices: removeDuplicateInlineTexTagsFromAnswers(
      replaceAnsCharEnt(values.answerChoices)
    ),
    possiblePoints: values.possiblePoints || 0,
    attemptsAllowed: values.attemptsAllowed || 1,
    scoringMethod: values.scoringMethod,
    tags: values.tags,
    tags_searchable: makeTagsSearchable(values.tags),
    solution: values.solution || "",
    auxillaryFiles: values.auxillaryFiles || [],
  };
}

function tidyFreeResponse(values) {
  return {
    type: values.type,
    prompt: removeDuplicateInlineTexTags(replacePromptCharEnt(values.prompt)),
    correctAnswer: {
      example: values.correctAnswer
        ? values.correctAnswer?.example
        : values.typicalAnswer,
    },
    characterLimit: values.characterLimit || 1000,
    possiblePoints: values.possiblePoints || 0,
    tags: values.tags,
    tags_searchable: makeTagsSearchable(values.tags),
    solution: values.solution || "",
    auxillaryFiles: values.auxillaryFiles || [],
  };
}

export function tidyShortAnswer(values) {
  const base = {
    type: values.type,
    subtype: values.subtype,
    prompt: removeDuplicateInlineTexTags(replacePromptCharEnt(values.prompt)),
    possiblePoints: values.possiblePoints || 0,
    attemptsAllowed: values.attemptsAllowed || 1,
    tags: values.tags,
    tags_searchable: makeTagsSearchable(values.tags),
    solution: values.solution || "",
    auxillaryFiles: values.auxillaryFiles || [],
  };

  switch (values.subtype) {
    case "text":
    case "wordOrPhrase":
      return Object.assign(base, {
        subtype: "text",
        correctAnswer: {
          text: values.correctAnswer.text,
          acceptAlternateSpacing: values.correctAnswer.acceptAlternateSpacing,
          acceptAlternateCapitalization:
            values.correctAnswer.acceptAlternateCapitalization,
        },
      });
    case "number":
      return Object.assign(base, {
        correctAnswer: {
          number: values.correctAnswer.number,
          percentTolerance:
            values.match === "exact"
              ? 0
              : values.correctAnswer.percentTolerance,
        },
      });
    case "measurement":
    case "measurement with feedback":
      return Object.assign(base, {
        correctAnswer: {
          number: values.correctAnswer.number,
          unit: values.correctAnswer.unit,
          percentTolerance:
            values.match === "exact"
              ? 0
              : values.correctAnswer.percentTolerance,
        },
      });
    case "measurement with rule":
      return Object.assign(base, {
        correctAnswer: {
          number: values.correctAnswer.number,
          unit: values.correctAnswer.unit,
          percentTolerance:
            values.match === "exact"
              ? 0
              : values.correctAnswer.percentTolerance,

          ...(values.correctAnswer.rule && {
            rule: values.correctAnswer.rule,
          }),
          ...(values.correctAnswer.unitRule && {
            unitRule: values.correctAnswer.unitRule,
          }),
        },
      });
    case "expr":
      return Object.assign(base, {
        correctAnswer: { expr: values.correctAnswer.expr },
      });

    case "mathematica expression":
      return Object.assign(base, {
        correctAnswer: { expr: values.correctAnswer.expr },
      });
    case "mathematica list":
      return Object.assign(base, {
        correctAnswer: { text: values.correctAnswer.text },
      });

    case "vector":
      return Object.assign(base, {
        correctAnswer: {
          vector: values.correctAnswer.vector,
          percentTolerance:
            values.match === "exact"
              ? 0
              : values.correctAnswer.percentTolerance,
        },
      });

    case "vector with unit":
      return Object.assign(base, {
        correctAnswer: {
          vector: values.correctAnswer.vector,
          unit: values.correctAnswer.unit,
          percentTolerance:
            values.match === "exact"
              ? 0
              : values.correctAnswer.percentTolerance,
        },
      });

    case "vector expr":
      return Object.assign(base, {
        correctAnswer: {
          vectorExpr: values.correctAnswer.vectorExpr,
        },
      });

    case "expr with rule":
      return Object.assign(base, {
        correctAnswer: {
          ...(values.correctAnswer.expr && {
            expr: values.correctAnswer.expr,
          }),
          rule: values.correctAnswer.rule,
        },
      });

    case "chemical formula":
      return Object.assign(base, {
        correctAnswer: {
          chemFormula: values.correctAnswer.chemFormula,
        },
      });

    default:
      return values;
  }
}

function tidyFileUpload(values) {
  return {
    type: values.type,
    prompt: removeDuplicateInlineTexTags(replacePromptCharEnt(values.prompt)),
    accept: values.accept || [],
    possiblePoints: values.possiblePoints || 0,
    tags: values.tags,
    tags_searchable: makeTagsSearchable(values.tags),
    solution: values.solution || "",
    auxillaryFiles: values.auxillaryFiles || [],
  };
}

function tidyMultipart(values) {
  return {
    header: values.header
      ? removeDuplicateInlineTexTags(replacePromptCharEnt(values.header))
      : "",
    type: values.type,
    // parts: values.parts,
    parts: tidyMultipartPrompts(values.parts),
    tags: values.tags,
    tags_searchable: makeTagsSearchable(values.tags),
    solution: values.solution || "",
    auxillaryFiles: values.auxillaryFiles || [],
  };
}

function tidyMultipartPrompts(parts) {
  // replace character entities like &lt; with < to compensate for SunEditor
  const tidiedParts = [];
  console.log(parts);
  if (!parts.length || parts.length === 0) return parts;
  parts.forEach((part) => {
    console.log(part);
    const tidiedPart = { ...part };
    if (tidiedPart.prompt)
      tidiedPart.prompt = removeDuplicateInlineTexTags(
        replacePromptCharEnt(part.prompt)
      );
    tidiedParts.push(tidiedPart);
  });

  return tidiedParts;
}
