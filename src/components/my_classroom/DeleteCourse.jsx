import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import { Box, Button } from "@material-ui/core";
import { TextField } from "@material-ui/core";
import { Typography, CircularProgress } from "@material-ui/core";
import { Modal, Backdrop, Fade } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import { useAuth } from "../../app/contexts/AuthContext.js";
import { functions } from "../../app/config/firebaseConfig.js";

const DeleteField = (props) => (
  <TextField id="deleteCourseID" variant="filled" fullWidth {...props} />
);

export default function DeleteCourse(props) {
  const currentValues = {
    title: props.title,
  };
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [userInputtedText, setUserInputtedText] = useState("");

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const handleDeleteFieldChange = (event) => {
    setUserInputtedText(event.target.value);
  };

  return (
    <>
      <Button
        style={{ color: "rgba(0, 0, 0, 0.54)" }}
        onClick={handleOpen}
        startIcon={<DeleteIcon />}
      >
        DELETE
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
            <Typography variant="h5" style={{ color: "red" }}>
              Warning - Delete Course
            </Typography>
            <Typography variant="body1">
              Are you sure you want to delete this course? This will delete the
              entire
              <br />
              course, including the gradebook and all associated question sets.
            </Typography>

            <Formik
              initialValues={currentValues}
              onSubmit={async (values, { setSubmitting }) => {
                setSubmitting(true);
                await deleteCourse(props.courseID, currentUser.uid);
                window.location.replace("/classroom");
                setUserInputtedText("");
                handleClose();
                setSubmitting(false);
              }}
              disabled={userInputtedText !== "delete"}
            >
              {({ isSubmitting, submitForm }) => (
                <Form style={{ textAlign: "center" }}>
                  <Field
                    label="Type 'delete' to confirm"
                    component={DeleteField}
                    autoComplete="off"
                    name="title"
                    type="text"
                    onChange={handleDeleteFieldChange}
                  />
                  <Button
                    type="button"
                    id="deleteCourseButton"
                    variant="contained"
                    style={{
                      backgroundColor:
                        userInputtedText === "delete" ? "red" : "grey",
                      color: userInputtedText === "delete" ? "white" : "white",
                      margin: "10px",
                    }}
                    disabled={userInputtedText !== "delete"}
                    onClick={() => submitForm()}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={24} color="secondary" />
                    ) : (
                      "DELETE"
                    )}
                  </Button>
                </Form>
              )}
            </Formik>
          </Box>
        </Fade>
      </Modal>
    </>
  );

  async function deleteCourse() {
    const callable = functions.httpsCallable("deleteCourse");
    const message = await callable({
      courseID: props.courseID,
      userID: currentUser.uid,
    });
    console.log(message);
  }
}
