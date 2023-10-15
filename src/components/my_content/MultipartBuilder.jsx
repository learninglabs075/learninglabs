import React, { useState } from "react";
import { Backdrop, Box, Button, Fade, Modal } from "@material-ui/core";
import { Formik, Form } from "formik";
import { PlaylistAdd } from "@material-ui/icons/";
import { tidy } from "./question_forms/questionFormValues.js";
import { saveQuestion } from "./question_forms/questionFormUtils.js";
import Multipart from "./question_forms/Multipart.jsx";
import { generateRandomCode } from "../../app/utils/utils";
import firebase from "firebase/app";

const initialValues = {
  type: "multipart",
  header: "",
  parts: [],
  tags: [],
  currentTag: "",
  solution: "",
  auxillaryFiles: [],
  created: "",
  lastEdited: "",
};

export default function MultipartBuilder({
  saveTo,
  productLibraryID,
  libraryQuestionID,
  userID,
  questionSetID,
  questions,
  qIndex,
}) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="contained"
        color="primary"
        onClick={handleOpen}
        startIcon={<PlaylistAdd />}
      >
        ADD MULTIPART
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
              initialValues={initialValues}
              onSubmit={async (values, { setSubmitting }) => {
                setSubmitting(true);
                const tidiedValues = tidy(values, "add");

                tidiedValues.created = firebase.firestore.Timestamp.now();

                if (saveTo === "my_question_sets") {
                  tidiedValues.id = generateRandomCode(20);
                }

                //Artificial delay to signal user that question info is being saved
                await new Promise((r) => setTimeout(r, 800));
                saveQuestion(
                  tidiedValues,
                  "add",
                  saveTo,
                  productLibraryID,
                  libraryQuestionID,
                  userID,
                  questionSetID,
                  questions,
                  qIndex
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
