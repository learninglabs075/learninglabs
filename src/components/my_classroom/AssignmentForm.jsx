import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  MenuItem,
  Radio,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { Formik, Field, Form } from "formik";
import "date-fns";
import DateFnsUtils from "@date-io/date-fns";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import { KeyboardTimePicker } from "@material-ui/pickers";
import { KeyboardDatePicker } from "@material-ui/pickers";
import { updateCourseModuleContent } from "../../app/firestoreClient.js";
import firebase from "../../app/config/firebaseConfig.js";
import { cloneQuestionSet, generateRandomCode } from "../../app/utils/utils.js";
import { PersonAdd, Delete, Warning } from "@material-ui/icons";

const SelectItem = (props) => <Select variant="outlined" {...props} />;
const SelectItem2 = (props) => <Select variant="outlined" id="2" {...props} />;

export default function AssignmentForm({
  userID,
  courseID,
  courseTitle,
  modules,
  moduleIndex,
  content,
  contentIndex,
  closeAssignmentForm,
  item,
  edit,
}) {
  const [questionSets, setQuestionSets] = useState([]);
  const [students, setStudents] = useState([]);
  const add = !edit;

  function addModuleAssignment(tidiedValues) {
    const updatedModules = modules.map((element, index) => {
      if (index === moduleIndex) {
        element.content.push(tidiedValues);
      }
      return element;
    });
    updateCourseModuleContent(courseID, updatedModules);
  }

  function updateModuleAssignment(tidiedValues) {
    const updatedContent = content.map((item, index) =>
      index === contentIndex ? tidiedValues : item
    );
    const updatedModules = modules.map((module, index) => {
      if (index === moduleIndex) {
        module.content = updatedContent;
      }
      return module;
    });
    updateCourseModuleContent(courseID, updatedModules);
  }

  function addAssignmentSummary(courseID, values) {
    const courseRef = firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .collection("assignments")
      .doc(values.assignmentID);
    courseRef.set(values);
  }

  function fetchMyQuestionSets() {
    const ref = firebase
      .firestore()
      .collection("user_questions")
      .doc(userID)
      .collection("my_question_sets")
      .orderBy("title");

    ref.onSnapshot((querySnapshot) => {
      const fetchedItems = [];
      querySnapshot.forEach((doc) => {
        if (doc.data().type !== "Folder") {
          fetchedItems.push({
            id: doc.id,
            title: doc.data().title,
            inUse: doc.data()?.inUse,
          });
        }
      });
      setQuestionSets((prevState) => fetchedItems);
    });
  }

  async function fetchStudents(courseID) {
    let courseRef = firebase
      .firestore()
      .collection("courses")
      .doc(courseID)
      .get();

    let courseDoc = await courseRef;
    let students = courseDoc.data().students;
    students = sortStudentsByName(students);

    setStudents((prevState) => students);
  }

  useEffect(() => {
    const unsubscribe = fetchMyQuestionSets();
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  return (
    <Formik
      initialValues={pickInitialValues(item, edit)}
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 800));

        if (values?.docRef && values?.inUse && edit !== true) {
          values.docRef = await cloneQuestionSet(
            userID,
            values.docRef,
            true,
            courseID,
            courseTitle
          );
        }

        const tidiedValues = tidy(values, edit);

        if (add) tidiedValues.assignmentID = generateRandomCode(20);
        if (add) addModuleAssignment(tidiedValues);
        if (edit) tidiedValues.assignmentID = values.assignmentID;
        if (edit) updateModuleAssignment(tidiedValues);

        addAssignmentSummary(courseID, tidiedValues);
        setSubmitting(false);
        closeAssignmentForm();
      }}
    >
      {({ values, isSubmitting, dirty, handleChange, setFieldValue }) => (
        <Form autoComplete="off">
          <Typography
            style={{ marginBottom: "5px" }}
            variant="h5"
            color="primary"
          >
            {edit ? "Update Assignment" : "Add Assignment"}
          </Typography>
          {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
          {!edit && (
            <Typography variant="subtitle1" style={{ marginTop: "10px" }}>
              ASSIGNMENT SELECTION
            </Typography>
          )}

          {edit && values.itemType === "question set" && (
            <>
              <Typography display="inline" variant="h6">
                {values.title}
              </Typography>
              <Typography
                color="textSecondary"
                display="inline"
                style={{ marginLeft: "20px", marginRight: "20px" }}
              >
                |
              </Typography>
              <Typography display="inline" variant="subtitle1" color="primary">
                question set
              </Typography>
            </>
          )}

          {edit && values.itemType === "student upload" && (
            <Box style={{ marginBottom: "10px" }}>
              <Typography display="inline" variant="h6">
                {values.title}
              </Typography>
              <Typography
                color="textSecondary"
                display="inline"
                style={{ marginLeft: "20px", marginRight: "20px" }}
              >
                |
              </Typography>
              <Typography display="inline" variant="subtitle1" color="primary">
                student upload
              </Typography>
            </Box>
          )}

          {!edit && (
            <Box className="flex-align-center">
              <Field
                name="itemType"
                type="radio"
                value="student upload"
                color="primary"
                as={Radio}
                onChange={(e) => {
                  handleChange(e);
                  setFieldValue("id", "placeholder");
                  setFieldValue("title", "");
                  setFieldValue("docRef", "");
                  setFieldValue("instructions", "");
                  setFieldValue("itemTypeSubType", "");
                  setFieldValue("courseID", "placeholder");
                  setFieldValue("selectedCourseQuestionSets", []);
                }}
              />
              <Typography>student upload</Typography>
            </Box>
          )}

          {values.itemType === "student upload" && (
            <Box className="flex padding-horizontal-medium padding-bottom-light">
              <Field
                name="totalPossiblePoints"
                variant="outlined"
                type="number"
                as={TextField}
                inputProps={{
                  min: 0,
                  style: { width: "50px", padding: 5, textAlign: "center" },
                }}
              />
              <Typography style={{ marginLeft: "10px" }}>points</Typography>
            </Box>
          )}

          {values.itemType === "student upload" && (
            <>
              <Box className="padding-horizontal-medium padding-bottom-light">
                <Field
                  fullWidth
                  name="title"
                  variant="filled"
                  placeholder="title (required)"
                  as={TextField}
                />
              </Box>
              <Box className="padding-horizontal-medium padding-bottom-light">
                <Field
                  fullWidth
                  name="instructions"
                  variant="filled"
                  placeholder="instructions"
                  as={TextField}
                  multiline
                  rows={5}
                />
              </Box>
            </>
          )}

          {values.itemType === "student upload" && (
            <Box className="choose-file-type">
              <Typography color="textSecondary">
                choose which file types to accept
              </Typography>
            </Box>
          )}

          {values.itemType === "student upload" && (
            <Box className="flex-column padding-left-heavy">
              <Box display="flex" alignItems="center">
                <Field
                  name="accept"
                  color="primary"
                  value="application/pdf"
                  as={Checkbox}
                  checked={values.accept.includes("application/pdf")}
                />

                <Typography display="inline">PDF</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Field
                  name="accept"
                  value="image/png"
                  color="primary"
                  as={Checkbox}
                  checked={values.accept.includes("image/png")}
                />
                <Typography display="inline">PNG (image)</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Field
                  name="accept"
                  value="image/jpeg"
                  color="primary"
                  as={Checkbox}
                  checked={values.accept.includes("image/jpeg")}
                />
                <Typography display="inline">JPEG (image)</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <Field
                  name="accept"
                  value="application/vnd.wolfram.mathematica"
                  color="primary"
                  as={Checkbox}
                  checked={values.accept.includes(
                    "application/vnd.wolfram.mathematica"
                  )}
                />
                <Typography display="inline">Mathematica notebook</Typography>
              </Box>
            </Box>
          )}

          {!edit && (
            <Box className="flex-align-center">
              <Field
                name="itemType"
                type="radio"
                value="question set"
                color="primary"
                as={Radio}
                onChange={(e) => {
                  handleChange(e);
                  setFieldValue("id", "placeholder");
                  setFieldValue("title", "");
                  setFieldValue("accept", []);
                  setFieldValue("docRef", "");
                  setFieldValue("instructions", "");
                  setFieldValue("inUse", null);
                }}
              />
              <Typography>question set</Typography>
            </Box>
          )}

          {values.itemType === "question set" && !edit && (
            <>
              <Box className="flex-align-center" style={{ marginLeft: "25px" }}>
                <Field
                  name="itemTypeSubType"
                  type="radio"
                  value="questionSetUnassigned"
                  color="primary"
                  as={Radio}
                  onChange={(e) => {
                    handleChange(e);
                    setFieldValue("id", "placeholder");
                    setFieldValue("title", "");
                    setFieldValue("accept", []);
                    setFieldValue("docRef", "");
                    setFieldValue("instructions", "");
                    setFieldValue("inUse", null);
                    setFieldValue("itemTypeSubType", "questionSetUnassigned");
                    setFieldValue("courseID", "placeholder");
                    setFieldValue("selectedCourseQuestionSets", []);
                  }}
                />
                <Typography>unassigned</Typography>
              </Box>

              {values.itemTypeSubType === "questionSetUnassigned" && (
                <Box
                  className="select-module-item"
                  style={{ marginBottom: "10px" }}
                >
                  {questionSets.filter((qSet) => !qSet.inUse).length > 0 && (
                    <Field name="id" as={SelectItem}>
                      <MenuItem value="placeholder" disabled>
                        <Typography color="textSecondary">
                          select a question set
                        </Typography>
                      </MenuItem>
                      {questionSets
                        .filter((qSet) => !qSet.inUse)
                        .map((questionSet) => (
                          <MenuItem
                            key={questionSet.id}
                            value={questionSet.id}
                            onClick={() => {
                              if (questionSet?.inUse) {
                                setFieldValue("inUse", questionSet.inUse);
                              }
                              setFieldValue(
                                "docRef",
                                `user_questions/${userID}/my_question_sets/${questionSet.id}`
                              );
                              setFieldValue("title", questionSet.title);
                            }}
                          >
                            {questionSet.title.slice(0, 30)}
                          </MenuItem>
                        ))}
                    </Field>
                  )}
                  {questionSets.filter((qSet) => !qSet.inUse).length === 0 && (
                    <a
                      href={`http://${process.env.REACT_APP_WEBSITE_URL}/content`}
                    >
                      Create Question Set Here
                    </a>
                  )}
                </Box>
              )}

              <Box className="flex-align-center" style={{ marginLeft: "25px" }}>
                <Field
                  name="itemTypeSubType"
                  type="radio"
                  value="questionSetFromCourse"
                  color="primary"
                  as={Radio}
                  onChange={(e) => {
                    handleChange(e);
                    setFieldValue("id", "placeholder");
                    setFieldValue("title", "");
                    setFieldValue("accept", []);
                    setFieldValue("docRef", "");
                    setFieldValue("instructions", "");
                    setFieldValue("inUse", null);
                    setFieldValue("itemTypeSubType", "questionSetFromCourse");
                  }}
                />
                <Typography>from existing course</Typography>
              </Box>

              {values.itemTypeSubType === "questionSetFromCourse" && (
                <Box
                  className="select-module-item"
                  style={{ marginBottom: "10px" }}
                >
                  <Field name="courseID" as={SelectItem2}>
                    <MenuItem value="placeholder" disabled>
                      <Typography color="textSecondary">
                        select a course
                      </Typography>
                    </MenuItem>
                    {getUniqueQuestionSetInUseCourses().map((course) => (
                      <MenuItem
                        key={course.id}
                        value={course.id}
                        onClick={(e) => {
                          const selectedCourseQuestionSets =
                            questionSets.filter(
                              (qSet) =>
                                qSet.inUse &&
                                qSet.inUse.courseID ===
                                  e.currentTarget.dataset.value
                            );
                          setFieldValue(
                            "selectedCourseQuestionSets",
                            selectedCourseQuestionSets
                          );
                        }}
                      >
                        {course.courseTitle.slice(0, 30)}
                      </MenuItem>
                    ))}
                  </Field>
                </Box>
              )}
              {values.itemTypeSubType === "questionSetFromCourse" && (
                <Box
                  className="select-module-item"
                  style={{ marginBottom: "10px" }}
                >
                  <Field name="id" as={SelectItem}>
                    <MenuItem value="placeholder" disabled>
                      <Typography color="textSecondary">
                        select question set
                      </Typography>
                    </MenuItem>
                    {values.selectedCourseQuestionSets.map((questionSet) => (
                      <MenuItem
                        key={questionSet.id}
                        value={questionSet.id}
                        onClick={() => {
                          if (questionSet?.inUse) {
                            setFieldValue("inUse", questionSet.inUse);
                          }
                          setFieldValue(
                            "docRef",
                            `user_questions/${userID}/my_question_sets/${questionSet.id}`
                          );
                          setFieldValue("title", questionSet.title);
                        }}
                      >
                        {questionSet.title.slice(0, 30)}
                      </MenuItem>
                    ))}
                  </Field>
                </Box>
              )}
            </>
          )}
          {values.itemType === "question set" && values.id !== "placeholder" && (
            <>
              <Typography color="primary" style={{ marginLeft: "10px" }}>
                options
              </Typography>
              <Box className="flex-align-center">
                <Field name="unlimitedAttempts" type="checkbox" as={Checkbox} />
                <Typography>remove attempt limits</Typography>
              </Box>

              <Box className="flex-align-center">
                <Field
                  name="hideSolutions"
                  type="checkbox"
                  as={Checkbox}
                  disabled={!values.hasDueDate}
                  checked={values.hideSolutions}
                />
                <Typography
                  color={values.hasDueDate ? "inherit" : "textSecondary"}
                >
                  hide solutions before due date
                </Typography>{" "}
                {!values.hasDueDate && (
                  <Typography style={{ marginLeft: "10px" }} color="primary">
                    (set due date to enable)
                  </Typography>
                )}
              </Box>
              <Box className="flex-align-center">
                <Field
                  name="hideCorrectStatus"
                  type="checkbox"
                  as={Checkbox}
                  disabled={!values.hasDueDate}
                  checked={values.hideCorrectStatus}
                />
                <Typography
                  color={values.hasDueDate ? "inherit" : "textSecondary"}
                >
                  hide scoring feedback before due date
                </Typography>{" "}
                {!values.hasDueDate && (
                  <Typography style={{ marginLeft: "10px" }} color="primary">
                    (set due date to enable)
                  </Typography>
                )}
              </Box>
            </>
          )}
          <Typography variant="subtitle1" style={{ marginTop: "10px" }}>
            OPEN / DUE DATE SETTINGS
          </Typography>
          <TimeSettingsMessage
            due={values.due}
            hasOpenDate={values.hasOpenDate}
            hasDueDate={values.hasDueDate}
            open={values.open}
          />
          <Box className="flex-align-center">
            <Field
              name="hasOpenDate"
              type="checkbox"
              color="primary"
              as={Checkbox}
            />
            <Typography>set open date</Typography>
          </Box>

          {values.hasOpenDate && (
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <Box
                display="flex"
                width={350}
                style={{ marginLeft: "20px" }}
                justifyContent="space-between"
              >
                <Box width={180}>
                  <KeyboardDatePicker
                    margin="normal"
                    disableToolbar
                    variant="inline"
                    format="MM/dd/yyyy"
                    value={values.open}
                    onChange={(value) => setFieldValue("open", value)}
                    KeyboardButtonProps={{
                      "aria-label": "change date",
                    }}
                  />
                </Box>
                <Box width={130}>
                  <KeyboardTimePicker
                    margin="normal"
                    value={values.open}
                    onChange={(value) => setFieldValue("open", value)}
                    KeyboardButtonProps={{
                      "aria-label": "change time",
                    }}
                  />
                </Box>
              </Box>
            </MuiPickersUtilsProvider>
          )}

          <Box className="flex-align-center">
            <Field
              name="hasDueDate"
              type="checkbox"
              color="primary"
              as={Checkbox}
              onClick={() => {
                values.hasDueDate && setFieldValue("hideSolutions", false);
                values.hasDueDate && setFieldValue("hideCorrectStatus", false);
              }}
            />
            <Typography>set due date</Typography>
            {values.hasDueDate && (
              <>
                <Tooltip
                  placement="right"
                  title="Create an exception assignment due date for specific students."
                >
                  <PersonAdd
                    color="primary"
                    style={{ cursor: "pointer", marginLeft: "20px" }}
                    onClick={() => {
                      fetchStudents(courseID);
                      setFieldValue(
                        "dueDateExceptions",
                        values.dueDateExceptions.concat({
                          dueDate: new Date(),
                          name: "",
                          userID: "",
                        })
                      );
                    }}
                  ></PersonAdd>
                </Tooltip>
                <Tooltip
                  placement="right"
                  title="Allow late assignment submissions but apply a penalty."
                >
                  <Warning
                    color="primary"
                    style={{ cursor: "pointer", marginLeft: "10px" }}
                    onClick={() => {
                      setFieldValue("dueDateExceededPenaltyPercentage", 20);
                    }}
                  ></Warning>
                </Tooltip>
              </>
            )}
          </Box>
          {values.hasDueDate && (
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <Box
                display="flex"
                width={350}
                style={{ marginLeft: "20px" }}
                justifyContent="space-between"
              >
                <Box width={180}>
                  <KeyboardDatePicker
                    margin="normal"
                    disableToolbar
                    variant="inline"
                    format="MM/dd/yyyy"
                    value={values.due}
                    onChange={(value) => setFieldValue("due", value)}
                    KeyboardButtonProps={{
                      "aria-label": "change date",
                    }}
                  />
                </Box>
                <Box width={130}>
                  <KeyboardTimePicker
                    margin="normal"
                    value={values.due}
                    onChange={(value) => setFieldValue("due", value)}
                    KeyboardButtonProps={{
                      "aria-label": "change time",
                    }}
                  />
                </Box>
              </Box>
            </MuiPickersUtilsProvider>
          )}
          {values?.dueDateExceptions?.map((exception, index) => (
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <Box
                display="flex"
                width={480}
                style={{ marginLeft: "20px" }}
                justifyContent="space-between"
                alignItems="center"
              >
                <Box width={180}>
                  <KeyboardDatePicker
                    margin="normal"
                    disableToolbar
                    variant="inline"
                    format="MM/dd/yyyy"
                    value={exception?.dueDate}
                    onChange={(value) =>
                      setFieldValue(
                        "dueDateExceptions",
                        updateDueDateExceptions(values, value, exception)
                      )
                    }
                    KeyboardButtonProps={{
                      "aria-label": "change date",
                    }}
                  />
                </Box>
                <Box width={130}>
                  <KeyboardTimePicker
                    margin="normal"
                    value={exception?.dueDate}
                    onChange={(value) =>
                      setFieldValue(
                        "dueDateExceptions",
                        updateDueDateExceptions(values, value, exception)
                      )
                    }
                    KeyboardButtonProps={{
                      "aria-label": "change time",
                    }}
                  />
                </Box>
                <Box width={40}>
                  {exception?.name ? (
                    `${exception?.name}`
                  ) : (
                    <Autocomplete
                      id="combo-box-demo"
                      options={students}
                      required
                      getOptionLabel={(option) => option.name}
                      style={{ width: 100 }}
                      renderInput={(params) => (
                        <TextField
                          required={true}
                          {...params}
                          label="Student"
                          variant="outlined"
                        />
                      )}
                      onChange={(event, value) => {
                        setFieldValue(
                          "dueDateExceptions",
                          updateDueDateExceptions(
                            values,
                            value,
                            exception,
                            "student"
                          )
                        );
                      }}
                    />
                  )}
                </Box>

                {!exception?.name && <div></div>}
                {exception?.name && (
                  <Tooltip
                    title="Remove student assignment due date exception"
                    placement="top"
                    style={{ marginLeft: "30px" }}
                  >
                    <Delete
                      style={{
                        marginLeft: "25px",
                        color: "darkred",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setFieldValue(
                          "dueDateExceptions",
                          removeDueDateException(values, exception)
                        )
                      }
                    />
                  </Tooltip>
                )}
              </Box>
            </MuiPickersUtilsProvider>
          ))}

          {values?.dueDateExceededPenaltyPercentage && (
            <Box
              display="flex"
              width={150}
              style={{ marginLeft: "20px", marginTop: "10px" }}
              justifyContent="space-between"
              alignItems="center"
            >
              <TextField
                required={true}
                label="Late % Penalty"
                variant="outlined"
                type="number"
                style={{ width: 115 }}
                value={values.dueDateExceededPenaltyPercentage}
                onChange={(e) =>
                  setFieldValue(
                    "dueDateExceededPenaltyPercentage",
                    e.target.value
                  )
                }
              />
              <Tooltip title="Remove late assignment penalty" placement="top">
                <Delete
                  style={{
                    cursor: "pointer",
                    color: "darkred",
                  }}
                  onClick={() =>
                    setFieldValue("dueDateExceededPenaltyPercentage", null)
                  }
                />
              </Tooltip>
            </Box>
          )}
          <Box className="flex justify-end padding-top-medium">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={
                !dirty ||
                isSubmitting ||
                values.itemType === "" ||
                (values.itemType === "question set" &&
                  values.id === "placeholder") ||
                (values.itemType === "student upload" && !values.title) ||
                (values.itemType === "student upload" &&
                  values.accept.length < 1)
              }
            >
              {!isSubmitting && add && "ADD"}
              {!isSubmitting && edit && "UPDATE"}
              {isSubmitting && <CircularProgress size={25} />}
            </Button>
          </Box>
          {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
        </Form>
      )}
    </Formik>
  );

  function sortStudentsByName(students) {
    students.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    return students;
  }

  function getUniqueQuestionSetInUseCourses() {
    let inUseQuestionSets = questionSets
      .filter((qSet) => qSet.inUse)
      .map((questionSet) => {
        return {
          id: questionSet.inUse.courseID,
          courseTitle: questionSet.inUse.courseTitle,
        };
      });

    let unique = [];
    let distinct = [];
    for (let i = 0; i < inUseQuestionSets.length; i++) {
      if (!unique[inUseQuestionSets[i].id]) {
        distinct.push({
          id: inUseQuestionSets[i].id,
          courseTitle: inUseQuestionSets[i].courseTitle,
        });
        unique[inUseQuestionSets[i].id] = 1;
      }
    }

    return distinct;
  }
}

function updateDueDateExceptions(values, value, exception, student = null) {
  let newDueDateExceptions = values.dueDateExceptions.filter(
    (el) => el.userID !== exception.userID
  );

  newDueDateExceptions.push({
    userID: exception?.userID || value?.id,
    name: exception?.name || value?.name,
    dueDate: student ? exception?.dueDate : value,
  });

  return newDueDateExceptions;
}

function removeDueDateException(values, exception) {
  let newDueDateExceptions = values.dueDateExceptions.filter(
    (el) => el.userID !== exception.userID
  );

  return newDueDateExceptions;
}

function getIDFromDocRef(docRef) {
  if (!docRef) return;
  if (docRef) {
    const docRefArray = docRef.split("/");
    return docRefArray[docRefArray.length - 1];
  }
}

function pickInitialValues(item, edit) {
  if (!edit)
    return {
      id: "placeholder",
      courseID: "placeholder",
      contentType: "assignment",
      itemType: "",
      itemTypeSubType: "",
      selectedCourseQuestionSets: [],
      title: "",
      instructions: "",
      accept: [],
      docRef: "",
      unlimitedAttempts: false,
      hideSolutions: false,
      hideCorrectStatus: false,
      hasOpenDate: false,
      hasDueDate: false,
      dueDateExceptions: [],
      dueDateExceededPenaltyPercentage: null,
      open: new Date(),
      due: new Date(),
      totalPossiblePoints: 0,
    };
  if (edit)
    return {
      id: getIDFromDocRef(item.docRef) || "placeholder",
      contentType: "assignment",
      itemType: item.itemType || "",
      itemTypeSubType: item.itemTypeSubType || "",
      selectedCourseQuestionSets: item.selectedCourseQuestionSets || [],
      title: item.title || "",
      instructions: item.instructions || "",
      accept: item.accept || [],
      docRef: item.docRef || "",
      unlimitedAttempts: item.unlimitedAttempts || false,
      hideSolutions: item.hideSolutions || false,
      hideCorrectStatus: item.hideCorrectStatus || false,
      hasOpenDate: item.hasOpenDate || false,
      hasDueDate: item.hasDueDate || false,
      open: item.open?.toDate() || new Date(),
      due: item.due?.toDate() || new Date(),
      dueDateExceptions:
        item?.dueDateExceptions?.map((exception) => {
          return {
            dueDate: exception.dueDate?.toDate(),
            name: exception.name,
            userID: exception.userID,
          };
        }) || [],
      dueDateExceededPenaltyPercentage:
        item?.dueDateExceededPenaltyPercentage || null,
      totalPossiblePoints: item.totalPossiblePoints || 0,
      assignmentID: item.assignmentID,
    };
}

function tidy(values) {
  if (values.itemType === "question set")
    return {
      contentType: values.contentType,
      itemType: values.itemType,
      title: values.title,
      docRef: values.docRef,
      unlimitedAttempts: values.unlimitedAttempts || false,
      hideSolutions: values.hideSolutions || false,
      hideCorrectStatus: values.hideCorrectStatus || false,
      hasOpenDate: values.hasOpenDate || false,
      hasDueDate: values.hasDueDate || false,
      open: values.hasOpenDate ? values.open : null,
      due: values.hasDueDate ? values.due : null,
      dueDateExceptions: values?.dueDateExceptions
        ? values.dueDateExceptions
        : [],
      dueDateExceededPenaltyPercentage: values?.dueDateExceededPenaltyPercentage
        ? values.dueDateExceededPenaltyPercentage
        : null,
    };

  if (values.itemType === "student upload")
    return {
      contentType: values.contentType,
      itemType: values.itemType,
      title: values.title,
      instructions: values.instructions,
      accept: values.accept,
      totalPossiblePoints: values.totalPossiblePoints,
      hasOpenDate: values.hasOpenDate || false,
      hasDueDate: values.hasDueDate || false,
      open: values.hasOpenDate ? values.open : null,
      due: values.hasDueDate ? values.due : null,
      dueDateExceptions: values?.dueDateExceptions
        ? values.dueDateExceptions
        : [],
      dueDateExceededPenaltyPercentage: values?.dueDateExceededPenaltyPercentage
        ? values.dueDateExceededPenaltyPercentage
        : null,
    };
  return values;
}

function TimeSettingsMessage({ due, hasOpenDate, hasDueDate, open }) {
  const dateFormat = { year: "numeric", month: "short", day: "numeric" };
  const timeFormat = { hour: "2-digit", minute: "2-digit" };
  if (!hasOpenDate && !hasDueDate)
    return (
      <Typography color="textSecondary" variant="subtitle2">
        assignment always open (default)
      </Typography>
    );

  if (hasOpenDate && !hasDueDate)
    return (
      <Typography color="textSecondary" variant="subtitle2">
        assignment open starting {open.toLocaleDateString("en-US", dateFormat)}{" "}
        at {open.toLocaleTimeString("en-US", timeFormat)}
      </Typography>
    );

  if (!hasOpenDate && hasDueDate)
    return (
      <Typography color="textSecondary" variant="subtitle2">
        assignment due {due.toLocaleDateString("en-US", dateFormat)} at{" "}
        {due.toLocaleTimeString("en-US", timeFormat)}
      </Typography>
    );

  if (hasOpenDate && hasDueDate)
    return (
      <Typography color="textSecondary" variant="subtitle2">
        assignment open {open.toLocaleDateString("en-US", dateFormat)} at{" "}
        {open.toLocaleTimeString("en-US", timeFormat)} , due{" "}
        {due.toLocaleDateString("en-US", dateFormat)} at{" "}
        {due.toLocaleTimeString("en-US", timeFormat)}
      </Typography>
    );

  return (
    <Typography color="textSecondary" variant="subtitle2">
      "an error occurred"
    </Typography>
  );
}
