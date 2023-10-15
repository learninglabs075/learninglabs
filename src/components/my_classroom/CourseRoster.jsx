import React, { useState } from "react";
import { CSVReader, CSVDownloader } from "react-papaparse";
import { Formik, Field, Form } from "formik";
import { CloudUpload, GetApp, PersonAdd } from "@material-ui/icons";
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Fade,
  Modal,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import firebase from "../../app/config/firebaseConfig.js";
import {
  inviteStudentToCourse,
  inviteStudentsToCourse,
} from "../../app/firestoreClient.js";
import { functions } from "../../app/config/firebaseConfig.js";
import {
  headerStyle,
  rowStyle,
  transparentGray,
} from "../../app/utils/stylingSnippets.js";

const buttonRef = React.createRef();

const studentName = (props) => (
  <TextField
    label="Student Name"
    id="studentName"
    variant="filled"
    required
    fullWidth
    {...props}
  />
);

const studentEmail = (props) => (
  <TextField
    label="Student Email"
    id="studentEmail"
    variant="filled"
    type="email"
    required
    fullWidth
    {...props}
  />
);

const studentOrganizationUserId = (props) => (
  <TextField
    label="Student ID"
    id="studentOrganziationUserId"
    variant="filled"
    fullWidth
    {...props}
  />
);

function updateStudentRoster(csvFile, courseID) {
  inviteStudentsToCourse(csvFile, courseID);
}

const initialValues = {
  title: "",
  questions: [],
  created: firebase.firestore.Timestamp.now(),
};

async function emailInvitedStudents(students, courseCode, courseTitle) {
  const callable = functions.httpsCallable("genericEmail");
  const emails = students.map((i) => i.email);
  // const names = students.map((i) => i.organizationName);

  const message = await callable({
    email: emails,
    course: courseTitle,
    link: "https://koral.community",
  });
  return console.log(message);
}

export default function CourseRoster({
  courseID,
  courseTitle,
  courseCode,
  students,
  invitedStudents,
}) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const handleOpenDialog = (e) => {
    // Note that the ref is set async, so it might be null at some point
    if (buttonRef.current) {
      buttonRef.current.open(e);
    }
  };

  const handleOnFileLoad = (data) => {
    console.log(data);
    let students = data.map((item) => item.data);
    students.pop(); //Resolves issue where last entered item is blank for some reason
    updateStudentRoster(students, courseID);
    emailInvitedStudents(students, courseCode, courseTitle);
  };

  const handleOnError = (err, file, inputElem, reason) => {
    console.log(err);
  };

  const handleOnRemoveFile = (data) => {
    console.log(data);
  };

  const handleRemoveFile = (e) => {
    // Note that the ref is set async, so it might be null at some point
    if (buttonRef.current) {
      buttonRef.current.removeFile(e);
    }
  };

  const rosterColumnHeaders = [
    "Name",
    "Organization User ID",
    "Email",
    "Status",
  ];

  function getActiveAndInvitedStudents(students, invitedStudents) {
    const invitedStudentsStatus =
      invitedStudents?.length > 0
        ? invitedStudents?.map(
            ({ organizationUserID, organizationUserName, email }) => ({
              organizationUserID: organizationUserID,
              organizationUserName: organizationUserName,
              name: "",
              email: email,
              status: "Invited (Pending)",
            })
          )
        : [];

    const activeStudentsStatus = students
      ? students.map((student) => {
          student.status = "Active";
          delete student.id; // Instructors are only interested in a students organizational id, not the internal id
          return student;
        })
      : [];

    const activeAndInvitedStudents =
      invitedStudentsStatus.concat(activeStudentsStatus);

    return activeAndInvitedStudents;
  }

  return (
    <>
      <Box className="flex space-between margin-bottom-light">
        <Box className="flex space-between" width="350px">
          <Tooltip
            title={
              <Typography variant="caption">
                Invite a student by email
              </Typography>
            }
            placement="top-start"
          >
            <Button
              component="label"
              style={transparentGray}
              onClick={handleOpen}
              startIcon={<PersonAdd />}
            >
              Invite Student
            </Button>
          </Tooltip>

          <CSVReader
            ref={buttonRef}
            onFileLoad={handleOnFileLoad}
            onError={handleOnError}
            noClick
            noDrag
            onRemoveFile={handleOnRemoveFile}
            config={{ header: true }}
          >
            {({ file }) => (
              <aside>
                <Tooltip
                  title={
                    <>
                      <Typography display="block" variant="caption">
                        Invite students by uploading a CSV file.
                      </Typography>
                      <Typography display="block" variant="caption">
                        Please use the following column headers:
                      </Typography>{" "}
                      <br />
                      <Typography variant="subtitle2">
                        organizationID | organizationName | email
                      </Typography>
                    </>
                  }
                  placement="top-start"
                >
                  <Button
                    style={transparentGray}
                    component="label"
                    onClick={handleOpenDialog}
                    startIcon={<CloudUpload />}
                  >
                    Upload Roster (.csv)
                    <input type="file" hidden />
                  </Button>
                </Tooltip>
                <div>{file && file.name}</div>
              </aside>
            )}
          </CSVReader>
        </Box>

        <CSVDownloader
          data={getActiveAndInvitedStudents(students, invitedStudents)}
          filename={"Course Roster"}
          bom={true}
        >
          <Button
            style={transparentGray}
            component="label"
            startIcon={<GetApp />}
          >
            Download Roster (.csv)
          </Button>
        </CSVDownloader>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {rosterColumnHeaders.map((element, index) => (
                <TableCell style={headerStyle} align="left">
                  {element}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {students?.map((student, index) => (
              <TableRow key={`student${index}`}>
                <TableCell style={rowStyle} component="th" scope="row">
                  {student.name}
                </TableCell>
                <TableCell style={rowStyle} component="th" scope="row">
                  {student.organizationUserID}
                </TableCell>
                <TableCell style={rowStyle} align="left">
                  {student.email}
                </TableCell>
                <TableCell style={rowStyle} align="left">
                  Active
                </TableCell>
              </TableRow>
            ))}
            {invitedStudents?.map((student, index) => (
              <TableRow key={index}>
                <TableCell component="th" scope="row">
                  {student.organizationUserName}
                </TableCell>
                <TableCell component="th" scope="row">
                  {student.organizationUserID}
                </TableCell>
                <TableCell align="left">{student.email}</TableCell>
                <TableCell align="left">Invited (Pending)</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {students?.length > 4 && (
        <Typography
          className="student-count"
          color="textPrimary"
          style={{ marginTop: "5px", paddingBottom: "50px" }}
        >
          # of students: {students?.length}
        </Typography>
      )}

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
            <Formik
              initialValues={initialValues}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                setSubmitting(true);
                await new Promise((r) => setTimeout(r, 800));
                try {
                  let student = [
                    {
                      email: values.studentEmail,
                      organizationUserId: values.studentOrganizationUserId,
                      organizationUserName: values.studentName,
                    },
                  ];
                  inviteStudentToCourse(values, courseID);
                  emailInvitedStudents(student, courseCode, courseTitle);
                  console.log("adding student logic here");
                } catch (error) {
                  console.log("error: cannot save student info to database");
                  console.log(error.message);
                }
                setSubmitting(false);
                resetForm();
                handleClose();
              }}
            >
              {({ values, isSubmitting }) => (
                <Form autoComplete="off">
                  <Typography color="primary" variant="h5">
                    Invite Student
                  </Typography>
                  <br />
                  <Box width={300} className="margin-bottom-light">
                    <Field name="studentName" as={studentName} />
                  </Box>
                  <Box width={300} className="margin-bottom-light">
                    <Field name="studentEmail" as={studentEmail} />
                  </Box>
                  <Box width={300} className="margin-bottom-light">
                    <Field
                      name="studentOrganizationUserId"
                      as={studentOrganizationUserId}
                    />
                  </Box>
                  <Box marginTop={3} display="flex" justifyContent="flex-end">
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <CircularProgress size={25} /> : "Invite"}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}
