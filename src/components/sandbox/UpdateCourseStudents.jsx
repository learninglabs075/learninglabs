import firebase from "../../app/config/firebaseConfig.js";
import { useState } from "react";
import { Button } from "@material-ui/core";

export default function AddStudents() {
  const [courseInfo, setCourseInfo] = useState(null);
  //   const students = [];
  const [students, setStudents] = useState([]);
  const studentIDs = courseInfo?.studentIDs;
  async function fetchStudentIDs() {
    await firebase
      .firestore()
      .collection("courses")
      .doc("DbO1GKAKWgPx9FRg9Lj4")
      .get()
      .then((doc) => setCourseInfo(doc.data()));
  }

  async function fetchStudentInfo(userID) {
    let userInfo = await firebase
      .firestore()
      .collection("users")
      .where("userID", "==", userID)
      .get();

    return {
      email: userInfo.docs[0].data().email,
      id: userInfo.docs[0].data().userID,
      name: userInfo.docs[0].data().displayName,
    };
  }

  async function updateStudents() {
    await firebase
      .firestore()
      .collection("courses")
      .doc("DbO1GKAKWgPx9FRg9Lj4")
      .update({ students: students });
  }

  async function fetchStudents(studentIDs) {
    const fetchedItems = [];
    studentIDs.forEach(async (el) => {
      const fetchedItem = await fetchStudentInfo(el);
      fetchedItems.push(fetchedItem);
    });
    console.log(fetchedItems);
    setStudents(() => fetchedItems);
  }

  return (
    <>
      <Button onClick={() => fetchStudentIDs()}>Fetch studentIDs</Button>
      <Button onClick={() => fetchStudentInfo(studentIDs[2])}>
        Fetch Student Info
      </Button>
      <Button onClick={() => fetchStudents(studentIDs)}>Fetch students</Button>
      <Button onClick={() => updateStudents()}>Update Students</Button>
      <div style={{ height: "600px" }} className="overflow-auto">
        {/* <pre>{JSON.stringify(studentIDs, null, 2)}</pre> */}
        <pre>{JSON.stringify(students, null, 2)}</pre>
      </div>
    </>
  );
}
