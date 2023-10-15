import { generateRandomCode } from "./utils";

export function wolframExprToHTML(str) {
  let newInnerHTML = typeof str === "string" ? str.slice() : str.toString();

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

  // handle scientific notation
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

export function wolframExprToTeX(str) {
  let TeXExpr = typeof str === "string" ? str.slice() : str.toString();
  TeXExpr = TeXExpr.replaceAll("Pi", "π");
  TeXExpr = TeXExpr.replaceAll("Infinity", "\\infty");

  const openBrktRegEx = /\[/g;
  const closeBrktRegEx = /\]/g;
  const escapeRegEx = /\\/g;

  const numOpenBrkts = TeXExpr.match(openBrktRegEx)?.length;
  const numCloseBrkts = TeXExpr.match(closeBrktRegEx)?.length;
  const numEscapes = TeXExpr.match(escapeRegEx)?.length;

  if (numOpenBrkts !== numCloseBrkts) return str;

  // convert special chracters to TeX
  for (let i = 0; i < numEscapes; i++) {
    const escapeIndex = TeXExpr.indexOf("\\[");
    const openBrktIndex = escapeIndex + 1;
    const closeBrktIndex = findClosingBracketIndex(TeXExpr, openBrktIndex);
    if (!closeBrktIndex) return TeXExpr;

    const preText = TeXExpr.slice(0, escapeIndex);
    const brktText = TeXExpr.slice(openBrktIndex + 1, closeBrktIndex);
    const postText = TeXExpr.slice(closeBrktIndex + 1);

    const TeXForm = getTeXChar(brktText);

    TeXExpr = preText + TeXForm + postText;
  }

  // convert scientific notation to TeX
  for (let i = 0; i < 5; i++) {
    const asteriskIndex = TeXExpr.indexOf("*");

    if (TeXExpr.charAt(asteriskIndex + 1) === "^") {
      const priorSpaceIndex = findPriorSpaceIndex(TeXExpr, asteriskIndex) || 0;
      const nextSpaceIndex =
        findNextSpaceIndex(TeXExpr, asteriskIndex) || TeXExpr.length;

      const preText = TeXExpr.slice(0, priorSpaceIndex);
      const base = TeXExpr.slice(priorSpaceIndex, asteriskIndex);
      const script = TeXExpr.slice(asteriskIndex + 2, nextSpaceIndex);
      const postText = TeXExpr.slice(nextSpaceIndex + 1);

      const sciNotation = `${base} \\times 10^{${script}} `;

      TeXExpr = preText + sciNotation + postText;
    }
  }

  for (let i = 0; i < numOpenBrkts; i++) {
    const openBrktIndex = TeXExpr.indexOf("[");
    const closeBrktIndex = findClosingBracketIndex(TeXExpr, openBrktIndex);

    const operator = parseOperator(TeXExpr, openBrktIndex); // check if valid operator

    if (!operator) return TeXExpr;

    if (operator) {
      const preText = TeXExpr.slice(0, openBrktIndex - operator.length);
      const postText = TeXExpr.slice(closeBrktIndex + 1);
      const brktText = TeXExpr.slice(openBrktIndex + 1, closeBrktIndex);
      const TeXForm = getTeXEquivalent(operator, brktText);
      TeXExpr = preText + TeXForm + postText;
    }

    console.log(TeXExpr);
    TeXExpr = TeXExpr.replace("+ −", "−");
  }

  return TeXExpr;
}

function findClosingBracketIndex(str, openBrktIndex) {
  let brktCount = 0;
  for (let i = openBrktIndex; i < str.length; i++) {
    const char = str.charAt(i);
    if (char === "[") brktCount++;
    if (char === "]") brktCount--;

    if (char === "]" && brktCount === 0) return i;
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

function findPriorSpaceIndex(str, startIndex) {
  for (let i = startIndex; i > -1; i--) {
    const char = str.charAt(i);
    if (char === " ") return i;
  }
  return null;
}

function getSymbol(str) {
  const foundIndex = specialChar.findIndex((el) => el.expr === str);
  if (foundIndex === -1) return str;
  return specialChar[foundIndex].symbol;
}

function getTeXChar(str) {
  const foundIndex = specialChar.findIndex((el) => el.expr === str);
  if (foundIndex === -1) return str;
  return `\\${specialChar[foundIndex].TeX}`;
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
      return `<span class="fraction" contenteditable="false" id="${newID}"><span class="numerator" contenteditable id="${newID}-numerator">${numerator}</span><hr class="fraction-divider"/><span class="denominator" contenteditable id="${newID}-denominator">${denominator}</span></span>`;
    }
    case "Sqrt":
      return `<span class="sqrt" contenteditable="false" id="${newID}"><span class="radical">√</span><span class="radical-arg"><span class="argument" contenteditable id="${newID}-arg">${brktText}</span></span></span>`;
    case "Power": {
      const [base, power] = parseArguments(brktText);
      return `<span class="superscript" contenteditable="false" id="${newID}"><span class="elem-base" contenteditable id="${newID}-base">${base}</span><span class="elem-script raised" contenteditable id="${newID}-script">${power}</span></span>`;
    }
    case "Subscript": {
      const [base, subscript] = parseArguments(brktText);
      return `<span class="subscript" contenteditable="false" id="${newID}"><span class="elem-base" contenteditable id="${newID}-base">${base}</span><span class="elem-script lowered" contenteditable id="${newID}-script">${subscript}</span></span>`;
    }
    case "OverHat":
    case "Overhat": {
      return `<span class="overhat" contenteditable="false" id="${newID}"><span class="overhat-decoration" contenteditable="false">^</span><span class="argument" contenteditable id="${newID}-arg">${brktText}</span></span>`;
    }
    case "Exp":
      return `<span class="exponential" contenteditable="false" id="${newID}"><span class="exp-decoration">e</span><span class="elem-script raised" contenteditable id="${newID}-script">${brktText}</span></span>`;
    case "Sin":
      return `<span class="sine" contenteditable="false" id="${newID}">sin(<span class="argument" contenteditable id="${newID}-arg">${brktText}</span>)</span>`;
    case "Cos":
      return `<span class="cosine" contenteditable="false" id="${newID}">cos(<span class="argument" contenteditable id="${newID}-arg">${brktText}</span>)</span>`;
    case "Tan":
      return `<span class="tangent" contenteditable="false" id="${newID}">tan(<span class="argument" contenteditable id="${newID}-arg">${brktText}</span>)</span>`;
    case "ArcTan":
      return `<span class="arctangent" contenteditable="false" id="${newID}">tan<sup>-1</sup>(<span class="argument" contenteditable id="${newID}-arg">${brktText}</span>)</span>`;
    case "chemSymbol": {
      const [atomicNum, isotopeNum, symbol, charge] = parseArguments(brktText);
      return `<span class="chem-symbol" id="${newID}" contenteditable="false"><span class="chem-symbol-left-container"><span class="isotope-num" contenteditable id="${newID}-isotope-num">${isotopeNum}</span><span class="atomic-num" contenteditable id="${newID}-atomic-num">${atomicNum}</span></span><span class="elem-base" contenteditable id="${newID}-base">${symbol}</span><span class="elem-script ion-charge" contenteditable id="${newID}-script">${charge}</span></span>`;
    }

    default:
      return brktText;
  }
}

function getTeXEquivalent(operator, brktText) {
  switch (operator) {
    case "Plus": {
      const args = parseArguments(brktText);
      return `${args.join("+")}`;
    }
    case "Times": {
      const args = parseArguments(brktText);
      const multipliers = refineMultipliers(args);
      return `${multipliers.join("\\ ")}`;
    }
    case "Rational":
    case "Divide": {
      const [numerator, denominator] = parseArguments(brktText);
      return `\\frac{${numerator}}{${denominator}}`;
    }
    case "Sqrt": {
      return `\\sqrt{${brktText}}`;
    }
    case "Power": {
      let [base, power] = parseArguments(brktText);

      if (power.trim() === "-1" || power.trim() === "−1")
        return `\\frac{1}{${base}}`;

      if (
        power.trim().slice(0, 4) === "Plus" ||
        power.trim().slice(0, 5) === "Times"
      )
        power = `(${power})`;
      if (
        base.trim().slice(0, 4) === "Plus" ||
        base.trim().slice(0, 5) === "Times"
      )
        base = `(${base})`;
      return `{${base}}^{${power}}`;
    }
    case "Subscript": {
      const [base, subscript] = parseArguments(brktText);
      return `{${base}}_{${subscript}}`;
    }
    case "OverHat":
    case "Overhat":
      return `\\ \\hat{${brktText}}`;
    case "Sin":
      return `\\sin (${brktText})`;
    case "Cos":
      return `\\cos (${brktText})`;
    case "Tan":
      return `\\tan (${brktText})`;
    case "Exp":
      return `e^{${brktText}}`;
    case "Log":
      return `\\ln(${brktText})`;
    case "Integrate": {
      const [integrand, differential] = parseArguments(brktText);
      return `\\int ${integrand} \\ d${differential}`;
    }
    default:
      return `${operator}[${brktText}]`;
  }
}

function refineMultipliers(args) {
  if (!Array.isArray(args)) return args;
  const multipliers = [];

  args.forEach((arg) => {
    if (arg.trim() === "-1" || arg.trim() === "−1") multipliers.push("−");
    else if (arg.trim().slice(0, 4) === "Plus") {
      multipliers.push(`(${arg.trim()})`);
    } else multipliers.push(arg.trim());
  });

  return multipliers;
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

function parseOperator(str, openBrktIndex) {
  if (str.charAt(openBrktIndex - 1) === " ") return null;

  const operatorArr = [];
  for (let i = 1; i < 12; i++) {
    if (
      str.charAt(openBrktIndex - i) === ">" ||
      str.charAt(openBrktIndex - i) === " " ||
      str.charAt(openBrktIndex - i) === "{" ||
      str.charAt(openBrktIndex - i) === "+" ||
      str.charAt(openBrktIndex - i) === "("
    )
      return operatorArr.reverse().join("");
    operatorArr.push(str.charAt(openBrktIndex - i));
  }

  return operatorArr.reverse().join("");
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

// Power[a,-1] => \frac{1}{a}
// exponential template (Exp[]=> e^{arg})
// infinity (Infinity)
// (Log[] => \ln(arg))

// infinity, degree, plus minus, partial derivative, del operator,
