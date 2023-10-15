const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();

const API_KEY = functions.config().sendgrid.key;
const TEMPLATE_ID = functions.config().sendgrid.template;
const TEMPLATE_WELCOME_NEW_USER =
  functions.config().sendgrid.template_welcome_new_user;
const TEMPLATE_REQUEST_LIBRARY_ACCESS =
  functions.config().sendgrid.template_request_library_access;
const WEBSITE_URL = functions.config().sendgrid.website_url;
sgMail.setApiKey(API_KEY);

const alphabet = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

//Called when new user added
exports.welcomeEmail = functions.auth.user().onCreate((user) => {
  const msg = {
    to: [user.email],
    from: `info@${WEBSITE_URL}`,
    template_id: TEMPLATE_WELCOME_NEW_USER,
    dynamic_template_data: {
      subject: "Welcome to Join Koral",
      name: user.displayName,
      link: WEBSITE_URL,
    },
  };

  return sgMail.send(msg);
});

exports.genericEmail = functions.https.onCall(async (data, context) => {
  const msg = {
    to: data.email,
    from: `info@${WEBSITE_URL}`,
    template_id: TEMPLATE_ID,
    dynamic_template_data: {
      course: data.course,
      courseCode: data.courseCode,
      name: data.name,
      link: data.link,
    },
  };

  await sgMail.send(msg);

  return { success: true };
});

exports.libraryAccessRequestEmail = functions.https.onCall(
  async (data, context) => {
    const msg = {
      to: data.email,
      from: `info@${WEBSITE_URL}`,
      template_id: TEMPLATE_REQUEST_LIBRARY_ACCESS,
      dynamic_template_data: {
        libraryTitle: data.libraryTitle,
      },
    };

    await sgMail.send(msg);

    return { success: true };
  }
);

exports.createStripeCheckout = functions.https.onCall(async (data, context) => {
  const stripe = require("stripe")(functions.config().stripe.secret_key);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `http://${WEBSITE_URL}/classroom`, //TODO Dynamic send to My Content if Library
    cancel_url: `http://${WEBSITE_URL}/support`,
    client_reference_id: data.client_reference_id,
    metadata: data.metadata,
    line_items: [
      {
        price: data.price,
        quantity: 1,
      },
    ],
  });

  return { id: session.id, url: session.url };
});

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripe = require("stripe")(functions.config().stripe.secret_key);
  let stripeEvent;

  //Validate Webhook
  try {
    const whSec = functions.config().stripe.payments_webhook_secret;
    stripeEvent = stripe.webhooks.constructEvent(
      req.rawBody,
      req.headers["stripe-signature"],
      whSec
    );
  } catch (error) {
    console.error("Webhook signature verification failed.");
    return res.sendStatus(400);
  }

  const dataObject = stripeEvent.data.object;

  await saveOrderInformation(dataObject);
  await activatePurchase(dataObject); //TODO add student to students map in course

  return res.sendStatus(200);
});

// An analagous function can be called client side via the scoreValidation component.
async function updateAllCourseAssignmentResultsAndGradebook() {
  let courses = await fetchCourses();

  for (const course of courses) {
    let courseID = course.id;
    let assignments = await fetchAssignments(courseID);
    if (assignments.length > 0) {
      await updateAssignmentResultsAndGradebook(assignments, courseID);
    }
  }

  Promise.resolve();
  return true;
}

async function updateAssignmentResultsAndGradebook(assignments, courseID) {
  for (const assignment of assignments) {
    let studentResultsRef = admin
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("assignments")
      .doc(assignment.id)
      .collection("results");

    let studentResults = await studentResultsRef.get();

    if (studentResults.empty === false) {
      for (const studentAssignmentResultDoc of studentResults.docs) {
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
          console.log(
            "updateStudentEarnedPoints() called with courseID: " +
              courseID +
              " assignmentID: " +
              assignment.id +
              " studentID: " +
              studentID
          );
          await updateStudentEarnedPoints(
            courseID,
            assignment.id,
            studentID,
            heavyTotalEarnedPoints,
            heavyTotalEarnedPointsViaCurrentKeys,
            questionSet,
            lightWeightAssignmentGrade
          );
        }
      }
    }
  }
  Promise.resolve();
  return true;
}

//Triggered on changes to the courses/assignments/{assignmentID} to track which assignment a questionSet is used in
exports.courseAssignmentModified = functions.firestore
  .document("courses/{courseID}/assignments/{assignmentID}")
  .onWrite(async (change, context) => {
    const courseID = context.params.courseID;
    let docRef = change.after.data()?.docRef;

    if (docRef !== null) {
      let courseDoc = await fetchCourse(courseID);
      await updateQuestionSetInUseCourses(docRef, courseDoc);

      let userID = docRef.substring(
        docRef.indexOf("user_questions/") + 15,
        docRef.indexOf("/my_question_sets/")
      );

      let qSet = await fetchQuestionSet(docRef);
      if (qSet?.isChild) {
        await removeQuestionSetFromParentFolder(qSet, userID);
      }
    }

    return null;
  });

exports.impersonateUser = functions.https.onCall(async (data, context) => {
  const callingUserID = context.auth.uid;
  const userID = data.userID;

  let blnImpersonatePermission = await hasImpersonatePermission(callingUserID);

  if (!blnImpersonatePermission) {
    return { error: "You do not have permission to impersonate users." };
  }

  const user = await admin.auth().getUser(userID);
  const impersonatedUser = await admin.auth().createCustomToken(userID);
  return {
    user: user,
    impersonatedUser: impersonatedUser,
  };
});

async function removeQuestionSetFromParentFolder(qSet, userID) {
  let parentQSet = await fetchQuestionSet(
    ("user_questions/" + userID + "/my_question_sets/" + qSet.parentID).trim()
  );

  let index = parentQSet?.children?.findIndex((child) => child.id === qSet.id);
  parentQSet.children.splice(index, 1);

  updateQuestionSetFolder(parentQSet, qSet, userID);
  updateQuestionSet(qSet, userID);

  return true;
}

async function updateQuestionSetFolder(parentQSet, qSet, userID) {
  let parentQSetRef = admin
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(parentQSet.id);

  let updatedFolderChildren = parentQSet.children.filter(
    (child) => child.id !== qSet.id
  );

  await parentQSetRef.update({
    children: updatedFolderChildren,
  });

  return true;
}

async function updateQuestionSet(qSet, userID) {
  let qSetRef = admin
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(qSet.id);

  await qSetRef.update({
    isChild: false,
    parentID: null,
    parentTitle: null,
  });

  return true;
}

async function updateQuestionSetInUseCourses(docRef, courseDoc) {
  await admin
    .firestore()
    .doc(docRef)
    .set(
      {
        inUse: {
          courseID: courseDoc.id,
          courseTitle: courseDoc.data()?.title,
        },
      },
      { merge: true }
    );
}

async function fetchCourse(courseID) {
  let courseRef = admin.firestore().collection("courses").doc(courseID).get();
  let courseDoc = await courseRef;

  return courseDoc;
}

exports.resolveGradebookResultDiscrepencies = functions
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .https.onRequest(async (req, res) => {
    if (req.query.runScript !== "true") {
      return res.sendStatus(404);
    }

    try {
      await updateAllCourseAssignmentResultsAndGradebook();
      return res.sendStatus(200);
    } catch (error) {
      console.log(error);
      res.send("Error running resolveGradebookResultDiscrepencies()");
    }
  });

//Triggered on changes to the courses/assignments/results collection
exports.courseAssignmentResultsModified = functions.firestore
  .document("courses/{courseID}/assignments/{assignmentID}/results/{userID}")
  .onWrite(async (change, context) => {
    const courseID = context.params.courseID;
    const assignmentID = context.params.assignmentID;
    const userID = context.params.userID;

    await new Promise((r) => setTimeout(r, 30000)); //Ensure the light-weight gradebook write has been made before we read the data.

    let {
      lightWeightAssignmentGrade,
      heavyTotalEarnedPointsViaCurrentKeys,
      heavyTotalEarnedPoints,
      questionSet,
    } = await getStudentResultsAndGradeInfo(courseID, assignmentID, userID);

    if (
      lightWeightAssignmentGrade?.totalEarnedPoints !==
        heavyTotalEarnedPointsViaCurrentKeys ||
      heavyTotalEarnedPoints !== heavyTotalEarnedPointsViaCurrentKeys
    ) {
      await updateStudentEarnedPoints(
        courseID,
        assignmentID,
        userID,
        heavyTotalEarnedPoints,
        heavyTotalEarnedPointsViaCurrentKeys,
        questionSet,
        lightWeightAssignmentGrade
      );
    }
  });

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

function getHeavyEarnedPointsKeys(
  heavyEarnedPointsKeys,
  studentAssignmentResultDoc
) {
  return heavyEarnedPointsKeys.reduce((acc, curr) => {
    return acc + studentAssignmentResultDoc.data()[curr];
  }, 0);
}

async function getStudentAssignmentResults(courseID, assignmentID, userID) {
  const studentAssignmentResultDocRef = admin
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("assignments")
    .doc(assignmentID)
    .collection("results")
    .doc(userID);

  const studentAssignmentResultDoc = await studentAssignmentResultDocRef.get();
  return studentAssignmentResultDoc;
}

async function fetchAssignments(courseID) {
  let assignments = await admin
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("assignments")
    .get();

  return assignments.docs.map((doc) => ({
    id: doc.id,
    docRef: doc.data().docRef,
  }));
}

async function fetchAssignment(courseID, assignmentID) {
  let assignment = await admin
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("assignments")
    .doc(assignmentID)
    .get();

  return { id: assignment.id, docRef: assignment.data().docRef };
}

async function fetchCourses() {
  let courses = await admin
    .firestore()
    .collection("courses")
    .where("isActive", "==", true)
    .get(); //TODO isActive

  return courses.docs.map((doc) => ({ id: doc.id }));
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

async function fetchQuestionSet(docRef) {
  const fetchedItem = await admin.firestore().doc(docRef).get();

  return {
    id: fetchedItem.id,
    title: fetchedItem.data()?.title,
    questions: fetchedItem.data()?.questions,
    isChild: fetchedItem.data()?.isChild,
    children: fetchedItem.data()?.children,
    parentID: fetchedItem.data()?.parentID,
    totalPossiblePoints: fetchedItem.data()?.totalPossiblePoints,
  };
}

function attachPartLabel(question) {
  return question.parts.map(
    (part, index) => `${question.id}_${alphabet[index]}`
  );
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

async function fetchLightweightAssignmentGradeForStudent(
  courseID,
  assignmentID,
  userID
) {
  let userGradeSummaryRef = admin
    .firestore()
    .collection("courses")
    .doc(courseID)
    .collection("grade_summaries")
    .doc(userID);

  let userGradeSummary = await userGradeSummaryRef.get();

  let assignmentGrade = {};
  try {
    assignmentGrade = userGradeSummary.data()[assignmentID];
  } catch (error) {
    console.log(error);
    console.log(
      "could not find assignment grade for assignmentID: ",
      assignmentID
    );
  }

  return assignmentGrade
    ? {
        assignmentID: assignmentID,
        totalEarnedPoints: assignmentGrade?.totalEarnedPoints,
        totalPossiblePoints: assignmentGrade?.totalPossiblePoints,
      }
    : {};
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
    let studentAssignmentResultRef = admin
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
    let userGradeSummaryRef = admin
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("grade_summaries")
      .doc(userID);

    await userGradeSummaryRef.set(
      {
        [assignmentID]: {
          totalEarnedPoints: heavyTotalEarnedPointsViaCurrentKeys,
          totalPossiblePoints: questionSet?.totalPossiblePoints
            ? questionSet.totalPossiblePoints
            : 0,
        },
      },
      { merge: true }
    );
  }
  return true;
}

async function activatePurchase(dataObject) {
  switch (dataObject.metadata.type) {
    case "course":
      await addUserToCourse(dataObject);
      break;
    case "question library":
      await addLibraryPermissionsForUser(dataObject);
      break;
    default:
      break;
  }
}

async function addLibraryPermissionsForUser(dataObject) {
  await admin
    .firestore()
    .collection("users")
    .doc(dataObject.client_reference_id)
    .update({
      permissions: admin.firestore.FieldValue.arrayUnion(
        dataObject.metadata.product_reference_id
      ),
    });
}

async function addUserToCourse(dataObject) {
  await admin
    .firestore()
    .collection("courses")
    .doc(dataObject.metadata.courseID)
    .update({
      studentEmails: admin.firestore.FieldValue.arrayUnion(
        dataObject.metadata.studentEmail
      ),
      studentIDs: admin.firestore.FieldValue.arrayUnion(
        dataObject.client_reference_id
      ),
      students: admin.firestore.FieldValue.arrayUnion({
        id: dataObject?.client_reference_id,
        email: dataObject.metadata?.studentEmail,
        name: dataObject.metadata?.displayName,
      }),
    });

  // Add minimal user info for grade_summaries collecion which is used in rendering the gradebook.
  let { firstName, lastName } = await getUserName(
    dataObject.client_reference_id
  );

  await admin
    .firestore()
    .collection("courses")
    .doc(dataObject.metadata.courseID)
    .collection("grade_summaries")
    .doc(dataObject.client_reference_id)
    .set({
      userID: dataObject.client_reference_id,
      userDisplayName: dataObject.metadata.displayName,
      userFirstName: firstName,
      userLastName: lastName,
    });
}

async function saveOrderInformation(dataObject) {
  await admin
    .firestore()
    .collection("orders")
    .doc()
    .set({
      checkoutSessionId: dataObject.id,
      paymentStatus: dataObject.payment_status,
      amountTotal: dataObject.amount_total,
      amountTotalDisplay: parseInt(dataObject.amount_total) / 100,
      userID: dataObject.client_reference_id,
      productReferenceID: dataObject.metadata.product_reference_id,
      purchaseDate: admin.firestore.Timestamp.fromDate(new Date()),
    });
}

async function hasImpersonatePermission(userID) {
  const impersonateUserIDs = [
    "MathugtWtXfaFvXcBHmBDGwoUXD3", // Koral IDs below
    "2K6wd4ymDdhJKNby73c7OXf9WvU2",
    "CjqOSwViY1a92rU5BGlDP1Mz6Uz1",
    "EgM9bQZnzlPJn8gRL6bJF5JAjKG3",
  ];
  let user = await admin.firestore().collection("users").doc(userID).get();

  return (
    user.data()?.permissions?.includes("impersonate") &&
    impersonateUserIDs.includes(userID)
  );
}

exports.deleteCourse = functions.https.onCall(async (data, context) => {
  var { course, courseRef } = await getCourseInfo(data);
  const archivesRef = admin.firestore().collection("archives").doc(course.id);
  let isUserInstructor = course?.instructorIDs?.includes(context.auth.uid);

  if (!course) {
    throw new functions.https.HttpsError("not-found", "course does not exist");
  }

  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "only authenticated users can delete courses"
    );
  }

  if (!isUserInstructor) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "only instructors can delete courses"
    );
  }

  await archiveCourse(archivesRef, course, courseRef);
  await deleteCourse(courseRef);

  return true;
});

async function getCourseInfo(data) {
  const courseID = data.courseID;
  const courseRef = admin.firestore().collection("courses").doc(courseID);
  let course = await admin
    .firestore()
    .collection("courses")
    .doc(courseID)
    .get();

  course = course.data();
  course.id = courseID;
  return { course, courseRef };
}

async function deleteCourse(courseRef) {
  try {
    await courseRef.delete();
  } catch (error) {
    console.log(error.message);
  }
}

async function archiveCourse(archivesRef, course, courseRef) {
  course.dateDeleted = new Date();
  await archivesRef.set(course);
  await archiveGradeSummariesCollection(courseRef, archivesRef);
  await archiveAssignmentsCollection(courseRef, archivesRef);
  await archiveCourseQuestionSets(courseRef, archivesRef);
}

async function archiveGradeSummariesCollection(courseRef, archivesRef) {
  const gradeSummariesRef = courseRef.collection("grade_summaries");
  const gradeSummaries = await gradeSummariesRef.get();
  gradeSummaries.forEach((doc) => {
    archivesRef.collection("grade_summaries").doc(doc.id).set(doc.data());
  });
}

async function archiveAssignmentsCollection(courseRef, archivesRef) {
  const assignmentsRef = courseRef.collection("assignments");
  const assignments = await assignmentsRef.get();

  await Promise.all(
    assignments.docs.map(async (doc) => {
      const assignmentID = doc.id;
      const assignment = doc.data();
      const resultsRef = assignmentsRef.doc(assignmentID).collection("results");
      const results = await resultsRef.get();
      if (results.docs.length > 0) {
        await archiveAssignmentResults(
          archivesRef,
          assignmentID,
          assignment,
          results
        );
      }

      if (results.docs.length === 0) {
        archivesRef.collection("assignments").doc(assignmentID).set(assignment);
      }
    })
  );
}

async function archiveAssignmentResults(
  archivesRef,
  assignmentID,
  assignment,
  results
) {
  await archivesRef.collection("assignments").doc(assignmentID).set(assignment);
  results.docs.forEach((doc) => {
    const resultID = doc.id;
    const result = doc.data();
    archivesRef
      .collection("assignments")
      .doc(assignmentID)
      .collection("results")
      .doc(resultID)
      .set(result);
  });
}

async function archiveCourseQuestionSets(courseRef, archivesRef, userID) {
  const courseAssignments = await getCourseAssignments(courseRef);

  for (let i = 0; i < courseAssignments.length; i++) {
    const assignment = courseAssignments[i];
    const questionSetContents = await getQuestionSet(assignment.docRef);
    if (questionSetContents) {
      await archivesRef
        .collection("my_question_sets")
        .doc(questionSetContents.qSetID)
        .set(questionSetContents);
    }
  }

  await deleteCourseQuestionSets(courseRef, courseAssignments);
}

async function getCourseAssignments(courseRef) {
  const course = await courseRef.get();
  const courseData = course.data();
  const courseModules = courseData.modules;
  const courseAssignments = [];

  for (let i = 0; i < courseModules.length; i++) {
    const module = courseModules[i];
    const moduleContent = module.content;
    for (let j = 0; j < moduleContent.length; j++) {
      const content = moduleContent[j];
      if (content.itemType === "question set") {
        courseAssignments.push(content);
      }
    }
  }
  return courseAssignments;
}

async function deleteCourseQuestionSets(courseRef, courseAssignments) {
  const batch = admin.firestore().batch();
  courseAssignments.forEach((assignment) => {
    const questionSetRef = admin.firestore().doc(assignment.docRef);
    batch.delete(questionSetRef);
  });

  return await batch.commit();
}

async function getQuestionSet(questionSetRef) {
  let questionSet = await admin.firestore().doc(questionSetRef).get();

  if (!questionSet.exists) {
    return null;
  }

  questionSet = questionSet.data();

  // get all the characters after /my_question_sets/ and store them in the questionSet.id
  let questionSetID = questionSetRef.match(/my_question_sets\/[^/]+/g);
  questionSetID = questionSetID[0].replace("my_question_sets/", "");

  questionSet.qSetID = questionSetID;

  return questionSet;
}

async function getUserName(userID) {
  const ref = admin
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
