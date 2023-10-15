import React from "react";
import { Formik, Field, Form } from "formik";
import {
  Box,
  TextField,
  Button,
  Typography,
  Modal,
  Backdrop,
  Fade,
  CircularProgress,
} from "@material-ui/core";
import {
  editQuestionSetTitle,
  editCourseAssignmentQuestionSetTitle,
} from "../../app/firestoreClient.js";

export default function EditQuestionSetTitle({
  questionSetID,
  title,
  parentID,
  userID,
  open,
  setOpen,
  inUse,
}) {
  const handleClose = () => {
    setOpen(false);
  };

  const initialValues = {
    title: title,
  };

  const TitleField = (props) => (
    <TextField label="Title" variant="filled" fullWidth {...props} />
  );

  return (
    <>
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
                  editQuestionSetTitle(
                    values,
                    userID,
                    questionSetID,
                    parentID,
                    initialValues.title
                  );
                  if (inUse) {
                    editCourseAssignmentQuestionSetTitle(
                      values,
                      questionSetID,
                      inUse
                    );
                  }
                } catch (error) {
                  console.log("error: cannot save title to database");
                  console.log(error.message);
                }
                setSubmitting(false);
                resetForm();
                handleClose();
              }}
            >
              {({ values, dirty, isSubmitting }) => (
                <Form autoComplete="off">
                  <Typography color="primary" variant="h5">
                    Edit Title
                  </Typography>
                  <br />
                  <Box width={300}>
                    <Field name="title" defaultValue={title} as={TitleField} />
                  </Box>
                  <Box marginTop={3} display="flex" justifyContent="flex-end">
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting || !dirty}
                    >
                      {isSubmitting ? <CircularProgress size={25} /> : "Save"}
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
