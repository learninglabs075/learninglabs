import firebase from "./config/firebaseConfig.js";
import { generateRandomCode } from "./utils/utils.js";

export async function initializeUser(currentUser, updateDisplayName) {
  const fetchedSignUpInfo = [];
  const userRef = firebase.firestore().collection("users").doc(currentUser.uid);
  const pendingNameRef = firebase
    .firestore()
    .collection("pendingActions")
    .doc("users")
    .collection("setDisplayName");
  const userQuestionsRef = firebase
    .firestore()
    .collection("user_questions")
    .doc(currentUser.uid);
  const myLibraryRef = firebase
    .firestore()
    .collection("user_questions")
    .doc(currentUser.uid)
    .collection("my_library");
  const myQuestionSetsRef = firebase
    .firestore()
    .collection("user_questions")
    .doc(currentUser.uid)
    .collection("my_question_sets");

  try {
    const snapshot = await pendingNameRef
      .where("email", "==", currentUser.email)
      .get();

    if (!snapshot.empty) {
      snapshot.forEach((doc) => {
        fetchedSignUpInfo.push({ docID: doc.id, info: doc.data() });
      });
      await userRef.set({
        userID: currentUser.uid,
        email: currentUser.email,
        displayName: fetchedSignUpInfo[0].info.displayName,
        firstName: fetchedSignUpInfo[0].info?.firstName,
        lastName: fetchedSignUpInfo[0].info?.lastName,
        created: firebase.firestore.Timestamp.now(),
      });
      await updateDisplayName(fetchedSignUpInfo[0].info.displayName);
      pendingNameRef.doc(fetchedSignUpInfo[0].docID).delete();
    } else {
      console.log("user did not enter a display name upon sign up");
      await userRef.set({
        userID: currentUser.uid,
        email: currentUser.email,
        displayName: "",
        created: firebase.firestore.Timestamp.now(),
      });
    }
  } catch (error) {
    console.log(error.message);
  }
  try {
    await userQuestionsRef.set({
      userID: currentUser.uid,
      initialized: firebase.firestore.Timestamp.now(),
    });
    await myLibraryRef
      .add({
        type: "title card",
        title: "Welcome to your library!",
        body: "Your library serves as a central repository for your questions. Library questions can be copied into any question set, then edited without affecting the original. Happy question writing :)",
        tags: ["tagged", "questions", "are", "searchable"],
        created: firebase.firestore.Timestamp.now(),
        lastEdited: "",
      })
      .then(
        async (docRef) =>
          await myLibraryRef.doc(docRef.id).update({ id: docRef.id })
      );
    await myQuestionSetsRef.add({
      title: "Example",
      questions: [
        {
          id: generateRandomCode(20),
          type: "title card",
          title: "Welcome to a question set!",
          body: "Question sets help you organize, edit, and administer question-based assessments. They can be delivered as stand-alone items or embedded within a course on the My Classroom page.",
          tags: ["tagged", "questions", "are", "searchable"],
          created: firebase.firestore.Timestamp.now(),
          lastEdited: "",
        },
      ],
      created: firebase.firestore.Timestamp.now(),
    });
  } catch (error) {
    console.log(error.messsage);
  }
}
