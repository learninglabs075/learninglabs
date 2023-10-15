import React, { useState } from "react";
import { addFolderToQuestionSetCollection } from "../../app/firestoreClient.js";
import { Formik, Field, Form } from "formik";
import { Box, Button, TextField } from "@material-ui/core";
import { Typography } from "@material-ui/core";
import { Modal, Backdrop, Fade, CircularProgress } from "@material-ui/core";
import { CreateNewFolder } from "@material-ui/icons";
import firebase from "../../app/config/firebaseConfig.js";

const TitleField = (props) => (
  <TextField
    label="Title"
    id="question set title"
    variant="filled"
    fullWidth
    autoFocus
    {...props}
  />
);

const initialValues = {
  title: "",
  created: firebase.firestore.Timestamp.now(),
  type: "Folder",
};

export default function CreateFolderInQuestionSetCollection(props) {
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
        onClick={handleOpen}
        startIcon={<CreateNewFolder />}
      >
        Add Folder
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
          <Box className="modal-form-v1 modal-common-styling">
            <Formik
              initialValues={initialValues}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                setSubmitting(true);
                await new Promise((r) => setTimeout(r, 800));
                try {
                  addFolderToQuestionSetCollection(values, props.userID);
                } catch (error) {
                  console.log("error: cannot save question info to database");
                  console.log(error.message);
                }
                setSubmitting(false);
                resetForm();
                handleClose();
              }}
            >
              {({ values, isSubmitting }) => (
                <Form autoComplete="off">
                  <Typography color="primary" variant="h5">
                    New Folder
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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <CircularProgress size={25} /> : "Create"}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
