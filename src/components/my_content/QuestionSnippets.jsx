import React from "react";
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  Checkbox,
  FormControlLabel,
} from "@material-ui/core";
import { renderQuestionSnippet } from "../../app/utils/utils.js";
import {
  deleteQuestionFromProductLibrary,
  deleteQuestionFromMyLibrary,
} from "../../app/firestoreClient.js";

export default function QuestionSnippets({
  currentLibrary,
  currentPage,
  deleteFrom,
  importList,
  isFetching,
  fetchPreviousPage,
  libraryImport,
  libraryIndex,
  productLibraryID,
  queryCount,
  questions,
  searchTerms,
  selectedForImport,
  setCurrentPage,
  setImportList,
  setQueryCount,
  setSelectedForImport,
  setSelectedQuestion,
  userID,
  readonly,
}) {
  function addToImportList(event, question) {
    question.libraryType =
      libraryIndex === 0
        ? "my_library"
        : process.env.REACT_APP_PRODUCT_COLLECTION;

    if (libraryIndex === 0) question.originalAuthorID = userID;
    if (libraryIndex > 0) question.libraryID = currentLibrary.id;

    if (event.target.checked) {
      setImportList([...importList, question]);
    } else if (!event.target.checked) {
      setImportList(importList.filter((item) => item.id !== question.id));
    }
  }

  return (
    <Box className="question-list">
      {!isFetching &&
        questions?.map((question, index) => (
          <Card
            key={question.id}
            style={{
              backgroundColor: "whitesmoke",
              margin: "3px",
            }}
          >
            <Box display="flex">
              <CardActionArea onClick={() => setSelectedQuestion(question)}>
                <Box maxWidth="300px" className="overflow-hidden" pl={2}>
                  <Typography
                    variant="subtitle1"
                    align="left"
                    color="textSecondary"
                  >
                    {renderQuestionSnippet(question)}
                  </Typography>
                </Box>
              </CardActionArea>
              {!libraryImport && !readonly && (
                <button
                  className="delete-button margin-x-tiny hover-pointer-default"
                  onClick={() => {
                    switch (deleteFrom) {
                      case process.env.REACT_APP_PRODUCT_COLLECTION: {
                        deleteQuestionFromProductLibrary(
                          question.id,
                          productLibraryID
                        );
                        break;
                      }
                      case "my_library": {
                        deleteQuestionFromMyLibrary(question.id, userID);
                        if (questions.length === 1 && currentPage > 1) {
                          setCurrentPage(() => currentPage - 1);
                          fetchPreviousPage(searchTerms);
                        }
                        if (searchTerms.length > 0) {
                          setQueryCount(() => queryCount - 1);
                        }
                        break;
                      }
                      default:
                        break;
                    }
                  }}
                >
                  X
                </button>
              )}
              {libraryImport && (
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      checked={selectedForImport[index] || false}
                      onChange={(event) =>
                        setSelectedForImport({
                          ...selectedForImport,
                          [event.target.name]: event.target.checked,
                        })
                      }
                      onClick={(event) => addToImportList(event, question)}
                    />
                  }
                />
              )}
            </Box>
          </Card>
        ))}
    </Box>
  );
}
