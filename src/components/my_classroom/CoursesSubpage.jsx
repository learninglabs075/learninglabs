import React, { useState, useEffect } from "react";
import { Box, Button, Link, Typography } from "@material-ui/core";
import AddCourse from "./AddCourse.jsx";
import StudentCourseCard from "./StudentCourseCard.jsx";
import InvitedStudentCourseCard from "./InvitedStudentCourseCard.jsx";
import InvitedInstructorCourseCard from "./InvitedInstructorCourseCard.jsx";
import InstructorCourseCard from "./InstructorCourseCard.jsx";
import { useAuth } from "../../app/contexts/AuthContext.js";
import firebase from "../../app/config/firebaseConfig.js";
import { useHistory } from "react-router-dom";

export default function CoursesSubpage(props) {
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [studentCourses, setStudentCourses] = useState([]);
  const [invitedToCourses, setInvitedToCourses] = useState([]);
  const [invitedAsInstructorToCourses, setInvitedAsInstructorToCourses] =
    useState([]);

  const { currentUser } = useAuth();
  const history = useHistory();

  function fetchMyInstructorCourses() {
    const ref = firebase
      .firestore()
      .collection("courses")
      .where("instructorIDs", "array-contains", currentUser.uid);

    ref.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setInstructorCourses((prevState) => fetchedItems);
    });
  }

  function fetchMyStudentCourses() {
    const ref = firebase
      .firestore()
      .collection("courses")
      .where("studentIDs", "array-contains", currentUser.uid);

    ref.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setStudentCourses((prevState) => fetchedItems);
    });
  }

  function fetchMyInvitedToCourses() {
    const ref = firebase
      .firestore()
      .collection("courses")
      .where("invitedStudentEmails", "array-contains", currentUser.email);
    ref.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setInvitedToCourses((prevState) => fetchedItems);
    });
  }

  function fetchMyInvitedAsInstructorToCourses() {
    const ref = firebase
      .firestore()
      .collection("courses")
      .where("invitedInstructorEmails", "array-contains", currentUser.email);
    ref.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        fetchedItems.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setInvitedAsInstructorToCourses((prevState) => fetchedItems);
    });
  }

  useEffect(() => {
    const unsubscribe = fetchMyInstructorCourses();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const unsubscribe = fetchMyStudentCourses();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const unsubscribe = fetchMyInvitedToCourses();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const unsubscribe = fetchMyInvitedAsInstructorToCourses();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  return (
    <Box className="display-area-full flex-column">
      <Box
        className="subpage-header"
        style={{ marginLeft: "20px", paddingBottom: "5px" }}
      >
        <Typography variant="h3" color="primary">
          Courses
        </Typography>
      </Box>
      {instructorCourses.length +
        studentCourses.length +
        invitedToCourses.length +
        invitedAsInstructorToCourses.length ===
      0 ? (
        <Box className="flex click-to-add-course">
          <Typography color="primary">
            click the button below to add a course
          </Typography>
        </Box>
      ) : (
        <Box className="flex-row wrap padding-horizontal-medium">
          {instructorCourses.map((courseInfo, courseIndex) => (
            <InstructorCourseCard
              key={courseInfo.id}
              courseID={courseInfo.id}
              coursePicture={instructorCourses[courseIndex].coursePicture}
              title={courseInfo.title}
              description={courseInfo.description}
              instructors={courseInfo.instructors}
              courseIndex={courseIndex}
              hiddenAdmins={courseInfo?.hiddenAdmins}
            />
          ))}
          {studentCourses.map((courseInfo, courseIndex) => (
            <StudentCourseCard
              key={courseInfo.id}
              courseID={courseInfo.id}
              coursePicture={studentCourses[courseIndex].coursePicture}
              title={courseInfo.title}
              description={courseInfo.description}
              instructors={courseInfo.instructors}
              courseIndex={courseIndex}
              hiddenAdmins={courseInfo?.hiddenAdmins}
            />
          ))}
          {invitedToCourses.map((courseInfo, courseIndex) => (
            <InvitedStudentCourseCard
              key={courseInfo.id}
              courseID={courseInfo.id}
              currentUser={currentUser}
              coursePicture={studentCourses[courseIndex]?.coursePicture}
              invitedStudents={courseInfo.invitedStudents}
              title={courseInfo.title}
              description={courseInfo.description}
              instructors={courseInfo.instructors}
              courseIndex={courseIndex}
            />
          ))}
          {invitedAsInstructorToCourses.map((courseInfo, courseIndex) => (
            <InvitedInstructorCourseCard
              key={courseInfo.id}
              courseID={courseInfo.id}
              currentUser={currentUser}
              coursePicture={studentCourses[courseIndex]?.coursePicture}
              invitedInstructors={courseInfo.invitedInstructors}
              title={courseInfo.title}
              description={courseInfo.description}
              instructors={courseInfo.instructors}
              courseIndex={courseIndex}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
