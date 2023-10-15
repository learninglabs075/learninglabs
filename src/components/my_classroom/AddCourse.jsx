import React, { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import { Box, Button, Fab, InputAdornment } from "@material-ui/core";
import { Radio, TextField, IconButton, Divider } from "@material-ui/core";
import { Typography, CircularProgress } from "@material-ui/core";
import { List, ListItem, ListItemText } from "@material-ui/core";
import { ListItemSecondaryAction } from "@material-ui/core";
import { Modal, Backdrop, Fade } from "@material-ui/core";
import { Search } from "@material-ui/icons";
import AddIcon from "@material-ui/icons/Add";
import CheckIcon from "@material-ui/icons/Check";
import LockIcon from "@material-ui/icons/Lock";
import { addCourse, getUserName } from "../../app/firestoreClient.js";
import firebase from "../../app/config/firebaseConfig.js";
import {
  generateRandomCode,
  makeSearchFriendly,
  capitalizeFirstLetter,
} from "../../app/utils/utils.js";
import { useAuth } from "../../app/contexts/AuthContext.js";

const CourseTitleField = (props) => (
  <TextField
    label="Title"
    id="course title"
    variant="filled"
    fullWidth
    {...props}
  />
);
const DescriptionField = (props) => (
  <TextField
    label="Description"
    id="course description"
    variant="filled"
    multiline
    rows={4}
    fullWidth
    {...props}
  />
);

const initialRole = {
  role: "",
};

const initialCourseInfo = {
  title: "",
  description: "",
  availableTo: "",
  courseCode: generateRandomCode(6),
  instructorNames_searchable: [],
  instructorIDs: [],
  instructors: [],
  students: [],
  invitedInstructors: [],
  invitedStudents: [],
  isActive: true,
};

async function addStudentToCourse(
  courseID,
  userID,
  userEmail,
  setAddingCourse,
  handleClose
) {
  const ref = firebase.firestore().collection("courses").doc(courseID);
  setAddingCourse((prevState) => courseID);

  let user = await getUserName(userID);

  //Update Single Student Object
  await ref.update({
    students: firebase.firestore.FieldValue.arrayUnion({
      id: userID,
      email: userEmail,
      name: user?.displayName,
    }),
    studentEmails: firebase.firestore.FieldValue.arrayUnion(userEmail),
    studentIDs: firebase.firestore.FieldValue.arrayUnion(userID),
  });

  // Add minimal user info for grade_summaries collecion which is used in rendering the gradebook.
  await ref
    .collection("grade_summaries")
    .doc(userID)
    .set({
      userID: userID,
      userEmail: userEmail,
      userDisplayName: user?.displayName,
      userFirstName: user?.firstName ? user?.firstName : "",
      userLastName: user?.lastName ? user?.lastName : "",
    });

  // Student is now active, remove any references from invitedStudents array.
  let courseDoc = await ref.get();
  let invitedStudents = courseDoc.data().invitedStudents;
  let invitedStudentMatch = {};

  if (invitedStudents) {
    invitedStudents.forEach((student) => {
      if (student.email === userEmail) {
        invitedStudentMatch = student;
      }
    });
  }

  await ref.update({
    invitedStudents:
      firebase.firestore.FieldValue.arrayRemove(invitedStudentMatch),
  });
  /////////////////////////////////////////////////////////////////////////////////

  setAddingCourse((prevState) => "");
  handleClose();
}

async function addLightWeightGradebookStub(courseID, currentUser) {
  let user = await getUserName(currentUser.uid);

  const ref = firebase.firestore().collection("courses").doc(courseID);
  ref
    .collection("grade_summaries")
    .doc(currentUser.uid)
    .set({
      userID: currentUser.uid,
      userEmail: currentUser.email,
      userDisplayName: currentUser.displayName,
      userFirstName: user?.firstName ? user.firstName : "",
      userLastName: user?.lastName ? user.lastName : "",
    });
}

function extractInstructorNames(instructorsInfo, hiddenAdmins) {
  if (hiddenAdmins?.length > 0) {
    instructorsInfo = instructorsInfo.filter((instructor) => {
      return !hiddenAdmins.includes(instructor.id);
    });
  }

  if (!instructorsInfo) return "anonymous";
  if (!Array.isArray(instructorsInfo)) return "anonymous";
  const instructorNames = instructorsInfo?.map(
    (info) => info.name || "anonymous"
  );

  if (instructorNames?.length > 0) return instructorNames.join(",");
}

function tidy(rawValues, role, userID, userDisplayName, userEmail) {
  if (role === "instructor") {
    return {
      title: rawValues.title,
      title_searchable: makeSearchFriendly(rawValues.title),
      description: rawValues.description,
      availableTo: rawValues.availableTo,
      courseCode: rawValues.courseCode,
      instructors: [{ id: userID, name: userDisplayName, email: userEmail }],
      instructorNames_searchable: makeSearchFriendly(userDisplayName),
      instructorIDs: [userID],
      instructorEmails: [userEmail],
      isActive: rawValues.isActive,
      students: [],
      invitedInstructors: [],
      invitedStudents: [],
      modules: [],
      created: firebase.firestore.Timestamp.now(),
      lastEdited: "",
    };
  }
}

export default function AddCourse() {
  const [activeStep, setActiveStep] = useState(0);
  const [role, setRole] = useState("none");
  const [searchTerm, setSearchTerm] = useState("");
  const [foundCourses, setFoundCourses] = useState([]);
  const [addingCourse, setAddingCourse] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const { currentUser } = useAuth();

  const courses = [];
  const [allCourses, setAllCourses] = useState([]);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line
  }, []);

  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
    setActiveStep((prevStep) => 0);
  };
  const handleClose = () => {
    setOpen(false);
    setActiveStep((prevStep) => -1);
    setRole((prevRole) => "none");
    setFoundCourses((prevCourses) => []);
    setSearchTerm("");
    setCourseCode(() => "");
  };

  const handleCourseCodeChange = (event) => {
    setCourseCode(event.target.value.trim());
  };

  function fetchCourses() {
    const ref = firebase
      .firestore()
      .collection("courses")
      .where("isActive", "==", true);
    const fetchedItems = [];
    const queryCourseTitle = ref.get();

    queryCourseTitle.then((snapshot) => {
      snapshot.forEach((doc) =>
        fetchedItems.push({
          id: doc.id,
          title: doc.data().title,
          instructors: doc.data().instructors,
          instructorNames: extractInstructorNames(
            doc.data().instructors,
            doc.data()?.hiddenAdmins
          ),
          instructorIDs: doc.data().instructorIDs,
          instructorNames_searchable: doc.data().instructorNames_searchable,
          availableTo: doc.data().availableTo,
          courseCode: doc.data().courseCode,
          enrolled: doc
            .data()
            .students?.some((student) => student.id === currentUser.uid),
        })
      );
      setAllCourses(fetchedItems);
    });
  }

  function isInstructor(foundCourses, courseIndex, userID) {
    return foundCourses[courseIndex].instructorIDs?.includes(userID);
  }

  const handleSearchFieldChange = (event) => {
    setFoundCourses(() => filterCourses(event.target.value));
    setSearchTerm(event.target.value);
  };

  function filterCourses(searchPhrase) {
    const searchTermArray = makeSearchFriendly(searchPhrase);

    const filteredCourses = allCourses?.filter(
      (course) =>
        searchTermArray.some((word) =>
          word.length > 0 ? course.title.toLowerCase().includes(word) : false
        ) ||
        searchTermArray.some((word) =>
          word.length > 0
            ? course.instructorNames_searchable?.filter(
                (instructorName) =>
                  instructorName
                    .substring(0, word.length)
                    .trim()
                    .toLowerCase() === word
              ).length > 0
            : false
        )
    );
    if (searchTermArray?.length > 0) return filteredCourses;

    return courses;
  }

  function runSearch(event, searchTerm) {
    if (
      event.type === "click" ||
      (event.type === "keydown" && event.code === "Enter")
    ) {
      event.preventDefault();
      filterCourses(searchTerm);
    }
  }

  return (
    <>
      <Fab variant="extended" color="primary" onClick={handleOpen}>
        <AddIcon />
        ADD COURSE
      </Fab>

      <Modal
        className="flex-center-all"
        open={open}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={open}>
          <Box className="modal-form-v1 modal-common-styling">
            {activeStep === 0 ? (
              <Box className="select-course-role">
                <Typography variant="h5" color="primary">
                  Select a role
                </Typography>
                <Formik
                  initialValues={initialRole}
                  onSubmit={async (values, { setSubmitting }) => {
                    setSubmitting(true);
                    await new Promise((r) => setTimeout(r, 400));
                    setRole((prevRole) => values.role);
                    setActiveStep((prevStep) => activeStep + 1);
                    setSubmitting(false);
                  }}
                >
                  {({ values, isSubmitting, dirty }) => (
                    <Form autoComplete="off">
                      <Box className="padding-light">
                        <Box className="flex-align-center">
                          <Field
                            name="role"
                            type="radio"
                            value="student"
                            color="primary"
                            as={Radio}
                          />
                          <Typography>Student</Typography>
                        </Box>
                        <Box className="flex-align-center">
                          <Field
                            name="role"
                            type="radio"
                            value="instructor"
                            color="primary"
                            as={Radio}
                          />
                          <Typography>Instructor</Typography>
                        </Box>
                      </Box>

                      <Box
                        marginTop={3}
                        display="flex"
                        justifyContent="flex-end"
                      >
                        <Button
                          type="submit"
                          color="primary"
                          variant="contained"
                          disabled={isSubmitting || !dirty}
                        >
                          NEXT
                        </Button>
                      </Box>
                    </Form>
                  )}
                </Formik>
              </Box>
            ) : null}

            {activeStep === 1 && role === "instructor" ? (
              <Box className="flex-column">
                <Typography variant="h5" color="primary">
                  Course Details
                </Typography>
                <Box className="padding-light">
                  <Typography variant="subtitle2">
                    Update course details and manage student invites
                  </Typography>
                  <Typography variant="subtitle2">
                    later inside the course dashboard.
                  </Typography>
                </Box>
                <Formik
                  initialValues={initialCourseInfo}
                  onSubmit={async (values, { setSubmitting }) => {
                    setSubmitting(true);
                    const tidiedValues = tidy(
                      values,
                      role,
                      currentUser.uid,
                      currentUser.displayName,
                      currentUser.email
                    );
                    //Artificial delay to signal user that course info is being saved
                    await new Promise((r) => setTimeout(r, 800));
                    try {
                      let courseID = await addCourse(tidiedValues);
                      addLightWeightGradebookStub(courseID, currentUser);
                    } catch (error) {
                      console.log(error.message);
                    }
                    setSubmitting(false);
                    handleClose();
                    setRole((prevRole) => "none");
                    setActiveStep((prevStep) => 0);
                  }}
                >
                  {({ values, isSubmitting, dirty }) => (
                    <Form autoComplete="off">
                      <Box className="flex-column course-title-and-description-fields">
                        <Field name="title" as={CourseTitleField} />
                        <Field name="description" as={DescriptionField} />
                      </Box>
                      <Box className="padding-light">
                        <Box className="share-with">
                          <Typography>Make the course available to:</Typography>
                        </Box>
                        <Box className="flex-align-center">
                          <Field
                            name="availableTo"
                            type="radio"
                            value="invited"
                            color="primary"
                            as={Radio}
                          />
                          <Typography>invited students only</Typography>
                        </Box>
                        <Box className="padding-left-heavy">
                          {values.availableTo === "invited" && (
                            <Box width="300px">
                              <Typography
                                display="inline"
                                color="textSecondary"
                              >
                                Students must enter the following code to
                                register for your course:
                              </Typography>
                              <Typography
                                color="primary"
                                variant="h6"
                                display="inline"
                              >
                                {" "}
                                {values.courseCode}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        <Box className="flex-align-center">
                          <Field
                            name="availableTo"
                            type="radio"
                            value={process.env.REACT_APP_COMMUNITY_NAME}
                            color="primary"
                            as={Radio}
                          />
                          <Typography>
                            {capitalizeFirstLetter(
                              process.env.REACT_APP_COMMUNITY_NAME
                            )}
                          </Typography>
                        </Box>
                      </Box>
                      <Box className="padding-left-heavy">
                        {values.availableTo ===
                          process.env.REACT_APP_COMMUNITY_NAME && (
                          <Box width="300px">
                            <Typography display="inline" color="textSecondary">
                              Anyone from the{" "}
                              {capitalizeFirstLetter(
                                process.env.REACT_APP_COMMUNITY_NAME
                              )}{" "}
                              can discover and register for your course.
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Box className="flex space-between padding-top-medium">
                        <Button
                          onClick={() => {
                            setActiveStep((prevStep) => activeStep - 1);
                          }}
                          color="primary"
                          size="large"
                        >
                          BACK
                        </Button>

                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={isSubmitting || !dirty}
                        >
                          {isSubmitting ? (
                            <CircularProgress size={25} />
                          ) : (
                            "SAVE"
                          )}
                        </Button>
                      </Box>
                      {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
                    </Form>
                  )}
                </Formik>
              </Box>
            ) : null}
            {activeStep === 1 && role === "student" ? (
              <Box className=" find-course-form">
                <Typography
                  variant="h5"
                  color="primary"
                  className="find-course-header"
                >
                  Find a Course
                </Typography>

                <Formik
                  initialValues={{ searchTerm: searchTerm }}
                  onSubmit={async (values, { setSubmitting }) => {
                    setSubmitting(true);
                    const tidiedValues = tidy(
                      values,
                      role,
                      currentUser.uid,
                      currentUser.displayName,
                      currentUser.email
                    );
                    //Artificial delay to signal user that course info is being saved
                    await new Promise((r) => setTimeout(r, 800));

                    try {
                      addCourse(tidiedValues);
                    } catch (error) {
                      console.log(error.message);
                    }
                    setSubmitting(false);
                    handleClose();
                    setRole((prevRole) => "none");
                    setActiveStep((prevStep) => 0);
                  }}
                >
                  {({ values, isSubmitting, dirty, handleChange }) => (
                    <Form autoComplete="off">
                      <TextField
                        name="searchTerm"
                        onKeyDown={(event) =>
                          runSearch(event, values.searchTerm)
                        }
                        onChange={handleSearchFieldChange}
                        variant="outlined"
                        placeholder="course title or instructor"
                        className="course-search-field"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="search for a course"
                                edge="end"
                                onClick={(event) =>
                                  runSearch(event, values.searchTerm)
                                }
                              >
                                <Search />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Form>
                  )}
                </Formik>

                <Box className="found-course-list">
                  {foundCourses.length === 0 && searchTerm ? (
                    <Typography
                      color="textSecondary"
                      style={{ paddingTop: "30px" }}
                      align="center"
                    >
                      (no courses found)
                    </Typography>
                  ) : null}
                  {foundCourses.map((course, courseIndex) => (
                    <Box key={course.id}>
                      <List>
                        <ListItem alignItems="center">
                          <ListItemText
                            primary={course.title}
                            secondary={course.instructorNames}
                          />

                          <ListItemSecondaryAction className="add-selected-course">
                            {addingCourse !== course.id && course.enrolled ? (
                              <Button
                                aria-label="add selected course"
                                startIcon={<CheckIcon />}
                                disabled={true}
                              >
                                ENROLLED
                              </Button>
                            ) : null}

                            {addingCourse !== course.id &&
                            !course.enrolled &&
                            !isInstructor(
                              foundCourses,
                              courseIndex,
                              currentUser.uid
                            ) ? (
                              <Button
                                aria-label="add selected course"
                                style={{ position: "relative", left: "px" }}
                                startIcon={
                                  course.availableTo === "invited" &&
                                  course.courseCode !== courseCode ? (
                                    <LockIcon />
                                  ) : (
                                    <AddIcon />
                                  )
                                }
                                disabled={
                                  course.availableTo === "invited" &&
                                  course.courseCode !== courseCode
                                }
                                onClick={() => {
                                  addStudentToCourse(
                                    course.id,
                                    currentUser.uid,
                                    currentUser.email,
                                    setAddingCourse,
                                    handleClose
                                  );
                                }}
                              >
                                ADD
                              </Button>
                            ) : null}
                            {isInstructor(
                              foundCourses,
                              courseIndex,
                              currentUser.uid
                            ) && (
                              <Box className="instructor-label-container">
                                <Typography className="instructor-label">
                                  instructor
                                </Typography>
                              </Box>
                            )}
                            {addingCourse === course.id ? (
                              <CircularProgress size={25} />
                            ) : null}
                          </ListItemSecondaryAction>
                        </ListItem>

                        {course.availableTo === "invited" &&
                        !course.enrolled &&
                        !isInstructor(
                          foundCourses,
                          courseIndex,
                          currentUser.uid
                        ) ? (
                          <Box className="padding-x-light">
                            <TextField
                              fullWidth
                              variant="outlined"
                              placeholder="enter course code to unlock"
                              name="enteredCourseCode"
                              onChange={handleCourseCodeChange}
                              autoComplete="off"
                            />
                          </Box>
                        ) : null}

                        <Divider style={{ marginTop: "15px" }} />
                      </List>
                    </Box>
                  ))}
                </Box>

                <Box className="flex back-to-select-role">
                  <Button
                    onClick={() => {
                      setActiveStep((prevStep) => activeStep - 1);
                      setFoundCourses(() => []);
                    }}
                    color="primary"
                    size="large"
                  >
                    BACK
                  </Button>
                </Box>
              </Box>
            ) : null}
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
