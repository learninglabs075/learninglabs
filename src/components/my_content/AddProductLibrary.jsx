import React, { useState } from "react";
import { Formik, Field, Form } from "formik";
import { Box, TextField, Button, Radio } from "@material-ui/core";
import { Typography } from "@material-ui/core";
import { Modal, Backdrop, Fade, CircularProgress } from "@material-ui/core";
import { addNewLibrary } from "../../app/firestoreClient.js";
import firebase from "../../app/config/firebaseConfig.js";

const LibraryNameField = (props) => (
  <TextField
    label="Title"
    id="library name"
    variant="filled"
    fullWidth
    {...props}
  />
);

const LibraryDescriptionField = (props) => (
  <TextField
    label="Description"
    id="library description"
    variant="filled"
    multiline
    rows={4}
    fullWidth
    {...props}
  />
);

const initialValues = {
  type: "question library",
  title: "",
  description: "",
  orderBy: "chapterThenProblemNumber",
  created: firebase.firestore.Timestamp.now(),
};

export default function AddProductLibrary() {
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button onClick={handleOpen}>
        <Box width={25} height={25} margin={1}>
          <img src={process.env.REACT_APP_LIBRARY_IMAGE} alt="" />
        </Box>
        ADD NEW Library
      </Button>

      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
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
                  addNewLibrary(values);
                } catch (error) {
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
                    New Library
                  </Typography>
                  <br />
                  <Box className="flex-column space-between library-info-fields">
                    <Field name="title" as={LibraryNameField} />
                    <Field name="description" as={LibraryDescriptionField} />
                    <Box>
                      <Typography variant="subtitle1">Order By:</Typography>
                      <Box className="flex-align-center">
                        <Field
                          name="orderBy"
                          type="radio"
                          value="chapterThenProblemNumber"
                          color="primary"
                          as={Radio}
                        />
                        <Typography>chapter then problem number</Typography>
                      </Box>
                      <Box className="flex-align-center">
                        <Field
                          name="orderBy"
                          type="radio"
                          value="created"
                          color="primary"
                          as={Radio}
                        />
                        <Typography>date created</Typography>
                      </Box>
                    </Box>
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
