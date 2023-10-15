import React, { useState } from "react";
import { Box, Chip, Card, Button, Link, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Alert from "@material-ui/lab/Alert";
import { CloudUpload, Copyright } from "@material-ui/icons/";
import QuestionEditor from "../QuestionEditor.jsx";
import MultipartEditor from "../MultipartEditor.jsx";
import FileUpload from "../../../app/utils/FileUpload.js";
import {
  generateStoragePath,
  generateFirestoreRef,
} from "./questionPreviewUtils.js";
import {
  PreviewHeader,
  MultipleChoicePreview,
  ShortAnswerPreview,
  FreeResponsePreview,
  TitleCardPreview,
  FileUploadPreview,
  InfoCardPreview,
  MultipartHeaderPreview,
} from "./QuestionPreviewCpnts.jsx";
import { alphabet } from "../../../app/utils/utils.js";
import firebase from "../../../app/config/firebaseConfig.js";

const QuestionPreviewStyles = makeStyles((theme) => ({
  previewCard: {
    minHeight: 50,
    width: 230,
    margin: 8,
    padding: 15,
    backgroundColor: "whitesmoke",
    flexWrap: "wrap",
    "& > *": {
      margin: theme.spacing(0.5),
    },
  },
}));

export default function QuestionPreviewCard({
  disableEdit,
  license,
  productLibraryID,
  question,
  questionSet,
  saveTo,
  userID,
  readonly,
}) {
  const classes = QuestionPreviewStyles();
  const [solutionFile, setSolutionFile] = useState(null);
  const [auxillaryFile, setAuxillaryFile] = useState(null);
  const [uploadSolnError, setUploadSolnError] = useState(false);
  const [uploadAuxError, setUploadAuxError] = useState(false);

  if (!question?.id)
    return (
      <Box className="empty-question-preview">
        <Typography color="primary">Select a question to preview.</Typography>
      </Box>
    );

  const questionSetID = questionSet?.id;
  const questions = questionSet?.questions;

  const solnStoragePath = generateStoragePath(
    saveTo,
    userID,
    productLibraryID,
    solutionFile?.name || question.solution?.name,
    "solution"
  );

  const auxFileStoragePath = generateStoragePath(
    saveTo,
    userID,
    productLibraryID,
    auxillaryFile?.name,
    "auxFile"
  );

  const customFirestoreRef = generateFirestoreRef(
    saveTo,
    userID,
    questionSetID,
    question.id,
    productLibraryID
  );

  const types = [
    "image/png",
    "image/jpeg",
    "application/pdf",
    "application/vnd.wolfram.mathematica",
    "application/vnd.wolfram.cdf",
  ];

  const handleSolutionFile = (e) => {
    let selected = e.target.files[0];
    if (selected && types.includes(selected.type)) {
      setSolutionFile(selected);
      setUploadSolnError(false);
    } else {
      setSolutionFile(null);
      setUploadSolnError(true);
    }
  };

  const handleAuxillaryFile = (e) => {
    let selected = e.target.files[0];
    if (selected && types.includes(selected.type)) {
      setAuxillaryFile(selected);
      setUploadAuxError(false);
    } else {
      setAuxillaryFile(null);
      setUploadAuxError(true);
    }
  };

  async function deleteSolution() {
    const solnStorageRef = firebase.storage().ref().child(solnStoragePath);
    if (saveTo === "my_question_sets") {
      const updatedQuestions = questions?.map((el) => {
        if (el.id === question.id) el.solution = "";
        return el;
      });
      await solnStorageRef
        .delete()
        .then(() => customFirestoreRef.update({ questions: updatedQuestions }))
        .catch(() => "an error occurred - unable to delete solution file");
    }

    if (
      saveTo === "my_library" ||
      saveTo === process.env.REACT_APP_PRODUCT_COLLECTION
    ) {
      await solnStorageRef
        .delete()
        .then(() => customFirestoreRef.update({ solution: "" }))
        .catch(() => "an error occurred - unable to delete solution file");
    }
  }

  async function deleteAuxillaryFile(auxFile, auxFileIndex) {
    const { name } = auxFile;

    const storagePath = generateStoragePath(
      saveTo,
      userID,
      productLibraryID,
      name,
      "auxFile"
    );
    const auxFileStorageRef = firebase.storage().ref().child(storagePath);

    if (saveTo === "my_question_sets") {
      const updatedQuestions = questions?.map((el) => {
        if (el.id === question.id) el.auxillaryFiles.splice(auxFileIndex, 1);
        return el;
      });
      await auxFileStorageRef.delete().then(() =>
        customFirestoreRef.update({
          questions: updatedQuestions,
        })
      );
    }

    if (
      saveTo === "my_library" ||
      saveTo === process.env.REACT_APP_PRODUCT_COLLECTION
    ) {
      const updatedAuxFiles = question.auxillaryFiles.filter(
        (el, ind) => ind !== auxFileIndex
      );
      await auxFileStorageRef
        .delete()
        .then(() =>
          customFirestoreRef.update({ auxillaryFiles: updatedAuxFiles })
        );
    }
  }

  return (
    <Box
      className="question-preview-container relative"
      style={{ marginTop: "40px" }}
    >
      <Card
        className="question-preview-card"
        style={{ backgroundColor: "whitesmoke", overflow: "auto" }}
      >
        <PreviewHeader
          questionType={question.type}
          questionID={question.id}
          saveTo={saveTo}
        />

        {question.type === "multiple choice" && (
          <MultipleChoicePreview question={question} />
        )}
        {question.type === "short answer" && (
          <ShortAnswerPreview question={question} />
        )}
        {question.type === "free response" && (
          <FreeResponsePreview question={question} />
        )}
        {question.type === "title card" && (
          <TitleCardPreview question={question} />
        )}
        {question.type === "file upload" && (
          <FileUploadPreview question={question} />
        )}
        {question.type === "multipart" && question.header && (
          <MultipartHeaderPreview question={question} />
        )}
        {question.type === "multipart" &&
          question.parts.map((question, partIndex) => (
            <Box key={`part${partIndex}`} style={{ paddingBottom: "50px" }}>
              <Typography>{`PART ${alphabet[partIndex]}`}</Typography>
              {question.type === "info card" && (
                <InfoCardPreview question={question} />
              )}
              {question.type === "multiple choice" && (
                <MultipleChoicePreview question={question} />
              )}
              {question.type === "short answer" && (
                <ShortAnswerPreview question={question} />
              )}
              {question.type === "free response" && (
                <FreeResponsePreview question={question} />
              )}
              {question.type === "title card" && (
                <TitleCardPreview question={question} />
              )}
              {question.type === "file upload" && (
                <FileUploadPreview question={question} />
              )}
            </Box>
          ))}
        <CopyrightLicense license={license} />

        <Box style={{ position: "absolute", top: 415, left: 510 }}>
          {question.type !== "multipart" && !disableEdit ? (
            <QuestionEditor
              productLibraryID={productLibraryID}
              question={question}
              questions={questions}
              questionSetID={questionSetID}
              saveTo={saveTo}
              userID={userID}
              readonly={readonly}
            />
          ) : null}
          {question.type === "multipart" && !disableEdit ? (
            <MultipartEditor
              productLibraryID={productLibraryID}
              question={question}
              questions={questions}
              questionSetID={questionSetID}
              saveTo={saveTo}
              userID={userID}
            />
          ) : null}
        </Box>
      </Card>

      <Box className="flex-column">
        {showPreview(question.type) && (
          <Card
            className="scoring-preview-card"
            style={{ backgroundColor: "whitesmoke" }}
          >
            <Typography variant="subtitle2" color="textSecondary">
              Scoring
            </Typography>
            <Typography display="inline">
              {question.possiblePoints} points
            </Typography>
          </Card>
        )}

        {showAttemptsPreview(question.type) && (
          <Card className={classes.previewCard}>
            <Typography variant="subtitle2" color="textSecondary">
              Attempts Allowed
            </Typography>
            <Typography display="inline">
              {question?.attemptsAllowed}
            </Typography>
          </Card>
        )}

        {question.tags && (
          <Card className={classes.previewCard}>
            <Typography variant="subtitle2" color="textSecondary">
              Tags
            </Typography>
            {question.tags.map((element, index) => (
              <Chip key={index} label={element} />
            ))}
          </Card>
        )}

        {showPreview(question.type) && (
          <Card
            className="solution-preview-card"
            style={{ backgroundColor: "whitesmoke" }}
          >
            <Typography variant="subtitle2" color="textSecondary">
              Solution
            </Typography>
            <Box>
              {uploadSolnError && (
                <Alert severity="warning">
                  Please select a png, jpeg, or pdf file
                </Alert>
              )}
              {solutionFile && <Typography>{solutionFile.name}</Typography>}
              {solutionFile && (
                <FileUpload
                  category="solution"
                  file={solutionFile}
                  firestoreRef={customFirestoreRef}
                  question={question}
                  questions={questions}
                  setFile={setSolutionFile}
                  storagePath={solnStoragePath}
                />
              )}
            </Box>

            {question.solution && (
              <Box className="flex-align-center space-between">
                <Link
                  className="hover-pointer"
                  style={{ color: "dimgray", fontFamily: "Lato" }}
                  href={question.solution.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {question.solution.name.length < 30
                    ? question.solution.name
                    : question.solution.name.slice(0, 27) + "..."}
                </Link>

                <Box>
                  <button
                    className="delete-button hover-pointer-default"
                    onClick={() => deleteSolution()}
                    disabled={readonly}
                  >
                    X
                  </button>
                </Box>
              </Box>
            )}

            {!question.solution && !disableEdit ? (
              <Box className="flex-column align-center">
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<CloudUpload />}
                  disabled={readonly}
                >
                  Upload
                  <input type="file" hidden onChange={handleSolutionFile} />
                </Button>
              </Box>
            ) : null}
            {disableEdit && !question.solution ? (
              <Typography color="textSecondary">(no solution file)</Typography>
            ) : null}
          </Card>
        )}
        {showPreview(question.type) && (
          <Card
            className="auxfile-preview-card"
            style={{ backgroundColor: "whitesmoke" }}
          >
            <Typography variant="subtitle2" color="textSecondary">
              Auxillary Files
            </Typography>

            {question.auxillaryFiles?.length === 0 && disableEdit ? (
              <Typography color="textSecondary">
                (no auxillary files)
              </Typography>
            ) : null}
            {question.auxillaryFiles?.map((auxFile, auxFileIndex) => (
              <Box
                key={auxFileIndex}
                className="flex-align-center space-between"
              >
                <Typography>
                  <Link
                    className="hover-pointer"
                    style={{ color: "dimgray", fontFamily: "Lato" }}
                    href={auxFile.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {auxFile.name.length < 25
                      ? auxFile.name
                      : auxFile.name.slice(0, 22) + "..."}
                  </Link>
                </Typography>

                {!disableEdit && (
                  <button
                    className="delete-button hover-pointer-default"
                    onClick={() => deleteAuxillaryFile(auxFile, auxFileIndex)}
                    disabled={readonly}
                  >
                    X
                  </button>
                )}
              </Box>
            ))}

            <Box>
              {uploadAuxError && (
                <Alert severity="warning">
                  Please select a png, jpeg, or pdf file
                </Alert>
              )}
              {auxillaryFile && <Typography>{auxillaryFile.name}</Typography>}
              {auxillaryFile && (
                <FileUpload
                  category="auxillaryFile"
                  file={auxillaryFile}
                  firestoreRef={customFirestoreRef}
                  question={question}
                  questions={questions}
                  setFile={setAuxillaryFile}
                  storagePath={auxFileStoragePath}
                />
              )}
            </Box>

            {!disableEdit && (
              <Box className="flex-column align-center">
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<CloudUpload />}
                  disabled={readonly}
                >
                  Upload
                  <input type="file" hidden onChange={handleAuxillaryFile} />
                </Button>
              </Box>
            )}
          </Card>
        )}
      </Box>
    </Box>
  );
}

function CopyrightLicense({ license }) {
  if (!license) return null;

  return (
    <Box style={{ position: "absolute", top: 470, left: 20 }}>
      <Copyright
        className="relative"
        style={{ color: "rgba(0,0,0,0.54)", top: "6px" }}
      />
      {license.titleLink ? (
        <Link
          color="textSecondary"
          href={license.titleLink}
          underline="always"
          style={{
            fontFamily: "Lato",
            marginLeft: "3px",
          }}
          target="_blank"
        >
          {license.title}
        </Link>
      ) : (
        <Typography
          color="textSecondary"
          style={{
            marginLeft: "1px",
          }}
          display="inline"
        >
          {license.title}
        </Typography>
      )}
      <Typography
        color="textSecondary"
        style={{
          marginLeft: "3px",
          marginRight: "3px",
        }}
        display="inline"
      >
        by
      </Typography>
      {license.authorLink ? (
        <Link
          color="textSecondary"
          href={license.authorLink}
          underline="always"
          style={{
            fontFamily: "Lato",
            marginRight: "3px",
          }}
          target="_blank"
        >
          {license.author}
        </Link>
      ) : (
        <Typography
          color="textSecondary"
          display="inline"
          style={{
            marginRight: "3px",
          }}
        >
          {license.author}
        </Typography>
      )}
      <Typography color="textSecondary" display="inline">
        is licensed under {license.type}
      </Typography>
    </Box>
  );
}

function showPreview(questionType) {
  switch (questionType) {
    case "multiple choice":
      return true;
    case "short answer":
      return true;
    case "free response":
      return true;
    case "multipart":
      return true;
    default:
      return false;
  }
}

function showAttemptsPreview(questionType) {
  switch (questionType) {
    case "multiple choice":
      return true;
    case "short answer":
      return true;
    case "free response":
      return false;
    default:
      return false;
  }
}
