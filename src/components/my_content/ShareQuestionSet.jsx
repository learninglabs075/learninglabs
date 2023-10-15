import React, { useState } from "react";
import { Formik, Field, Form } from "formik";
import {
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  Modal,
  Backdrop,
  Fade,
  CircularProgress,
} from "@material-ui/core";
import PeopleIcon from "@material-ui/icons/People";
import firebase from "../../app/config/firebaseConfig.js";
import { fetchUserIDFromEmail } from "../../app/firestoreClient.js";

export default function ShareQuestionSet({ questionSetID, title, userID }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const initialValues = {
    user: "",
  };

  const UserField = (props) => (
    <TextField label="User Email" variant="filled" fullWidth {...props} />
  );

  async function runSearch(event, values) {
    if (
      event.type === "click" ||
      (event.type === "keydown" && event.code === "Enter")
    ) {
      event.preventDefault();
      // fetchCourses(values.searchTerm, userID, setFoundCourses, setSearchTerm);
      alert("Need to implement search people functionality");
    }
  }

  return (
    <>
      <IconButton
        style={{ marginLeft: "10px" }}
        size="small"
        variant="extended"
        color="primary"
        onClick={handleOpen}
      >
        <PeopleIcon />
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
                  let shareWithUserID = await fetchUserIDFromEmail(values.user);

                  if (userID) {
                    updateSharedQuestionSet(
                      shareWithUserID,
                      userID,
                      questionSetID,
                      title
                    );
                  }
                } catch (error) {
                  console.log("error: cannot share question set to database");
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
                    Share Question Set
                  </Typography>
                  <br />
                  <Box width={300}>
                    <Field
                      onKeyDown={(event) => runSearch(event, values)}
                      name="user"
                      as={UserField}
                    />
                  </Box>
                  <Box marginTop={3} display="flex" justifyContent="flex-end">
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting || !dirty}
                    >
                      {isSubmitting ? <CircularProgress size={25} /> : "Share"}
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

async function updateSharedQuestionSet(
  shareWithUserID,
  userID,
  questionSetID,
  title
) {
  const sharedQuestionSetRef = firebase
    .firestore()
    .collection("user_questions")
    .doc(shareWithUserID)
    .collection("shared_question_sets")
    .doc(questionSetID);
  await sharedQuestionSetRef.set(
    {
      ownerID: userID,
      questionSetID: questionSetID,
      title: title,
    },
    { merge: true }
  );
}
