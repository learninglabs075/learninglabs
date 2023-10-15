import { useState } from "react";
import { Box, Button, TextField } from "@material-ui/core";
import firebase from "../../app/config/firebaseConfig.js";

export default function UpdateOrgIDs() {
  const [courseID, setCourseID] = useState("");
  const [courseInfo, setCourseInfo] = useState(null);
  const students = courseInfo?.students;
  const studentsWithOrgID = students?.filter((el) => el.organizationUserID);

  const updateCourseID = (e) => setCourseID(e.target.value);

  async function fetchStudents() {
    console.log("button pressed");
    await firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .get()
      .then((doc) => setCourseInfo(doc.data()));
  }

  function updateGradeSummaryOrgIDs() {
    studentsWithOrgID.forEach(
      async (student) =>
        await firebase
          .firestore()
          .collection("courses")
          .doc(courseID)
          .collection("grade_summaries")
          .doc(student.id)
          .update({ organizationUserID: student.organizationUserID })
    );
  }

  return (
    <Box className="overflow-auto full-height">
      <TextField
        variant="outlined"
        label="course ID"
        onChange={updateCourseID}
      />
      <Button onClick={fetchStudents} variant="contained" disabled={!courseID}>
        Fetch Students
      </Button>
      <Button
        onClick={updateGradeSummaryOrgIDs}
        variant="contained"
        disabled={!studentsWithOrgID || studentsWithOrgID?.length < 1}
      >
        Update Org IDs
      </Button>
      {courseID && <pre>course ID: {courseID}</pre>}
      {/* {courseInfo && <pre>{JSON.stringify(students, null, 2)}</pre>} */}
      {courseInfo && (
        <pre>{"number of students found: " + students?.length}</pre>
      )}

      {courseInfo && (
        <pre>
          {"number of students with Org IDs: " + studentsWithOrgID?.length}
        </pre>
      )}
      {courseInfo && <pre>{JSON.stringify(studentsWithOrgID, null, 2)}</pre>}
      {/* {courseInfo && <pre>{JSON.stringify(courseInfo, null, 2)}</pre>} */}
    </Box>
  );
}
