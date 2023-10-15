import React, { useState } from "react";
import { Typography, Box, IconButton, Divider } from "@material-ui/core";
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from "@material-ui/lab";
import {
  ListAltRounded,
  ShortText,
  Subject,
  Crop54Sharp,
  CloudUpload,
  Delete,
} from "@material-ui/icons";
import { FieldArray } from "formik";
import { Tags, SaveButton } from "./CommonQuestCpnts";
import { alphabet } from "../../../app/utils/utils";
import MultipleChoice from "./MultipleChoice.jsx";
import ShortAnswer from "./ShortAnswer.jsx";
import FreeResponse from "./FreeResponse.jsx";
import InfoCard from "./InfoCard.jsx";
import FileUpload from "./FileUpload.jsx";
import {
  fileUploadValues,
  multipleChoiceValues,
  shortAnswerValues,
  freeResponseValues,
  infoCardValues,
} from "./questionFormValues.js";

const InfoCardButton = (props) => (
  <IconButton
    style={{ padding: "5px", marginLeft: "5px", marginRight: "5px" }}
    onClick={props.onClick}
  >
    <Crop54Sharp color={props.type === "info card" ? "primary" : "inherit"} />
  </IconButton>
);

const MultipleChoiceButton = (props) => (
  <IconButton
    style={{ padding: "5px", marginLeft: "5px", marginRight: "5px" }}
    onClick={props.onClick}
  >
    <ListAltRounded
      color={props.type === "multiple choice" ? "primary" : "inherit"}
    />
  </IconButton>
);

const ShortAnswerButton = (props) => (
  <IconButton
    style={{ padding: "5px", marginLeft: "5px", marginRight: "5px" }}
    onClick={props.onClick}
  >
    <ShortText color={props.type === "short answer" ? "primary" : "inherit"} />
  </IconButton>
);

const FreeResponseButton = (props) => (
  <IconButton
    style={{ padding: "5px", marginLeft: "5px", marginRight: "5px" }}
    onClick={props.onClick}
  >
    <Subject color={props.type === "free response" ? "primary" : "inherit"} />
  </IconButton>
);

const CloudUploadButton = (props) => (
  <IconButton
    style={{ padding: "5px", marginLeft: "5px", marginRight: "5px" }}
    onClick={props.onClick}
  >
    <CloudUpload color={props.type === "file upload" ? "primary" : "inherit"} />
  </IconButton>
);

export default function Multipart({
  values,
  isSubmitting,
  setFieldValue,
  handleChange,
  dirty,
  question,
}) {
  const [contentMenuOpen, setContentMenuOpen] = useState(false);

  const closeContentMenu = () => {
    setContentMenuOpen(false);
  };

  const openContentMenu = () => {
    setContentMenuOpen(true);
  };
  return (
    <>
      <Box className="flex column" minWidth="850px" minHeight="500px">
        <Typography variant="h5" style={{ marginBottom: "20px" }}>
          Multipart
        </Typography>

        {values.parts.map(
          (part, partIndex) =>
            (part.type === "info card" && (
              <>
                <PartHeader partIndex={partIndex} type={part.type} />
                <InfoCard
                  values={values.parts[partIndex]}
                  setFieldValue={setFieldValue}
                  handleChange={handleChange}
                  isMultipart={true}
                  partIndex={partIndex}
                />
                {partIndex < values.parts.length - 1 && (
                  <Divider
                    style={{ marginTop: "20px", marginBottom: "20px" }}
                  />
                )}
              </>
            )) ||
            (part.type === "multiple choice" && (
              <>
                <PartHeader partIndex={partIndex} type={part.type} />
                <MultipleChoice
                  values={values.parts[partIndex]}
                  setFieldValue={setFieldValue}
                  handleChange={handleChange}
                  isMultipart={true}
                  partIndex={partIndex}
                />
                {partIndex < values.parts.length - 1 && (
                  <Divider
                    style={{ marginTop: "20px", marginBottom: "20px" }}
                  />
                )}
              </>
            )) ||
            (part.type === "short answer" && (
              <>
                <PartHeader partIndex={partIndex} type={part.type} />
                <ShortAnswer
                  values={values.parts[partIndex]}
                  setFieldValue={setFieldValue}
                  handleChange={handleChange}
                  isMultipart={true}
                  partIndex={partIndex}
                  initVal={question?.parts[partIndex]}
                />
                {partIndex < values.parts.length - 1 && (
                  <Divider
                    style={{ marginTop: "20px", marginBottom: "20px" }}
                  />
                )}
              </>
            )) ||
            (part.type === "free response" && (
              <>
                <PartHeader partIndex={partIndex} type={part.type} />
                <FreeResponse
                  values={values.parts[partIndex]}
                  setFieldValue={setFieldValue}
                  handleChange={handleChange}
                  isMultipart={true}
                  partIndex={partIndex}
                />
                {partIndex < values.parts.length - 1 && (
                  <Divider
                    style={{ marginTop: "20px", marginBottom: "20px" }}
                  />
                )}
              </>
            )) ||
            (part.type === "file upload" && (
              <>
                <PartHeader partIndex={partIndex} type={part.type} />
                <FileUpload
                  values={values.parts[partIndex]}
                  setFieldValue={setFieldValue}
                  handleChange={handleChange}
                  isMultipart={true}
                  partIndex={partIndex}
                />
                {partIndex < values.parts.length - 1 && (
                  <Divider
                    style={{ marginTop: "20px", marginBottom: "20px" }}
                  />
                )}
              </>
            ))
        )}
        {values.parts.length < 1 && (
          <Box className="select-part-to-view">
            <Typography color="primary" align="center">
              Add a part using the (+) button.
            </Typography>
          </Box>
        )}
        {values.parts.length > 0 && (
          <Box
            style={{ marginTop: "10px", marginLeft: "20px" }}
            maxWidth="760px"
          >
            <Tags values={values} setFieldValue={setFieldValue} />
          </Box>
        )}
      </Box>

      {values.parts.length > 0 && (
        <Box className="flex-justify-center padding-top-light">
          <SaveButton isSubmitting={isSubmitting} dirty={dirty} />
        </Box>
      )}
      {/* <pre>{JSON.stringify(values, null, 2)}</pre> */}
      <FieldArray name="parts">
        {({ push }) => (
          <div className="expanding-speed-dial-container speed-dial-position-v2">
            <SpeedDial
              ariaLabel="add module content"
              icon={<SpeedDialIcon />}
              onClose={closeContentMenu}
              onOpen={openContentMenu}
              open={contentMenuOpen}
              direction={"up"}
            >
              <SpeedDialAction
                icon={<CloudUpload />}
                tooltipTitle={<Typography noWrap>file upload</Typography>}
                tooltipOpen
                onClick={() => push(fileUploadValues)}
              />
              <SpeedDialAction
                icon={<Subject />}
                tooltipTitle={<Typography noWrap> free response</Typography>}
                tooltipOpen
                onClick={() => push(freeResponseValues)}
              />
              <SpeedDialAction
                icon={<ShortText />}
                tooltipTitle={<Typography noWrap>short answer</Typography>}
                tooltipOpen
                onClick={() => push(shortAnswerValues)}
              />

              <SpeedDialAction
                icon={<ListAltRounded />}
                tooltipTitle={<Typography noWrap>multiple choice</Typography>}
                tooltipOpen
                onClick={() => push(multipleChoiceValues)}
              />

              <SpeedDialAction
                icon={<Crop54Sharp />}
                tooltipTitle={<Typography noWrap>info card</Typography>}
                tooltipOpen
                onClick={() => push(infoCardValues)}
              />
            </SpeedDial>
          </div>
        )}
      </FieldArray>
    </>
  );
}

function PartHeader({ partIndex, type }) {
  return (
    <Box className="flex-column">
      <Box className="flex align-center" style={{ marginLeft: "13px" }}>
        <FieldArray name="parts">
          {({ remove }) => (
            <IconButton
              style={{ padding: "0px" }}
              onClick={() => remove(partIndex)}
            >
              <Delete />
            </IconButton>
          )}
        </FieldArray>
        <Typography
          display="inline"
          variant="h6"
          style={{ marginLeft: "10px", marginRight: "20px" }}
        >
          Part {alphabet[partIndex]}
        </Typography>
      </Box>

      <FieldArray name="parts">
        {({ replace, remove }) => (
          <>
            <Box className="flex-align-center" style={{ marginLeft: "20px" }}>
              <Typography
                style={{ marginRight: "20px" }}
                color="primary"
                display="inline"
              >
                {type}
              </Typography>
              <InfoCardButton
                onClick={() => replace(partIndex, infoCardValues)}
                type={type}
              />
              <MultipleChoiceButton
                onClick={() => replace(partIndex, multipleChoiceValues)}
                type={type}
              />
              <ShortAnswerButton
                onClick={() => replace(partIndex, shortAnswerValues)}
                type={type}
              />
              <FreeResponseButton
                onClick={() => replace(partIndex, freeResponseValues)}
                type={type}
              />
              <CloudUploadButton
                onClick={() => replace(partIndex, fileUploadValues)}
                type={type}
              />
            </Box>
          </>
        )}
      </FieldArray>
    </Box>
  );
}
