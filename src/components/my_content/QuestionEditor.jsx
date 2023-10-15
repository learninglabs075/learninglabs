import React, { useState } from "react";
import { Box, Button } from "@material-ui/core";
import { Tabs, Tab, Modal, Backdrop, Fade } from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import MultipleChoice from "./question_forms/MultipleChoice.jsx";
import ShortAnswer from "./question_forms/ShortAnswer.jsx";
import FreeResponse from "./question_forms/FreeResponse.jsx";
import TitleCard from "./question_forms/TitleCard.jsx";
import FileUpload from "./question_forms/FileUpload.jsx";
import { Formik, Form } from "formik";
import { pickInitialValues } from "./question_forms/questionFormValues.js";
import { tidy } from "./question_forms/questionFormValues.js";
import { saveQuestion } from "./question_forms/questionFormUtils.js";
import firebase from "../../app/config/firebaseConfig.js";

export default function QuestionEditor({
  productLibraryID,
  question,
  questions,
  questionSetID,
  saveTo,
  userID,
  readonly,
}) {
  const questionTypes = [
    "multiple choice",
    "short answer",
    "free response",
    "title card",
    "file upload",
  ];
  const initialTabIndex = questionTypes.findIndex(
    (element) => element === question.type
  );

  const [tabIndex, setTabIndex] = useState(initialTabIndex);
  const [selectedTab, setSelectedTab] = useState(question.type);
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setTabIndex(initialTabIndex);
    setSelectedTab(question.type);
    setOpen(true);
  };
  const handleClose = () => {
    setTabIndex(0);
    setOpen(false);
  };

  const handleChange = (event, index) => {
    setTabIndex(index);
    setSelectedTab(questionTypes[index]);
  };

  return (
    <>
      <Button
        type="button"
        color="primary"
        onClick={handleOpen}
        startIcon={<EditIcon />}
        disabled={readonly}
      >
        EDIT
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
              value={tabIndex}
              indicatorColor="primary"
              textColor="primary"
              onChange={handleChange}
              className="padding-bottom-medium"
            >
              <Tab label="Multiple Choice" />
              <Tab label="Short Answer" />
              <Tab label="Free Response" />
              <Tab label="Title Card" />
              <Tab label="File Upload" />
            </Tabs>

            <Formik
              enableReinitialize
              initialValues={pickInitialValues(selectedTab, question, true)}
              onSubmit={async (values, { setSubmitting }) => {
                const tidiedValues = tidy(values, "edit");

                if (saveTo === "my_question_sets")
                  tidiedValues.id = question.id;

                tidiedValues.created =
                  question.created || firebase.firestore.Timestamp.now();
                tidiedValues.lastEdited = firebase.firestore.Timestamp.now();

                setSubmitting(true);
                await new Promise((r) => setTimeout(r, 400));
                saveQuestion(
                  tidiedValues,
                  "edit",
                  saveTo,
                  productLibraryID,
                  question.id,
                  userID,
                  questionSetID,
                  questions
                );
                setSubmitting(false);
                handleClose();
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
                          initVal={pickInitialValues(
                            selectedTab,
                            question,
                            true
                          )}
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
                        {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
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
