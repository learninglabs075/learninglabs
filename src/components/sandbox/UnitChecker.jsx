import EquationEditor from "../../app/utils/EquationEditor.jsx";
import { Box, Button, Divider, Typography } from "@material-ui/core";
import { useState } from "react";

export default function UnitChecker() {
  const [laTeXExpr1, setLaTeXExpr1] = useState("");
  const [mathematicaExpr1, setMathematicaExpr1] = useState("");
  const [laTeXExpr2, setLaTeXExpr2] = useState("");
  const [mathematicaExpr2, setMathematicaExpr2] = useState("");

  return (
    <Box className="overflow-auto">
      <Typography
        variant="h5"
        style={{ marginLeft: "20px", marginTop: "30px" }}
      >
        Student Response
      </Typography>
      <EquationEditor
        name="editor-field-1"
        laTeXExpr={laTeXExpr1}
        mathematicaExpr={mathematicaExpr1}
        setLaTeXExpr={setLaTeXExpr1}
        setMathematicaExpr={setMathematicaExpr1}
      />
      <Divider />
      <Typography
        variant="h5"
        style={{ marginLeft: "20px", marginTop: "30px" }}
      >
        Correct Response
      </Typography>
      <EquationEditor
        name="editor-field-2"
        laTeXExpr={laTeXExpr2}
        mathematicaExpr={mathematicaExpr2}
        setLaTeXExpr={setLaTeXExpr2}
        setMathematicaExpr={setMathematicaExpr2}
      />
      <Box style={{ float: "right" }}>
        <Button
          onClick={() =>
            gradeUnitsUsingMathematica(mathematicaExpr1, mathematicaExpr2)
          }
          style={{ backgroundColor: "#46ACC3" }}
          variant="contained"
        >
          Send To Mathematica
        </Button>
      </Box>
    </Box>
  );
}

function gradeUnitsUsingMathematica(mathematicaExpr1, mathematicaExpr2) {
  //   const studentVal = encodeURIComponent(response.number);
  //   const studentUnit = encodeURIComponent(response.unit);
  //   const correctVal = encodeURIComponent(question.correctNumber);
  //   const correctUnit = encodeURIComponent(question.correctUnit);
  //   const percentTolerance = encodeURIComponent(question.percentTolerance);

  const question = { subtype: "unit" };
  const studentUnit = encodeURIComponent(mathematicaExpr1);
  const correctUnit = encodeURIComponent(mathematicaExpr2);

  const request = require("request");
  const options = {
    method: "GET",
    url: chooseMathematicaURL(question.subtype),
  };

  console.log("request sent to: " + chooseMathematicaURL(question.subtype));

  console.log(
    `Sent to mathematica.... studentunit: ${studentUnit}, correctunit: ${correctUnit}`
  );

  options.url =
    options.url + `studentunit=${studentUnit}&correctunit=${correctUnit}`;

  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (response) {
        console.log(`response from mathematica: ${response.body}`);
        resolve(response.body);
      } else if (error) {
        console.log(error);
        reject(error);
      }
    });
  });
}

function chooseMathematicaURL(subtype) {
  switch (subtype) {
    case "unit":
      return "https://www.wolframcloud.com/obj/ptaborek/unitChecker?";
    case "number":
      return "https://www.wolframcloud.com/obj/ptaborek/valueOnlyGradingFunc?";
    case "symbolic":
      return "https://www.wolframcloud.com/obj/ptaborek/symbolicGradingFunc?";
    case "mathematica expression":
      return "https://www.wolframcloud.com/obj/ptaborek/MMAGradingFunc?";
    case "measurement":
      return "https://www.wolframcloud.com/obj/ptaborek/valueUnitGradingFunc?";
    case "measurement with feedback":
      return "https://www.wolframcloud.com/obj/ptaborek/gradeMeasurementFB?";
    case "expr with rule":
      return "https://www.wolframcloud.com/obj/ptaborek/gradeMeasurementFB?"; //TODO - update this url
    case "vector":
      return "https://www.wolframcloud.com/obj/ptaborek/vecsGradingFunc?";
    case "vector symbolic":
      return "https://www.wolframcloud.com/obj/ptaborek/symbolicVecGradingFunc?";
    case "vector with unit":
      return "https://www.wolframcloud.com/obj/ptaborek/vecsWunitsGradingFunc?";
    default:
      break;
  }
}
