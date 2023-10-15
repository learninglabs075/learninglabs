import React, { useState } from "react";
import { Formik, Field, Form } from "formik";
import { Box, TextField, Button } from "@material-ui/core";
import { Typography } from "@material-ui/core";
import { Modal, Backdrop, Fade, CircularProgress } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import { addCourseModule } from "../../app/firestoreClient.js";

const TitleField = (props) => (
  <TextField
    label="Title"
    id="question set title"
    variant="filled"
    fullWidth
    {...props}
  />
);

const initialValues = {
  title: "",
  content: [],
  visible: true,
};

export default function AddModule(props) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button size="large" color="primary" onClick={handleOpen}>
        <AddIcon />
        ADD MODULE
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
                  addCourseModule(values, props.courseID);
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
                  <Typography variant="h5" color="primary">
                    New Module
                  </Typography>
                  <br />
                  <Box width={300}>
                    <Field name="title" as={TitleField} />
                  </Box>
                  <Box className="flex justify-end padding-top-medium">
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <CircularProgress size={25} /> : "ADD"}
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
