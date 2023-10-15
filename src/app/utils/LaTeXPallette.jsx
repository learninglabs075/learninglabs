import React, { useState } from "react";
import {
  greekLettersLowerCase,
  greekLettersUpperCase,
  mathTrigonometry,
  mathSubscriptsSuperscripts,
  mathFractions,
  mathVectors,
  mathScientificNotation,
  mathMiscellaneous,
  chemistryMass,
  chemistryLength,
  chemistryAmount,
  chemistryEnergy,
  chemistryVolume,
  chemistryPressure,
  chemistryConcentration,
  metricPrefixes,
  physicsKinematics,
  physicsTime,
  physicsEnergy,
  physicsEM,
} from "./LaTeXExpressionGroups.js";
import Dialog from "@material-ui/core/Dialog";
import { Tabs, Tab } from "@material-ui/core";
import DragIndicatorIcon from "@material-ui/icons/DragIndicator";
import {
  Box,
  TextField,
  Tooltip,
  Paper,
  IconButton,
  Typography,
} from "@material-ui/core";
import TeX from "@matejmazur/react-katex";
import Draggable from "react-draggable";
import { Field } from "formik";
import EditIcon from "@material-ui/icons/Edit";

export function LaTeXPallette({
  fieldname,
  palletteOpen,
  setPalletteOpen,
  value,
  setFieldValue,
}) {
  const [cursorPosition, setCursorPosition] = useState(0);
  const [tabIndex, setTabIndex] = useState(0);

  const handleChange = (event, index) => {
    setTabIndex(index);
  };

  const handleClosePallette = () => {
    setPalletteOpen(false);
  };

  return (
    <>
      <IconButton
        onClick={() => {
          setPalletteOpen(true);
        }}
      >
        <EditIcon />
      </IconButton>
      <Dialog
        disableEnforceFocus
        open={palletteOpen}
        onClose={handleClosePallette}
        PaperComponent={PaperComponent}
        BackdropProps={{
          style: { backgroundColor: "transparent" },
        }}
      >
        <Box className="relative" style={{ backgroundColor: "whitesmoke" }}>
          <DragIndicatorIcon
            fontSize="large"
            id="draggable-dialog-title"
            style={{
              cursor: "move",
              color: "silver",
              position: "absolute",
              top: 12,
              left: 10,
            }}
          />

          <Box
            className="padding-top-light flex-row align-center"
            width="430px"
            style={{ paddingLeft: "140px", paddingBottom: "20px" }}
          >
            <Field
              name={fieldname}
              as={LaTeXInputField}
              onClick={(e) => {
                setCursorPosition(e.target.selectionStart);
              }}
              onKeyUp={(e) => {
                setCursorPosition(e.target.selectionStart);
              }}
              onFocus={(e) => {
                setCursorPosition(e.target.selectionStart);
              }}
            />
          </Box>
          <Box width={585} className="flex-row">
            <Tabs
              orientation="vertical"
              value={tabIndex}
              onChange={handleChange}
              className="laTeX-group-selected"
            >
              <Tab
                label="math"
                disableRipple
                onClick={() => setTabIndex((prevIndex) => 0)}
              />
              <Tab
                label="greek"
                disableRipple
                onClick={() => setTabIndex((prevIndex) => 1)}
              />
              <Tab
                label="chemistry"
                disableRipple
                onClick={() => setTabIndex((prevIndex) => 2)}
              />
              <Tab
                label="physics"
                disableRipple
                onClick={() => setTabIndex((prevIndex) => 3)}
              />
            </Tabs>
            <Box
              className="flex-row wrap"
              style={{ alignContent: "flex-start" }}
              width={515}
            >
              {tabIndex === 0 &&
                [
                  mathSubscriptsSuperscripts,
                  mathFractions,
                  mathScientificNotation,
                  mathVectors,
                  mathMiscellaneous,
                  mathTrigonometry,
                ].map((laTeXGroup, index) => (
                  <LaTeXButtonGroup
                    key={`math${index}`}
                    value={value}
                    laTeXGroup={laTeXGroup}
                    cursorPosition={cursorPosition}
                    setCursorPosition={setCursorPosition}
                    setFieldValue={setFieldValue}
                    fieldname={fieldname}
                  />
                ))}
              {tabIndex === 1 &&
                [greekLettersLowerCase, greekLettersUpperCase].map(
                  (laTeXGroup, index) => (
                    <LaTeXButtonGroup
                      key={`greek${index}`}
                      value={value}
                      laTeXGroup={laTeXGroup}
                      cursorPosition={cursorPosition}
                      setCursorPosition={setCursorPosition}
                      setFieldValue={setFieldValue}
                      fieldname={fieldname}
                    />
                  )
                )}

              {tabIndex === 2 &&
                [
                  chemistryMass,
                  chemistryLength,
                  chemistryAmount,
                  chemistryPressure,
                  chemistryEnergy,
                  chemistryVolume,
                  chemistryConcentration,
                  metricPrefixes,
                ].map((laTeXGroup, index) => (
                  <LaTeXButtonGroup
                    key={`chemistry${index}`}
                    value={value}
                    laTeXGroup={laTeXGroup}
                    cursorPosition={cursorPosition}
                    setCursorPosition={setCursorPosition}
                    setFieldValue={setFieldValue}
                    fieldname={fieldname}
                  />
                ))}

              {tabIndex === 3 &&
                [
                  physicsKinematics,
                  physicsTime,
                  physicsEnergy,
                  physicsEM,
                  metricPrefixes,
                ].map((laTeXGroup, index) => (
                  <LaTeXButtonGroup
                    key={`physics${index}`}
                    value={value}
                    laTeXGroup={laTeXGroup}
                    cursorPosition={cursorPosition}
                    setCursorPosition={setCursorPosition}
                    setFieldValue={setFieldValue}
                    fieldname={fieldname}
                  />
                ))}
            </Box>
            <button
              className="hover-pointer delete-button padding-light absolute"
              style={{ right: 0, bottom: 0 }}
              onClick={() => setPalletteOpen(false)}
            >
              DONE
            </button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}

function insertLaTeXExpression(
  value,
  expression,
  cursorPosition,
  setFieldValue,
  fieldname
) {
  const expressionLeftOfCursor = value.substring(0, cursorPosition);
  const expressionRightOfCursor = value.substring(cursorPosition, value.length);

  setFieldValue(
    fieldname,
    expressionLeftOfCursor + `${expression} ` + expressionRightOfCursor
  );
}

const LaTeXInputField = (props) => (
  <TextField
    variant="filled"
    autoComplete="off"
    fullWidth
    placeholder="laTeX"
    {...props}
  />
);

function LaTeXButtonGroup({
  value,
  laTeXGroup,
  cursorPosition,
  setCursorPosition,
  setFieldValue,
  fieldname,
}) {
  return (
    <Box className="padding-light flex wrap">
      {laTeXGroup.map((expression) => (
        <Box key={expression.code} minWidth={35} minHeight={20}>
          <Tooltip title={expression.caption}>
            <button
              type="button"
              className="hover-pointer full-width"
              onClick={(e) => {
                insertLaTeXExpression(
                  value,
                  expression.code,
                  cursorPosition,
                  setFieldValue,
                  fieldname
                );

                setCursorPosition(cursorPosition + expression.code.length + 1);
              }}
            >
              <TeX>{expression.code}</TeX>
            </button>
          </Tooltip>
        </Box>
      ))}
    </Box>
  );
}

function PaperComponent(props) {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} elevation={1} />
    </Draggable>
  );
}

export function LaTeXDisplayBox({ value, placeholder }) {
  const boxDimensions = {
    backgroundColor: "rgba(0,0,0,0.09)",
    minWidth: "100px",
    maxWidth: "160px",
    minHeight: "50px",
    maxHeight: "50px",
    borderTopLeftRadius: "4px",
    borderTopRightRadius: "4px",
  };

  const boxDimensions2 = {
    backgroundColor: "rgba(0,0,0,0.09)",
    minWidth: "100px",
    borderTopLeftRadius: "4px",
    borderTopRightRadius: "4px",
  };

  return value === "" ? (
    <Box className="flex-center-all" style={boxDimensions}>
      <Typography color="textSecondary">{placeholder}</Typography>
    </Box>
  ) : (
    <TeX
      className="padding-light overflow-auto text-align-center"
      style={boxDimensions2}
      math={value}
    />
  );
}
