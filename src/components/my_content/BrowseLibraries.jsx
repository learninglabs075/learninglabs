import { useEffect, useState } from "react";
import {
  Backdrop,
  Box,
  Button,
  Card,
  CardMedia,
  CircularProgress,
  Checkbox,
  Fade,
  Link,
  Modal,
  TextField,
  Typography,
} from "@material-ui/core";
import { Copyright } from "@material-ui/icons";
import { Alert } from "@material-ui/lab";
import firebase, { functions } from "../../app/config/firebaseConfig.js";
import { artificialDelay } from "../../app/utils/utils.js";

export default function BrowseLibraries({
  permissionRequests,
  userDisplayName,
  userEmail,
  userID,
  userPermissions,
}) {
  const [librariesInfo, setLibrariesInfo] = useState([]);
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => fetchLibraries(), []);
  useEffect(() => fetchPermissionRequests(), []);

  async function fetchLibraries() {
    const fetchedItems = [];
    await firebase
      .firestore()
      .collection("products")
      .orderBy("title", "asc")
      .get()
      .then((snapshot) =>
        snapshot.forEach((doc) => {
          doc.data().visible &&
            fetchedItems.push({ id: doc.id, ...doc.data() });
        })
      );
    setLibrariesInfo(() => fetchedItems);
  }

  async function fetchPermissionRequests() {
    const fetchedItems = [];
    await firebase
      .firestore()
      .collection("permission_requests")
      .get()
      .then((snapshot) =>
        snapshot.forEach((doc) => {
          fetchedItems.push({ id: doc.id, ...doc.data() });
        })
      );
  }

  return (
    <>
      <Button type="button" onClick={handleOpen} startIcon={<AppIcon />}>
        Community Libraries
      </Button>

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
            className="modal-common-styling padding-medium"
            style={{ maxHeight: "80vh", maxWidth: "90vw" }}
          >
            {librariesInfo.map((libraryInfo, index) => (
              <Box className="flex-row margin-vertical-medium" key={index}>
                <Box>
                  <Card>
                    <CardMedia
                      style={{ height: "250px", width: "250px" }}
                      image={libraryInfo.picture?.url}
                    />
                  </Card>
                </Box>
                <Box maxWidth="500px" style={{ marginLeft: "20px" }}>
                  <Typography variant="h5">{libraryInfo.title}</Typography>
                  <Typography>{libraryInfo.description}</Typography>

                  <CopyrightLicense license={libraryInfo.license} />

                  <RequestInstructorAccess
                    permissionRequests={permissionRequests}
                    userDisplayName={userDisplayName}
                    userEmail={userEmail}
                    userID={userID}
                    userPermissions={userPermissions}
                    libraryInfo={libraryInfo}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Fade>
      </Modal>
    </>
  );
}

const AppIcon = () => (
  <img
    src={process.env.REACT_APP_LIBRARY_IMAGE}
    style={{
      width: "18px",
      verticalAlign: "bottom",
    }}
    alt="product library"
  />
);

function RequestInstructorAccess({
  permissionRequests,
  userDisplayName,
  userEmail,
  userID,
  userPermissions,
  libraryInfo,
}) {
  const [isInstructor, setIsInstructor] = useState(false);
  const [institution, setInstitution] = useState("");
  const [institutionEmail, setInstitutionEmail] = useState(userEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pendingRequestLibraryIDs = permissionRequests.map((el) => el.libraryID);
  const requestPending = pendingRequestLibraryIDs?.includes(libraryInfo.id);

  const updateInstitution = (e) => setInstitution(e.target.value);
  const updateEmail = (e) => setInstitutionEmail(e.target.value);

  async function logRequest() {
    const user = {
      institution: institution,
      institutionEmail: institutionEmail,
      userDisplayName: userDisplayName,
      userEmail: userEmail,
      userID: userID,
    };

    const requestInfo = {
      type: "question library",
      libraryID: libraryInfo.id,
      libraryTitle: libraryInfo.title,
      requested: firebase.firestore.Timestamp.now(),
    };

    setIsSubmitting(true);
    artificialDelay(1000).then(async () => {
      await firebase
        .firestore()
        .collection("permission_requests")
        .add({ ...user, ...requestInfo })
        .then(() => setIsSubmitting(false))
        .then(() => emailAuthorizedEditor(user, requestInfo));
    });
  }

  async function emailAuthorizedEditor(user, requestInfo) {
    const callable = functions.httpsCallable("libraryAccessRequestEmail");
    const email = ["email@email.com"]; //TODO set list of authorized editor

    const message = await callable({
      email: email,
      course: requestInfo.libraryTitle, //TODO change key name to libraryTitle
    });
    return console.log(message);
  }

  if (userPermissions?.includes(libraryInfo.id))
    return (
      <Box>
        <Alert>
          You've have access to this library. Use it by selecting a question set
          and clicking the IMPORT feature.
        </Alert>
      </Box>
    );

  if (requestPending)
    return (
      <Fade in={pendingRequestLibraryIDs.includes(libraryInfo.id)}>
        <Alert severity="info">
          Thanks for your request! We'll get back to you by email, typically
          within one business day.
        </Alert>
      </Fade>
    );

  return (
    <>
      <Box className="flex-align-center">
        <Checkbox
          color="primary"
          checked={isInstructor}
          onChange={() => setIsInstructor(!isInstructor)}
        />
        <Typography>I'm an instructor</Typography>
      </Box>
      {isInstructor && (
        <Box
          className="flex-row"
          style={{ marginLeft: "10px", marginBottom: "20px" }}
        >
          <Box width="230px" style={{ marginRight: "20px" }}>
            <TextField
              fullWidth
              label="institution name (required)"
              variant="filled"
              onChange={updateInstitution}
            />
          </Box>
          <Box width="230px">
            {isInstructor && (
              <TextField
                fullWidth
                label="institution email (required)"
                defaultValue={userEmail}
                variant="filled"
                onChange={updateEmail}
              />
            )}
          </Box>
        </Box>
      )}
      <Box style={{ marginLeft: "10px", marginBottom: "5px" }}>
        <Button
          fullWidth
          onClick={() => logRequest()}
          disabled={!isInstructor || institution === ""}
          variant="contained"
          color="primary"
        >
          {isSubmitting ? (
            <CircularProgress style={{ color: "whitesmoke" }} size={25} />
          ) : (
            "REQUEST INSTRUCTOR ACCESS"
          )}
        </Button>
      </Box>
    </>
  );
}

function CopyrightLicense({ license }) {
  if (!license) return null;

  return (
    <Box style={{ marginBottom: "10px" }}>
      <Copyright
        className="relative"
        style={{ color: "rgba(0,0,0,0.54)", top: "6px" }}
      />
      {license.titleLink ? (
        <Link
          color="textSecondary"
          href={license.titleLink}
          underline="always"
          style={{
            fontFamily: "Lato",
            marginLeft: "3px",
          }}
          target="_blank"
        >
          {license.title}
        </Link>
      ) : (
        <Typography
          color="textSecondary"
          style={{
            marginLeft: "1px",
          }}
          display="inline"
        >
          {license.title}
        </Typography>
      )}
      <Typography
        color="textSecondary"
        style={{
          marginLeft: "3px",
          marginRight: "3px",
        }}
        display="inline"
      >
        by
      </Typography>
      {license.authorLink ? (
        <Link
          color="textSecondary"
          href={license.authorLink}
          underline="always"
          style={{
            fontFamily: "Lato",
            marginRight: "3px",
          }}
          target="_blank"
        >
          {license.author}
        </Link>
      ) : (
        <Typography
          color="textSecondary"
          display="inline"
          style={{
            marginRight: "3px",
          }}
        >
          {license.author}
        </Typography>
      )}
      <Typography color="textSecondary" display="inline">
        is licensed under {license.type}
      </Typography>
    </Box>
  );
}
