import firebase from "../../app/config/firebaseConfig.js";
import { useEffect, useState } from "react";
import { useAuth } from "../../app/contexts/AuthContext.js";
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@material-ui/core";
import {
  fetchUserPermissions,
  getUserName,
  getUserEmailByID,
} from "../../app/firestoreClient.js";
import { generateRandomCode } from "../../app/utils/utils.js";
import { ThemeProvider } from "@material-ui/core/styles";
import MainNavBar from "./../MainNavBar";
import { MyProfileTheme } from "../../themes.js";
import { useHistory } from "react-router-dom";

export default function CloneCourse() {
  const { currentUser } = useAuth();
  const [courseID, setCourseID] = useState("");
  const [userToCloneTo, setUserToCloneTo] = useState();
  const [cloneCourseSuccess, setCloneCourseSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const history = useHistory();

  async function initiateCloneCourse(courseID, userID, userToCloneTo) {
    setIsSubmitting(true);

    let course = await getCourse(courseID);
    if (!course) {
      alert("Course does not exist");
      setIsSubmitting(false);
      return;
    }

    let modules = course?.modules;
    let assignments = await getCourseAssignments(courseID);
    const randomCourseIDExtender = generateRandomCode(6);

    let clonedQuestionSets = await cloneCourseQuestionSets(
      courseID,
      randomCourseIDExtender,
      course.title + " (Clone)",
      modules,
      userID,
      userToCloneTo
    );

    let clonedAssignments = updateAssignmentsReferences(
      assignments,
      clonedQuestionSets,
      userToCloneTo || userID
    );

    let clonedModulesWithUpdatedReferences =
      updateModuleReferencesForClonedCourse(
        modules,
        clonedQuestionSets,
        userID
      );

    let courseClone = await cloneCourse(
      course,
      clonedModulesWithUpdatedReferences
    );
    await addUserAsInstructorToCourse(courseClone, userToCloneTo);

    courseClone.id = saveClonedCourseToDB(
      courseID,
      randomCourseIDExtender,
      courseClone,
      userID
    );

    saveClonedCourseAssignmentsToDB(
      courseID + "CLN" + randomCourseIDExtender,
      clonedAssignments
    );
    await addLightWeightGradebookStub(courseClone.id, userToCloneTo || userID);

    setIsSubmitting(false);
    setCloneCourseSuccess(true);
  }

  async function addLightWeightGradebookStub(courseID, userID) {
    let user = await getUserName(userID);
    user.email = await getUserEmailByID(userID);

    const ref = firebase.firestore().collection("courses").doc(courseID);
    ref
      .collection("grade_summaries")
      .doc(userID)
      .set({
        userID: userID,
        userEmail: user.email,
        userDisplayName: user?.displayName,
        userFirstName: user?.firstName ? user.firstName : "",
        userLastName: user?.lastName ? user.lastName : "",
      });
  }

  async function addUserAsInstructorToCourse(courseClone, userToCloneTo) {
    let userToCloneToName = await getUserName(userToCloneTo);
    userToCloneToName = userToCloneToName.displayName;
    let email = await getUserEmailByID(userToCloneTo);

    courseClone.instructors = [
      {
        id: userToCloneTo,
        email: email,
        name: userToCloneToName,
      },
    ];
    courseClone.instructorIDs = [userToCloneTo];
  }

  function saveClonedCourseAssignmentsToDB(courseID, clonedAssignments) {
    for (let i = 0; i < clonedAssignments.length; i++) {
      firebase
        .firestore()
        .collection("courses")
        .doc(courseID)
        .collection("assignments")
        .doc(clonedAssignments[i].assignmentID)
        .set(clonedAssignments[i]);
    }
  }

  function saveClonedCourseToDB(
    courseID,
    randomCourseIDExtender,
    courseClone,
    userID
  ) {
    let courseCloneRef = firebase
      .firestore()
      .collection("courses")
      .doc(courseID + "CLN" + randomCourseIDExtender);

    courseCloneRef
      .set(courseClone)
      .then(() => {
        console.log("cloned");
      })
      .catch((error) => {
        console.log("error cloning course" + error);
      });

    return courseCloneRef.id;
  }

  function updateAssignmentsReferences(
    assignments,
    clonedQuestionSets,
    userToCloneTo
  ) {
    let updatedAssignmentRefs = [];

    assignments.forEach((assignment) => {
      let updatedAssignment = {};

      updatedAssignment.assignmentID = assignment.assignmentID;
      updatedAssignment.contentType = assignment.contentType;
      updatedAssignment.hideCorrectStatus =
        assignment.hideCorrectStatus || false;
      updatedAssignment.hideSolutions = assignment.hideSolutions || false;
      updatedAssignment.itemType = assignment.itemType;
      updatedAssignment.title = assignment.title;
      updatedAssignment.unlimitedAttempts =
        assignment.unlimitedAttempts || false;
      updatedAssignment.docRef = updateReference(
        assignment.docRef,
        clonedQuestionSets,
        userToCloneTo
      );

      updatedAssignmentRefs.push(updatedAssignment);
    });

    return updatedAssignmentRefs;
  }

  function updateReference(docRef, clonedQuestionSets, userToCloneTo) {
    //TODO: update for user_files & user_links
    let updatedDocRef = "";

    if (docRef.includes("user_files")) {
      return docRef;
    }

    if (docRef.includes("user_links")) {
      return docRef;
    }

    if (docRef.includes("user_questions")) {
      let currentUserID = docRef.match(/user_questions\/[^/]+/g)[0];
      currentUserID = currentUserID.replace("user_questions/", "");
      updatedDocRef = docRef.replace(currentUserID, userToCloneTo);

      // extract the question set ID from the docRef which is the last part of the docRef after my_question_sets/
      let questionSetID = docRef
        .match(/my_question_sets\/[^/]+/g)[0]
        .replace("my_question_sets/", "");

      // loop through clonedQuestionSets and find the questionSet.qSetID = questionSetID
      for (let i = 0; i < clonedQuestionSets.length; i++) {
        if (clonedQuestionSets[i].qSetID === questionSetID) {
          updatedDocRef = updatedDocRef.replace(
            questionSetID,
            clonedQuestionSets[i].id
          );
        }
      }
    }

    return updatedDocRef;
  }

  async function getCourseAssignments(courseID) {
    let assignmentsRef = firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("assignments");

    let assignments = await assignmentsRef.get();

    let assignmentArray = [];

    assignments.forEach((assignment) => {
      assignmentArray.push(assignment.data());
    });

    return assignmentArray;
  }

  function removeInstructorsAndStudentsFields(courseClone) {
    delete courseClone.students;
    delete courseClone.studentIDs;
    delete courseClone.studentEmails;
    delete courseClone.invitedStudentEmails;
    delete courseClone.invitedStudents;
    delete courseClone.invitedInstructorEmails;
    delete courseClone.invitedInstructors;
    delete courseClone.instructors;
    delete courseClone.instructorIDs;
    delete courseClone.instructorEmails;

    return courseClone;
  }

  async function cloneCourseQuestionSets(
    courseID,
    randomCourseIDExtender,
    courseTitle,
    modules,
    userID,
    userToCloneTo = null
  ) {
    let questionSets = [];
    userToCloneTo = userToCloneTo || userID;

    let questionSetRefs = getQuestionSetRefs(modules);
    questionSets = await retrieveQuestionSets(questionSetRefs);
    questionSets = initializeQuestionSetsForNewCourse(
      questionSets,
      courseID,
      randomCourseIDExtender,
      courseTitle
    );

    return saveClonedQuestionSetsToUser(questionSets, userToCloneTo);
  }

  function initializeQuestionSetsForNewCourse(
    questionSets,
    courseID,
    randomCourseIDExtender,
    courseTitle
  ) {
    let newQuestionSets = [];
    questionSets.forEach((questionSet) => {
      questionSet.created = firebase.firestore.Timestamp.now();
      questionSet.inUse = {
        courseID: courseID + "CLN" + randomCourseIDExtender,
        courseTitle: courseTitle,
      };
      newQuestionSets.push(questionSet);
    });
    return newQuestionSets;
  }

  async function saveClonedQuestionSetsToUser(questionSets, userToCloneTo) {
    let clonedQuestionSets = [];

    for (let i = 0; i < questionSets.length; i++) {
      let clonedQuestionSet = await cloneQuestionSet(
        questionSets[i],
        userToCloneTo
      );
      clonedQuestionSet.sourceQSetID = questionSets[i].qSetID;
      clonedQuestionSets.push(clonedQuestionSet);
    }

    return clonedQuestionSets;
  }

  async function cloneQuestionSet(questionSet, userToCloneTo) {
    let questionSetRef = firebase
      .firestore()
      .collection("user_questions")
      .doc(userToCloneTo)
      .collection("my_question_sets")
      .doc();

    try {
      await questionSetRef.set(questionSet);
      questionSet.id = questionSetRef.id;
      return questionSet;
    } catch (error) {
      console.log("error cloning questionSet" + error);
    }
  }

  function getQuestionSetRefs(modules) {
    let questionSetRefs = modules?.map((module) => {
      return module?.content?.map((content) => {
        return content?.docRef;
      });
    });

    questionSetRefs = questionSetRefs?.flat()?.filter((ref) => {
      return ref?.includes("user_questions");
    });
    return questionSetRefs;
  }

  async function hasCloneCoursePermissions(user) {
    let userPermissions = await fetchUserPermissions(user.uid);
    return userPermissions?.includes("admin");
  }

  async function restrictUnauthorizedAccess(user, history) {
    let userCanCloneCourse = await hasCloneCoursePermissions(user);

    if (!userCanCloneCourse) {
      history.push("/access_restricted");
    }
  }

  useEffect(() => {
    restrictUnauthorizedAccess(currentUser, history);
    // eslint-disable-next-line
  }, []);

  return (
    <>
      <ThemeProvider theme={MyProfileTheme}>
        <div className="page-background">
          <MainNavBar />
          <Box className="display-area-full">
            <Box className="subpage-header">
              <Typography variant="h3" color="primary">
                Admin
              </Typography>
            </Box>
            <Box className="flex-column flex-center-all">
              <div className="container" style={{ marginTop: "25px" }}>
                <TextField
                  required
                  style={{ width: "300px" }}
                  id="courseID"
                  label="Course ID"
                  variant="outlined"
                  value={courseID}
                  onChange={(e) => setCourseID(e.target.value)}
                />
                <TextField
                  style={{ width: "300px" }}
                  required
                  id="userToCloneTo"
                  label="Target userID"
                  variant="outlined"
                  value={userToCloneTo}
                  onChange={(e) => setUserToCloneTo(e.target.value)}
                />
                <br />
                <Button
                  label="Clone Course"
                  variant="contained"
                  disabled={cloneCourseSuccess || isSubmitting}
                  onClick={() => {
                    cloneCourseButtonClicked(
                      courseID,
                      userToCloneTo,
                      currentUser
                    );
                  }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={25} />
                  ) : (
                    "Clone Course"
                  )}
                </Button>
                {cloneCourseSuccess && (
                  <Typography variant="h6" style={{ color: "green" }}>
                    Course cloned successfully!
                  </Typography>
                )}
              </div>
            </Box>
          </Box>
        </div>
      </ThemeProvider>
    </>
  );

  function cloneCourseButtonClicked(courseID, userToCloneTo, currentUser) {
    courseID?.length > 0 && userToCloneTo?.length > 0
      ? initiateCloneCourse(courseID, currentUser.uid, userToCloneTo)
      : alert(
          "Please input a courseID and the userID of the person you'd like to clone to proceed."
        );
  }

  function cloneCourse(course, clonedModules) {
    let courseClone = {
      ...course,
      modules: clonedModules,
      title: course.title + " (Clone)",
      created: firebase.firestore.FieldValue.serverTimestamp(),
      courseCode: generateRandomCode(6),
      isActive: true,
    };
    courseClone = removeInstructorsAndStudentsFields(courseClone);
    return courseClone;
  }

  function updateModuleReferencesForClonedCourse(
    modules,
    clonedQuestionSets,
    userID
  ) {
    return modules.map((module) => {
      let updatedModule = { ...module };
      let updatedContent = module.content.map((content) => {
        let updatedContent = { ...content };
        updatedContent.docRef = updateReference(
          content?.docRef,
          clonedQuestionSets,
          userToCloneTo || userID
        );
        updatedContent = resetOpenAndDueDates(updatedContent);
        if (updatedContent.hasOwnProperty("firstResultSubmitted")) {
          delete updatedContent.firstResultSubmitted;
        }

        return updatedContent;
      });
      updatedModule.content = updatedContent;
      return updatedModule;
    });
  }

  function resetOpenAndDueDates(updatedContent) {
    if (updatedContent?.hasDueDate) {
      updatedContent.due = null;
      updatedContent.hasDueDate = false;
    }

    if (updatedContent?.hasOpenDate) {
      updatedContent.open = null;
      updatedContent.hasOpenDate = false;
    }

    return updatedContent;
  }

  async function getCourse(courseID) {
    let courseRef = firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .get();

    let course = await courseRef;
    return course.data();
  }
}
async function retrieveQuestionSets(questionSetRefs) {
  let questionSets = [];

  for (let i = 0; i < questionSetRefs.length; i++) {
    let questionSetRef = questionSetRefs[i];
    let questionSet = await getQuestionSet(questionSetRef);
    questionSets.push(questionSet);
  }

  return questionSets;
}

async function getQuestionSet(questionSetRef) {
  let questionSet = await firebase.firestore().doc(questionSetRef).get();
  questionSet = questionSet.data();

  // get all the characters after /my_question_sets/ and store them in the questionSet.id
  let questionSetID = questionSetRef.match(/my_question_sets\/[^/]+/g);
  questionSetID = questionSetID[0].replace("my_question_sets/", "");

  questionSet.qSetID = questionSetID;

  return questionSet;
}
