import firebase from "../../app/config/firebaseConfig.js";
import { useState } from "react";
import { Button } from "@material-ui/core";
import { getUserName } from "../../app/firestoreClient.js";
import { alphabet } from "../../app/utils/utils.js";

export default function ScoreValidation() {
  const [assignments, setAssignments] = useState([{}]);
  function attachPartLabel(question) {
    return question.parts.map(
      (part, index) => `${question.id}_${alphabet[index]}`
    );
  }

  async function fetchAssignments(courseID) {
    let assignments = await firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("assignments")
      .get();

    setAssignments(
      assignments.docs.map((doc) => {
        return { id: doc.id, docRef: doc.data().docRef };
      })
    );

    return assignments.docs.map((doc) => ({
      id: doc.id,
      docRef: doc.data().docRef,
    }));
  }

  async function fetchLightweightAssignmentGradeForStudent(
    courseID,
    assignmentID,
    userID
  ) {
    let userGradeSummaryRef = firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("grade_summaries")
      .doc(userID);

    let userGradeSummary = await userGradeSummaryRef.get();

    let assignmentGrade;
    try {
      assignmentGrade = userGradeSummary.data()[assignmentID];
    } catch (error) {
      console.log(
        `Missing Lightweight assignment for courseID: ${courseID} assignmentID: ${assignmentID} and userID: ${userID}`
      );
      return {};
    }

    return assignmentGrade
      ? {
          assignmentID: assignmentID,
          totalEarnedPoints: assignmentGrade?.totalEarnedPoints,
          totalPossiblePoints: assignmentGrade?.totalPossiblePoints,
        }
      : {};
  }

  async function fetchQuestionSet(docRef) {
    const fetchedItem = await firebase.firestore().doc(docRef).get();
    return {
      id: fetchedItem.id,
      title: fetchedItem.data()?.title,
      questions: fetchedItem.data()?.questions,
      totalPossiblePoints: fetchedItem.data()?.totalPossiblePoints,
    };
  }

  return (
    <>
      <Button onClick={() => updateAllCourseAssignmentResultsAndGradebook()}>
        Update All Course Assignment Results
      </Button>
      <div style={{ height: "600px" }} className="overflow-auto">
        <pre>{JSON.stringify(assignments, null, 2)}</pre>
      </div>
    </>
  );

  async function fetchCourses() {
    let courses = await firebase
      .firestore()
      .collection("courses")
      .where("isActive", "==", true)
      .get();
    return courses.docs.map((doc) => ({ id: doc.id }));
  }

  async function updateAllCourseAssignmentResultsAndGradebook() {
    let courses = await fetchCourses();

    courses.forEach(async (course) => {
      console.log("courseID", course.id);
      let courseID = course.id;
      let assignments = await fetchAssignments(courseID);

      if (assignments.length > 0) {
        await updateAssignmentResultsAndGradebook(assignments, courseID);
      }
    });
  }

  async function updateAssignmentResultsAndGradebook(assignments, courseID) {
    assignments.forEach(async (assignment, index, array) => {
      let studentResultsRef = firebase
        .firestore()
        .collection("courses")
        .doc(courseID)
        .collection("assignments")
        .doc(assignment.id)
        .collection("results");

      let studentResults = await studentResultsRef.get();

      if (studentResults.empty === false) {
        studentResults.docs.forEach(async (studentAssignmentResultDoc) => {
          let studentID = studentAssignmentResultDoc.id;

          let {
            lightWeightAssignmentGrade,
            heavyTotalEarnedPointsViaCurrentKeys,
            heavyTotalEarnedPointsViaKeys,
            heavyTotalEarnedPoints,
            heavyTotalPossiblePoints,
            questionSet,
          } = await getStudentResultsAndGradeInfo(
            courseID,
            assignment.id,
            studentID
          );

          if (
            lightWeightAssignmentGrade?.totalEarnedPoints !==
              heavyTotalEarnedPointsViaCurrentKeys ||
            heavyTotalEarnedPoints !== heavyTotalEarnedPointsViaCurrentKeys
          ) {
            await prettyPrintAssignmentResults(
              courseID,
              studentID,
              assignment.id,
              heavyTotalEarnedPoints,
              heavyTotalEarnedPointsViaKeys,
              heavyTotalEarnedPointsViaCurrentKeys,
              lightWeightAssignmentGrade,
              heavyTotalPossiblePoints,
              questionSet.totalPossiblePoints
            );
            // await updateStudentEarnedPoints(
            //   courseID,
            //   assignment.id,
            //   studentID,
            //   heavyTotalEarnedPoints,
            //   heavyTotalEarnedPointsViaCurrentKeys,
            //   questionSet,
            //   lightWeightAssignmentGrade
            // );
            console.log("updated student earned points");
          }
        });
      }
    });
  }

  async function getStudentAssignmentResults(courseID, assignmentID, userID) {
    const studentAssignmentResultDocRef = firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("assignments")
      .doc(assignmentID)
      .collection("results")
      .doc(userID);

    const studentAssignmentResultDoc =
      await studentAssignmentResultDocRef.get();
    return studentAssignmentResultDoc;
  }

  async function getStudentResultsAndGradeInfo(courseID, assignmentID, userID) {
    let lightWeightAssignmentGrade =
      await fetchLightweightAssignmentGradeForStudent(
        courseID,
        assignmentID,
        userID
      );

    const studentAssignmentResultDoc = await getStudentAssignmentResults(
      courseID,
      assignmentID,
      userID
    );

    let heavyEarnedPointsKeys = Object.keys(
      studentAssignmentResultDoc.data()
    ).filter((key) => key.includes("_earnedPoints"));

    let heavyTotalEarnedPoints =
      studentAssignmentResultDoc.data().totalEarnedPoints;

    let heavyTotalPossiblePoints =
      studentAssignmentResultDoc.data().totalPossiblePoints;

    // Filter again with current questions
    let assignment = await fetchAssignment(courseID, assignmentID);
    let questionSet = assignment?.docRef
      ? await fetchQuestionSet(assignment.docRef)
      : {};

    //get values of array of keys and add them up
    let heavyTotalEarnedPointsViaKeys = getHeavyEarnedPointsKeys(
      heavyEarnedPointsKeys,
      studentAssignmentResultDoc
    );

    let currentQuestions =
      questionSet?.questions?.length > 0
        ? getCurrentQuestionIDs(questionSet)
        : [];

    //loop through all keys and check if they are in current questions
    let heavyEarnedPointsCurrentKeys = getHeavyEarnedPointsCurrentKeys(
      heavyEarnedPointsKeys,
      currentQuestions
    );

    let heavyTotalEarnedPointsViaCurrentKeys =
      calculateHeavyTotalEarnedPointsViaCurrentKeys(
        heavyEarnedPointsCurrentKeys,
        studentAssignmentResultDoc
      );
    return {
      lightWeightAssignmentGrade,
      heavyTotalEarnedPointsViaCurrentKeys,
      heavyTotalEarnedPointsViaKeys,
      heavyTotalEarnedPoints,
      heavyTotalPossiblePoints,
      questionSet,
    };
  }

  async function fetchAssignment(courseID, assignmentID) {
    let assignment = await firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("assignments")
      .doc(assignmentID)
      .get();

    return { id: assignment.id, docRef: assignment.data()?.docRef };
  }

  async function updateStudentEarnedPoints(
    courseID,
    assignmentID,
    userID,
    heavyTotalEarnedPoints,
    heavyTotalEarnedPointsViaCurrentKeys,
    questionSet,
    lightWeightAssignmentGrade
  ) {
    if (heavyTotalEarnedPoints !== heavyTotalEarnedPointsViaCurrentKeys) {
      let studentAssignmentResultRef = firebase
        .firestore()
        .collection("courses")
        .doc(courseID)
        .collection("assignments")
        .doc(assignmentID)
        .collection("results")
        .doc(userID);

      await studentAssignmentResultRef.update({
        totalEarnedPoints: heavyTotalEarnedPointsViaCurrentKeys,
        totalPossiblePoints: questionSet?.totalPossiblePoints
          ? questionSet.totalPossiblePoints
          : 0,
      });
    }

    if (
      lightWeightAssignmentGrade.totalEarnedPoints !==
      heavyTotalEarnedPointsViaCurrentKeys
    ) {
      let userGradeSummaryRef = firebase
        .firestore()
        .collection("courses")
        .doc(courseID)
        .collection("grade_summaries")
        .doc(userID);

      await userGradeSummaryRef.update({
        [assignmentID]: {
          totalEarnedPoints: heavyTotalEarnedPointsViaCurrentKeys,
          totalPossiblePoints: questionSet?.totalPossiblePoints
            ? questionSet.totalPossiblePoints
            : 0,
        },
      });
    }
  }

  function getHeavyEarnedPointsKeys(
    heavyEarnedPointsKeys,
    studentAssignmentResultDoc
  ) {
    return heavyEarnedPointsKeys.reduce((acc, curr) => {
      return acc + studentAssignmentResultDoc.data()[curr];
    }, 0);
  }

  function getCurrentQuestionIDs(questionSet) {
    let currentQuestions = questionSet.questions.map((question) => {
      if (question?.parts) {
        return attachPartLabel(question);
      }
      return question.id;
    });

    currentQuestions = currentQuestions.flat();
    return currentQuestions;
  }

  function calculateHeavyTotalEarnedPointsViaCurrentKeys(
    heavyEarnedPointsCurrentKeys,
    doc
  ) {
    return heavyEarnedPointsCurrentKeys.reduce((acc, curr) => {
      return acc + doc.data()[curr];
    }, 0);
  }

  function getHeavyEarnedPointsCurrentKeys(
    heavyEarnedPointsKeys,
    currentQuestions
  ) {
    let heavyEarnedPointsCurrentKeys = [];

    heavyEarnedPointsKeys.forEach((questionIDEarnedPoints) => {
      currentQuestions.forEach((questionID) => {
        if (
          questionIDEarnedPoints === questionID + "_earnedPoints" &&
          !heavyEarnedPointsCurrentKeys.includes(questionIDEarnedPoints)
        ) {
          heavyEarnedPointsCurrentKeys.push(questionIDEarnedPoints);
        }
      });
    });
    return heavyEarnedPointsCurrentKeys;
  }

  async function prettyPrintAssignmentResults(
    courseID,
    userID,
    assignmentID,
    heavyTotalEarnedPoints,
    heavyTotalEarnedPointsViaKeys,
    heavyTotalEarnedPointsViaCurrentKeys,
    lightWeightAssignmentGrade,
    heavyTotalPossiblePoints,
    currentTotalPossiblePoints
  ) {
    let userName = await getUserName(userID);

    console.log(userName?.displayName + ": " + userID);
    // console.log((await getUserName(userID)).displayName + ": " + userID);
    console.log("courseID: " + courseID);

    if (heavyTotalEarnedPoints !== heavyTotalEarnedPointsViaCurrentKeys)
      console.log(
        "Heavy TotalEarnedPoints current keys summed  <> Heavy totalEarnedPoints field " +
          assignmentID
      );

    if (
      lightWeightAssignmentGrade.totalEarnedPoints !==
      heavyTotalEarnedPointsViaKeys
    ) {
      console.log(
        "%c" +
          "Light TotalEarnedPoints <> Heavy totalEarnedPoints summed********************No impact********************",
        "color: yellow"
      );
    }

    if (
      lightWeightAssignmentGrade.totalEarnedPoints !==
      heavyTotalEarnedPointsViaCurrentKeys
    ) {
      console.log(
        "%c" +
          "Light TotalEarnedPoints <> Heavy totalEarnedPoints via current keys summed********************PROBLEM !!!!********************",
        "color: red"
      );
    }

    console.log(
      'HeavyWeight:  {"assignmentID":',
      assignmentID,
      '"totalEarned Points":' + heavyTotalEarnedPoints,
      '"totalPossiblePoints"' + heavyTotalPossiblePoints,
      "| summed earnedPoints: " + heavyTotalEarnedPointsViaKeys,
      "| summed current Keys earnedPoints: " +
        heavyTotalEarnedPointsViaCurrentKeys
    );
    console.log("LightWeight: ", JSON.stringify(lightWeightAssignmentGrade));
    console.log("currentTotalPossiblePoints: ", currentTotalPossiblePoints);
    console.log("");
  }
}
