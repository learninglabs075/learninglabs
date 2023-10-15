import React, { useState } from "react";
import { Box, Button } from "@material-ui/core";
import { Tabs, Tab, Modal, Backdrop, Fade } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import MultipleChoice from "./question_forms/MultipleChoice";
import ShortAnswer from "./question_forms/ShortAnswer.jsx";
import FreeResponse from "./question_forms/FreeResponse.jsx";
import TitleCard from "./question_forms/TitleCard.jsx";
import FileUpload from "./question_forms/FileUpload.jsx";
import { Formik, Form } from "formik";
import { pickInitialValues } from "./question_forms/questionFormValues.js";
import { tidy } from "./question_forms/questionFormValues.js";
import { saveQuestion } from "./question_forms/questionFormUtils.js";
import { generateRandomCode } from "../../app/utils/utils";
import firebase from "../../app/config/firebaseConfig.js";

export default function QuestionBuilder({
  libraryQuestionID,
  productLibraryID,
  questions,
  questionSetID,
  setCurrentPage,
  setSearchTerms,
  saveTo,
  userID,
}) {
  const [value, setValue] = useState(0);
  const [selectedTab, setSelectedTab] = useState("multiple choice");
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const questionTypes = [
    "multiple choice",
    "short answer",
    "free response",
    "title card",
    "file upload",
  ];

  const handleChange = (event, index) => {
    setValue(index);
    setSelectedTab(questionTypes[index]);
  };

  return (
    <>
      <Button
        type="button"
        variant="contained"
        color="primary"
        onClick={handleOpen}
        startIcon={<AddIcon />}
      >
        ADD QUESTION
      </Button>

      <Modal
        className="flex-center-all"
        open={open}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={open}>
          <Box className="modal-form-v2 modal-common-styling">
            <Tabs
              value={value}
              indicatorColor="primary"
              textColor="primary"
              onChange={handleChange}
              className="padding-bottom-medium"
            >
              <Tab label="multiple choice" />
              <Tab label="short answer" />
              <Tab label="free response" />
              <Tab label="title card" />
              <Tab label="file upload" />
            </Tabs>

            <Formik
              enableReinitialize
              initialValues={pickInitialValues(selectedTab, null, false)}
              onSubmit={async (values, { setSubmitting }) => {
                setSubmitting(true);
                const tidiedValues = tidy(values, "add");

                if (saveTo === "my_question_sets") {
                  tidiedValues.id = generateRandomCode(20);
                }

                tidiedValues.created = firebase.firestore.Timestamp.now();

                saveQuestion(
                  tidiedValues,
                  "add",
                  saveTo,
                  productLibraryID,
                  libraryQuestionID,
                  userID,
                  questionSetID,
                  questions
                );
                //Artificial delay to signal user that question info is being saved
                await new Promise((r) => setTimeout(r, 800));
                setSubmitting(false);
                handleClose();

                //handle resets for page view and search terms
                if (saveTo !== "my_question_sets") {
                  setSearchTerms([]);
                }
                setCurrentPage(1);
              }}
            >
              {({
                values,
                isSubmitting,
                dirty,
                setFieldValue,
                handleChange,
              }) => {
                switch (selectedTab) {
                  case "multiple choice":
                    return (
                      <Form autoComplete="off" className="flex-column">
                        <MultipleChoice
                          values={values}
                          isSubmitting={isSubmitting}
                          setFieldValue={setFieldValue}
                          handleChange={handleChange}
                          dirty={dirty}
                        />
                        {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
                      </Form>
                    );
                  case "short answer":
                    return (
                      <Form autoComplete="off" className="flex-column">
                        <ShortAnswer
                          values={values}
                          isSubmitting={isSubmitting}
                          setFieldValue={setFieldValue}
                          handleChange={handleChange}
                          dirty={dirty}
                        />
                        {process.env.REACT_APP_WEBSITE_URL ===
                          "koral-development.community" && (
                          <pre>{JSON.stringify(values, null, 2)}</pre>
                        )}
                      </Form>
                    );
                  case "free response":
                    return (
                      <Form autoComplete="off" className="flex-column">
                        <FreeResponse
                          values={values}
                          isSubmitting={isSubmitting}
                          setFieldValue={setFieldValue}
                          handleChange={handleChange}
                          dirty={dirty}
                        />
                        {process.env.REACT_APP_WEBSITE_URL ===
                          "koral-development.community" && (
                          <pre>{JSON.stringify(values, null, 2)}</pre>
                        )}
                      </Form>
                    );
                  case "title card":
                    return (
                      <Form autoComplete="off" className="flex-column">
                        <TitleCard
                          values={values}
                          isSubmitting={isSubmitting}
                          setFieldValue={setFieldValue}
                          dirty={dirty}
                        />
                        {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
                      </Form>
                    );
                  case "file upload":
                    return (
                      <Form autoComplete="off" className="flex-column">
                        <FileUpload
                          values={values}
                          isSubmitting={isSubmitting}
                          setFieldValue={setFieldValue}
                          dirty={dirty}
                        />
                        {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
                      </Form>
                    );
                  default:
                    break;
                }
              }}
            </Formik>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
