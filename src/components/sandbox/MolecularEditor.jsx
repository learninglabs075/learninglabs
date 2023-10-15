import React, { useState, useEffect, useRef } from "react";
import { Box, Button, IconButton, Typography } from "@material-ui/core";
import { OpenWith } from "@material-ui/icons";
import {
  Eraser,
  distance,
  arcTan,
  generateRandomCode as newID,
} from "../../app/utils/utils.js";
import { generateSMILES } from "./generateSMILES.js";

function pickCursor(tool, isOverElement) {
  switch (tool) {
    case "bond":
      return "cursor-crosshair";
    case "eraser":
      return "cursor-eraser";
    case "move":
      return isOverElement ? "cursor-move" : "cursor-default";
    default:
      return "default";
  }
}

function newAtom(id, element, coord) {
  switch (element) {
    case "carbon":
      return {
        id: id,
        atomicNum: 6,
        element: element,
        symbol: "C",
        isotope: 12,
        formalCharge: 0,
        coord: coord,
      };

    default:
      break;
  }
}

function getTypicalNumBonds(element) {
  switch (element) {
    case "hydrogen":
    case "lithium":
    case "sodium":
    case "fluorine":
    case "chlorine":
    case "bromine":
      return 1;
    case "oxygen":
    case "magnesium":
    case "sulfur":
      return 2;
    case "nitrogen":
    case "phosphorus":
    case "boron":
      return 3;
    case "carbon":
    case "silicon":
      return 4;
    default:
      return 4;
  }
}

export default function MolecularEditor({ fullscreenOption }) {
  const canvasWidth = 600;
  const canvasHeight = 700;
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  const [tool, setTool] = useState("bond");
  const [action, setAction] = useState("none");
  const [atoms, setAtoms] = useState([]);
  const [bonds, setBonds] = useState([]);
  const [nearestAtomIndex, setNearestAtomIndex] = useState(-1);
  const [nearestBondIndex, setNearestBondIndex] = useState(-1);
  const [attachedAtoms, setAttachedAtoms] = useState([]);
  const [selectedAtoms, setSelectedAtoms] = useState([]);
  const [selectedBonds, setSelectedBonds] = useState([]);
  const [clippedBonds, setClippedBonds] = useState([]);

  const [initialBondCoord, setInitialBondCoord] = useState(null);
  const nearestAtom = atoms[nearestAtomIndex];
  const nearestBond = bonds[nearestBondIndex];
  const mouseOverAtom = nearestAtomIndex >= 0;
  const mouseOverBond = nearestBondIndex >= 0;
  const atomIDs = atoms.map((atom) => atom.id);

  const defaultBondLength = 40;

  const [initialCoord, setInitialCoord] = useState({ x: 0, y: 0 });
  const highlight = { color: "black", backgroundColor: "rgba(0,0,0,0.2)" };

  // custom icon SVGs
  const SingleBond = () => (
    <svg height="26" width="26">
      <line
        x1="4"
        y1="22"
        x2="22"
        y2="4"
        stroke={tool === "bond" ? "black" : "rgba(0,0,0,0.54)"}
        strokeWidth="2"
      />
    </svg>
  );

  //================ useEffect hooks =========================//

  //initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.lineCap = "round";
    //   context.fillStyle = "rgba(0,0,0,0.2)";
    context.fillStyle = "rgba(72,155,181,0.2)";
    context.font = "18px Lato";
    contextRef.current = context;
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    clearCanvas();
    drawBonds();
    drawAtoms();

    if (selectedBonds.length > 0) highlightBonds();
    if (selectedAtoms.length > 0) highlightAtoms();

    //eslint-disable-next-line
  }, [action]);

  useEffect(
    () => highlightAtom(),
    //eslint-disable-next-line
    [nearestAtomIndex]
  );

  useEffect(
    () => tool === "bond" && highlightAtom(),
    //eslint-disable-next-line
    [nearestAtomIndex, atoms]
  );

  useEffect(
    () => highlightBond(),
    //eslint-disable-next-line
    [nearestBondIndex]
  );

  useEffect(
    () => highlightAtoms(),
    //eslint-disable-next-line
    [selectedAtoms]
  );

  useEffect(
    () => highlightBonds(selectedBonds),
    //eslint-disable-next-line
    [selectedBonds]
  );

  useEffect(() => {
    setSelectedAtoms([]);
    setSelectedBonds([]);
    setClippedBonds([]);
    clearCanvas();
    drawBonds();
    drawAtoms();
    //eslint-disable-next-line
  }, [tool]);

  //================================= highlight ======================================//

  function highlightAtom() {
    if (selectedAtoms.length > 0) return;
    // if (selectedBondIndexes.length > 0) return;
    if (nearestAtomIndex < 0) {
      clearCanvas();
      drawBonds();
      drawAtoms();
      return;
    }
    const atomX = nearestAtom.coord.x;
    const atomY = nearestAtom.coord.y;
    const draw = contextRef.current;
    draw.beginPath();
    draw.ellipse(atomX, atomY, 8, 8, 0, 0, 2 * Math.PI);
    draw.fill();
  }

  function highlightAtoms() {
    selectedAtoms.forEach((sel) => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.strokeStyle = "rgba(72,155,181,0.2)";
      context.lineWidth = 10;
      const draw = contextRef.current;

      const coord = atoms[sel.ind].coord;

      draw.beginPath();
      draw.ellipse(coord.x, coord.y, 8, 8, 0, 0, 2 * Math.PI);
      draw.fill();

      context.strokeStyle = "black";
      context.lineWidth = 1;
    });
  }

  function highlightBond() {
    if (selectedBonds.length > 0) return;
    if (nearestBondIndex < 0) {
      clearCanvas();
      drawBonds();
      drawAtoms();
      return;
    }
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.strokeStyle = "rgba(72,155,181,0.2)";
    context.lineWidth = 10;
    const draw = contextRef.current;

    draw.beginPath();
    draw.moveTo(nearestBond.coord1.x, nearestBond.coord1.y);
    draw.lineTo(nearestBond.coord2.x, nearestBond.coord2.y);
    draw.stroke();
    draw.closePath();

    context.strokeStyle = "black";
    context.lineWidth = 1;
  }

  function highlightBonds() {
    selectedBonds.forEach((sel) => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.strokeStyle = "rgba(72,155,181,0.2)";
      context.lineWidth = 10;
      const draw = contextRef.current;

      const coord1 = bonds[sel.ind].coord1;
      const coord2 = bonds[sel.ind].coord2;

      draw.beginPath();
      draw.moveTo(coord1.x, coord1.y);
      draw.lineTo(coord2.x, coord2.y);
      draw.stroke();
      draw.closePath();

      context.strokeStyle = "black";
      context.lineWidth = 1;
    });
  }

  //================================= draw bonds =====================================//

  function drawSelectBox(cursor) {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const draw = contextRef.current;

    context.strokeStyle = "gray";
    context.setLineDash([6]);

    draw.strokeRect(
      initialCoord.x,
      initialCoord.y,
      cursor.x - initialCoord.x,
      cursor.y - initialCoord.y
    );

    context.strokeStyle = "black";
    context.setLineDash([]);
  }

  function drawAtoms() {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.fillStyle = "black";

    atoms.forEach((atom) => {
      const attachedBonds = getAttachedBonds(atom.id);
      const numAttachedBonds = attachedBonds.length;
      const { element, visible } = atom;
      if (element !== "carbon" || visible || numAttachedBonds === 0) {
        drawAtom(atom);
        drawHydrogens(atom);
      }
    });

    context.fillStyle = "rgba(72,155,181,0.2)";
  }

  function drawAtom(atom) {
    const draw = contextRef.current;
    const { coord, symbol } = atom;

    symbol.length === 1 && draw.clearRect(coord.x - 8, coord.y - 9, 16, 18);
    symbol.length === 1 && draw.fillText(symbol, coord.x - 7, coord.y + 7);

    symbol.length === 2 && draw.clearRect(coord.x - 8, coord.y - 9, 16, 18);
    symbol.length === 2 && draw.fillText(symbol, coord.x - 7, coord.y + 7);

    return;
  }

  function drawHydrogens(atom) {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const draw = contextRef.current;
    const { coord } = atom;
    const typicalNumBonds = getTypicalNumBonds(atom.element);
    const attached = getAttachedAtoms(atom.id);
    const attachedBonds = getAttachedBonds(atom.id);
    const numAttachedBonds = attachedBonds.length;
    const totalBondOrder = attachedBonds.reduce(
      (total, current) => total + current.bondOrder,
      0
    );
    const numHydrogens = typicalNumBonds - totalBondOrder;
    const subscript = numHydrogens.toString();

    let Hx = coord.x;
    let Hy = coord.y;
    let subscript_x = coord.x;
    let subscript_y = coord.y;

    if (numHydrogens < 1) return;

    switch (numAttachedBonds) {
      case 0: {
        draw.fillText("H", coord.x + 6, coord.y + 7);
        context.font = "12px Lato";
        draw.fillText(subscript, coord.x + 19, coord.y + 12);
        break;
      }
      case 1: {
        const attCoord = attached[0].coord;
        const dx = coord.x - attCoord.x;

        if (dx >= 0) {
          Hx = Hx + 6;
          subscript_x = subscript_x + 19;
        } else if (dx < 0) {
          Hx = numHydrogens > 1 ? Hx - 26 : Hx - 20;
          subscript_x = subscript_x - 13;
        }

        Hy = Hy + 7;
        subscript_y = subscript_y + 12;

        draw.fillText("H", Hx, Hy);
        context.font = "12px Lato";
        numHydrogens > 1 && draw.fillText(subscript, subscript_x, subscript_y);
        break;
      }
      case 2:
      case 3: {
        const phi = findOpenAngle(atom, attached);
        const octant1 = phi >= 0.0 * Math.PI && phi < 0.25 * Math.PI;
        const octant2 = phi >= 0.25 * Math.PI && phi < 0.5 * Math.PI;
        const octant3 = phi >= 0.5 * Math.PI && phi < 0.75 * Math.PI;
        const octant4 = phi >= 0.75 * Math.PI && phi < 1.0 * Math.PI;
        const octant5 = phi >= 1.0 * Math.PI && phi < 1.25 * Math.PI;
        const octant6 = phi >= 1.25 * Math.PI && phi < 1.5 * Math.PI;
        const octant7 = phi >= 1.5 * Math.PI && phi < 1.75 * Math.PI;
        const octant8 = phi >= 1.75 * Math.PI && phi < 2.0 * Math.PI;

        if (octant8 || octant1) {
          Hx = Hx + 5;
          Hy = Hy + 7;
          subscript_x = subscript_x + 18;
          subscript_y = subscript_y + 12;
        } else if (octant2 || octant3) {
          Hx = Hx - 7;
          Hy = Hy + 23;
          subscript_x = subscript_x + 6;
          subscript_y = subscript_y + 28;
        } else if (octant4 || octant5) {
          Hx = numHydrogens > 1 ? Hx - 26 : Hx - 20;
          Hy = Hy + 7;
          subscript_x = subscript_x - 13;
          subscript_y = subscript_y + 12;
        } else if (octant6 || octant7) {
          Hx = Hx - 7;
          Hy = Hy - 10;
          subscript_x = subscript_x + 6;
          subscript_y = subscript_y - 5;
        }
        draw.fillText("H", Hx, Hy);
        context.font = "12px Lato";
        numHydrogens > 1 && draw.fillText(subscript, subscript_x, subscript_y);
        break;
      }
      default:
        break;
    }
    context.font = "18px Lato";
  }

  function drawBonds() {
    const draw = contextRef.current;

    bonds.forEach((bond) => {
      const theta = Math.atan(
        (bond.coord2.y - bond.coord1.y) / (bond.coord2.x - bond.coord1.x)
      );
      const gap = 3;
      const gapX = gap * Math.sin(theta);
      const gapY = gap * Math.cos(theta);
      switch (bond.bondOrder) {
        case 1:
          draw.beginPath();
          draw.moveTo(bond.coord1.x, bond.coord1.y);
          draw.lineTo(bond.coord2.x, bond.coord2.y);
          draw.stroke();
          draw.closePath();
          break;
        case 2:
          draw.beginPath();
          draw.moveTo(bond.coord1.x - gapX, bond.coord1.y + gapY);
          draw.lineTo(bond.coord2.x - gapX, bond.coord2.y + gapY);
          draw.stroke();
          draw.closePath();
          draw.beginPath();
          draw.moveTo(bond.coord1.x + gapX, bond.coord1.y - gapY);
          draw.lineTo(bond.coord2.x + gapX, bond.coord2.y - gapY);
          draw.stroke();
          draw.closePath();
          break;
        case 3:
          draw.beginPath();
          draw.moveTo(bond.coord1.x - gapX * 1.5, bond.coord1.y + gapY * 1.5);
          draw.lineTo(bond.coord2.x - gapX * 1.5, bond.coord2.y + gapY * 1.5);
          draw.stroke();
          draw.closePath();
          draw.beginPath();
          draw.moveTo(bond.coord1.x, bond.coord1.y);
          draw.lineTo(bond.coord2.x, bond.coord2.y);
          draw.stroke();
          draw.beginPath();
          draw.moveTo(bond.coord1.x + gapX * 1.5, bond.coord1.y - gapY * 1.5);
          draw.lineTo(bond.coord2.x + gapX * 1.5, bond.coord2.y - gapY * 1.5);
          draw.stroke();
          draw.closePath();
          break;
        default:
          break;
      }
    });
  }

  //=================== find distance and angles =====================//

  function findOpenAngle(atom, attached) {
    const bondAngles = attached.map((att) =>
      arcTan(att.coord.x - atom.coord.x, att.coord.y - atom.coord.y)
    );
    bondAngles.sort((a, b) => a - b);

    // find differences between all angles
    const dAlphas = [];
    for (let i = 0; i < bondAngles.length; i++) {
      i + 1 < bondAngles.length
        ? dAlphas.push(bondAngles[i + 1] - bondAngles[i])
        : dAlphas.push(2 * Math.PI - bondAngles[i] + bondAngles[0]);
    }

    let i_max = 0;

    for (let i = 0; i < dAlphas.length; i++) {
      i_max = dAlphas[i] > dAlphas[i_max] ? i : i_max;
    }

    let phi = bondAngles[i_max] + dAlphas[i_max] / 2;
    phi = phi > 2 * Math.PI ? phi - 2 * Math.PI : phi;
    return phi;
  }

  //=================== find close atoms and bonds =====================//

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function findClosestAtom(cursor) {
    if (action === "drawing" && tool === "bond") {
      const existingAtoms = atoms.slice(0, -1);

      return existingAtoms.find((atom, atomIndex) =>
        isNearAtom(cursor, atom, atomIndex)
      );
    }
    return atoms.find((atom, atomIndex) => isNearAtom(cursor, atom, atomIndex));
  }

  function findClosestBond(cursor) {
    return bonds.find((bond, bondIndex) => isNearBond(cursor, bond, bondIndex));
  }

  function isNearAtom(cursor, atom, atomIndex) {
    const distanceToAtom = distance(cursor, atom.coord);

    if (distanceToAtom < 10) {
      setNearestBondIndex(-1);
      setNearestAtomIndex(atomIndex);
      return true;
    } else {
      setNearestAtomIndex(-1);
      return false;
    }
  }

  function checkAtomOverlap(newAtomCoord) {
    const overlappingAtom = atoms.find(
      (atom) => distance(atom.coord, newAtomCoord) < 8
    );

    return overlappingAtom;
  }

  function isNearBond(cursor, bond, bondIndex) {
    const { coord1, coord2 } = bond;
    const x1 = coord1.x;
    const y1 = coord1.y;
    const x2 = coord2.x;
    const y2 = coord2.y;
    const x1prime = x1 + 0.3 * (x2 - x1);
    const x2prime = x2 - 0.3 * (x2 - x1);
    const y1prime = y1 + 0.3 * (y2 - y1);
    const y2prime = y2 - 0.3 * (y2 - y1);
    const a = { x: x1prime, y: y1prime };
    const b = { x: x2prime, y: y2prime };

    const cursorToLine =
      distance(a, b) - (distance(a, cursor) + distance(b, cursor));

    if (Math.abs(cursorToLine) < 3) {
      setNearestBondIndex(bondIndex);
      return true;
    } else {
      setNearestBondIndex(-1);
      return false;
    }
  }

  //=================== edit atoms and bonds =====================//

  function addAtoms(newAtoms) {
    const atomsCopy = [...atoms];
    newAtoms.forEach((newAtom) => atomsCopy.push(newAtom));
    setAtoms(atomsCopy);
  }

  function addBonds(newBonds) {
    const bondsCopy = [...bonds];
    newBonds.forEach((newBond) => bondsCopy.push(newBond));
    setBonds(bondsCopy);
  }

  function getAtomInfo(keyPressed) {
    switch (keyPressed) {
      case "b":
        if (nearestAtom.element === "boron")
          return {
            atomicNum: 35,
            element: "bromine",
            symbol: "Br",
            isotope: 79,
          };
        else
          return { atomicNum: 5, element: "boron", symbol: "B", isotope: 11 };
      case "c":
        if (nearestAtom.element === "carbon" && nearestAtom.visible)
          return {
            atomicNum: 17,
            element: "chlorine",
            symbol: "Cl",
            isotope: 35,
          };
        else
          return { atomicNum: 6, element: "carbon", symbol: "C", isotope: 12 };
      case "f":
        return { atomicNum: 9, element: "fluorine", symbol: "F", isotope: 19 };
      case "h":
        return { atomicNum: 1, element: "hydrogen", symbol: "H", isotope: 1 };
      case "l":
        return { atomicNum: 3, element: "lithium", symbol: "Li", isotope: 7 };
      case "m":
        return {
          atomicNum: 12,
          element: "magnesium",
          symbol: "Mg",
          isotope: 24,
        };
      case "n":
        if (nearestAtom.element === "nitrogen")
          return {
            atomicNum: 11,
            element: "sodium",
            symbol: "Na",
            isotope: 23,
          };
        else
          return {
            atomicNum: 7,
            element: "nitrogen",
            symbol: "N",
            isotope: 14,
          };
      case "o":
        return { atomicNum: 8, element: "oxygen", symbol: "O", isotope: 16 };
      case "p":
        return {
          atomicNum: 15,
          element: "phosphorus",
          symbol: "P",
          isotope: 31,
        };
      case "s":
        if (nearestAtom.element === "sulfur")
          return {
            atomicNum: 14,
            element: "silicon",
            symbol: "Si",
            isotope: 32,
          };
        else
          return { atomicNum: 16, element: "sulfur", symbol: "S", isotope: 28 };
      default:
        break;
    }
  }

  function toggleBondOrder(bondIndex, bondInfo) {
    const bondsCopy = [...bonds];
    bondsCopy[bondIndex] = bondInfo;
    setBonds(bondsCopy);
  }

  function updateBondCoord(index, coord1, coord2) {
    const bondsCopy = [...bonds];
    const updatedBond = bondsCopy[index];
    updatedBond.coord1 = { x: coord1.x, y: coord1.y };
    updatedBond.coord2 = { x: coord2.x, y: coord2.y };
    bondsCopy[index] = updatedBond;
    setBonds(bondsCopy);
  }

  function updateBondAtomIDs(index, atom1_id, atom2_id) {
    const bondsCopy = [...bonds];
    const updatedBond = bondsCopy[index];
    updatedBond.atom1_id = atom1_id;
    updatedBond.atom2_id = atom2_id;
    bondsCopy[index] = updatedBond;
    setBonds(bondsCopy);
  }

  function updateAtomCoord(index, newCoord) {
    const atomsCopy = [...atoms];
    const updatedAtom = atomsCopy[index];
    updatedAtom.coord = { x: newCoord.x, y: newCoord.y };
    atomsCopy[index] = updatedAtom;
    setAtoms(atomsCopy);
  }

  function updateAtomElement(atomIndex, updateInfo) {
    const atomsCopy = [...atoms];
    const originalAtom = atoms[atomIndex];
    const updatedAtom = atomsCopy[atomIndex];
    updatedAtom.atomicNum = updateInfo.atomicNum;
    updatedAtom.element = updateInfo.element;
    updatedAtom.symbol = updateInfo.symbol;
    updatedAtom.isotope = updateInfo.isotope;

    //toggle carbon visibility
    if (updateInfo.element === "carbon") {
      updatedAtom.visible = !originalAtom.visible;
    }
    atomsCopy[atomIndex] = updatedAtom;
    setAtoms(atomsCopy);
  }

  function deleteAtom(atomID) {
    const atomsCopy = atoms.filter((atom) => atom.id !== atomID);
    setAtoms(atomsCopy);
  }

  function deleteAttachedBonds(atomID) {
    const updatedBonds = bonds.filter(
      (bond) => bond.atom1_id !== atomID && bond.atom2_id !== atomID
    );
    setBonds(updatedBonds);
  }

  function deleteBond(atom1_id, atom2_id) {
    const bondsCopy = bonds.filter(
      (bond) => bond.atom1_id !== atom1_id || bond.atom2_id !== atom2_id
    );
    setBonds(bondsCopy);
  }

  function getAttachedBonds(atomID) {
    const attachedBonds = bonds.filter(
      (bond) => bond.atom1_id === atomID || bond.atom2_id === atomID
    );
    return attachedBonds;
  }

  function getAttachedAtoms(atomID) {
    const attachedBonds = getAttachedBonds(atomID);

    const attachedAtomIDs = attachedBonds.map((attachedBond) =>
      attachedBond.atom1_id === atomID
        ? attachedBond.atom2_id
        : attachedBond.atom1_id
    );
    return atoms.filter((atom) => attachedAtomIDs.includes(atom.id));
  }

  //==================== handle key down ======================//

  const handleKeyDown = (event) => {
    if (!mouseOverAtom) return;
    if (mouseOverAtom) {
      // const updateInfo = commonElements.find(
      //   (element) => event.key === element.symbol.charAt(0).toLowerCase()
      // );
      const updatedAtomInfo = getAtomInfo(event.key);
      // if (!updateInfo) return;
      if (!updatedAtomInfo) return;
      updateAtomElement(nearestAtomIndex, updatedAtomInfo);
      clearCanvas();
      drawBonds();
      drawAtoms();
    }
  };

  //=================== handle mouse down =====================//

  const handleMouseDown = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const cursorCoord = { x: offsetX, y: offsetY };
    const itemsSelected = selectedAtoms.length > 0 || selectedBonds.length > 0;

    if (action !== "none") return;

    if (tool === "move" && !mouseOverBond && !mouseOverAtom) {
      setSelectedAtoms([]);
      setSelectedBonds([]);
      setClippedBonds(() => []);
      setInitialCoord(cursorCoord);
      setAction("selecting");
      return;
    }

    if (tool === "move" && itemsSelected && (mouseOverBond || mouseOverAtom)) {
      setInitialCoord(cursorCoord);
      const selectedAtomsCopy = [...selectedAtoms];
      const selectedBondsCopy = [...selectedBonds];
      const clippedBondsCopy = [...clippedBonds];

      selectedAtomsCopy.forEach(
        (sel, index) =>
          (selectedAtomsCopy[index].atomToCursor = {
            x: offsetX - atoms[sel.ind].coord.x,
            y: offsetY - atoms[sel.ind].coord.y,
          })
      );

      selectedBondsCopy.forEach((sel, index) => {
        selectedBondsCopy[index].atom1ToCursor = {
          x: offsetX - bonds[sel.ind].coord1.x,
          y: offsetY - bonds[sel.ind].coord1.y,
        };
        selectedBondsCopy[index].atom2ToCursor = {
          x: offsetX - bonds[sel.ind].coord2.x,
          y: offsetY - bonds[sel.ind].coord2.y,
        };
      });

      clippedBonds.forEach((bond, index) => {
        clippedBondsCopy[index].attachedAtomToCursor = {
          x: offsetX - bond.attachedAtomCoord.x,
          y: offsetY - bond.attachedAtomCoord.y,
        };
      });

      setSelectedBonds(selectedBondsCopy);
      setSelectedAtoms(selectedAtomsCopy);
      setClippedBonds(clippedBondsCopy);
      setAction("moving selected");
      console.log("starting to move object group");
      return;
    }

    if (tool === "move" && mouseOverAtom) {
      setAction("moving atom");
      return;
    }

    if (tool === "move" && mouseOverBond) {
      setInitialCoord(cursorCoord);
      setInitialBondCoord([nearestBond.coord1, nearestBond.coord2]);
      setAction("moving bond");
      return;
    }

    if (tool === "eraser" && mouseOverAtom) {
      setAction("erasing");
      deleteAttachedBonds(nearestAtom.id);
      deleteAtom(nearestAtom.id);
      setNearestAtomIndex(-1);
      return;
    }

    if (tool === "eraser" && mouseOverBond) {
      const numBondsToAtom1 = getAttachedBonds(nearestBond.atom1_id).length;
      const numBondsToAtom2 = getAttachedBonds(nearestBond.atom2_id).length;

      let atomIDsCopy = [...atomIDs];
      let atomsCopy = [...atoms];

      if (numBondsToAtom1 < 2) {
        const atom1_index = atomIDsCopy.indexOf(nearestBond.atom1_id);
        atomsCopy.splice(atom1_index, 1);
        atomIDsCopy.splice(atom1_index, 1);
      }

      if (numBondsToAtom2 < 2) {
        const atom2_index = atomIDsCopy.indexOf(nearestBond.atom2_id);
        atomsCopy.splice(atom2_index, 1);
      }

      setAtoms(atomsCopy);
      deleteBond(nearestBond.atom1_id, nearestBond.atom2_id);
      setNearestBondIndex(-1);
      return;
    }

    if (tool === "bond" && mouseOverAtom) {
      const newCarbon = newAtom(newID(6), "carbon", nearestAtom.coord);
      const newBond = {
        atom1_id: nearestAtom.id,
        atom2_id: newCarbon.id,
        bondOrder: 1,
        coord1: nearestAtom.coord,
        coord2: nearestAtom.coord,
      };
      addAtoms([newCarbon]);
      addBonds([newBond]);
      setInitialCoord(() => nearestAtom.coord);
      setAttachedAtoms(() => getAttachedAtoms(nearestAtom.id));
      setAction("drawing");
      return;
    }

    if (tool === "bond" && mouseOverBond) {
      const bondCopy = { ...nearestBond };

      bondCopy.bondOrder =
        bondCopy.bondOrder === 3 ? 1 : bondCopy.bondOrder + 1;

      toggleBondOrder(nearestBondIndex, bondCopy);
      setAction("toggling bond order");
      return;
    }

    if (tool === "bond") {
      const carbon1 = newAtom(newID(6), "carbon", cursorCoord);
      const carbon2 = newAtom(newID(6), "carbon", cursorCoord);

      const newBond = {
        atom1_id: carbon1.id,
        atom2_id: carbon2.id,
        bondOrder: 1,
        coord1: cursorCoord,
        coord2: cursorCoord,
      };

      addAtoms([carbon1, carbon2]);
      addBonds([newBond]);
      setInitialCoord({ x: offsetX, y: offsetY });
      setAttachedAtoms(() => []);
      setAction("drawing");
      return;
    }
  };

  //=================== handle mouse move =====================//

  const handleMouseMove = (event) => {
    const { offsetX, offsetY } = event.nativeEvent;
    const cursorCoord = { x: offsetX, y: offsetY };
    const moving =
      action === "moving atom" ||
      action === "moving bond" ||
      action === "moving selected";

    if (!moving && atoms.length > 0) {
      findClosestAtom(cursorCoord);
      findClosestBond(cursorCoord);
    }

    if (action === "none") return;

    if (action === "selecting") {
      clearCanvas();
      drawBonds();
      drawAtoms();
      drawSelectBox(cursorCoord);
      return;
    }

    if (action === "moving selected") {
      const atomsCopy = [...atoms];
      const bondsCopy = [...bonds];

      selectedAtoms.forEach((sel) => {
        if (!atomsCopy[sel.ind]) return;
        const newCoord = {
          x: cursorCoord.x - sel.atomToCursor.x,
          y: cursorCoord.y - sel.atomToCursor.y,
        };
        atomsCopy[sel.ind].coord = newCoord;
      });

      selectedBonds.forEach((sel) => {
        if (!bondsCopy[sel.ind]) return;
        const newCoord1 = {
          x: cursorCoord.x - sel.atom1ToCursor.x,
          y: cursorCoord.y - sel.atom1ToCursor.y,
        };
        const newCoord2 = {
          x: cursorCoord.x - sel.atom2ToCursor.x,
          y: cursorCoord.y - sel.atom2ToCursor.y,
        };
        bondsCopy[sel.ind].coord1 = newCoord1;
        bondsCopy[sel.ind].coord2 = newCoord2;
      });

      clippedBonds.forEach((bond) => {
        const newCoord = {
          x: cursorCoord.x - bond.attachedAtomToCursor.x,
          y: cursorCoord.y - bond.attachedAtomToCursor.y,
        };
        if (bond.attachedAtom === "atom1")
          bondsCopy[bond.index].coord1 = newCoord;
        else bondsCopy[bond.index].coord2 = newCoord;
      });

      setAtoms(atomsCopy);
      setBonds(bondsCopy);
      clearCanvas();
      drawBonds();
      drawAtoms();
      return;
    }

    if (action === "moving atom") {
      updateAtomCoord(nearestAtomIndex, cursorCoord);

      bonds.forEach((bond, index) => {
        if (bond.atom1_id === nearestAtom.id)
          updateBondCoord(index, cursorCoord, bond.coord2);
        else if (bond.atom2_id === nearestAtom.id)
          updateBondCoord(index, bond.coord1, cursorCoord);
      });
      clearCanvas();
      drawBonds();
      drawAtoms();
      return;
    }

    if (action === "moving bond") {
      const newCoord1 = {
        x: initialBondCoord[0].x - initialCoord.x + cursorCoord.x,
        y: initialBondCoord[0].y - initialCoord.y + cursorCoord.y,
      };
      const newCoord2 = {
        x: initialBondCoord[1].x - initialCoord.x + cursorCoord.x,
        y: initialBondCoord[1].y - initialCoord.y + cursorCoord.y,
      };

      const atom1_index = atomIDs.indexOf(nearestBond.atom1_id);
      const atom2_index = atomIDs.indexOf(nearestBond.atom2_id);

      //update bond coordinates
      updateAtomCoord(atom1_index, newCoord1);
      updateAtomCoord(atom2_index, newCoord2);
      updateBondCoord(nearestBondIndex, newCoord1, newCoord2);

      //update attached bond coordinates
      bonds.forEach((bond, index) => {
        if (bond.atom1_id === nearestBond.atom1_id)
          updateBondCoord(index, newCoord1, bond.coord2);
        else if (bond.atom2_id === nearestBond.atom1_id)
          updateBondCoord(index, bond.coord1, newCoord1);
        else if (bond.atom1_id === nearestBond.atom2_id)
          updateBondCoord(index, newCoord2, bond.coord2);
        else if (bond.atom2_id === nearestBond.atom2_id)
          updateBondCoord(index, bond.coord1, newCoord2);
      });

      clearCanvas();
      drawBonds();
      drawAtoms();
      return;
    }

    if (tool === "bond" && action === "drawing") {
      const lastAtomIndex = atoms.length - 1;
      const lastBondIndex = bonds.length - 1;
      updateAtomCoord(lastAtomIndex, cursorCoord);
      updateBondCoord(lastBondIndex, initialCoord, cursorCoord);
      clearCanvas();
      drawBonds();
      drawAtoms();
      highlightAtom();
      return;
    }
  };

  function selectElements(cursor) {
    if (action === "moving selected") return;
    const minX = initialCoord.x < cursor.x ? initialCoord.x : cursor.x;
    const maxX = initialCoord.x < cursor.x ? cursor.x : initialCoord.x;
    const minY = initialCoord.y < cursor.y ? initialCoord.y : cursor.y;
    const maxY = initialCoord.y < cursor.y ? cursor.y : initialCoord.y;

    const atomsCopy = [...atoms];
    const atomsInfo = [];
    atomsCopy.forEach((atom, index) => {
      const inXRange = atom.coord.x > minX && atom.coord.x < maxX;
      const inYRange = atom.coord.y > minY && atom.coord.y < maxY;
      if (inXRange && inYRange) {
        atomsInfo.push({
          ind: index,
          atomToCursor: { x: 0, y: 0 },
        });
      }
    });

    const bondsCopy = [...bonds];
    const bondsFullyInRange = [];
    const otherBonds = [];
    bondsCopy.forEach((bond, index) => {
      const atm1inXRange = bond.coord1.x > minX && bond.coord1.x < maxX;
      const atm1inYRange = bond.coord1.y > minY && bond.coord1.y < maxY;
      const atm2inXRange = bond.coord2.x > minX && bond.coord2.x < maxX;
      const atm2inYRange = bond.coord2.y > minY && bond.coord2.y < maxY;

      if (atm1inXRange && atm1inYRange && atm2inXRange && atm2inYRange) {
        bondsFullyInRange.push({
          coord1: bond.coord1,
          coord2: bond.coord2,
          ind: index,
          atom1ToCursor: { x: 0, y: 0 },
          atom2ToCursor: { x: 0, y: 0 },
        });
      } else
        otherBonds.push({
          atom1_id: bond.atom1_id,
          atom2_id: bond.atom2_id,
          index: index,
          coord1: bond.coord1,
          coord2: bond.coord2,
        });
    });

    const bondsPartlyInRange = [];
    otherBonds.forEach((bond) => {
      const atm1inXRange = bond.coord1.x > minX && bond.coord1.x < maxX;
      const atm1inYRange = bond.coord1.y > minY && bond.coord1.y < maxY;
      const atm2inXRange = bond.coord2.x > minX && bond.coord2.x < maxX;
      const atm2inYRange = bond.coord2.y > minY && bond.coord2.y < maxY;

      if (atm1inXRange && atm1inYRange) {
        bondsPartlyInRange.push({
          index: bond.index,
          attachedAtom: "atom1",
          attachedAtomID: bond.atom1_id,
          attachedAtomCoord: bond.coord1,
        });
      } else if (atm2inXRange && atm2inYRange) {
        bondsPartlyInRange.push({
          index: bond.index,
          attachedAtom: "atom2",
          attachedAtomID: bond.atom2_id,
          attachedAtomCoord: bond.coord2,
        });
      }
    });

    setSelectedAtoms(atomsInfo);
    setSelectedBonds(bondsFullyInRange);
    setClippedBonds(bondsPartlyInRange);
  }

  //=================== handle mouse up =====================//

  const handleMouseUp = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const cursorCoord = { x: offsetX, y: offsetY };
    const lastBondIndex = bonds.length - 1;
    const lastAtomIndex = atoms.length - 1;
    const bondLength = distance(initialCoord, cursorCoord);
    const numAttachedAtoms = attachedAtoms.length;

    if (action === "none") return;

    if (action === "moving atom") {
      setAction("none");
      setNearestAtomIndex(-1);
      return;
    }

    if (action === "moving bond") {
      setAction("none");
      setNearestAtomIndex(-1);
      return;
    }

    if (action === "moving selected") {
      setAction("none");
      return;
    }

    if (action === "selecting") {
      selectElements(cursorCoord);
      setAction("none");
      return;
    }

    if (action === "erasing" || action === "selecting") {
      setAction("none");
      return;
    }

    if (tool === "bond" && bondLength >= 8) {
      if (mouseOverAtom) {
        const atom1_id = bonds[lastBondIndex].atom1_id;
        setAtoms(() => atoms.slice(0, -1));
        updateBondCoord(lastBondIndex, initialCoord, nearestAtom.coord);
        updateBondAtomIDs(lastBondIndex, atom1_id, nearestAtom.id);
      }
      setAction("none");
      return;
    }

    // auto-pick position for new atom (if bondLength < 8)
    if (tool === "bond" && numAttachedAtoms === 0) {
      const snapToCoord = {};
      snapToCoord.x = initialCoord.x + (Math.sqrt(3) * defaultBondLength) / 2;
      snapToCoord.y = initialCoord.y - defaultBondLength / 2;
      updateAtomCoord(lastAtomIndex, snapToCoord);
      updateBondCoord(lastBondIndex, initialCoord, snapToCoord);
      setAction("none");

      return;
    }

    if (tool === "bond" && numAttachedAtoms === 1) {
      const nearest = nearestAtom.coord;
      const attached = attachedAtoms[0].coord;

      const dx = attached.x - nearest.x;
      const dy = attached.y - nearest.y;

      const cursor_dx = attached.x - offsetX;
      const cursor_dy = attached.y - offsetY;

      // angle between exisitng bond and +x axis
      const alpha = arcTan(dx, dy);

      // angle between cursor and +x axis
      const theta = arcTan(cursor_dx, cursor_dy);

      // angle to set new bond
      const phi =
        theta - alpha > 0
          ? alpha - (2 * Math.PI) / 3
          : alpha + (2 * Math.PI) / 3;

      const snapToCoord = {};
      snapToCoord.x = nearest.x + defaultBondLength * Math.cos(phi);
      snapToCoord.y = nearest.y + defaultBondLength * Math.sin(phi);

      //returns true if newly drawn atom overlaps with existing atom.
      const overlappedAtom = checkAtomOverlap(snapToCoord);
      if (overlappedAtom) {
        const atom1_id = bonds[lastBondIndex].atom1_id;
        setAtoms(() => atoms.slice(0, -1));
        updateBondCoord(lastBondIndex, initialCoord, overlappedAtom.coord);
        updateBondAtomIDs(lastBondIndex, atom1_id, overlappedAtom.id);
        setAttachedAtoms(() => []);
        setAction("none");

        return;
      }

      updateAtomCoord(lastAtomIndex, snapToCoord);
      updateBondCoord(lastBondIndex, nearestAtom.coord, snapToCoord);
      setAttachedAtoms(() => []);
      setAction("none");
      return;
    }

    if (tool === "bond" && numAttachedAtoms >= 2) {
      const phi = findOpenAngle(nearestAtom, attachedAtoms);
      const snapToCoord = {};
      snapToCoord.x = nearestAtom.coord.x + defaultBondLength * Math.cos(phi);
      snapToCoord.y = nearestAtom.coord.y + defaultBondLength * Math.sin(phi);

      //returns true if newly drawn atom overlaps with existing atom.
      const overlappedAtom = checkAtomOverlap(snapToCoord);
      if (overlappedAtom) {
        const atom1_id = bonds[lastBondIndex].atom1_id;
        setAtoms(() => atoms.slice(0, -1));
        updateBondCoord(lastBondIndex, initialCoord, overlappedAtom.coord);
        updateBondAtomIDs(lastBondIndex, atom1_id, overlappedAtom.id);
        setAttachedAtoms(() => []);
        setAction("none");
        return;
      }

      updateAtomCoord(lastAtomIndex, snapToCoord);
      updateBondCoord(lastBondIndex, nearestAtom.coord, snapToCoord);
      setAttachedAtoms(() => []);
      setAction("none");
      return;
    }

    return;
  };

  return (
    <Box className="flex row relative">
      <Box className="flex column padding-light align-center" maxWidth="50px">
        <IconButton
          onClick={() => setTool("move")}
          style={tool === "move" ? highlight : null}
        >
          <OpenWith />
        </IconButton>
        <IconButton
          onClick={() => setTool("bond")}
          style={tool === "bond" ? highlight : null}
        >
          <SingleBond />
        </IconButton>
        <IconButton
          onClick={() => setTool("eraser")}
          style={tool === "eraser" ? highlight : null}
        >
          <Eraser
            strokeColor={tool === "eraser" ? "black" : "rgba(0,0,0,0.54)"}
          />
        </IconButton>
        {/* <Button
          onClick={() => setTool("text")}
          style={tool === "text" ? highlight : { color: "rgba(0,0,0,0.54)" }}
        >
          ABC
        </Button> */}
      </Box>

      <canvas
        style={{
          backgroundColor: "#F8F8F8",
          position: "relative",
        }}
        className={pickCursor(tool, mouseOverAtom || mouseOverBond)}
        width={canvasWidth}
        height={canvasHeight}
        tabIndex="0"
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={canvasRef}
      />

      <Box maxHeight="700px" className="overflow-auto">
        {/* <pre>{JSON.stringify(initialCoord, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(attachedAtoms, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(action, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(tool, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(atomIDs, null, 2)}</pre> */}
        <pre>{JSON.stringify(atoms, null, 2)}</pre>
        {/* <pre>{JSON.stringify(selectedBonds, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(clippedBonds, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(selectedAtoms, null, 2)}</pre> */}
        <pre>{JSON.stringify(bonds, null, 2)}</pre>
        {/* <pre>{JSON.stringify(nearestAtomIndex, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(nearestAtom, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(nearestBondIndex, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(nearestBond, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(mouseOverAtom, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(mouseOverBond, null, 2)}</pre> */}
      </Box>

      <Box
        className="absolute"
        style={{ top: canvasHeight - 35, left: canvasWidth }}
      >
        <Button
          style={{ color: "gray", fontSize: "13px" }}
          onClick={() => {
            clearCanvas();
            setSelectedAtoms([]);
            setSelectedBonds([]);
            setAttachedAtoms([]);
            setClippedBonds([]);
            setBonds([]);
            setAtoms([]);
            setAction("none");
          }}
        >
          CLEAR
        </Button>
      </Box>
      <Box className="absolute" style={{ top: 20, left: canvasWidth - 30 }}>
        <Button
          // style={{ color: "gray", fontSize: "13px" }}
          variant="contained"
          onClick={() => generateSMILES(atoms, bonds)}
          disabled={atoms.length === 0}
        >
          SMILES
        </Button>
      </Box>
      <Box className="absolute" style={{ top: 20, left: 100 }}>
        <Typography>{nearestAtom?.id}</Typography>
      </Box>
    </Box>
  );
}
