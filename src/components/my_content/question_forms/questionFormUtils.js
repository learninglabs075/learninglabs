import { addQuestionToSet } from "../../../app/firestoreClient.js";
import { addQuestionToMyLibrary } from "../../../app/firestoreClient.js";
import { updateQuestionInSet } from "../../../app/firestoreClient.js";
import { updateQuestionInMyLibrary } from "../../../app/firestoreClient.js";
import { addQuestionToProductLibrary } from "../../../app/firestoreClient.js";
import { updateQuestionInProductLibrary } from "../../../app/firestoreClient.js";
import { generateTotalPossiblePoints } from "../../../app/firestoreClient.js";

//TODO ENV Page

function updateQuestionSet(questions, questionSetID, tidiedValues, userID) {
  console.log(tidiedValues);
  const updatedQuestions = questions.map((question, index) => {
    if (question.id === tidiedValues.id) {
      question = tidiedValues;
    }
    return question;
  });

  console.log(updatedQuestions);
  // console.log(updatedQuestions);
  updateQuestionInSet(questionSetID, updatedQuestions, userID);
}

export function saveQuestion(
  tidiedValues,
  addOrEdit,
  saveTo,
  productLibraryID,
  libraryQuestionID,
  userID,
  questionSetID,
  questions
) {
  switch (saveTo) {
    case "my_library":
      if (addOrEdit === "add") {
        try {
          addQuestionToMyLibrary(tidiedValues, userID);
        } catch (error) {
          console.log(error.message);
        }
      }
      if (addOrEdit === "edit") {
        try {
          updateQuestionInMyLibrary(libraryQuestionID, tidiedValues, userID);
        } catch (error) {
          console.log(error.message);
        }
      }
      break;
    case "my_question_sets":
      if (addOrEdit === "add") {
        try {
          addQuestionToSet(questionSetID, tidiedValues, userID);
          generateTotalPossiblePoints(questionSetID, userID);
        } catch (error) {
          console.log(error.message);
        }
      }
      if (addOrEdit === "edit") {
        try {
          updateQuestionSet(questions, questionSetID, tidiedValues, userID);
          generateTotalPossiblePoints(questionSetID, userID);
        } catch (error) {
          console.log(error.message);
        }
      }
      break;

    case process.env.REACT_APP_PRODUCT_COLLECTION:
      if (addOrEdit === "add") {
        try {
          addQuestionToProductLibrary(tidiedValues, productLibraryID);
        } catch (error) {
          console.log(error.message);
        }
      } else if (addOrEdit === "edit") {
        try {
          updateQuestionInProductLibrary(
            productLibraryID,
            libraryQuestionID,
            tidiedValues
          );
        } catch (error) {
          console.log(error.message);
        }
      }
      break;
    default:
      break;
  }
}
