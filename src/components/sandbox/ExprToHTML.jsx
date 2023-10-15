import { useState, useRef } from "react";
import { Box, TextField } from "@material-ui/core";
import { generateRandomCode } from "../../app/utils/utils";
import "../../app/utils/EquationEditor.css";
import parse from "html-react-parser";

export default function ExprToHTML() {
  const [value, setValue] = useState("");
  const updateExpr = (e) => setValue(() => e.target.value);
  return (
    <Box style={{ margin: "20px" }}>
      <TextField variant="outlined" onChange={updateExpr} />
      <EquationEditor value={value} />
    </Box>
  );
}

function EquationEditor(props) {
  const editorRef = useRef();
  const value = props.value;

  return (
    <Box width="200px">
      <div
        className="equation-editor"
        contentEditable
        id={"testing"}
        ref={editorRef}
        suppressContentEditableWarning
      >
        {parse(wolframExprToHTML(value))}
      </div>
    </Box>
  );
}

function wolframExprToHTML(str) {
  let newInnerHTML = typeof str === "string" ? str.slice() : str.toString();
  console.log("copy of string: " + newInnerHTML);

  const openBrktRegEx = /\[/g;
  const closeBrktRegEx = /\]/g;
  const escapeRegEx = /\\/g;

  const numOpenBrkts = newInnerHTML.match(openBrktRegEx)?.length;
  const numCloseBrkts = newInnerHTML.match(closeBrktRegEx)?.length;
  const numEscapes = newInnerHTML.match(escapeRegEx)?.length;

  if (numOpenBrkts !== numCloseBrkts) return str;

  for (let i = 0; i < numEscapes; i++) {
    const escapeIndex = newInnerHTML.indexOf("\\[");
    const openBrktIndex = escapeIndex + 1;
    const closeBrktIndex = findClosingBracketIndex(newInnerHTML, openBrktIndex);
    if (!closeBrktIndex) return newInnerHTML;

    const preText = newInnerHTML.slice(0, escapeIndex);
    const brktText = newInnerHTML.slice(openBrktIndex + 1, closeBrktIndex);
    const postText = newInnerHTML.slice(closeBrktIndex + 1);

    const symbol = getSymbol(brktText);

    console.log(preText);
    console.log(getSymbol(brktText));
    console.log(postText);

    newInnerHTML = preText + symbol + postText;
  }

  for (let i = 0; i < 1; i++) {
    const asteriskIndex = newInnerHTML.indexOf("*");

    if (newInnerHTML.charAt(asteriskIndex + 1) === "^") {
      const priorSpaceIndex =
        findPriorSpaceIndex(newInnerHTML, asteriskIndex) || 0;
      const nextSpaceIndex =
        findNextSpaceIndex(newInnerHTML, asteriskIndex) || newInnerHTML.length;

      const preText = newInnerHTML.slice(0, priorSpaceIndex);
      const base = newInnerHTML.slice(priorSpaceIndex, asteriskIndex);
      const script = newInnerHTML.slice(asteriskIndex + 2, nextSpaceIndex);
      const postText = newInnerHTML.slice(nextSpaceIndex + 1);

      const newID = generateRandomCode(8);

      const sciNotation = `<span class="sci-notation" id="${newID}"><span class="elem-base" contenteditable id="${newID}-base">${base}</span> x 10 <span class="elem-script raised" contenteditable id="${newID}-script">${script}</span></span>`;

      newInnerHTML = preText + sciNotation + postText;
    }
  }

  for (let i = 0; i < numOpenBrkts; i++) {
    const openBrktIndex = newInnerHTML.indexOf("[");
    const closeBrktIndex = findClosingBracketIndex(newInnerHTML, openBrktIndex);

    const operator = parseOperator(newInnerHTML, openBrktIndex); // check if valid operator

    if (!operator) return newInnerHTML;

    if (operator) {
      const preText = newInnerHTML.slice(0, openBrktIndex - operator.length);
      const postText = newInnerHTML.slice(closeBrktIndex + 1);
      const brktText = newInnerHTML.slice(openBrktIndex + 1, closeBrktIndex);
      const HTMLForm = getHTMLEquivalent(operator, brktText);
      newInnerHTML = preText + HTMLForm + postText;
    }
  }

  return newInnerHTML;
}

function findPriorSpaceIndex(str, startIndex) {
  console.log("lookng for prior space");
  for (let i = startIndex; i > -1; i--) {
    const char = str.charAt(i);
    console.log(char);
    if (char === " ") return i;
  }
  return null;
}

function findNextSpaceIndex(str, startIndex) {
  for (let i = startIndex; i < str.length; i++) {
    const char = str.charAt(i);
    if (char === " ") return i;
  }
  return null;
}

function findClosingBracketIndex(str, openBrktIndex) {
  console.log(str.charAt(openBrktIndex));
  let brktCount = 0;
  for (let i = openBrktIndex; i < str.length; i++) {
    const char = str.charAt(i);
    if (char === "[") brktCount++;
    if (char === "]") brktCount--;
    console.log("bracket count: " + brktCount);

    if (char === "]" && brktCount === 0) return i;
  }
  return null;
}

function parseOperator(str, openBrktIndex) {
  if (str.charAt(openBrktIndex - 1) === " ") return null;

  const operatorArr = [];
  for (let i = 1; i < 10; i++) {
    if (
      str.charAt(openBrktIndex - i) === ">" ||
      str.charAt(openBrktIndex - i) === " " ||
      str.charAt(openBrktIndex - i) === "{" ||
      str.charAt(openBrktIndex - i) === "+"
    )
      return operatorArr.reverse().join("");
    operatorArr.push(str.charAt(openBrktIndex - i));
  }
  return operatorArr.reverse().join("");
}

function getHTMLEquivalent(operator, brktText) {
  const newID = generateRandomCode(8);
  switch (operator) {
    case "Plus": {
      const args = parseArguments(brktText);
      return `${args.join("+")}`;
    }
    case "Times": {
      const args = parseArguments(brktText);
      return `${args.join(" ")}`;
    }
    case "Rational":
    case "Divide": {
      const [numerator, denominator] = parseArguments(brktText);
      return `<span class="fraction" id="${newID}"><span class="numerator" contenteditable id="${newID}-numerator">${numerator}</span><hr class="fraction-divider"/><span class="denominator" contenteditable id="${newID}-denominator">${denominator}</span></span>`;
    }
    case "Sqrt":
      return `<span class="sqrt" id="${newID}"><span class="radical">√</span><span class="radical-arg"><span class="argument" contenteditable id="${newID}-arg">${brktText}</span></span></span>`;
    case "Power": {
      const [base, power] = parseArguments(brktText);
      return `<span class="superscript" id="${newID}"><span class="elem-base" contenteditable id="${newID}-base">${base}</span><span class="elem-script raised" contenteditable id="${newID}-script">${power}</span></span>`;
    }
    case "Subscript": {
      const [base, subscript] = parseArguments(brktText);
      return `<span class="subscript" id="${newID}"><span class="elem-base" contenteditable id="${newID}-base">${base}</span><span class="elem-script lowered" contenteditable id="${newID}-script">${subscript}</span></span>`;
    }
    case "OverHat":
    case "Overhat": {
      return `<span class="overhat" id="${newID}"><span class="overhat-decoration" contenteditable="false">^</span><span class="argument" contenteditable id="${newID}-arg">${brktText}</span></span>`;
    }
    default:
      return brktText;
  }
}

function parseArguments(str) {
  const commasRegEx = /,/g;
  const openBrktRegEx = /\[/g;
  const closeBrktRegEx = /\]/g;
  const args = [];

  const numCommas = str.match(commasRegEx)?.length;
  const numOpenBrkts = str.match(openBrktRegEx)?.length;
  const numCloseBrkts = str.match(closeBrktRegEx)?.length;

  if (numCommas === 0) return [str];
  if (numCommas === 1) return str.split(",");
  if (numOpenBrkts !== numCloseBrkts) return [str];

  let brktCount = 0;
  let movingIndex = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charAt(i);
    if (char === "[") brktCount++;
    if (char === "]") brktCount--;
    if (char === "," && brktCount === 0) {
      args.push(str.slice(movingIndex, i));
      movingIndex = i + 1;
    }
  }
  if (movingIndex < str.length) args.push(str.slice(movingIndex));

  return args;
}

function getSymbol(str) {
  const foundIndex = specialChar.findIndex((el) => el.expr === str);
  if (foundIndex === -1) return str;
  return specialChar[foundIndex].symbol;
}

const specialChar = [
  { TeX: "alpha", expr: "Alpha", symbol: "α" },
  { TeX: "beta", expr: "Beta", symbol: "β" },
  { TeX: "gamma", expr: "Gamma", symbol: "γ" },
  { TeX: "delta", expr: "Delta", symbol: "δ" },
  { TeX: "epsilon", expr: "Epsilon", symbol: "ε" },
  { TeX: "zeta", expr: "Zeta", symbol: "ζ" },
  { TeX: "eta", expr: "Eta", symbol: "η" },
  { TeX: "theta", expr: "Theta", symbol: "θ" },
  { TeX: "iota", expr: "Iota", symbol: "ι" },
  { TeX: "kappa", expr: "Kappa", symbol: "κ" },
  { TeX: "lambda", expr: "Lambda", symbol: "λ" },
  { TeX: "mu", expr: "Mu", symbol: "μ" },
  { TeX: "nu", expr: "Nu", symbol: "ν" },
  { TeX: "xi", expr: "Xi", symbol: "ξ" },
  { TeX: "omicron", expr: "Omicron", symbol: "ο" },
  { TeX: "pi", expr: "Pi", symbol: "π" },
  { TeX: "rho", expr: "Rho", symbol: "ρ" },
  { TeX: "sigma", expr: "Sigma", symbol: "σ" },
  { TeX: "tau", expr: "Tau", symbol: "τ" },
  { TeX: "upsilon", expr: "Upsilon", symbol: "υ" },
  { TeX: "phi", expr: "Phi", symbol: "φ" },
  { TeX: "chi", expr: "Chi", symbol: "χ" },
  { TeX: "psi", expr: "Psi", symbol: "ψ" },
  { TeX: "omega", expr: "Omega", symbol: "ω" },

  { TeX: "Alpha", expr: "CapitalAlpha", symbol: "Α" },
  { TeX: "Beta", expr: "CapitalBeta", symbol: "Β" },
  { TeX: "Gamma", expr: "CapitalGamma", symbol: "Γ" },
  { TeX: "Delta", expr: "CapitalDelta", symbol: "Δ" },
  { TeX: "Epsilon", expr: "CapitalEpsilon", symbol: "Ε" },
  { TeX: "Zeta", expr: "CapitalZeta", symbol: "Ζ" },
  { TeX: "Eta", expr: "CapitalEta", symbol: "Η" },
  { TeX: "Theta", expr: "CapitalTheta", symbol: "Θ" },
  { TeX: "Iota", expr: "CapitalIota", symbol: "Ι" },
  { TeX: "Kappa", expr: "CapitalKappa", symbol: "Κ" },
  { TeX: "Lambda", expr: "CapitalLambda", symbol: "Λ" },
  { TeX: "Mu", expr: "CapitalMu", symbol: "Μ" },
  { TeX: "Nu", expr: "CapitalNu", symbol: "Ν" },
  { TeX: "Xi", expr: "CapitalXi", symbol: "Ξ" },
  { TeX: "Omicron", expr: "CapitalOmicron", symbol: "Ο" },
  { TeX: "Pi", expr: "CapitalPi", symbol: "Π" },
  { TeX: "Rho", expr: "CapitalRho", symbol: "Ρ" },
  { TeX: "Sigma", expr: "CapitalSigma", symbol: "Σ" },
  { TeX: "Tau", expr: "CapitalTau", symbol: "Τ" },
  { TeX: "Upsilon", expr: "CapitalUpsilon", symbol: "Υ" },
  { TeX: "Phi", expr: "CapitalPhi", symbol: "Φ" },
  { TeX: "Chi", expr: "CapitalChi", symbol: "Χ" },
  { TeX: "Psi", expr: "CapitalPsi", symbol: "Ψ" },
  { TeX: "Omega", expr: "CapitalOmega", symbol: "Ω" },
  { TeX: "times", expr: "Times", symbol: "×" },
  { TeX: "div", expr: "Divide", symbol: "÷" },
  { TeX: "degree", expr: "Degree", symbol: "°" },
  { TeX: "neq", expr: "NotEqual", symbol: "≠" },
  { TeX: "leq", expr: "LessEqual", symbol: "≤" },
  { TeX: "geq", expr: "GreaterEqual", symbol: "≥" },
  { TeX: "plusmn", expr: "PlusMinus", symbol: "±" },

  { TeX: "sum", expr: "Sum" },
  { TeX: "prod", expr: "Product" },
  { TeX: "int", expr: "Integral" },
  { TeX: "partial", expr: "PartialD" },

  { TeX: "angle", expr: "Angle", symbol: "∠" },
];
