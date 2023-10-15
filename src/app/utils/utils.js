import firebase from "../config/firebaseConfig.js";
import {
  Box,
  IconButton,
  Typography,
  SvgIcon,
  Tooltip,
} from "@material-ui/core";
import { OpenInNew } from "@material-ui/icons";
import { parseHTMLandTeX } from "./customParsers.js";

export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// via https://stackoverflow.com/questions/260857/changing-website-favicon-dynamically
export function updateFaviconAndTitleForCurrentEnvironment() {
  var link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.getElementsByTagName("head")[0].appendChild(link);
  }
  link.href = process.env.REACT_APP_FAVICON;
  document.title =
    capitalizeFirstLetter(process.env.REACT_APP_PRODUCT) + " | learn together";
}

export const handleImageUploadBefore = async (
  files,
  info,
  uploadHandler,
  userID,
  productLibraryID
) => {
  let imgName = files[0].name;
  let imgSize = files[0].size;
  let storagePath = "";

  storagePath = productLibraryID
    ? `${process.env.REACT_APP_PRODUCT_COLLECTION}/${productLibraryID}/questions/${files[0].name}`
    : `users/${userID}/questions/${files[0].name}`;

  const storageRef = firebase.storage().ref().child(storagePath);
  await storageRef.put(files[0]);
  let imgSource = await storageRef.getDownloadURL();

  const response = {
    result: [
      {
        url: imgSource,
        name: imgName,
        size: imgSize,
      },
    ],
  };

  uploadHandler(response);
};

export function displayEarnedOfPossible(assignmentGrade) {
  let totalEarnedPoints = assignmentGrade?.pointAdjustment
    ? assignmentGrade.totalEarnedPoints + assignmentGrade.pointAdjustment
    : assignmentGrade.totalEarnedPoints;

  if (assignmentGrade?.dueDateExceededPenaltyPercentage) {
    totalEarnedPoints =
      totalEarnedPoints *
      (1 - assignmentGrade.dueDateExceededPenaltyPercentage / 100);
  }

  return `${totalEarnedPoints} of ${assignmentGrade.totalPossiblePoints}`;
}

// Used in Search and Pagination
export function addSearchChip(searchTerm, mySearchChips, setMySearchChips) {
  if (searchTerm) {
    mySearchChips.push(searchTerm);
    setMySearchChips(mySearchChips);
  }
}

export async function cloneQuestionSet(
  userID,
  docRef,
  viaAssignmentBuilder = false,
  courseID = null,
  courseTitle = null
) {
  const questionSet = await firebase.firestore().doc(docRef).get();

  let clonedTitle =
    questionSet.data().title.includes("(copy)") || viaAssignmentBuilder
      ? questionSet.data().title
      : questionSet.data().title + " (copy)";

  const clonedQuestionSet = {
    ...questionSet.data(),
    title: clonedTitle,
    clonedTo: [],
    clonedFrom: docRef,
    created: Date(Date.now()),
  };
  delete clonedQuestionSet.inUse;

  const clonedQuestionSetRef = await firebase
    .firestore()
    .collection("user_questions")
    .doc(userID)
    .collection("my_question_sets")
    .add(clonedQuestionSet);

  questionSet.ref.update({
    clonedTo: firebase.firestore.FieldValue.arrayUnion(
      clonedQuestionSetRef.path
    ),
  });

  //If the questionSet is in a folder, ensure the cloned questionSet is also in the folder
  if (questionSet.data()?.isChild && questionSet.data()?.parentID) {
    let inUse =
      viaAssignmentBuilder && courseID
        ? { courseID: courseID, courseTitle: courseTitle }
        : null;

    firebase
      .firestore()
      .collection("user_questions")
      .doc(userID)
      .collection("my_question_sets")
      .doc(questionSet.data().parentID)
      .update({
        children: firebase.firestore.FieldValue.arrayUnion({
          id: clonedQuestionSetRef.id,
          isChild: true,
          title: clonedTitle,
          ...(inUse && { inUse: inUse }),
        }),
      });
  }

  return clonedQuestionSetRef.path;
}

export function removeSearchChip(chipValue, mySearchChips, setMySearchChips) {
  let mySearchChipsLatest = mySearchChips.filter((item) => item !== chipValue);

  setMySearchChips(mySearchChipsLatest);
  return mySearchChipsLatest;
}

export function handleAndOperatorChange(
  event,
  setchkAnd,
  mySearchChips,
  fetchQuestionsFromSearch
) {
  setchkAnd(event.target.checked);
  fetchQuestionsFromSearch(mySearchChips, event.target.checked);
}

// Suneditor content inputs <p> or <div> tags, where the <div> tag is used by sunEditor when adding images
// TODO: Although this function currently assists in proper rendering of questions, there are some cases where multiple
// <div> or <p> tags can be in the string.  In the future, this function should be updated to remove these unnecessary tags from persisting to the database.
export function extractInner(editorContent) {
  let startTag = editorContent?.substring(0, 3);
  let endTag = editorContent?.substring(
    editorContent.length - 3,
    editorContent.length
  );
  let innerContent = editorContent;
  innerContent = removeStartTag(innerContent, startTag);
  innerContent = removeEndTag(innerContent, endTag);

  return innerContent;
}

//TODO - extracting the div tag which is added via sunEditor is more involved.  This function should be updated to properly remove the div tag from persisting to the database.
function removeEndTag(innerContent, endTag) {
  if (endTag === "/p>") {
    innerContent = innerContent.substring(0, innerContent.length - 4);
  }
  // if (endTag === "iv>") {
  //   innerContent = innerContent.substring(0, innerContent.length - 6);
  // }
  return innerContent;
}

function removeStartTag(innerContent, startTag) {
  if (startTag === "<p>") {
    innerContent = innerContent.substring(3);
  }
  // if (startTag === "<di") {
  //   innerContent = innerContent.substring(5);
  // }
  return innerContent;
}

export function numberifyArray(myArray) {
  const numberifiedArray = [];
  myArray.forEach((element, index) => numberifiedArray.push(Number(element)));
  return numberifiedArray;
}

export function makeSearchFriendly(rawValues) {
  if (Array.isArray(rawValues)) {
    const normalizedArray = rawValues.map((element) =>
      element.toLowerCase().replace(/\s+/g, " ")
    );
    return normalizedArray.flat();
  } else if (typeof rawValues === "string") {
    const normalizedArray = rawValues
      .toLowerCase()
      .replace(/\s+/g, " ")
      .split(" ");
    return normalizedArray;
  }
}

export function makeTagsSearchable(rawTags) {
  if (!Array.isArray(rawTags)) return [];

  // lower cases and replaces continguous spaces with a single space
  const wholeTags = rawTags.map((el) =>
    el.toLowerCase().replace(/\s+/g, " ").trim()
  );

  const phrases = wholeTags.filter((el) => checkIfPhrase(el));
  if (!phrases || phrases.length === 0) return wholeTags;

  const atomizedPhrases = [];
  phrases.forEach((phrase) => {
    const atomizedPhrase = phrase.split(" ");
    atomizedPhrases.push(...atomizedPhrase);
  });

  const filteredAtomizedPhrases = atomizedPhrases.filter((el) =>
    checkIfArticle(el)
  );

  const wholeAndAtomizedTags = [...wholeTags, ...filteredAtomizedPhrases];
  return wholeAndAtomizedTags;
}

function checkIfPhrase(str) {
  return /\s/.test(str);
}

export function getInstructorNames(instructors, hiddenAdmins) {
  if (hiddenAdmins?.length > 0) {
    instructors = instructors.filter((instructor) => {
      return !hiddenAdmins.includes(instructor.id);
    });
  }

  if (instructors.length === 1) return instructors[0].name;

  if (instructors.length === 2)
    return `${instructors[0].name} and ${instructors[1].name}`;

  if (instructors.length > 2)
    return `${instructors[0].name}, ${instructors[1].name}, and others`;
}

export function makeSunEditorReadable(str) {
  if (!str) return "<p></p>";
  // wraps string in <p> </p>
  const latexCompatStr = str
    .replaceAll("<inlineteX>", "&lt;inlineteX&gt;")
    .replaceAll("</inlineteX>", "&lt;/inlineteX&gt;")
    .replaceAll("<InlineTeX>", "&lt;InlineTeX&gt;")
    .replaceAll("</InlineTeX>", "&lt;/InlineTeX&gt;")
    .replaceAll("<BlockTeX>", "&lt;BlockTeX&gt;")
    .replaceAll("</BlockTeX>", "&lt;/BlockTeX&gt;");
  const readableStr = `<p>${latexCompatStr}</p>`;
  return readableStr;
}

export function updatePrompt(content, setFieldValue, isMultipart, partIndex) {
  return isMultipart
    ? setFieldValue(`parts.${partIndex}.prompt`, extractInner(content))
    : setFieldValue("prompt", extractInner(content));
}

export function updateRule(
  event,
  setFieldValue,
  ruleFieldname,
  isMultipart,
  partIndex
) {
  let content = event.target.value;
  return isMultipart
    ? setFieldValue(`parts.${partIndex}.` + ruleFieldname, content)
    : setFieldValue(ruleFieldname, content);
}

export function updateAnswerChoice(
  content,
  setFieldValue,
  isMultipart,
  partIndex,
  answerIndex
) {
  return isMultipart
    ? setFieldValue(
        `parts.${partIndex}.answerChoices.${answerIndex}.answerChoice`,
        extractInner(content)
      )
    : setFieldValue(
        `answerChoices.${answerIndex}.answerChoice`,
        extractInner(content)
      );
}

function checkIfArticle(str) {
  switch (str) {
    case "of":
    case "the":
    case "and":
      return false;
    default:
      return true;
  }
}

function getQuestionSnippet(info) {
  const QUESTION_SNIPPET_LIMIT = 150;

  if (!info) return "(no prompt entered)";

  if (info.includes("<InlineTeX>")) return info;
  if (info.includes("<BlockTeX>")) return info;

  if (info.includes("<img")) return info;

  if (info.length < QUESTION_SNIPPET_LIMIT) return info;

  if (info.charAt(QUESTION_SNIPPET_LIMIT) === " ")
    return info.substring(0, QUESTION_SNIPPET_LIMIT) + "...";

  let indexLastCharWhitespace = info
    .substring(0, QUESTION_SNIPPET_LIMIT)
    .lastIndexOf(" ");
  info = info.substring(0, indexLastCharWhitespace) + "...";

  return info;
}

export function renderQuestionSnippet(question) {
  switch (question.type) {
    case "multiple choice":
    case "short answer":
    case "free response":
    case "file upload":
      return parseHTMLandTeX(getQuestionSnippet(question.prompt));
    case "title card":
      return parseHTMLandTeX(getQuestionSnippet(question.title));
    case "multipart":
      return parseHTMLandTeX(
        getQuestionSnippet(
          question.header ||
            question.parts[0].prompt ||
            question.parts[0].title ||
            question.parts[0].info
        )
      );
    default:
      return "";
  }
}

export function generateRandomCode(length) {
  let randomCode = "";
  // removed 'I' and 'l' from characters on Jan 16, 2022  since these look identical with the website font
  // and may cause confusion for students trying to enter course code
  const characters =
    "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    randomCode += characters.charAt(
      Math.floor(Math.random() * charactersLength)
    );
  }
  return randomCode;
}

export async function artificialDelay(milliseconds) {
  await new Promise((r) => setTimeout(r, milliseconds));
}

export function extractDate(dateObject) {
  const date = dateObject?.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const time = dateObject?.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return date ? `${date} \u00A0 ${time}` : "";
}

export const alphabet = [
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

export function makeReadable(acceptedFileTypes) {
  const readableArray = [];
  acceptedFileTypes?.forEach((element, index) => {
    switch (element) {
      case "application/pdf":
        readableArray.push("PDF");
        break;
      case "image/jpeg":
        readableArray.push("JPEG");
        break;
      case "image/png":
        readableArray.push("PNG");
        break;
      case "application/vnd.wolfram.mathematica":
        readableArray.push("Mathematica notebook");
        break;
      default:
        break;
    }
  });
  return readableArray.join(", ");
}

export function ZoomControl({ zoom, setZoom, url }) {
  return (
    <Box
      style={{
        paddingLeft: "10px",
        minWidth: "180px",
        borderRadius: "5px",
        backgroundColor: "rgba(0,0,0,0.1)",
        position: "fixed",
        bottom: "8px",
        zIndex: 2,
      }}
    >
      <Tooltip title="zoom in">
        <IconButton
          style={{ padding: "8px", marginLeft: "2px", marginRight: "5px" }}
          variant="contained"
          onClick={() => setZoom(() => zoom - 0.1)}
        >
          −
        </IconButton>
      </Tooltip>
      <Typography
        display="inline"
        variant="subtitle2"
        align="center"
        color="textSecondary"
      >
        {(zoom * 100).toFixed(0)} %
      </Typography>
      <Tooltip title="zoom in">
        <IconButton
          style={{ padding: "8px", marginRight: "2px" }}
          variant="contained"
          onClick={() => setZoom(() => zoom + 0.1)}
        >
          +
        </IconButton>
      </Tooltip>

      <Tooltip title="open in new tab">
        <IconButton
          style={{ padding: "8px", marginLeft: "20px" }}
          className="hover-pointer padding-left-light"
          href={url}
          rel="noreferrer"
          target="_blank"
        >
          <OpenInNew fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export const Eraser = ({ strokeColor }) => (
  <SvgIcon>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88.02 85.43">
      <path
        stroke={strokeColor}
        strokeWidth="6px"
        fill="none"
        d="M144.35,414.41h-17L122,410.09l-13.22-13.21a18.64,18.64,0,0,1,.54-12.4q10.11-10.39,20.23-20.77L160,333.63l32.4,32Z"
        transform="translate(-106.44 -331.52)"
      />
      <line
        stroke={strokeColor}
        strokeWidth="6px"
        x1="19.03"
        y1="38.66"
        x2="47.21"
        y2="66.84"
      />
      <line
        stroke={strokeColor}
        strokeWidth="6px"
        x1="20.65"
        y1="83.43"
        x2="78.35"
        y2="83.43"
      />
    </svg>
  </SvgIcon>
);

export function arcTan(dx, dy) {
  if (dx > 0 && dy > 0) return Math.atan(dy / dx);
  if (dx < 0 && dy > 0) return Math.atan(dy / dx) + Math.PI;
  if (dx < 0 && dy < 0) return Math.atan(dy / dx) + Math.PI;
  if (dx > 0 && dy < 0) return Math.atan(dy / dx) + 2 * Math.PI;
  if (dx > 0 && dy === 0) return 0;
  if (dx < 0 && dy === 0) return Math.PI;
  if (dx === 0 && dy > 0) return 0.5 * Math.PI;
  if (dx === 0 && dy < 0) return 1.5 * Math.PI;
}

export function distance(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

export function getPublicUrl(url) {
  console.log(url);
  const urlArr = url.split("?");
  const baseUrl = urlArr[0];
  const trimmedUrl = baseUrl
    .slice(16)
    .replaceAll("%2F", "/")
    .replace("/o", "")
    .replace("v0/b/", "");
  const publicUrl = "https://" + trimmedUrl;

  return publicUrl;
}
