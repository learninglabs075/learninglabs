import React, { useState } from "react";
import { Formik, Field, Form } from "formik";
import { Box, TextField, Button, IconButton } from "@material-ui/core";
import { Typography } from "@material-ui/core";
import { Modal, Backdrop, Fade, CircularProgress } from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import firebase from "../../app/config/firebaseConfig.js";
import { updateModuleTitle } from "../../app/firestoreClient.js";

const TitleField = (props) => (
  <TextField
    label="Title"
    id="question set title"
    variant="filled"
    fullWidth
    {...props}
  />
);

function updateTitle(courseID, modules, moduleIndex, updatedTitle) {
  const updatedModules = modules.map((element, index) => {
    if (index === moduleIndex) {
      element.title = updatedTitle;
      element.lastEdited = firebase.firestore.Timestamp.now();
    }
    return element;
  });
  updateModuleTitle(courseID, updatedModules);
}

export default function EditModule({ modules, moduleIndex, courseID }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const moduleTitle = modules[moduleIndex]?.title;

  const initialValues = {
    title: moduleTitle || "",
  };

  return (
    <>
      <IconButton
        className="edit-module-title"
        style={{ color: "silver" }}
        onClick={handleOpen}
      >
        <EditIcon fontSize="small" />
      </IconButton>

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
          <Box className="modal-form-v1 modal-common-styling">
            <Formik
              initialValues={initialValues}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                setSubmitting(true);
                await new Promise((r) => setTimeout(r, 800));
                try {
                  updateTitle(courseID, modules, moduleIndex, values.title);
                } catch (error) {
                  console.log("error: cannot save question info to database");
                  console.log(error.message);
                }
                setSubmitting(false);
                resetForm();
                handleClose();
              }}
            >
              {({ isSubmitting, dirty }) => (
                <Form autoComplete="off">
                  <Typography color="primary" variant="h5">
                    Edit Title
                  </Typography>
                  <br />
                  <Box width={300}>
                    <Field name="title" as={TitleField} />
                  </Box>
                  <Box marginTop={3} display="flex" justifyContent="flex-end">
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting || !dirty}
                    >
                      {isSubmitting ? <CircularProgress size={25} /> : "SAVE"}
                    </Button>
                  </Box>
                  {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
                </Form>
              )}
            </Formik>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
