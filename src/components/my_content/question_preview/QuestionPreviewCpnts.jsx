import {
  Box,
  Divider,
  Grid,
  Radio,
  TextField,
  Typography,
} from "@material-ui/core";
import { parseHTMLandTeX } from "../../../app/utils/customParsers.js";
import { multipleChoiceRadioStyling } from "../../../app/utils/stylingSnippets.js";
import { questionDividerA } from "../../../app/utils/stylingSnippets.js";
import { makeReadable } from "../../../app/utils/utils.js";
import TeX from "@matejmazur/react-katex";
import { wolframExprToTeX } from "../../../app/utils/expressionTranslators.js";

export function PreviewHeader({ questionType, questionID, saveTo }) {
  return (
    <Box className="flex-row question-preview-header">
      {saveTo !== process.env.REACT_APP_PRODUCT_COLLECTION && (
        <Typography variant="subtitle2" color="textSecondary">
          QUESTION PREVIEW
        </Typography>
      )}

      {saveTo === process.env.REACT_APP_PRODUCT_COLLECTION && (
        <Box width="340px" className="flex space-between">
          <Typography variant="subtitle2" color="textSecondary">
            QUESTION PREVIEW
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            <em>{questionID}</em>
          </Typography>
        </Box>
      )}

      <Typography variant="subtitle2" color="textSecondary">
        {questionType}
      </Typography>
    </Box>
  );
}

export function MultipleChoicePreview({ question }) {
  return (
    <>
      <Prompt question={question} />

      <Divider style={questionDividerA} />

      {question.answerChoices.map((question, index) => (
        <Box key={index} display="flex" className="padding-vertical-tiny">
          <Radio
            disabled={true}
            checked={question.isCorrect}
            style={multipleChoiceRadioStyling}
          />
          <Typography
            variant="subtitle1"
            style={{ width: "510px", marginRight: "10px" }}
          >
            {parseHTMLandTeX(question.answerChoice)}
          </Typography>
          <Box width="60px">
            {question.isCorrect && (
              <Typography variant="subtitle1" color="textSecondary">
                (correct)
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </>
  );
}

export function ShortAnswerPreview({ question }) {
  const subtype = question.subtype;

  return (
    <>
      <Prompt question={question} />

      <Divider style={questionDividerA} />

      {(subtype === "wordOrPhrase" || subtype === "text") && (
        <Box className="flex-justify-center padding-medium">
          <CorrectText question={question} />
        </Box>
      )}

      {(subtype === "number" || subtype === "number beta") && (
        <>
          <Box className="flex-justify-center padding-medium">
            <CorrectNumber question={question} />
          </Box>
          <PercentTolerance question={question} />
        </>
      )}

      {(subtype === "measurement" ||
        subtype === "measurement beta" ||
        subtype === "measurement with feedback") && (
        <>
          <Box className="flex-justify-center padding-medium">
            <CorrectNumber question={question} />
            <CorrectUnit question={question} />
          </Box>
          <PercentTolerance question={question} />
        </>
      )}

      {subtype === "measurement with rule" && (
        <>
          <Box className="flex-justify-center padding-medium">
            <Grid container>
              <Grid item xs={3}>
                <CorrectNumber question={question} />
              </Grid>
              <Grid item xs={3}>
                <CorrectUnit question={question} />
              </Grid>
              <Grid item xs={12}>
                <CorrectRule question={question} />
              </Grid>
              <Grid item xs={12}>
                <CorrectUnitRule question={question} />
              </Grid>
            </Grid>
          </Box>
          <PercentTolerance question={question} />
        </>
      )}

      {subtype === "expr with rule" && (
        <>
          <Box className="flex-justify-center padding-light">
            <Grid container>
              <Grid item xs={12}>
                <CorrectExpr question={question} />
              </Grid>
              <Grid item xs={12}>
                <CorrectRule question={question} />
              </Grid>
            </Grid>
          </Box>
        </>
      )}

      {(subtype === "vector" || subtype === "vector beta") && (
        <>
          <Box className="flex-justify-center padding-medium">
            <CorrectVector question={question} />
          </Box>
          <PercentTolerance question={question} />
        </>
      )}

      {(subtype === "vector with unit" ||
        subtype === "vector with unit beta") && (
        <>
          <Box className="flex-justify-center padding-medium">
            <CorrectVector question={question} />
            <CorrectUnit question={question} />
          </Box>
          <PercentTolerance question={question} />
        </>
      )}

      {(subtype === "vector symbolic" || subtype === "vector expr") && (
        <>
          <CorrectVectorExpr question={question} />
          <PercentTolerance question={question} />
        </>
      )}

      {(subtype === "symbolic" || subtype === "expr") && (
        <>
          <Box className="flex-justify-center padding-medium">
            <CorrectExpr question={question} />
          </Box>
          <PercentTolerance question={question} />
        </>
      )}

      {subtype === "mathematica expression" && (
        <Box padding={3} width={280}>
          <TextField
            fullWidth
            value={question.correctAnswer?.expr || question.correctExpression}
            disabled={true}
            variant="outlined"
          />
        </Box>
      )}
      {subtype === "mathematica list" && (
        <Box padding={3} width={280}>
          <TextField
            fullWidth
            value={question.correctAnswer?.text}
            disabled={true}
            variant="outlined"
          />
        </Box>
      )}

      {subtype === "chemical formula" && (
        <>
          <Box className="flex-justify-center padding-medium">
            <CorrectChemFormula question={question} />
          </Box>
          <PercentTolerance question={question} />
        </>
      )}
    </>
  );
}

function Prompt({ question }) {
  if (!question.prompt)
    return <Typography color="textSecondary">(no prompt entered)</Typography>;

  return (
    <Typography variant="subtitle1">
      {parseHTMLandTeX(question.prompt)}
    </Typography>
  );
}

function CorrectText({ question }) {
  if (question.correctAnswer?.text)
    return (
      <Box className="flex-justify-center padding-light">
        <Box className="correct-answer-display">
          {question.correctAnswer?.text}
        </Box>
      </Box>
    );
  if (question.correctWordOrPhrase)
    return (
      <Box className="flex-justify-center padding-light">
        <Box className="correct-answer-display">
          {question.correctWordOrPhrase}
        </Box>
      </Box>
    );
  return <CorrectAnswerMissing />;
}

function CorrectNumber({ question }) {
  if (question.correctAnswer?.number)
    return (
      <Box className="flex-justify-center padding-light relative">
        <TeX className="correct-answer-display">
          {wolframExprToTeX(question.correctAnswer?.number)}
        </TeX>
      </Box>
    );
  if (question.correctNumber)
    return (
      <Box className="flex-justify-center padding-light">
        <TeX className="correct-answer-display">{question.correctNumber}</TeX>
      </Box>
    );
  return <CorrectAnswerMissing />;
}

function CorrectVector({ question }) {
  if (question.correctAnswer?.vector)
    return (
      <Box className="flex-justify-center padding-medium relative">
        <TeX className="correct-answer-display">
          {wolframExprToTeX(question.correctAnswer?.vector)}
        </TeX>
      </Box>
    );
  if (question.correctNumber)
    return (
      <Box className="flex-justify-center padding-medium">
        <TeX className="correct-answer-display">{question.correctNumber}</TeX>
      </Box>
    );
  return <CorrectAnswerMissing />;
}

function CorrectVectorExpr({ question }) {
  if (question.correctAnswer?.vectorExpr) {
    return (
      <Box className="flex-justify-center padding-medium relative">
        <TeX className="correct-answer-display">
          {wolframExprToTeX(question.correctAnswer?.vectorExpr)}
        </TeX>
      </Box>
    );
  }
  if (question.correctNumber)
    return (
      <Box className="flex-justify-center padding-medium">
        <TeX className="correct-answer-display">{question.correctNumber}</TeX>
      </Box>
    );
  return <CorrectAnswerMissing />;
}

function CorrectExpr({ question }) {
  if (question.correctAnswer?.expr) {
    return (
      <Box className="flex-justify-center padding-light relative">
        <TeX className="correct-answer-display">
          {wolframExprToTeX(question.correctAnswer?.expr)}
        </TeX>
      </Box>
    );
  }
  if (question.correctNumber)
    return (
      <Box className="flex-justify-center padding-medium">
        <TeX className="correct-answer-display">{question.correctNumber}</TeX>
      </Box>
    );
  return <CorrectAnswerMissing />;
}

function CorrectRule({ question }) {
  if (question.correctAnswer?.rule) {
    return (
      <Box className="flex-justify-center padding-light relative">
        <TextField
          className="correct-answer-display"
          value={question.correctAnswer?.rule}
          multiline
          style={{ width: "450px" }}
          disabled={true}
          variant="outlined"
        />
      </Box>
    );
  }
  return <CorrectAnswerMissing />;
}

function CorrectUnitRule({ question }) {
  if (question.correctAnswer?.rule) {
    return (
      <Box className="flex-justify-center padding-light relative">
        <TextField
          className="correct-answer-display"
          value={question.correctAnswer?.unitRule}
          multiline
          style={{ width: "450px" }}
          disabled={true}
          variant="outlined"
        />
      </Box>
    );
  }
  return <CorrectAnswerMissing />;
}

function CorrectChemFormula({ question }) {
  if (question.correctAnswer?.chemFormula) {
    return (
      <Box className="flex-justify-center padding-medium relative">
        <TeX className="correct-answer-display">
          {wolframExprToTeX(question.correctAnswer?.chemFormula)}
        </TeX>
      </Box>
    );
  }

  return <CorrectAnswerMissing />;
}

function CorrectUnit({ question }) {
  if (question.correctAnswer?.unit)
    return (
      <Box className="flex-center-all padding-light relative">
        <TeX className="correct-answer-display">
          {`\\mathrm{${wolframExprToTeX(question.correctAnswer?.unit)}}`}
        </TeX>
      </Box>
    );
  if (question.correctUnit)
    return (
      <Box className="flex-center-all padding-light">
        <TeX className="correct-answer-display">{question.correctUnit}</TeX>
      </Box>
    );
  return <CorrectAnswerMissing />;
}

function CorrectAnswerMissing() {
  return (
    <Box className="flex-justify-center padding-medium">
      <Typography color="textSecondary">
        (correct answer information missing)
      </Typography>
    </Box>
  );
}

function PercentTolerance({ question }) {
  if (question.match !== "withinRange") return null;
  if (question.correctAnswer?.percentTolerance > 0)
    return (
      <Typography variant="subtitle1" align="center" color="textSecondary">
        percent tolerance: ± {question.correctAnswer.percentTolerance} %
      </Typography>
    );
  if (question.percentTolerance > 0)
    return (
      <Typography variant="subtitle1" align="center" color="textSecondary">
        percent tolerance: ± {question.percentTolerance} %
      </Typography>
    );

  return null;
}

function ExprPreview({ expr }) {
  return (
    <Box
      width="300px"
      className="absolute"
      style={{ top: "80px", textAlign: "center", color: "gray" }}
    >
      {expr}
    </Box>
  );
}

export function AcceptableRange({
  correctNumber,
  correctUnit,
  percentTolerance,
}) {
  const lowerBound = Number(correctNumber) * ((100 - percentTolerance) / 100);
  const upperBound = Number(correctNumber) * ((100 + percentTolerance) / 100);
  return (
    <Box display="flex" flexWrap="wrap" style={{ marginLeft: "45px" }}>
      <Typography style={{ marginRight: "0.3rem" }} color="textSecondary">
        accept answers between:
      </Typography>
      <Box className="flex">
        <Typography color="textSecondary">
          {lowerBound.toPrecision(3)}
        </Typography>
        <UnitLaTeXForm correctUnit={correctUnit} />
        <Typography
          style={{ marginLeft: "0.5rem", marginRight: "0.5rem" }}
          color="textSecondary"
        >
          —
        </Typography>
        <Typography color="textSecondary">
          {upperBound.toPrecision(3)}
        </Typography>
        <UnitLaTeXForm correctUnit={correctUnit} />
      </Box>
    </Box>
  );
}

function UnitLaTeXForm({ correctUnit }) {
  return (
    <TeX
      style={{
        color: "rgba(0, 0, 0, 0.54)",
        fontSize: "1rem",
        position: "relative",
        marginLeft: "5px",
      }}
    >
      {correctUnit}
    </TeX>
  );
}

export function FreeResponsePreview({ question }) {
  return (
    <>
      <Prompt question={question} />
      <Divider style={questionDividerA} />

      <Box padding={3}>
        <Box
          padding="14px"
          style={{
            borderStyle: "solid",
            borderWidth: "1px",
            borderColor: "rgba(0,0,0,0.25)",
            borderRadius: "4px",
          }}
        >
          <Typography style={{ color: "rgba(0,0,0,0.38)" }}>
            {question.correctAnswer
              ? parseHTMLandTeX(question.correctAnswer.example)
              : parseHTMLandTeX(question.typicalAnswer)}
          </Typography>
        </Box>

        <Typography
          color="textSecondary"
          style={{ marginTop: "10px" }}
          align="right"
        >
          {"character limit: " + question.characterLimit}
        </Typography>
      </Box>
    </>
  );
}

export function TitleCardPreview({ question }) {
  return (
    <>
      <Box className="flex-center-all title-card-title-preview">
        {question.title === "" && (
          <Typography variant="h6" color="textSecondary">
            {"(no title entered)"}
          </Typography>
        )}
        {question.title !== "" && (
          <Typography variant="h6">
            {parseHTMLandTeX(question.title)}
          </Typography>
        )}
      </Box>
      <Box className="flex-center-all title-card-body-preview">
        {question.body === "" && (
          <Typography variant="subtitle1" color="textSecondary">
            (body)
          </Typography>
        )}
        {question.body !== "" && (
          <Typography variant="subtitle1">
            {parseHTMLandTeX(question.body)}
          </Typography>
        )}
      </Box>
    </>
  );
}

export function FileUploadPreview({ question }) {
  const acceptedFileTypes = question?.accept;
  return (
    <>
      {question.prompt === "" && (
        <Typography color="textSecondary">(no prompt entered)</Typography>
      )}
      {question.prompt !== "" && (
        <Typography variant="subtitle1">
          {parseHTMLandTeX(question.prompt)}
        </Typography>
      )}

      <Divider style={questionDividerA} />

      <Typography color="textSecondary">
        accepted file types: {makeReadable(acceptedFileTypes)}
      </Typography>
    </>
  );
}

export function InfoCardPreview({ question }) {
  return (
    <Box className="title-card-body-preview">
      {question.info === "" && (
        <Typography variant="subtitle1" color="textSecondary">
          (no info entered)
        </Typography>
      )}
      {question.info !== "" && (
        <Typography variant="subtitle1">
          {parseHTMLandTeX(question.info)}
        </Typography>
      )}
    </Box>
  );
}

export function MultipartHeaderPreview({ question }) {
  return (
    <Box className="margin-vertical-medium">
      <Typography> {parseHTMLandTeX(question.header)}</Typography>
    </Box>
  );
}
