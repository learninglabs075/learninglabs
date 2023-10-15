import { useState, useRef, useEffect } from "react";
import { Box, Button, IconButton, Paper, Tooltip } from "@material-ui/core";
import { Clear, KeyboardArrowUp, KeyboardArrowDown } from "@material-ui/icons";
import { generateRandomCode } from "../../app/utils/utils.js";
import "./EquationEditor.css";
import Draggable from "react-draggable";
import { wolframExprToHTML } from "./expressionTranslators.js";
import { parseHTMLandTeX } from "./customParsers.js";

const commonSymbols = [
  { symbol: "α", caption: "alpha" },
  { symbol: "β", caption: "beta" },
  { symbol: "γ", caption: "gamma" },
  { symbol: "δ", caption: "delta" },
  { symbol: "ε", caption: "epsilon" },
  { symbol: "η", caption: "eta" },
  { symbol: "θ", caption: "theta" },
  { symbol: "κ", caption: "kappa" },
  { symbol: "λ", caption: "lambda" },
  { symbol: "μ", caption: "mu" },
  { symbol: "ν", caption: "nu" },
  { symbol: "π", caption: "pi" },
  { symbol: "ρ", caption: "rho" },
  { symbol: "σ", caption: "sigma" },
  { symbol: "τ", caption: "tau" },
  { symbol: "ϕ", caption: "phi" },
  { symbol: "χ", caption: "chi" },
  { symbol: "ψ", caption: "psi" },
  { symbol: "ω", caption: "omega" },
  { symbol: "Γ", caption: "Gamma" },
  { symbol: "Δ", caption: "Delta" },
  { symbol: "Φ", caption: "Phi" },
  { symbol: "Ψ", caption: "Psi" },
  { symbol: "Ω", caption: "Omega" },
  { symbol: "±", caption: "plus / minus" },
  { symbol: "°", caption: "degree" },
  { symbol: "𝕚", caption: "imaginary number" },
  { symbol: "∞", caption: "infinity" },
];

const greekLowercase = [
  { symbol: "α", caption: "alpha" },
  { symbol: "β", caption: "beta" },
  { symbol: "γ", caption: "gamma" },
  { symbol: "δ", caption: "delta" },
  { symbol: "ε", caption: "epsilon" },
  { symbol: "ζ", caption: "zeta" },
  { symbol: "η", caption: "eta" },
  { symbol: "θ", caption: "theta" },
  { symbol: "ι", caption: "iota" },
  { symbol: "κ", caption: "kappa" },
  { symbol: "λ", caption: "lambda" },
  { symbol: "μ", caption: "mu" },
  { symbol: "ν", caption: "nu" },
  { symbol: "ξ", caption: "xi" },
  { symbol: "ο", caption: "omicron" },
  { symbol: "π", caption: "pi" },
  { symbol: "ρ", caption: "rho" },
  { symbol: "σ", caption: "sigma" },
  { symbol: "τ", caption: "tau" },
  { symbol: "υ", caption: "upsilon" },
  { symbol: "ϕ", caption: "phi" },
  { symbol: "χ", caption: "chi" },
  { symbol: "ψ", caption: "psi" },
  { symbol: "ω", caption: "omega" },
];

const greekUppercase = [
  { symbol: "Α", caption: "Alpha" },
  { symbol: "Β", caption: "Beta" },
  { symbol: "Γ", caption: "Gamma" },
  { symbol: "Δ", caption: "Delta" },
  { symbol: "Ε", caption: "Epsilon" },
  { symbol: "Ζ", caption: "Zeta" },
  { symbol: "Η", caption: "Eta" },
  { symbol: "Θ", caption: "Theta" },
  { symbol: "Ι", caption: "Iota" },
  { symbol: "Κ", caption: "Kappa" },
  { symbol: "Λ", caption: "Lambda" },
  { symbol: "Μ", caption: "Mu" },
  { symbol: "Ν", caption: "Nu" },
  { symbol: "Ξ", caption: "Xi" },
  { symbol: "Ο", caption: "Omicron" },
  { symbol: "Π", caption: "Pi" },
  { symbol: "Ρ", caption: "Rho" },
  { symbol: "Σ", caption: "Sigma" },
  { symbol: "Τ", caption: "Tau" },
  { symbol: "Υ", caption: "Upsilon" },
  { symbol: "Φ", caption: "Phi" },
  { symbol: "Χ", caption: "Chi" },
  { symbol: "Ψ", caption: "Psi" },
  { symbol: "Ω", caption: "Omega" },
];

const mathSymbols = [
  { symbol: "±", caption: "plus / minus" },
  { symbol: "∓", caption: "minus / plus" },
  { symbol: "°", caption: "degree" },
  { symbol: "𝕚", caption: "imaginary number" },
  { symbol: "∞", caption: "infinity" },
  { symbol: "∇", caption: "gradient" },
  // { symbol: "∂", caption: "partial dervative" },
];

const extraSymbols = [
  {
    symbol: parseHTMLandTeX(`μ<sub class="lowered-v2">0</sub>`),
    caption: "permeability of free space",
    base: "μ",
    script: "0",
  },
  {
    symbol: parseHTMLandTeX(`ε<sub class="lowered-v2">0</sub>`),
    caption: "vacuum permitivity",
    base: "ε",
    script: "0",
  },
];

export default function EquationEditor(props) {
  const fieldname = props.fieldname;
  const id = props.id;
  const label = props.label;
  const question = props.question;
  const initVal = props.initVal;
  const setFieldValue = props.setFieldValue;

  const [palletteOpen, setPalletteOpen] = useState(false);
  const [seeAllSymbols, setSeeAllSymbols] = useState(false);

  const editorRef = useRef();

  useEffect(() => {
    // reset editor innerHTML every time user navigates to different question
    if (!editorRef.current) return;
    if (!initVal) {
      editorRef.current.innerHTML = "";
    } else {
      editorRef.current.innerHTML = wolframExprToHTML(initVal) || "";
    }
  }, [question?.id, initVal]);

  if (!id) return "Equation Editor component requires an id prop";

  const InsertParentheses = () => (
    <Tooltip title="parentheses">
      <Button id="insert" onClick={(e) => insertNewElement("parentheses")}>
        <span
          className="parentheses-btn"
          style={{ position: "relative", bottom: "5px" }}
        >
          (
          <span
            className="argument-btn"
            style={{ position: "relative", top: "6px" }}
          />
          )
        </span>
      </Button>
    </Tooltip>
  );

  const InsertSuperscript = () => (
    <Tooltip title="power / superscript">
      <Button id="insert" onClick={() => insertNewElement("superscript")}>
        <span className="superscript">
          <span className="elem-base-btn" />
          <span className="elem-script-btn raised" />
        </span>
      </Button>
    </Tooltip>
  );

  const InsertSubscript = () => (
    <Tooltip title="subscript">
      <Button id="insert" onClick={() => insertNewElement("subscript")}>
        <span className="subscript">
          <span
            className="elem-base-btn"
            style={{ position: "relative", top: "2px" }}
          />
          <span className="elem-script-btn lowered" />
        </span>
      </Button>
    </Tooltip>
  );

  const InsertFraction = () => (
    <Tooltip title="fraction">
      <Button id="insert" onClick={() => insertNewElement("fraction")}>
        <div className="fraction">
          <span className="numerator-btn" />
          <hr className="fraction-divider" />
          <span className="denominator-btn" />
        </div>
      </Button>
    </Tooltip>
  );

  const InsertSquareRoot = () => (
    <Tooltip title="square root">
      <Button id="insert" onClick={() => insertNewElement("sqrt")}>
        <span className="radical-btn">√</span>
        <span className="radical-arg-btn">
          <span className="argument-btn" />
        </span>
      </Button>
    </Tooltip>
  );

  const InsertSciNotation = () => (
    <Tooltip title="scientific notation">
      <Button id="insert" onClick={() => insertNewElement("sci-notation")}>
        <span className="elem-base-btn" />
        <span style={{ fontSize: "16px", color: "gray", fontWeight: 300 }}>
          ×10
        </span>
        <span
          className="elem-script-btn"
          style={{ position: "relative", bottom: "6px", left: "1px" }}
        />
      </Button>
    </Tooltip>
  );

  const InsertOverhat = () => (
    <Tooltip title="unit vector">
      <Button id="insert" onClick={() => insertNewElement("overhat")}>
        <span
          className="overhat"
          style={{
            position: "relative",
            bottom: "6px",
          }}
        >
          <span className="overhat-decoration">^</span>
          <span className="argument-btn" />
        </span>
      </Button>
    </Tooltip>
  );

  const InsertChemSymbol = () => (
    <Tooltip title="chemical symbol">
      <Button id="insert" onClick={() => insertNewElement("chem-symbol")}>
        <div style={{ width: "18px" }}>
          <span className="isotope-num-btn" />
          <span className="atomic-num-btn" />
        </div>
        <span className="elem-base-btn" />
        <span className="elem-script-btn ion-charge-btn" />
      </Button>
    </Tooltip>
  );

  const InsertExponential = () => (
    <Tooltip title="exponential">
      <Button
        id="insert"
        onClick={() => insertNewElement("exponential")}
        style={{
          fontSize: "16px",
          color: "gray",
          fontWeight: 300,
          textTransform: "none",
        }}
      >
        <span className="exponential">
          <span className="exp-decoration">e</span>
          <span className="elem-script-btn raised" />
        </span>
      </Button>
    </Tooltip>
  );

  const InsertSine = () => (
    <Button
      id="insert"
      onClick={(e) => insertNewElement("sine")}
      style={{ textTransform: "none" }}
    >
      <span className="sine-btn">
        sin(
        <span className="argument-btn relative" style={{ top: "5px" }} />)
      </span>
    </Button>
  );

  const InsertCosine = () => (
    <Button
      id="insert"
      onClick={(e) => insertNewElement("cosine")}
      style={{ textTransform: "none" }}
    >
      <span className="cosine-btn">
        cos(
        <span className="argument-btn relative" style={{ top: "5px" }} />)
      </span>
    </Button>
  );

  const InsertTangent = () => (
    <Button
      id="insert"
      onClick={(e) => insertNewElement("tangent")}
      style={{ textTransform: "none" }}
    >
      <span className="tangent-btn">
        tan(
        <span className="argument-btn relative" style={{ top: "5px" }} />)
      </span>
    </Button>
  );

  const InsertArcTangent = () => (
    <Button
      id="insert"
      onClick={(e) => insertNewElement("arctangent")}
      style={{ textTransform: "none" }}
    >
      <span className="tangent-btn">
        tan<sup>-1</sup>(
        <span className="argument-btn relative" style={{ top: "5px" }} />)
      </span>
    </Button>
  );

  function insertSymbol(char) {
    const selection = window.getSelection();
    if (!selection) return;

    const node = selection.anchorNode;
    if (!node) return;

    // prevent DOM mutation if selection is not in a contentEditable element
    if (node.nodeType === 1 && !node.contentEditable) return;

    if (
      node.nodeType === 3 &&
      (!node.parentElement.contentEditable ||
        node.parentElement.contentEditable === "inherit")
    )
      return;

    if (node.nodeType === 1) {
      //add new text node if element is empty
      node.innerText = node.innerText + char;
      const rangeobj = document.createRange();
      const selectobj = window.getSelection();
      rangeobj.setStart(node, 0);
      rangeobj.setEnd(node, 1);
      rangeobj.collapse(false);
      selectobj.removeAllRanges();
      selectobj.addRange(rangeobj);
    }

    //insert character if element already has text
    if (node.nodeType === 3) {
      const caretStart = selection.anchorOffset;
      const caretEnd = selection.focusOffset;
      const selectionRange = caretEnd - caretStart;
      const preSelection =
        selectionRange >= 0
          ? node.nodeValue?.slice(0, caretStart)
          : node.nodeValue?.slice(0, caretEnd);
      const postSelection =
        selectionRange >= 0
          ? node.nodeValue?.slice(caretEnd)
          : node.nodeValue?.slice(caretStart);

      const newValue = preSelection + char + postSelection;
      node.nodeValue = newValue;
      selectionRange >= 0
        ? selection.collapse(node, caretStart + 1)
        : selection.collapse(node, caretEnd + 1);
    }
  }

  function getParenthesesText(node, exprType) {
    const argNode = document.getElementById(`${node.id}-arg`);
    const argTextArray = [];
    argNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && argTextArray.push(nestedElemText);
    });

    const argText = argTextArray.join(" ").trim();
    return "(" + argText + ")";
  }

  function getSuperscriptText(node, exprType) {
    const baseNode = document.getElementById(`${node.id}-base`);
    const scriptNode = document.getElementById(`${node.id}-script`);
    const baseTextArray = [];
    const scriptTextArray = [];

    baseNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && baseTextArray.push(nestedElemText);
    });

    scriptNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && scriptTextArray.push(nestedElemText);
    });

    const baseText = baseTextArray.join(" ").trim();
    const scriptText = scriptTextArray.join(" ").trim();

    if (exprType === "laTeX") return `{${baseText}}^{${scriptText}}`;
    if (exprType === "mathematica") return `Power[${baseText},${scriptText}]`;
  }

  function getExponentialText(node, exprType) {
    const scriptNode = document.getElementById(`${node.id}-script`);
    const scriptTextArray = [];
    scriptNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && scriptTextArray.push(nestedElemText);
    });
    const scriptText = scriptTextArray.join(" ").trim();
    if (exprType === "laTeX") return `e^{${scriptText}}`;
    if (exprType === "mathematica") return `Exp[${scriptText}]`;
  }

  function getSubscriptText(node, exprType) {
    const baseNode = document.getElementById(`${node.id}-base`);
    const scriptNode = document.getElementById(`${node.id}-script`);

    const baseTextArray = [];
    const scriptTextArray = [];

    baseNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && baseTextArray.push(nestedElemText);
    });

    scriptNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && scriptTextArray.push(nestedElemText);
    });

    const baseText = baseTextArray.join(" ").trim();
    const scriptText = scriptTextArray.join(" ").trim();

    if (exprType === "laTeX") return `{${baseText}}_{${scriptText}}`;
    if (exprType === "mathematica")
      return `Subscript[${baseText},${scriptText}]`;
  }

  function getFractionText(node, exprType) {
    const numerNode = document.getElementById(`${node.id}-numerator`);
    const denomNode = document.getElementById(`${node.id}-denominator`);

    const numerTextArray = [];
    const denomTextArray = [];

    numerNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && numerTextArray.push(nestedElemText);
    });

    denomNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && denomTextArray.push(nestedElemText);
    });

    const denomText = denomTextArray.join(" ").trim();
    const numerText = numerTextArray.join(" ").trim();

    if (exprType === "laTeX") return `\\frac{${numerText}}{${denomText}}`;
    if (exprType === "mathematica") return `Divide[${numerText},${denomText}]`;
  }

  function getSqrtText(node, exprType) {
    const argNode = document.getElementById(`${node.id}-arg`);
    const argTextArray = [];

    argNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && argTextArray.push(nestedElemText);
    });
    const argText = argTextArray.join(" ").trim();
    if (exprType === "laTeX") return `\\sqrt{${argText}}`;
    if (exprType === "mathematica") return `Sqrt[${argText}]`;
  }

  function getSciNotationText(node, exprType) {
    const baseNode = document.getElementById(`${node.id}-base`);
    const scriptNode = document.getElementById(`${node.id}-script`);

    const baseTextArray = [];
    const scriptTextArray = [];

    baseNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && baseTextArray.push(nestedElemText);
    });

    scriptNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && scriptTextArray.push(nestedElemText);
    });

    const baseText = baseTextArray.join(" ").trim();
    const scriptText = scriptTextArray.join(" ").trim();
    if (exprType === "laTeX") return `${baseText} \\times 10^{${scriptText}}`;
    if (exprType === "mathematica") return `${baseText}*^${scriptText}`;
  }

  function getChemSymbolText(node, exprType) {
    const baseNode = document.getElementById(`${node.id}-base`);
    const scriptNode = document.getElementById(`${node.id}-script`);
    const atomicNumNode = document.getElementById(`${node.id}-atomic-num`);
    const isotopeNumNode = document.getElementById(`${node.id}-isotope-num`);

    const baseTextArray = [];
    const scriptTextArray = [];
    const isotopeTextArray = [];
    const atomicTextArray = [];

    baseNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && baseTextArray.push(nestedElemText);
    });

    scriptNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && scriptTextArray.push(nestedElemText);
    });

    isotopeNumNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && isotopeTextArray.push(nestedElemText);
    });

    atomicNumNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && atomicTextArray.push(nestedElemText);
    });

    const baseText = baseTextArray.join(" ").trim();
    const scriptText = scriptTextArray.join(" ").trim();
    const isotopeText = isotopeTextArray.join(" ").trim();
    const atomicNumText = atomicTextArray.join(" ").trim();

    if (exprType === "mathematica")
      return `chemSymbol[${atomicNumText},${isotopeText},${baseText},${scriptText}]`;
  }

  function getOverhatText(node, exprType) {
    const argNode = document.getElementById(`${node.id}-arg`);
    const argTextArray = [];
    argNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && argTextArray.push(nestedElemText);
    });

    const argText = argTextArray.join(" ").trim();
    if (exprType === "laTeX") return `\\hat{${argText}}`;
    if (exprType === "mathematica") return `OverHat[${argText}]`;
  }

  function getSineText(node, exprType) {
    const argNode = document.getElementById(`${node.id}-arg`);
    const argTextArray = [];
    argNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && argTextArray.push(nestedElemText);
    });

    const argText = argTextArray.join(" ").trim();
    if (exprType === "laTeX") return `sin(${argText})`;
    if (exprType === "mathematica") return `Sin[${argText}]`;
  }

  function getCosineText(node, exprType) {
    const argNode = document.getElementById(`${node.id}-arg`);
    const argTextArray = [];
    argNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && argTextArray.push(nestedElemText);
    });

    const argText = argTextArray.join(" ").trim();
    if (exprType === "laTeX") return `cos(${argText})`;
    if (exprType === "mathematica") return `Cos[${argText}]`;
  }

  function getTangentText(node, exprType) {
    const argNode = document.getElementById(`${node.id}-arg`);
    const argTextArray = [];
    argNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && argTextArray.push(nestedElemText);
    });

    const argText = argTextArray.join(" ").trim();
    if (exprType === "laTeX") return `tan(${argText})`;
    if (exprType === "mathematica") return `Tan[${argText}]`;
  }

  function getArcTangentText(node, exprType) {
    const argNode = document.getElementById(`${node.id}-arg`);
    const argTextArray = [];
    argNode?.childNodes.forEach((childNode) => {
      const nestedElemText = getExprArr(childNode, exprType);
      nestedElemText && argTextArray.push(nestedElemText);
    });

    const argText = argTextArray.join(" ").trim();
    if (exprType === "laTeX") return `tan(${argText})`;
    if (exprType === "mathematica") return `ArcTan[${argText}]`;
  }

  function getExprArr(node, exprType) {
    if (node.nodeType === 3) return node.nodeValue.trim(); // text node

    switch (node.className) {
      case "parentheses":
        return getParenthesesText(node, exprType);
      case "superscript":
        return getSuperscriptText(node, exprType);
      case "subscript":
        return getSubscriptText(node, exprType);
      case "fraction":
        return getFractionText(node, exprType);
      case "sqrt":
        return getSqrtText(node, exprType);
      case "sci-notation":
        return getSciNotationText(node, exprType);
      case "overhat":
        return getOverhatText(node, exprType);
      case "exponential":
        return getExponentialText(node, exprType);
      case "chem-symbol":
        return getChemSymbolText(node, exprType);
      case "sine":
        return getSineText(node, exprType);
      case "cosine":
        return getCosineText(node, exprType);
      case "tangent":
        return getTangentText(node, exprType);
      case "arctangent":
        return getArcTangentText(node, exprType);
      default:
        return null;
    }
  }

  function updateExpressions() {
    const editorNode = document.getElementById(id);
    const childNodes = Array.from(editorNode.childNodes);
    // const laTeXArr = childNodes.map((node) => getExprArr(node, "laTeX"));
    const mathematicaArr = childNodes.map((node) =>
      getExprArr(node, "mathematica")
    );
    setFieldValue(fieldname, mathematicaArr.join(" "));
    // setLaTeXExpr(() => laTeXArr.join(" "));
    // setMathematicaExpr(() => mathematicaArr.join(" "));
  }

  return (
    <>
      <Box className="label">{label}</Box>
      <div
        className="equation-editor"
        contentEditable
        id={id}
        onBlur={(e) => {
          if (e.relatedTarget?.className === "equation-editor")
            setPalletteOpen(false);
        }}
        onFocus={(e) => {
          setSeeAllSymbols(false);
          setPalletteOpen(true);
          e.preventDefault();
          const endChar = e.target.innerHTML.slice(-1);
          const startChar = e.target.innerHTML.slice(0, 1);
          if (endChar === ">")
            e.target.innerHTML = e.target.innerHTML + "&nbsp;";

          if (startChar === "<")
            e.target.innerHTML = "&nbsp;" + e.target.innerHTML;
        }}
        onKeyUp={(e) => updateExpressions()}
        ref={editorRef}
        suppressContentEditableWarning
      ></div>

      <Box className="clear">
        <Button
          onClick={() => {
            editorRef.current.innerHTML = "";
            setFieldValue(fieldname, "");
            // setLaTeXExpr(() => "");
            // setMathematicaExpr(() => "");
          }}
        >
          Clear
        </Button>
      </Box>

      {/* <Box style={{ padding: "20px", fontFamily: "Lato" }}>
        <div>{"laTeX expression: " + laTeXExpr}</div>
        <div>{"mathematica expression: " + mathematicaExpr}</div>
      </Box> */}
      {palletteOpen && (
        <Draggable start={{ top: "10px", right: 10 }}>
          <Paper elevation={0} className="pallette">
            <Box className="absolute" style={{ top: "0px", right: "0px" }}>
              <IconButton
                variant="contained"
                style={{ color: "rgb(184,184,184)" }}
                onClick={() => setPalletteOpen(false)}
                size="small"
              >
                <Clear />
              </IconButton>
            </Box>
            <Box className="template-container">
              <InsertParentheses />
              <InsertSuperscript />
              <InsertSubscript />
              <InsertFraction />
              <InsertChemSymbol />
            </Box>
            <Box className="template-container">
              <InsertSquareRoot />
              <InsertSciNotation />
              <InsertExponential />
              <InsertOverhat />
            </Box>
            <Box className="template-container">
              <InsertSine />
              <InsertCosine />
              <InsertTangent />
              <InsertArcTangent />
            </Box>

            {!seeAllSymbols && (
              <>
                <Box className="margin-vertical-light symbol-btns">
                  {commonSymbols.map((el, ind) => (
                    <Tooltip key={`commonSymbols${ind}`} title={el.caption}>
                      <Button
                        variant="outlined"
                        style={{
                          textTransform: "none",
                          minWidth: "45px",
                          fontFamily: "Lato",
                        }}
                        onClick={() => {
                          insertSymbol(el.symbol);
                          updateExpressions();
                        }}
                      >
                        {el.symbol}
                      </Button>
                    </Tooltip>
                  ))}
                </Box>
                <Button
                  onClick={() => setSeeAllSymbols(true)}
                  startIcon={
                    <KeyboardArrowDown style={{ color: "rgb(184,184,184)" }} />
                  }
                >
                  more symbols
                </Button>
              </>
            )}

            {seeAllSymbols && (
              <>
                <Box className="margin-vertical-light symbol-btns">
                  {greekLowercase.map((el, ind) => (
                    <Tooltip key={`greekLowercase${ind}`} title={el.caption}>
                      <Button
                        variant="outlined"
                        style={{
                          textTransform: "none",
                          minWidth: "45px",
                          fontFamily: "Lato",
                        }}
                        onClick={() => {
                          insertSymbol(el.symbol);
                          updateExpressions();
                        }}
                      >
                        {el.symbol}
                      </Button>
                    </Tooltip>
                  ))}
                </Box>
                <Box className="margin-vertical-light symbol-btns">
                  {greekUppercase.map((el, ind) => (
                    <Tooltip key={`greekUpercase${ind}`} title={el.caption}>
                      <Button
                        variant="outlined"
                        style={{
                          textTransform: "none",
                          minWidth: "45px",
                          fontFamily: "Lato",
                        }}
                        onClick={() => {
                          insertSymbol(el.symbol);
                          updateExpressions();
                        }}
                      >
                        {el.symbol}
                      </Button>
                    </Tooltip>
                  ))}
                </Box>
                <Box className="margin-vertical-light symbol-btns">
                  {mathSymbols.map((el, ind) => (
                    <Tooltip key={`mathSymbol${ind}`} title={el.caption}>
                      <Button
                        variant="outlined"
                        style={{
                          textTransform: "none",
                          minWidth: "45px",
                          fontFamily: "Lato",
                        }}
                        onClick={() => {
                          insertSymbol(el.symbol);
                          updateExpressions();
                        }}
                      >
                        {el.symbol}
                      </Button>
                    </Tooltip>
                  ))}
                  {extraSymbols.map((el, ind) => (
                    <Tooltip key={`extraSymbol${ind}`} title={el.caption}>
                      <Button
                        variant="outlined"
                        style={{
                          textTransform: "none",
                          minWidth: "45px",
                          fontFamily: "Lato",
                        }}
                        onClick={() => {
                          insertSymbolWithTemplate(
                            "subscript",
                            el.base,
                            el.script
                          );
                          updateExpressions();
                          setSeeAllSymbols(true);
                        }}
                      >
                        {el.symbol}
                      </Button>
                    </Tooltip>
                  ))}
                </Box>
                <Button
                  onClick={() => setSeeAllSymbols(false)}
                  startIcon={
                    <KeyboardArrowUp style={{ color: "rgb(184,184,184)" }} />
                  }
                >
                  fewer symbols
                </Button>
              </>
            )}
          </Paper>
        </Draggable>
      )}
    </>
  );
}

function insertNewElement(className) {
  const selection = window.getSelection();
  if (!selection) return;

  const node = selection?.anchorNode;
  if (!node) return;

  // prevent DOM mutation if selection is not in a contentEditable element
  if (node.nodeType === 1 && !node.contentEditable) return;

  if (
    node.nodeType === 3 &&
    (!node.parentElement.contentEditable ||
      node.parentElement.contentEditable === "inherit")
  )
    return;

  const range = window.getSelection()?.getRangeAt(0);
  const newElement = document.createElement("span");
  const newID = generateRandomCode(8);
  newElement.className = className;
  newElement.contentEditable = false;
  newElement.id = newID;
  newElement.innerHTML = getInnerHTML(className, newID);
  range.deleteContents(); // delete selected range
  range.insertNode(newElement);
  setFocusToNewElement(className, newID);
}

function insertSymbolWithTemplate(className, base, script) {
  const selection = window.getSelection();
  if (!selection) return;

  const node = selection?.anchorNode;
  if (!node) return;

  // prevent DOM mutation if selection is not in a contentEditable element
  if (node.nodeType === 1 && !node.contentEditable) return;

  if (
    node.nodeType === 3 &&
    (!node.parentElement.contentEditable ||
      node.parentElement.contentEditable === "inherit")
  )
    return;

  const range = window.getSelection()?.getRangeAt(0);
  const newElement = document.createElement("span");
  const newID = generateRandomCode(8);
  newElement.className = className;
  newElement.contentEditable = false;
  newElement.id = newID;
  newElement.innerHTML = `<span class="elem-base" contenteditable id="${newID}-base">${base}</span><span class="elem-script lowered" contenteditable id="${newID}-script">${script}</span>`;

  range.deleteContents(); // delete selected range
  range.insertNode(newElement);
  setFocusToNewElement(className, newID);
}

function setFocusToNewElement(className, newID) {
  switch (className) {
    case "parentheses":
    case "sqrt":
    case "overhat":
    case "sine":
    case "cosine":
    case "tangent":
    case "arctangent":
      document.getElementById(`${newID}-arg`).focus();
      break;
    case "superscript":
    case "subscript":
    case "sci-notation":
      document.getElementById(`${newID}-base`).focus();
      break;
    case "fraction":
      document.getElementById(`${newID}-numerator`).focus();
      break;
    case "exponential":
      document.getElementById(`${newID}-script`).focus();
      break;
    case "chem-symbol":
      document.getElementById(`${newID}-base`).focus();
      break;
    default:
      break;
  }
}

function getInnerHTML(className, newID) {
  switch (className) {
    case "parentheses":
      return `(<span class="argument" contenteditable id="${newID}-arg"></span>)`;
    case "superscript":
      return `<span class="elem-base" contenteditable id="${newID}-base"></span><span class="elem-script raised" contenteditable id="${newID}-script"></span>`;
    case "subscript":
      return `<span class="elem-base" contenteditable id="${newID}-base"></span><span class="elem-script lowered" contenteditable id="${newID}-script"></span>`;
    case "fraction":
      return `<span class="numerator" contenteditable id="${newID}-numerator"></span><hr class="fraction-divider"/><span class="denominator" contenteditable id="${newID}-denominator"></span>`;
    case "sqrt":
      return `<span class="radical">√</span><span class="radical-arg"><span class="argument" contenteditable id="${newID}-arg"></span></span>`;
    case "sci-notation":
      return `<span class="elem-base" contenteditable id="${newID}-base"></span> x 10 <span class="elem-script raised" contenteditable id="${newID}-script"></span>`;
    case "overhat":
      return `<span class="overhat-decoration" contenteditable="false">^</span><span class="argument" contenteditable id="${newID}-arg"></span>`;
    case "exponential":
      return `<span class="exp-decoration">e</span><span class="elem-script raised" contenteditable id="${newID}-script"></span>`;
    case "sine":
      return `sin(<span class="argument" contenteditable id="${newID}-arg"></span>)`;
    case "cosine":
      return `cos(<span class="argument" contenteditable id="${newID}-arg"></span>)`;
    case "tangent":
      return `tan(<span class="argument" contenteditable id="${newID}-arg"></span>)`;
    case "arctangent":
      return `tan<sup>-1</sup>(<span class="argument" contenteditable id="${newID}-arg"></span>)`;
    case "chem-symbol":
      return `<span class="chem-symbol-left-container"><span class="isotope-num" contenteditable id="${newID}-isotope-num"></span><span class="atomic-num" contenteditable id="${newID}-atomic-num"></span></span><span class="elem-base" contenteditable id="${newID}-base"></span><span class="elem-script ion-charge" contenteditable id="${newID}-script"></span>`;
    default:
      break;
  }
}
