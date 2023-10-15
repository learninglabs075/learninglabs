import React, { useState, useEffect } from "react";
import { Box, Typography, Select, MenuItem } from "@material-ui/core";
import firebase from "../../app/config/firebaseConfig.js";
import QuestionSetCard from "./question_set_display/QuestionSetCard.jsx";

export default function QuestionsSubpage({ userID }) {
  const [questionSets, setQuestionSets] = useState([]);
  const [qSetIndex, setQSetIndex] = useState(-1);

  const handleQSetSelect = (event) => {
    setQSetIndex(event.target.value);
  };

  const currentQuestionSet = questionSets[qSetIndex];

  useEffect(() => {
    const unsubscribe = fetchMyQuestionSets(userID, setQuestionSets);
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  return (
    <Box className="display-area flex-column">
      <Box className="subpage-header flex justify-start">
        <Typography variant="h3" color="primary">
          Questions
        </Typography>
        <Box className="padding-left-medium">
          <Select
            value={qSetIndex}
            onChange={handleQSetSelect}
            displayEmpty
            variant="outlined"
          >
            <MenuItem value={-1} disabled>
              <Typography color="textSecondary">
                select a question set
              </Typography>
            </MenuItem>
            {questionSets.map((questionSet, qSetIndex) => (
              <MenuItem key={questionSet.id} value={qSetIndex}>
                {questionSet.title}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>

      {qSetIndex < 0 && (
        <Box className="flex please-select-item">
          <Typography color="primary">
            (please select a question set)
          </Typography>
        </Box>
      )}

      {qSetIndex >= 0 && (
        <Box className="justify-center full-width">
          <QuestionSetCard
            questionSet={currentQuestionSet}
            courseID={null}
            assignmentID={null}
            collection="my_responses"
            userID={userID}
          />
        </Box>
      )}
    </Box>
  );
}

function fetchMyQuestionSets(userID, setQuestionSets) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .orderBy("title");

  ref.onSnapshot((querySnapshot) => {
    const fetchedItems = [];
    querySnapshot.forEach((doc) => {
      if (doc.data().type !== "Folder") {
        fetchedItems.push({
          id: doc.id,
          ...doc.data(),
        });
      }
    });

    setQuestionSets((prevState) => fetchedItems);
  });
}
