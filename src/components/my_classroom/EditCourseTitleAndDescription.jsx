import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import { Box, Button } from "@material-ui/core";
import { TextField } from "@material-ui/core";
import { Typography, CircularProgress } from "@material-ui/core";
import { Modal, Backdrop, Fade } from "@material-ui/core";
import { updateCourseTitle } from "../../app/firestoreClient.js";
import { updateCourseDescription } from "../../app/firestoreClient.js";
import EditIcon from "@material-ui/icons/Edit";
import { useAuth } from "../../app/contexts/AuthContext.js";

const CourseTitleField = (props) => (
  <TextField
    label="Title"
    id="course title"
    variant="filled"
    fullWidth
    {...props}
  />
);
const DescriptionField = (props) => (
  <TextField
    label="Description"
    id="course description"
    variant="filled"
    multiline
    rows={4}
    fullWidth
    {...props}
  />
);

export default function EditCourseTitleAndDescription(props) {
  const currentValues = {
    title: props.title,
    description: props.description,
  };
  const { currentUser } = useAuth();
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
        style={{ color: "rgba(0, 0, 0, 0.54)" }}
        onClick={handleOpen}
        startIcon={<EditIcon />}
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
          <Box className="modal-form-v1 modal-common-styling">
            <Typography variant="h5" color="primary">
              Edit Course Details
            </Typography>
            <Formik
              initialValues={currentValues}
              onSubmit={async (values, { setSubmitting }) => {
                setSubmitting(true);
                updateCourseTitle(
                  props.courseID,
                  values.title,
                  currentUser.uid
                );
                updateCourseDescription(props.courseID, values.description);

                await new Promise((r) => setTimeout(r, 800));

                setSubmitting(false);
                handleClose();
              }}
            >
              {({ values, isSubmitting, dirty }) => (
                <Form autoComplete="off">
                  <Box className="flex-column edit-course-title-and-description">
                    <Field name="title" as={CourseTitleField} />
                    <Field name="description" as={DescriptionField} />
                  </Box>

                  <Box className="flex justify-end padding-tiny">
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting || !dirty}
                    >
                      {isSubmitting ? <CircularProgress size={25} /> : "SAVE"}
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
