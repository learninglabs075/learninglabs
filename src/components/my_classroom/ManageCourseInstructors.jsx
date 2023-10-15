import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import { Box, Button } from "@material-ui/core";
import { TextField } from "@material-ui/core";
import { Typography, CircularProgress } from "@material-ui/core";
import { Modal, Backdrop, Fade } from "@material-ui/core";
import { inviteInstructorToCourse } from "../../app/firestoreClient.js";
import { functions } from "../../app/config/firebaseConfig.js";
import { Edit } from "@material-ui/icons/";

const InstructorEmail = (props) => (
  <TextField
    label="Instructor Email"
    id="instructorEmail"
    variant="filled"
    fullWidth
    {...props}
  />
);

async function emailInvitedInstructor(courseTitle, email) {
  const callable = functions.httpsCallable("genericEmail");

  const message = await callable({
    email: email,
    course: courseTitle,
    link: "https://koral.community",
  });
  return console.log(message);
}

export default function ManageCourseInstructors({ courseID, courseTitle }) {
  const currentValues = { instructorEmail: "" };

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
        startIcon={<Edit />}
      >
        Manage
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
              Invite Course Instructor
            </Typography>
            <Formik
              initialValues={currentValues}
              onSubmit={async (values, { setSubmitting }) => {
                setSubmitting(true);
                inviteInstructorToCourse(values, courseID);
                emailInvitedInstructor(courseTitle, values.instructorEmail);

                await new Promise((r) => setTimeout(r, 800));

                setSubmitting(false);
                handleClose();
              }}
            >
              {({ values, isSubmitting, dirty }) => (
                <Form autoComplete="off">
                  <Box className="flex-column manage-instructors">
                    <Field name="instructorEmail" as={InstructorEmail} />
                  </Box>

                  <Box className="flex justify-end padding-tiny">
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting || !dirty}
                    >
                      {isSubmitting ? <CircularProgress size={25} /> : "INVITE"}
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
