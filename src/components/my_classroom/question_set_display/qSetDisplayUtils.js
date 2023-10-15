import { alphabet } from "../../../app/utils/utils.js";

export function generateResponseID(questionID, partIndex) {
  if (partIndex < 0) {
    return questionID;
  } else if (partIndex >= 0) {
    return `${questionID}_${alphabet[partIndex]}`;
  }
}

export function generateEarnedPointsID(questionID, partIndex) {
  if (partIndex < 0) {
    return `${questionID}_earnedPoints`;
  }
  if (partIndex < 0) {
    return `${questionID}_${alphabet[partIndex]}_earnedPoints`;
  }
}

export function findIndexesOfCorrect(answerChoices) {
  const correctAnswerIndexes = [];
  answerChoices.forEach((element, index) => {
    if (element.isCorrect) {
      correctAnswerIndexes.push(index);
    }
  });
  return correctAnswerIndexes;
}

export function attachPartLabel(question) {
  return question.parts.map(
    (part, index) => `${question.id}_${alphabet[index]}`
  );
}
