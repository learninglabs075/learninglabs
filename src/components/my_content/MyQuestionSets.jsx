import React, { useState, useEffect } from "react";
import { Box, IconButton, Tooltip, Typography } from "@material-ui/core";
import QuestionBuilder from "./QuestionBuilder.jsx";
import MultipartBuilder from "./MultipartBuilder.jsx";
import ImportFromLibrary from "./ImportFromLibrary.jsx";
import QuestionSnippetsDraggable from "./QuestionSnippetsDraggable.jsx";
import EditQuestionSetTitle from "./EditQuestionSetTitle.jsx";
import EditAdaptiveParams from "./EditAdaptiveParams.jsx";
import ShareQuestionSet from "./ShareQuestionSet.jsx";
import QuestionPreviewCard from "./question_preview/QuestionPreviewCard.jsx";
import { AccountTree } from "@material-ui/icons";

export default function MyQuestionSets({
  selectedQuestionSet,
  setSelectedQuestionSet,
  userID,
  userPermissions,
}) {
  const [selectedQuestion, setSelectedQuestion] = useState({});
  const [editTitleOpen, setEditTitleOpen] = useState(false);
  const [editAdaptiveOpen, setEditAdaptiveOpen] = useState(false);

  useEffect(() => {
    if (!selectedQuestion?.id) return;

    const updatedQuestions = selectedQuestionSet.questions;
    const updatedQuestionPreview = updatedQuestions.find(
      (el) => el.id === selectedQuestion.id
    );
    setSelectedQuestion(() => updatedQuestionPreview);

    // eslint-disable-next-line
  }, [selectedQuestionSet]);

  return (
    <Box className="question-list-and-preview-area">
      <Box className="question-list-panel">
        <Box
          pb="10px"
          style={{ position: "relative", left: "15px" }}
          className="flex-center-all"
        >
          <Typography color="primary" variant="h5">
            {selectedQuestionSet?.title || "(no title)"}
          </Typography>
          {/* <IconButton
            style={{ marginLeft: "10px" }}
            size="small"
            variant="extended"
            color="primary"
            onClick={() => setOpen(true)}
          >
            <Edit />
          </IconButton> */}
          <Tooltip title="turn on adaptive mode">
            <IconButton
              style={{ marginLeft: "10px" }}
              size="small"
              variant="extended"
              color="primary"
              onClick={() => setEditAdaptiveOpen(true)}
            >
              <AccountTree />
            </IconButton>
          </Tooltip>
          <EditAdaptiveParams
            open={editAdaptiveOpen}
            selectedQuestionSet={selectedQuestionSet}
            setOpen={setEditAdaptiveOpen}
            userID={userID}
          />

          <EditQuestionSetTitle
            questionSetID={selectedQuestionSet?.id}
            title={selectedQuestionSet?.title}
            parentID={selectedQuestionSet?.parentID}
            userID={userID}
            open={editTitleOpen}
            setOpen={setEditTitleOpen}
          />
          <ShareQuestionSet
            questionSetID={selectedQuestionSet?.id}
            title={selectedQuestionSet?.title}
            userID={userID}
          />
        </Box>
        <QuestionSnippetsDraggable
          selectedQuestion={selectedQuestion}
          selectedQuestionSet={selectedQuestionSet}
          setSelectedQuestion={setSelectedQuestion}
          setSelectedQuestionSet={setSelectedQuestionSet}
          userID={userID}
        />
        <Box className="add-question-my-sets flex-column space-around">
          <QuestionBuilder
            questionSetID={selectedQuestionSet?.id}
            saveTo="my_question_sets"
            userID={userID}
          />
          <MultipartBuilder
            questionSetID={selectedQuestionSet?.id}
            saveTo="my_question_sets"
            userID={userID}
          />
          <ImportFromLibrary
            questionSetID={selectedQuestionSet?.id}
            userID={userID}
            userPermissions={userPermissions}
          />
        </Box>
      </Box>

      <QuestionPreviewCard
        question={selectedQuestion}
        questionSet={selectedQuestionSet}
        saveTo="my_question_sets"
        userID={userID}
      />
    </Box>
  );
}
