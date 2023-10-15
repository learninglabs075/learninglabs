import React from "react";
import { Box, Typography } from "@material-ui/core";
import { Button, Card, CardContent, CardMedia } from "@material-ui/core";
import firebase from "../../app/config/firebaseConfig.js";
import { getUserName } from "../../app/firestoreClient.js";

const acceptInviteStyling = {
  height: "60px",
  backgroundColor: "rgba(70,172,195,0.85)",
  color: "white",
  top: "90px",
  fontSize: "18px",
};

const removeInviteStyling = {
  top: "275px",
  color: "#BDD3D6",
  fontSize: "14px",
};

const sharedStyling = {
  width: "250px",
  position: "absolute",
  left: "36px",
};

export function makeSearchFriendly(rawValues) {
  if (Array.isArray(rawValues)) {
    const normalizedArray = rawValues.map((element) =>
      element.toLowerCase().replace(/\s+/g, " ").split(" ")
    );
    return normalizedArray.flat();
  } else if (typeof rawValues === "string") {
    const normalizedArray = rawValues
      .toLowerCase()
      .replace(/\s+/g, " ")
      .split(" ");
    return normalizedArray;
  }
}

async function addInstructorToCourse(
  courseID,
  userID,
  userEmail,
  userDisplayName,
  invitedInstructors
) {
  // Instructor has clicked to join, remove any references from invitedInstructors and invitedInstructorEmails array.

  const ref = firebase.firestore().collection("courses").doc(courseID);
  const searchableNameArr = makeSearchFriendly(userDisplayName);
  await ref
    .update({
      instructors: firebase.firestore.FieldValue.arrayUnion({
        id: userID,
        email: userEmail,
        name: userDisplayName,
      }),
      instructorEmails: firebase.firestore.FieldValue.arrayUnion(userEmail),
      instructorIDs: firebase.firestore.FieldValue.arrayUnion(userID),
      instructorNames_searchable: firebase.firestore.FieldValue.arrayUnion(
        ...searchableNameArr
      ),
    })
    .catch((error) => console.log(error.message));

  let user = await getUserName(userID);

  // Add minimal user info for grade_summaries collecion which is used in rendering the gradebook.
  await ref
    .collection("grade_summaries")
    .doc(userID)
    .set({
      userID: userID,
      userEmail: userEmail,
      userDisplayName: userDisplayName,
      userFirstName: user?.firstName ? user.firstName : "",
      userLastName: user?.lastName ? user.lastName : "",
    });

  await removeInvitedInstructor(invitedInstructors, userEmail, courseID);
}

async function removeInvitedInstructor(
  invitedInstructors,
  userEmail,
  courseID
) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  let invitedInstructor = {};

  if (invitedInstructors) {
    invitedInstructors.forEach((instructor) => {
      if (instructor.email === userEmail) {
        invitedInstructor = instructor;
      }
    });
  }

  await ref.update({
    invitedInstructors:
      firebase.firestore.FieldValue.arrayRemove(invitedInstructor),
    invitedInstructorEmails:
      firebase.firestore.FieldValue.arrayRemove(userEmail),
  });
  return invitedInstructor;
}

export default function InvitedInstructorCourseCard(props) {
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
          await addInstructorToCourse(
            props.courseID,
            props.currentUser.uid,
            props.currentUser.email,
            props.currentUser.displayName,
            props.invitedInstructors
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
          await removeInvitedInstructor(
            props.invitedInstructors,
            props.currentUser.email,
            props.courseID
          );
        }}
        style={{
          ...removeInviteStyling,
          ...sharedStyling,
        }}
      >
        REMOVE
      </Button>
    </Card>
  );
}
