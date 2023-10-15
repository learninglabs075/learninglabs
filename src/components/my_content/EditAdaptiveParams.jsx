import React, { useEffect, useState } from "react";
import { Formik, Field, FieldArray, Form } from "formik";
import Alert from "@material-ui/lab/Alert";
import {
  Box,
  TextField,
  Button,
  Typography,
  Modal,
  Backdrop,
  Fade,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
} from "@material-ui/core";
import FileUpload from "../../app/utils/FileUpload.js";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import { Add, Delete } from "@material-ui/icons";
import { parseHTMLandTeX } from "../../app/utils/customParsers.js";
import firebase from "../../app/config/firebaseConfig.js";

export default function EditAdaptiveParams({
  selectedQuestionSet,
  userID,
  open,
  setOpen,
}) {
  const [file, setFile] = useState(null);
  const [skillUrl, setSkillUrl] = useState(null);
  const [skillIndex, setSkillIndex] = useState(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [step, setStep] = useState(1);

  const handleClose = () => {
    setOpen(false);
    setStep(1);
  };

  useEffect(() => {
    if (skillUrl) {
      updateSkillResource(selectedQuestionSet, skillIndex, userID, skillUrl);
    }
  }, [skillUrl, skillIndex]);

  const acceptedTypes = [
    "application/pdf",
    "application/vnd.wolfram.mathematica",
    "application/vnd.wolfram.cdf",
  ];

  const acceptedExtensions = ["nb", "pdf"];

  const firestoreRef = firebase
    .firestore()
    .collection("users")
    .doc(userID)
    .collection("my_question_sets")
    .doc(selectedQuestionSet.id)
    .collection("skillResources");

  const updateSkillResource = async (
    selectedQuestionSet,
    skillIndex,
    userID,
    skillUrl
  ) => {
    const questionSetRef = firebase
      .firestore()
      .collection("user_questions")
      .doc(userID)
      .collection("my_question_sets")
      .doc(selectedQuestionSet.id);
    const questionSet = await questionSetRef.get();
    const updatedSkills = questionSet.data().adaptiveParams?.skills;
    updatedSkills[skillIndex].resource = skillUrl;
    questionSetRef.update({ "adaptiveParams.skills": updatedSkills });
  };

  const handleSelectFile = (e, index) => {
    let selectedFile = e.target.files[0];
    const fileType = selectedFile.type;
    const fileExtension = selectedFile.name.split(".").pop();
    console.log("file type: " + fileType);
    console.log("file extension: " + fileExtension);
    const validFile =
      selectedFile &&
      (acceptedTypes.includes(fileType) ||
        acceptedExtensions.includes(fileExtension));

    if (!validFile) {
      setFile(null);
      setError(true);
      setErrorMessage("Please select a PDF or Mathematica (.nb or .cdf) file");
      return;
    }

    setFile(selectedFile);
    setSkillIndex(index);
    setError(false);
    setErrorMessage("");
  };

  function getSkillAssignments(selectedQuestionSet) {
    let skillAssignments = [];
    let firstSkillQuestionIDs =
      selectedQuestionSet?.adaptiveParams?.skills[0]?.questionIDs || [];
    let secondSkillQuestionIDs =
      selectedQuestionSet?.adaptiveParams?.skills[1]?.questionIDs || [];

    selectedQuestionSet.questions.forEach((question, index) => {
      if (firstSkillQuestionIDs.includes(question.id)) {
        skillAssignments.push(
          selectedQuestionSet?.adaptiveParams?.skills[0].title
        );
        return;
      }
      if (secondSkillQuestionIDs.includes(question.id)) {
        skillAssignments.push(
          selectedQuestionSet?.adaptiveParams?.skills[1].title
        );
        return;
      }
      skillAssignments.push("placeholder");
    });

    return skillAssignments;
  }

  const initialValues = {
    completeRule: selectedQuestionSet?.adaptiveParams
      ? selectedQuestionSet?.adaptiveParams?.completeRule
      : "placeholder" || "",
    skills:
      selectedQuestionSet?.adaptiveParams?.skills?.length > 0
        ? selectedQuestionSet?.adaptiveParams?.skills
        : [],
    newSkillTitle: "",
    skillAssignments:
      selectedQuestionSet?.adaptiveParams?.skills?.length > 0
        ? getSkillAssignments(selectedQuestionSet)
        : selectedQuestionSet?.questions?.map(() => "placeholder"),
  };

  const SelectItem = (props) => (
    <Select fullWidth variant="outlined" {...props} />
  );

  const CompletionValue = (props) => (
    <TextField
      variant="outlined"
      type="number"
      inputProps={{ min: 0, max: props.questionCount }}
      size="small"
      {...props}
    />
  );

  const SkillTitleField = (props) => (
    <TextField label="skill name" variant="filled" fullWidth {...props} />
  );

  const goToNext = () => setStep(step + 1);
  const goBack = () => setStep(step - 1);

  return (
    <>
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
          <Box
            className="modal-form-v1 modal-common-styling overflow-auto"
            style={{ maxHeight: "80vh" }}
            width="800px"
          >
            <Typography color="primary" variant="h5">
              Adaptive Parameters
            </Typography>
            <br />
            <Box
              className="flex-center-all space-between"
              width="100%"
              style={{ marginBottom: "20px" }}
            >
              {step === 1 && <Button disabled>Back</Button>}
              {step > 1 && <Button onClick={goBack}>Back</Button>}
              <Typography variant="h6">{getStepHeader(step)}</Typography>
              {step < 4 && <Button onClick={goToNext}>Next</Button>}
              {step === 4 && <Button disabled>Next</Button>}
            </Box>
            <Formik
              initialValues={initialValues}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                setSubmitting(true);
                await new Promise((r) => setTimeout(r, 800));

                const tidiedSkills = tidySkills(
                  values.skills,
                  values.skillAssignments,
                  selectedQuestionSet
                );

                const tidiedValues = {
                  completeRule: values.completeRule,
                  skills: tidiedSkills,
                };

                updateAdaptiveParams(
                  userID,
                  selectedQuestionSet.id,
                  tidiedValues
                );
                setSubmitting(false);
                resetForm();
                handleClose();
              }}
            >
              {({
                values,
                dirty,
                isSubmitting,
                handleChange,
                setFieldValue,
              }) => (
                <Form autoComplete="off">
                  {step === 1 && (
                    <FieldArray name="skills">
                      {({ push, remove }) => (
                        <>
                          {values.skills.map((skill, index) => (
                            <Box className="flex-justify-center padding-light">
                              <Field
                                as={SkillTitleField}
                                name={`skills.${index}.title`}
                              />
                              <IconButton onClick={() => remove(index)}>
                                <Delete />
                              </IconButton>
                            </Box>
                          ))}
                          <br />
                          <Box className="margin-auto" width="500px">
                            <Button
                              fullWidth
                              disabled={values.skills.length >= 2}
                              startIcon={<Add />}
                              color="primary"
                              onClick={() => {
                                push({
                                  completeValue: 0,
                                  difficulty: 1,
                                  questionIDs: [],
                                  title: values.newSkillTitle,
                                });
                                setFieldValue("newSkillTitle", "");
                              }}
                            >
                              Add a skill
                            </Button>
                            <div style={{ textAlign: "center", color: "grey" }}>
                              * Maximum of two skills.
                            </div>
                          </Box>
                        </>
                      )}
                    </FieldArray>
                  )}

                  {step === 2 && (
                    <table style={{ width: "800px" }}>
                      <tr>
                        <th style={{ width: "15%" }}>
                          <Typography>Queston #</Typography>
                        </th>
                        <th style={{ width: "60%" }}>
                          <Typography>Prompt / Header</Typography>
                        </th>
                        <th style={{ width: "25%" }}>
                          <Typography>Skill Group</Typography>
                        </th>
                      </tr>

                      {selectedQuestionSet.questions.map((question, qIndex) => (
                        <tr>
                          <td style={{ textAlign: "center", padding: "3px" }}>
                            <Typography>{qIndex + 1}</Typography>
                          </td>
                          <td style={{ textAlign: "center", padding: "3px" }}>
                            <Typography>
                              {parseHTMLandTeX(
                                question?.prompt || question.header || ""
                              )}
                            </Typography>
                          </td>
                          <td style={{ textAlign: "center", padding: "3px" }}>
                            <Field
                              defaultValue="placeholder"
                              as={SelectItem}
                              name={`skillAssignments.${qIndex}`}
                            >
                              <MenuItem value="placeholder" disabled>
                                <Typography color="textSecondary">
                                  unassigned
                                </Typography>
                              </MenuItem>
                              {values.skills.map((skill, index) => (
                                <MenuItem value={skill.title}>
                                  <Typography>{skill.title}</Typography>
                                </MenuItem>
                              ))}
                            </Field>
                          </td>
                        </tr>
                      ))}
                    </table>
                  )}
                  {step === 3 && (
                    <Box>
                      <Typography variant="h6" style={{ marginBottom: "5px" }}>
                        Completion Rule
                      </Typography>

                      <Field
                        as={SelectItem}
                        onChange={handleChange}
                        name="completeRule"
                      >
                        <MenuItem value="placeholder" disabled>
                          <Typography color="textSecondary">
                            select a rule
                          </Typography>
                        </MenuItem>
                        <MenuItem value="totalCorrect">total correct</MenuItem>
                        <MenuItem value="inARow">in a row</MenuItem>
                      </Field>

                      <br />
                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        style={{ marginTop: "5px" }}
                      >
                        {parseHTMLandTeX(getHelperText(values.completeRule))}
                      </Typography>
                      <br />
                      <br />
                      <Typography variant="h6">Threshold Values</Typography>
                      <table style={{ width: "700px" }}>
                        <tr>
                          <th style={{ width: "50%" }}>
                            <Typography>Skill</Typography>
                          </th>
                          <th style={{ width: "25%" }}>
                            <Typography># Questions</Typography>
                          </th>
                          <th style={{ width: "25%" }}>
                            <Typography>Advance After</Typography>
                          </th>
                        </tr>
                        {values.skills.map(
                          (skill, index) =>
                            skill?.title && (
                              <tr className="padding-light">
                                <td
                                  style={{
                                    textAlign: "center",
                                    padding: "2px",
                                  }}
                                >
                                  <Typography>{skill.title}</Typography>
                                </td>
                                <td
                                  style={{
                                    textAlign: "center",
                                    padding: "2px",
                                  }}
                                >
                                  <Typography>
                                    {countAssignedQuestions(
                                      skill.title,
                                      values.skillAssignments
                                    )}
                                  </Typography>
                                </td>
                                <td
                                  style={{
                                    textAlign: "center",
                                    padding: "2px",
                                  }}
                                >
                                  <Field
                                    as={CompletionValue}
                                    name={`skills.${index}.completeValue`}
                                    questionCount={countAssignedQuestions(
                                      skill.title,
                                      values.skillAssignments
                                    )}
                                  />
                                </td>
                              </tr>
                            )
                        )}
                        <tr
                          className="padding-light"
                          style={{ height: "45px" }}
                        >
                          <td style={{ textAlign: "center", padding: "2px" }}>
                            <Typography>unassigned*</Typography>
                          </td>
                          <td style={{ textAlign: "center", padding: "2px" }}>
                            <Typography>
                              {countUnassignedQuestions(
                                values.skillAssignments
                              )}
                            </Typography>
                          </td>
                          <td
                            style={{ textAlign: "center", padding: "2px" }}
                          ></td>
                        </tr>
                      </table>
                      <br />
                      <Box className="flex-justify-center">
                        <Typography variant="caption">
                          *Unassigned questions will not be delivered to the
                          student
                        </Typography>
                      </Box>
                      <br />
                      <br />
                      <Box className="flex-justify-center">
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={isSubmitting || !dirty}
                        >
                          {isSubmitting && <CircularProgress size={25} />}
                          {!isSubmitting && "Save"}
                        </Button>
                      </Box>
                    </Box>
                  )}
                  {step === 4 && (
                    <FieldArray name="skills">
                      {({ push, remove }) => (
                        <>
                          {values.skills.map((skill, index) => (
                            <Box className="flex-justify-center padding-light">
                              <Field
                                style={{ width: "100px" }}
                                disabled
                                as={SkillTitleField}
                                name={`skills.${index}.title`}
                              />
                              <form autoComplete="off">
                                <Button
                                  color="primary"
                                  component="label"
                                  variant="contained"
                                  startIcon={<CloudUploadIcon />}
                                >
                                  Upload
                                  <input
                                    id={index}
                                    type="file"
                                    hidden
                                    onChange={(e) => handleSelectFile(e, index)}
                                  />
                                </Button>
                              </form>
                              <Box padding={1}>
                                {error && (
                                  <Alert severity="warning">
                                    {errorMessage}
                                  </Alert>
                                )}
                                {file && index === skillIndex && (
                                  <>
                                    <Typography>{file.name}</Typography>
                                    <FileUpload
                                      key={index}
                                      category="document"
                                      file={file}
                                      setFile={setFile}
                                      storagePath={`users/${userID}/skillResources/${file.name}`}
                                      firestoreRef={firestoreRef}
                                      setSkillUrl={setSkillUrl}
                                    />
                                  </>
                                )}
                              </Box>
                            </Box>
                          ))}
                          <br />
                          <Box className="margin-auto" width="500px"></Box>
                        </>
                      )}
                    </FieldArray>
                  )}
                  {/* <pre>step: {step}</pre> */}
                  {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
                  {/* <Box width="500px">
                    <pre>{JSON.stringify(selectedQuestionSet, null, 2)}</pre>
                  </Box> */}
                </Form>
              )}
            </Formik>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}

function getHelperText(completeRule) {
  if (completeRule === "totalCorrect")
    return "Students must answer a set number of question correctly to advance.";
  if (completeRule === "inARow")
    return "Students must correctly answer some number of questions in a row to advance. <br/> Progress restarts when the student answer incorrectly.";
  return "";
}

function getStepHeader(step) {
  switch (step) {
    case 1:
      return "Step 1 - Define Skills";
    case 2:
      return "Step 2 - Group Questions";
    case 3:
      return "Step 3 - Completion Criteria";
    case 4:
      return "Step 4 - Skill Resources";
    default:
      return null;
  }
}

function countAssignedQuestions(skillTitle, skillAssignments) {
  if (!Array.isArray(skillAssignments)) return 0;
  const numAssigned = skillAssignments.filter((skill) => skill === skillTitle);
  return numAssigned.length;
}

function countUnassignedQuestions(skillAssignments) {
  if (!Array.isArray(skillAssignments)) return 0;
  const numUnassigned = skillAssignments.filter(
    (skill) => skill === "placeholder"
  );
  return numUnassigned.length;
}

async function updateAdaptiveParams(userID, questionSetID, tidiedValues) {
  await firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .doc(questionSetID)
    .update({ adaptiveParams: tidiedValues, mode: "adaptive" });
}

function tidySkills(skills, skillAssignments, selectedQuestionSet) {
  const mergedAssignments = [];

  skillAssignments.forEach((skillAssignment, index) =>
    mergedAssignments.push({
      title: skillAssignment,
      questionID: selectedQuestionSet?.questions[index].id,
    })
  );

  const updatedSkills = [];
  skills.forEach((skill, index) => {
    skill.completeValue !== 0 &&
      skill.title !== "" &&
      updatedSkills.push({
        ...skill,
        questionIDs: getQuestionIDs(skill, mergedAssignments),
      });
  });
  return updatedSkills;
}

function getQuestionIDs(skill, mergedAssignments) {
  const filteredAssignments = mergedAssignments.filter(
    (mergedAssignment) => mergedAssignment.title === skill.title
  );
  const questionIDs = filteredAssignments.map(
    (assignment) => assignment.questionID
  );
  return questionIDs;
}
