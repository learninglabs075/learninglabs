import firebase from "../../app/config/firebaseConfig.js";
import { useState } from "react";
import { Button } from "@material-ui/core";
import { getUserName } from "../../app/firestoreClient.js";
import { capitalizeFirstLetter } from "../../app/utils/utils.js";

export default function UpdateLastNameFirstName() {
  const [assignments, setAssignments] = useState([{}]);

  // const courseID = "HFKIaJrv6yyYC8TD2aeO";
  const courseID = "puMfcrGQmX42YAmq0jSN";

  async function updateFirstNameLastName(courseID) {
    let gradeSummariesRef = firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("grade_summaries")
      .get();

    let userGradeSummary = await gradeSummariesRef;

    userGradeSummary.forEach((gradeSummary) => {
      let userDisplayName = gradeSummary.data().userDisplayName;
      let userID = gradeSummary.data().userID;
      let userName = userDisplayName ? userDisplayName.split(" ") : "";
      let userFirstName = userName[0]
        ? capitalizeFirstLetter(userName[0])
        : "Firstname_not_found";
      let userLastName = userName[1]
        ? capitalizeFirstLetter(userName[1])
        : "Lastname_not_found";

      let userRef = firebase.firestore().collection("users").doc(userID);

      userRef
        .update({
          firstName: userFirstName,
          lastName: userLastName,
        })
        .then(() => {
          console.log("updated");
        })
        .catch((error) => {
          console.log("user not found for userID: " + userID);
        });

      firebase
        .firestore()
        .collection("courses")
        .doc(courseID)
        .collection("grade_summaries")
        .doc(gradeSummary.id)
        .update({
          userFirstName: userFirstName,
          userLastName: userLastName,
        })
        .then(() => {
          console.log("works");
        })
        .catch(() => {
          console.log("error");
        });
    });
  }

  return (
    <>
      <Button onClick={() => updateFirstNameLastName(courseID)}>
        Update FirstName LastName
      </Button>
      <div style={{ height: "600px" }} className="overflow-auto">
        <pre>{JSON.stringify(assignments, null, 2)}</pre>
      </div>
    </>
  );
}
