import React from "react";
import { Box, Typography, Card, CardActionArea } from "@material-ui/core";
import { renderQuestionSnippet } from "../../app/utils/utils.js";
import {
  deleteQuestionFromSet,
  generateTotalPossiblePoints,
  updateQuestionSetQuestionsOrder,
} from "../../app/firestoreClient.js";
import DragIndicatorIcon from "@material-ui/icons/DragIndicator";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

//TODO ENV Page

export default function QuestionSnippetsDraggable({
  selectedQuestion,
  selectedQuestionSet,
  setSelectedQuestion,
  setSelectedQuestionSet,
  userID,
}) {
  if (!selectedQuestionSet.id) return null;

  const { id: questionSetID, questions, shared } = selectedQuestionSet;

  const onDragEnd = async (result) => {
    const { destination, source } = result;
    const notReordered =
      destination?.droppableId === source.droppableId &&
      destination?.index === source.index;

    if (!destination) return;
    if (notReordered) return;

    const reorderedQuestions = [...questions];
    const [removed] = reorderedQuestions.splice(source.index, 1);
    reorderedQuestions.splice(destination.index, 0, removed);

    const selectedQuestionSetCopy = JSON.parse(
      JSON.stringify(selectedQuestionSet)
    );
    selectedQuestionSetCopy.questions = reorderedQuestions;
    setSelectedQuestionSet(() => selectedQuestionSetCopy);

    await updateQuestionSetQuestionsOrder(
      userID,
      questionSetID,
      reorderedQuestions
    );
  };

  return (
    <Box className="question-list">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided, snapshot) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {questions?.map((question, qIndex) => (
                <Draggable
                  key={question.id}
                  draggableId={question.id}
                  index={qIndex}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <Card
                        key={question.id}
                        className="flex whitesmoke"
                        style={{
                          margin: "3px",
                        }}
                      >
                        {!shared && (
                          <DragIndicatorIcon
                            id="draggable-dialog-title"
                            style={{
                              backgroundColor: "none",
                              cursor: "move",
                              color: "rgba(0,0,0,0.2)",
                              margin: "auto",
                            }}
                          />
                        )}
                        <CardActionArea
                          onClick={() => setSelectedQuestion(question)}
                        >
                          <Box display="flex" pl={2}>
                            <Typography
                              variant="subtitle1"
                              align="left"
                              color="textSecondary"
                            >
                              {renderQuestionSnippet(question)}
                            </Typography>
                          </Box>
                        </CardActionArea>
                        {!shared && (
                          <button
                            className="delete-button margin-x-tiny hover-pointer-default"
                            onClick={() => {
                              deleteQuestionFromSet(
                                qIndex,
                                questions,
                                questionSetID,
                                userID
                              );
                              generateTotalPossiblePoints(
                                questionSetID,
                                userID
                              );
                              if (
                                selectedQuestion?.id === questions[qIndex]?.id
                              )
                                setSelectedQuestion({});
                            }}
                          >
                            X
                          </button>
                        )}
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </Box>
  );
}
