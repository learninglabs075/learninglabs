import firebase from "./config/firebaseConfig.js";
import { capitalizeFirstLetter } from "./utils/utils.js";

export function setNamePending(email, firstName, lastName) {
  const ref = firebase
    .firestore()
    .collection("pendingActions")
    .doc("users")
    .collection("setDisplayName");
  return ref.add({
    email: email.toLowerCase(),
    displayName:
      capitalizeFirstLetter(firstName) + " " + capitalizeFirstLetter(lastName),
    firstName: capitalizeFirstLetter(firstName),
    lastName: capitalizeFirstLetter(lastName),
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

export function updateDisplayNameInFirestore(displayName, userID) {
  const ref = firebase.firestore().collection("users").doc(userID);
  ref.update({ displayName: displayName });
}

export async function addCourse(courseInfo) {
  const ref = firebase.firestore().collection("courses");
  let course = await ref.add(courseInfo);

  return course.id;
}

export function updateCourseTitle(courseID, updatedTitle, userID) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.update({
    title: updatedTitle,
  });

  updateAnyQuestionSetsInUseCourseTitle(courseID, updatedTitle, userID);
}

function updateAnyQuestionSetsInUseCourseTitle(courseID, updatedTitle, userID) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets");

  ref.get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      if (doc.data()?.inUse?.courseID === courseID) {
        ref.doc(doc.id).update({
          inUse: {
            courseID: courseID,
            courseTitle: updatedTitle,
          },
        });
      }
    });
  });
}

export function updateAssignmentFirstResultSubmitted(courseID, assignmentID) {
  firebase
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("assignments")
    .doc(assignmentID)
    .update({
      firstResultSubmitted: firebase.firestore.FieldValue.serverTimestamp(),
    });
}

export function updateCourseDescription(courseID, updatedDescription) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.update({
    description: updatedDescription,
  });
}

export async function generateTotalPossiblePoints(questionSetID, userID) {
  let ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID)
    .get();

  let questions = await ref;

  questions = questions.data().questions;

  let totalPossiblePoints = questions.reduce(
    (total, current) => total + (parseInt(current.possiblePoints) || 0),
    0
  );

  //Get totalPossiblePoints for multipart questions which are embedded in parts array
  let multiPartTotalPossiblePoints = 0;
  questions.forEach((question) => {
    multiPartTotalPossiblePoints += question.hasOwnProperty("parts")
      ? question.parts.reduce(
          (total, current) => total + (parseInt(current.possiblePoints) || 0),
          0
        )
      : 0;
  });

  totalPossiblePoints =
    parseInt(totalPossiblePoints) + parseInt(multiPartTotalPossiblePoints);

  updateTotalPossiblePoints(totalPossiblePoints, questionSetID, userID);
}

export function updateTotalPossiblePoints(
  totalPossiblePoints,
  questionSetID,
  userID
) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);

  ref.update({
    totalPossiblePoints: totalPossiblePoints,
  });
}

export function inviteStudentsToCourse(students, courseID) {
  const ref = firebase.firestore().collection("courses").doc(courseID);

  ref.update({
    invitedStudents: firebase.firestore.FieldValue.arrayUnion(...students),
    invitedStudentEmails: firebase.firestore.FieldValue.arrayUnion(
      ...students.map((student) => student.email)
    ),
  });
}

export async function inviteInstructorToCourse(values, courseID) {
  let ref = firebase.firestore().collection("courses").doc(courseID);

  await ref.update({
    invitedInstructorEmails: firebase.firestore.FieldValue.arrayUnion(
      values.instructorEmail
    ),
  });
}

export function inviteStudentToCourse(values, courseID) {
  let ref = firebase.firestore().collection("courses").doc(courseID);

  ref.update({
    invitedStudents: firebase.firestore.FieldValue.arrayUnion({
      email: values.studentEmail,
      organizationUserID: values?.studentOrganizationUserId
        ? values.studentOrganizationUserId
        : "",
      organizationUserName: values.studentName,
    }),
    invitedStudentEmails: firebase.firestore.FieldValue.arrayUnion(
      values.studentEmail
    ),
  });
}

export function addCourseModule(moduleInfo, courseID) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.update({
    modules: firebase.firestore.FieldValue.arrayUnion(moduleInfo),
  });
}

export function deleteCourseModule(moduleInfo, courseID) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.update({
    modules: firebase.firestore.FieldValue.arrayRemove(moduleInfo),
  });
}

export function updateModuleTitle(courseID, updatedModules) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.update({
    modules: updatedModules,
  });
}

export function updateCourseModuleContent(courseID, updatedModules) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.update({
    modules: updatedModules,
  });
  return ref.response;
}

export function updateCourseModuleOrder(courseID, updatedModules) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.update({
    modules: updatedModules,
  });
  return ref.response;
}

export async function updateCourseModuleContentOrder(
  courseID,
  currentModuleIndex,
  reorderedContent
) {
  const ref = firebase.firestore().collection("courses").doc(courseID);

  let course = await ref.get();
  let modules = course.data().modules;
  let currentModule = modules[currentModuleIndex];
  let updatedModule = {
    ...currentModule,
    content: reorderedContent,
  };
  let updatedModules = [...modules];
  updatedModules[currentModuleIndex] = updatedModule;

  await ref.update({ modules: updatedModules });

  // ref.update({
  //   modules[currentModuleIndex]: updatedModules,
  // });

  return ref.response;
}

export function updateQuestionSetQuestionsOrder(
  userID,
  questionSetID,
  updatedQuestionSetQuestions
) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);
  ref.update({
    questions: updatedQuestionSetQuestions,
  });
  return ref.response;
}

export function addQuestionSetToFolder(
  userID,
  questionSetID,
  folderID,
  questionSetTitle,
  questionSetInUse
) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(folderID);

  ref.update({
    children: firebase.firestore.FieldValue.arrayUnion({
      id: questionSetID,
      title: questionSetTitle,
      inUse: questionSetInUse ? questionSetInUse : false,
      isChild: true,
    }),
  });
  return ref.response;
}

export function removeQuestionSetFromFolder(
  userID,
  questionSetID,
  folderID,
  questionSetTitle,
  inUse
) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(folderID);

  ref.update({
    children: firebase.firestore.FieldValue.arrayRemove({
      id: questionSetID,
      title: questionSetTitle,
      isChild: true,
      ...(inUse && { inUse: inUse }),
    }),
  });
  return ref.response;
}

export function updateQuestionSetFolderProperties(
  userID,
  questionSetID,
  isChild,
  parentID = null,
  parentTitle = null
) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);

  ref.update({
    isChild: isChild,
    parentID: parentID,
    parentTitle: parentTitle,
  });
  return ref.response;
}

export function deleteContentFromModule(courseID, updatedModules) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref.update({
    modules: updatedModules,
  });
}

export function addReportProblem(values) {
  const ref = firebase.firestore().collection("report_a_problem");
  ref.add(values);
}

export function addNewLibrary(libraryInfo) {
  const ref = firebase
    .firestore()
    .collection(process.env.REACT_APP_PRODUCT_COLLECTION);
  ref.add(libraryInfo);
}

export function addQuestionToProductLibrary(question, productLibraryID) {
  const productLibraryInfoRef = firebase
    .firestore()
    .collection(process.env.REACT_APP_PRODUCT_COLLECTION)
    .doc(productLibraryID);

  const productLibraryRef = productLibraryInfoRef.collection("questions");

  productLibraryRef
    .add(question)
    .then((docRef) =>
      productLibraryRef.doc(docRef.id).update({ id: docRef.id })
    )
    .then(() => {
      productLibraryInfoRef.update({
        questionCount: firebase.firestore.FieldValue.increment(1),
      });
    });
}

export function updateQuestionInProductLibrary(
  productLibraryID,
  libraryQuestionID,
  editedQuestion
) {
  const ref = firebase
    .firestore()
    .collection(process.env.REACT_APP_PRODUCT_COLLECTION)
    .doc(productLibraryID)
    .collection("questions")
    .doc(libraryQuestionID);

  ref.update(editedQuestion);
}

export function deleteQuestionFromProductLibrary(questionID, productLibraryID) {
  const productLibraryInfoRef = firebase
    .firestore()
    .collection(process.env.REACT_APP_PRODUCT_COLLECTION)
    .doc(productLibraryID);

  const productLibraryQuestionRef = productLibraryInfoRef
    .collection("questions")
    .doc(questionID);

  productLibraryQuestionRef.delete().then(() =>
    productLibraryInfoRef.update({
      questionCount: firebase.firestore.FieldValue.increment(-1),
    })
  );
}

export function addQuestionToMyLibrary(question, userID) {
  const myQuestionsRef = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID);

  const myLibraryRef = myQuestionsRef.collection("my_library");

  myLibraryRef
    .add(question)
    .then((docRef) => myLibraryRef.doc(docRef.id).update({ id: docRef.id }))
    .then(() => {
      myQuestionsRef.update({
        questionCount: firebase.firestore.FieldValue.increment(1),
      });
    });
}

export function updateQuestionInMyLibrary(
  libraryQuestionID,
  editedQuestion,
  userID
) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_library")
    .doc(libraryQuestionID);

  ref.update(editedQuestion);
}

export function deleteQuestionFromMyLibrary(questionID, userID) {
  const ref = firebase.firestore().collection("user_questions").doc(userID);

  ref
    .collection("my_library")
    .doc(questionID)
    .delete()
    .then(() =>
      ref.update({
        questionCount: firebase.firestore.FieldValue.increment(-1),
      })
    );
}

export function addQuestionToSet(questionSetID, question, userID) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);
  ref.update({
    questions: firebase.firestore.FieldValue.arrayUnion(question),
  });
}

export function updateQuestionInSet(questionSetID, updatedQuestions, userID) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);

  ref.update({
    questions: updatedQuestions,
  });
}

export async function deleteQuestionFromSet(
  qIndex,
  questions,
  questionSetID,
  userID
) {
  const question = questions[qIndex];

  const updatedQuestions = questions.filter((el) => el.id !== question.id);

  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);

  await ref.update({
    questions: updatedQuestions,
  });
}

export function copyQuestionToSet(questionSetID, selectedQuestions, userID) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);
  selectedQuestions.forEach((question) => {
    ref.update({
      questions: firebase.firestore.FieldValue.arrayUnion(question),
    });
  });
}

export function addQuestionSet(questionSetInfo, userID) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc();

  ref.set(questionSetInfo);
}

export async function editQuestionSetTitle(
  values,
  userID,
  questionSetID,
  parentID = null,
  originalTitle
) {
  const questionSetRef = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);
  await questionSetRef.update({ title: values.title });

  if (parentID) {
    const parentRef = firebase
      .firestore()
      .collection("user_questions")
      .doc(userID)
      .collection("my_question_sets")
      .doc(parentID);

    parentRef.update({
      children: firebase.firestore.FieldValue.arrayRemove({
        id: questionSetID,
        isChild: true,
        title: originalTitle,
      }),
    });

    parentRef.update({
      children: firebase.firestore.FieldValue.arrayUnion({
        id: questionSetID,
        isChild: true,
        title: values.title,
      }),
    });
  }
}

export async function editCourseAssignmentQuestionSetTitle(
  values,
  questionSetID,
  inUse
) {
  const courseRef = firebase
    .firestore()
    .collection("courses")
    .doc(inUse.courseID);

  let courseDoc = await courseRef.get();
  let course = courseDoc.data();

  course.modules.map((module) => {
    return module.content?.map((content) => {
      if (content.docRef.includes(questionSetID)) {
        content.title = values.title;
      }
      return content;
    });
  });

  await courseRef.update({
    modules: course.modules,
  });
}

export function addFolderToQuestionSetCollection(questionSetInfo, userID) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc();

  ref.set(questionSetInfo);
}

export function deleteQuestionSet(questionSetID, userID) {
  const ref = firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID);

  ref.delete().catch((err) => {
    console.error(err);
  });
}

export function addLink(urlInfo, userID) {
  const ref = firebase
    .firestore()
    .collection("user_links")
    .doc(userID)
    .collection("urls");

  ref.add(urlInfo);
}

export function updateLink(linkInfo, userID, docID) {
  if (!docID) return;

  const ref = firebase
    .firestore()
    .collection("user_links")
    .doc(userID)
    .collection("urls")
    .doc(docID);

  const updatedInfo = {
    title: linkInfo?.title || "",
    url: linkInfo?.url || "",
    description: linkInfo?.description || "",
    created: linkInfo?.created || firebase.firestore.Timestamp.now(),
    updated: firebase.firestore.Timestamp.now(),
  };

  ref.update({ ...updatedInfo });
}

export function deleteLink(linkID, userID) {
  const ref = firebase
    .firestore()
    .collection("user_links")
    .doc(userID)
    .collection("urls")
    .doc(linkID);
  ref.delete();
}

export async function saveResponse(
  response,
  courseID,
  assignmentID,
  userID,
  questionSetID,
  collection
) {
  switch (collection) {
    case "courses":
      const coursesRef = firebase
        .firestore()
        .collection("courses")
        .doc(courseID)
        .collection("assignments")
        .doc(assignmentID)
        .collection("results")
        .doc(userID);

      await coursesRef.set(response, { merge: true });
      break;
    case "my_responses":
      const myResponsesRef = firebase
        .firestore()
        .collection("user_questions")
        .doc(userID)
        .collection("my_responses")
        .doc(questionSetID);

      await myResponsesRef.set(response, { merge: true });
      break;
    default:
      break;
  }
}

export function saveQuestionSetGradeSummary(
  response,
  courseID,
  assignmentID,
  userID,
  userDisplayName,
  submittedQuestion,
  pastDue,
  dueDateExceededPenaltyPercentage
) {
  const gradeSummariesRef = firebase
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("grade_summaries")
    .doc(userID);

  response.totalEarnedPoints = extractQuestionEarnedPoints(response);

  switch (submittedQuestion.type) {
    case "free response":
      gradeSummariesRef.set(
        {
          userID: userID,
          userDisplayName: userDisplayName,
          [assignmentID]: {
            assignmentType: "question set",
            totalEarnedPoints: response.totalEarnedPoints
              ? firebase.firestore.FieldValue.increment(
                  response.totalEarnedPoints
                )
              : firebase.firestore.FieldValue.increment(0),
            totalPossiblePoints: response.totalPossiblePoints,
            ...(pastDue &&
              dueDateExceededPenaltyPercentage && {
                dueDateExceededPenaltyPercentage:
                  dueDateExceededPenaltyPercentage,
              }),
            pendingFreeResponseReview: firebase.firestore.FieldValue.arrayUnion(
              submittedQuestion.id
            ),
          },
        },
        { merge: true }
      );
      break;
    default:
      gradeSummariesRef.set(
        {
          userID: userID,
          userDisplayName: userDisplayName,
          [assignmentID]: {
            assignmentType: "question set",
            totalEarnedPoints: response.totalEarnedPoints
              ? firebase.firestore.FieldValue.increment(
                  response.totalEarnedPoints
                )
              : firebase.firestore.FieldValue.increment(0),
            totalPossiblePoints: response.totalPossiblePoints,
            ...(pastDue &&
              dueDateExceededPenaltyPercentage && {
                dueDateExceededPenaltyPercentage:
                  dueDateExceededPenaltyPercentage,
              }),
            ...(response.mode && { mode: response.mode }),
            ...(response.completedSkills
              ? {
                  completedSkills: firebase.firestore.FieldValue.arrayUnion(
                    response.completedSkills
                  ),
                }
              : {}),
          },
        },
        { merge: true }
      );
      break;
  }
}

function extractQuestionEarnedPoints(response) {
  let earnedPoints = 0;
  for (const key in response) {
    if (key.endsWith("_earnedPoints")) {
      earnedPoints = response[key];
    }
  }
  return earnedPoints;
}

export function fetchResponses(
  collection,
  courseID,
  assignmentID,
  userID,
  questionSetID,
  setSubmissionHistory
) {
  switch (collection) {
    case "courses":
      const coursesRef = firebase
        .firestore()
        .collection("courses")
        .doc(courseID)
        .collection("assignments")
        .doc(assignmentID)
        .collection("results")
        .doc(userID);
      coursesRef.onSnapshot((querySnapshot) => {
        setSubmissionHistory(querySnapshot.data());
      });
      break;
    case "my_responses":
      const myResponsesRef = firebase
        .firestore()
        .collection("user_questions")
        .doc(userID)
        .collection("my_responses")
        .doc(questionSetID || "placeholderID");
      myResponsesRef.onSnapshot((querySnapshot) => {
        setSubmissionHistory(querySnapshot.data());
      });
      break;
    default:
      break;
  }
}

export function fetchUserInfo(userID, setUserInfo) {
  const ref = firebase.firestore().collection("users").doc(userID);
  ref.onSnapshot((snapshot) => {
    setUserInfo(snapshot.data());
  });
}

export async function fetchUserPermissions(userID) {
  const ref = firebase.firestore().collection("users").doc(userID);
  let user = await ref.get();

  return user?.data()?.permissions?.length > 0 ? user.data().permissions : null;
}

export async function fetchUserIDFromEmail(userEmail) {
  const ref = firebase
    .firestore()
    .collection("users")
    .where("email", "==", userEmail);

  let user = await ref.get();

  return user.docs[0].id;
}

export async function getUserEmailByID(userID) {
  const ref = firebase.firestore().collection("users").doc(userID);

  let user = await ref.get();

  return user.data().email;
}

export async function getUserName(userID) {
  const ref = firebase
    .firestore()
    .collection("users")
    .where("userID", "==", userID);

  let user = await ref.get();

  return user.docs.length > 0
    ? {
        displayName: user.docs[0].data()?.displayName,
        lastName: user.docs[0].data()?.lastName,
        firstName: user.docs[0].data()?.firstName,
      }
    : "Name Missing";
}
