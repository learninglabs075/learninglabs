import React from "react";
import { Box, Typography } from "@material-ui/core";
import { Button, Card, CardContent, CardMedia } from "@material-ui/core";
import firebase from "../../app/config/firebaseConfig.js";

const acceptInviteStyling = {
  height: "60px",
  backgroundColor: "rgba(72,155,181,0.85)",
  color: "white",
  top: "90px",
  fontSize: "18px",
};
const notInteresteedStyling = {
  top: "275px",
  color: "#c1d0d3",
  fontSize: "14px",
};

const sharedStyling = {
  width: "250px",
  position: "absolute",
  left: "36px",
};

async function addStudentToCourse(
  courseID,
  userID,
  userEmail,
  userDisplayName,
  invitedStudents
) {
  // Student has clicked to join, remove any references from invitedStudents and invitedStudentEmails array.
  let invitedStudent = await removeInvitedStudent(
    invitedStudents,
    userEmail,
    courseID
  );

  //Add Student to Course
  const ref = firebase.firestore().collection("courses").doc(courseID);
  await ref.update({
    students: firebase.firestore.FieldValue.arrayUnion({
      id: userID,
      email: userEmail,
      name: userDisplayName,
      organizationUserID: invitedStudent.organizationUserID,
      organizationUserName: invitedStudent.organizationUserName,
    }),
    studentEmails: firebase.firestore.FieldValue.arrayUnion(userEmail),
    studentIDs: firebase.firestore.FieldValue.arrayUnion(userID),
  });

  // Add minimal user info for grade_summaries collecion which is used in rendering the gradebook.
  await ref.collection("grade_summaries").doc(userID).set({
    userID: userID,
    userEmail: userEmail,
    userDisplayName: userDisplayName,
    organizationUserId: invitedStudent.organizationUserID,
    organizationUserName: invitedStudent.organizationUserName,
  });
}

async function removeInvitedStudent(invitedStudents, userEmail, courseID) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  let invitedStudent = {};

  if (invitedStudents) {
    invitedStudents.forEach((student) => {
      if (student.email === userEmail) {
        invitedStudent = student;
      }
    });
  }

  await ref.update({
    invitedStudents: firebase.firestore.FieldValue.arrayRemove(invitedStudent),
    invitedStudentEmails: firebase.firestore.FieldValue.arrayRemove(userEmail),
  });
  return invitedStudent;
}

export default function InvitedStudentCourseCard(props) {
  return (
    <Card
      className="course-card"
      style={{
        position: "relative",
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
    >
      {props.coursePicture ? (
        <CardMedia
          className="course-card-picture"
          image={props.coursePicture.url}
        />
      ) : (
        <CardMedia
          style={{ opacity: 0.35 }}
          className="course-card-picture"
          image={process.env.REACT_APP_DEFAULT_COURSE_IMAGE}
        />
      )}
      <Button
        variant="contained"
        onClick={async () => {
          await addStudentToCourse(
            props.courseID,
            props.currentUser.uid,
            props.currentUser.email,
            props.currentUser.displayName,
            props.invitedStudents
          );
        }}
        style={{ ...acceptInviteStyling, ...sharedStyling }}
      >
        CLICK TO JOIN COURSE
      </Button>

      <CardContent className="course-card-content">
        <Typography variant="h6" color="textPrimary">
          {props.title}
        </Typography>
        <Box className="instructor-description-container">
          <Typography color="textPrimary" variant="subtitle1">
            {props.instructors?.length === 1 && props.instructors[0].name}
            {props.instructors?.length === 2 &&
              `${props.instructors[0].name} and ${props.instructors[1].name}`}
            {props.instructors?.length > 2 &&
              `${props.instructors[0].name}, ${props.instructors[1].name}, and others`}
          </Typography>

          <Typography variant="subtitle2" color="textSecondary">
            {props.description}
          </Typography>
        </Box>
      </CardContent>
      <Button
        color="primary"
        onClick={async () => {
          await removeInvitedStudent(
            props.invitedStudents,
            props.currentUser.email,
            props.courseID
          );
        }}
        style={{
          ...notInteresteedStyling,
          ...sharedStyling,
        }}
      >
        REMOVE
      </Button>
    </Card>
  );
}
