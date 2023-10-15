import { TextField, InputAdornment } from "@material-ui/core";
import { handleImageUploadBefore } from "./utils.js";
import SunEditor from "suneditor-react";
import katex from "katex";

const optionsPackageA = {
  katex: katex,
  buttonList: [
    [
      "bold",
      "underline",
      "italic",
      "subscript",
      "superscript",
      "list",
      "table",
      "image",
      "codeView",
      "fullScreen",
    ],
  ],
  addTagsWhitelist: "InlineTex",
  mode: "inline",
};

export const TitleField = (props) => (
  <TextField
    variant="filled"
    style={{ marginTop: "10px", marginBottom: "20px" }}
    fullWidth
    label="title"
    {...props}
  />
);

export const BodyField = (props) => (
  <div className="relative">
    <span className="editor-field-placeholder">body</span>
    <SunEditor
      width="100%"
      showToolbar="false"
      onImageUploadBefore={(files, info, uploadHandler) =>
        handleImageUploadBefore(
          files,
          info,
          uploadHandler,
          props.userID,
          props.productLibraryID
        )
      }
      setOptions={optionsPackageA}
      {...props}
    />
  </div>
);

export const PromptField = (props) => (
  <div className="relative">
    <span className="editor-field-placeholder">prompt</span>
    <SunEditor
      width="100%"
      showToolbar="false"
      onImageUploadBefore={(files, info, uploadHandler) =>
        handleImageUploadBefore(
          files,
          info,
          uploadHandler,
          props.userID,
          props.productLibraryID
        )
      }
      setOptions={optionsPackageA}
      {...props}
    />
  </div>
);

export const RuleField = (props) => (
  <div className="relative" style={{ marginTop: "10px" }}>
    <TextField
      variant="filled"
      multiline
      style={{ marginTop: "10px", marginBottom: "20px" }}
      fullWidth
      label={props.label}
      {...props}
    />
  </div>
);

export const UnitRuleField = (props) => (
  <div className="relative" style={{ marginTop: "10px" }}>
    <TextField
      variant="filled"
      multiline
      style={{ marginTop: "10px", marginBottom: "20px" }}
      fullWidth
      label="unit rule"
      {...props}
    />
  </div>
);

export const InfoField = (props) => (
  <div className="relative">
    <span className="editor-field-placeholder">info</span>
    <SunEditor
      width="100%"
      showToolbar="false"
      onImageUploadBefore={(files, info, uploadHandler) =>
        handleImageUploadBefore(
          files,
          info,
          uploadHandler,
          props.userID,
          props.productLibraryID
        )
      }
      setOptions={optionsPackageA}
      {...props}
    />
  </div>
);

export const AnswerChoiceField = (props) => (
  <div className="relative">
    <span className="editor-field-placeholder">answer choice</span>
    <SunEditor
      width="100%"
      showToolbar="false"
      onImageUploadBefore={(files, info, uploadHandler) =>
        handleImageUploadBefore(
          files,
          info,
          uploadHandler,
          props.userID,
          props.productLibraryID
        )
      }
      setOptions={optionsPackageA}
      {...props}
    />
  </div>
);

export const FreeResponseField = (props) => (
  <TextField
    label="response"
    variant="filled"
    multiline
    rows={6}
    fullWidth
    inputProps={{ maxLength: props.characterlimit }}
    {...props}
  />
);

export const WordOrPhraseField = (props) => (
  <TextField label="word or phrase" variant="filled" multiline {...props} />
);

export const SimpleTextField = (props) => (
  <TextField label="word / phrase" variant="filled" multiline {...props} />
);

export const ExpressionInputField = (props) => (
  <TextField
    label="mathematica expression"
    variant="filled"
    multiline
    {...props}
  />
);

export const ListInputField = (props) => (
  <TextField
    label="list"
    placeholder="{a, b, c, ...}"
    variant="filled"
    {...props}
  />
);

export const NumberInputField = (props) => (
  <TextField label="number" variant="filled" size="small" {...props} />
);

export const UnitInputField = (props) => (
  <TextField label="unit" id="unit" variant="filled" size="small" {...props} />
);

export const PositiveNumberInputField = (props) => (
  <TextField
    placeholder={0}
    size="small"
    inputProps={{ min: 0 }}
    InputProps={{
      endAdornment: <InputAdornment position="end">%</InputAdornment>,
    }}
    type="number"
    disabled={props.match !== "withinRange"}
    {...props}
  />
);

export const FreeResponseExample = (props) => (
  <TextField
    multiline
    rows={4}
    variant="outlined"
    fullWidth
    placeholder="example response"
    {...props}
  />
);

export const CharacterLimitField = (props) => (
  <TextField
    id="character limit"
    type="number"
    inputProps={{
      min: 0,
    }}
    size="small"
    {...props}
  />
);

export const TagField = (props) => (
  <TextField
    placeholder="add tag"
    variant="outlined"
    size="small"
    fullWidth
    {...props}
  />
);

export const PointsField = (props) => (
  <TextField
    placeholder="#"
    variant="outlined"
    size="small"
    type="number"
    inputProps={{
      min: 0,
    }}
    {...props}
  />
);

export const AttemptsAllowedField = (props) => (
  <TextField
    placeholder="#"
    variant="outlined"
    size="small"
    type="number"
    inputProps={{
      min: 1,
    }}
    {...props}
  />
);

export const DescriptionField = (props) => (
  <TextField
    label="Please describe the issue"
    id="Description"
    variant="filled"
    multiline
    rows={4}
    fullWidth
    {...props}
  />
);
