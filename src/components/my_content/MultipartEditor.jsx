import React, { useState } from "react";
import { Box, Button, Modal, Backdrop, Fade } from "@material-ui/core";
import { Edit } from "@material-ui/icons/";
import { Formik, Form } from "formik";
import Multipart from "./question_forms/Multipart.jsx";
import {
  pickInitialValues,
  tidy,
} from "./question_forms/questionFormValues.js";
import { saveQuestion } from "./question_forms/questionFormUtils.js";

export default function MultipartEditor({
  productLibraryID,
  question,
  questions,
  questionSetID,
  saveTo,
  userID,
}) {
  const [questionType, setQuestionType] = useState(question.type);
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setQuestionType(question.type);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        color="primary"
        onClick={handleOpen}
        startIcon={<Edit />}
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
            <Formik
              initialValues={pickInitialValues(questionType, question, true)}
              onSubmit={async (values, { setSubmitting }) => {
                setSubmitting(true);
                const tidiedValues = tidy(values, "edit");
                if (saveTo === "my_question_sets") {
                  tidiedValues.id = values.id;
                }
                // Artificial delay to signal user that question info is being saved
                await new Promise((r) => setTimeout(r, 800));
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
                return (
                  <Form autoComplete="off" className="flex-column">
                    <Multipart
                      values={values}
                      isSubmitting={isSubmitting}
                      setFieldValue={setFieldValue}
                      handleChange={handleChange}
                      dirty={dirty}
                      question={question}
                    />
                    {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
                  </Form>
                );
              }}
            </Formik>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
