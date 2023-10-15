import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  IconButton,
  Slider,
  SvgIcon,
  Typography,
} from "@material-ui/core";
import { Edit, Crop54, OpenWith, GridOn, OpenInNew } from "@material-ui/icons";
import { withStyles } from "@material-ui/core/styles";

const grayscale = [
  "#CCCCCC",
  "#A3A3A3",
  "#7A7A7A",
  "#525252",
  "#292929",
  "#000000",
];

const blues = [
  "#D3E7EE",
  "#A7D0DC",
  "#7CB8CB",
  "#50A1B9",
  "#3A7D92",

  "#295866",
];

const greens = [
  "#DBE9D8",
  "#B6D2B1",
  "#91BC8A",
  "#6DA664",
  "#52824A",
  "#395B34",
];

const purples = [
  "#F2E3EE",
  "#E5C8DD",
  "#D19EC3",
  "#BE74A9",
  "#A64E8D",
  "#7D3B6A",
];

const corals = [
  "#F2E6E4",
  "#E4CCC8",
  "#D0A79F",
  "#BC8276",
  "#AE695B",
  "#96574A",
];

const HorizontalSlider = withStyles((theme) => ({
  thumb: {
    borderRadius: "0",
    width: "3px",
    height: "15px",
  },
}))(Slider);

const Eraser = ({ strokeColor }) => (
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

function pickCursor(tool, isOverElement) {
  switch (tool) {
    case "path":
      return "cursor-circle";
    case "text":
      return "cursor-text";
    case "ellipse":
    case "rectangle":
    case "grid":
    case "line":
    case "arrow":
      return "cursor-crosshair";
    case "eraser":
      return "cursor-eraser";
    case "select":
      return isOverElement ? "cursor-move" : "cursor-default";
    default:
      return "default";
  }
}

export default function DrawingCanvas({
  canvasWidth,
  canvasHeight,
  fullscreenOption,
}) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  const [tool, setTool] = useState("path");
  const [text, setText] = useState("");
  const [action, setAction] = useState("none");
  const [elements, setElements] = useState([]);
  const [selectedColorGroup, setSelectedColorGroup] = useState(grayscale);
  const [saturation, setSaturation] = useState(4);
  const [thickness, setThickness] = useState(2);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedElementIndex, setSelectedElementIndex] = useState(null);
  const [isOverElement, setIsOverElement] = useState(false);
  const [initialCoord, setInitialCoord] = useState({ x1: 0, y1: 0 });
  const selectedColor = selectedColorGroup[saturation];
  const highlight = { color: "black", backgroundColor: "rgba(0,0,0,0.2)" };

  // custom icon SVGs
  const Line = () => (
    <svg height="20" width="25">
      <line
        x1="4"
        y1="18"
        x2="20"
        y2="2"
        stroke={tool === "line" ? "black" : "rgba(0,0,0,0.54)"}
        strokeWidth="2.5"
      />
    </svg>
  );

  const Arrow = () => (
    <svg height="20" width="25">
      <line
        x1="4"
        y1="18"
        x2="20"
        y2="2"
        stroke={tool === "arrow" ? "black" : "rgba(0,0,0,0.54)"}
        strokeWidth="2.5"
      />
      <polygon
        points="12,2 20,2 20,10"
        fill={tool === "arrow" ? "black" : "dimgray"}
        stroke={tool === "arrow" ? "black" : "dimgray"}
      />
    </svg>
  );

  const Ellipse = () => (
    <svg height="20" width="25">
      <ellipse
        cx="12.5"
        cy="10"
        rx="10"
        ry="8"
        fill="none"
        stroke={tool === "ellipse" ? "black" : "rgba(0,0,0,0.54)"}
        strokeWidth="2"
      />
    </svg>
  );

  //initialize canvas
  useEffect(
    () => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.lineCap = "round";
      context.lineWidth = thickness;
      context.strokeStyle = selectedColor;
      context.fillStyle = selectedColor;
      context.font = "20px Lato";
      contextRef.current = context;
    },
    // eslint-disable-next-line
    []
  );

  useEffect(
    () => resetCanvasStyling(),
    // eslint-disable-next-line
    [selectedColor, thickness]
  );

  function resetCanvasStyling() {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineWidth = thickness;
    context.strokeStyle = selectedColor;
    context.fillStyle = selectedColor;
    context.font = "20px Lato";
    context.setLineDash([]);
    contextRef.current = context;
  }

  function drawElements() {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const draw = contextRef.current;

    elements.forEach((element) => {
      context.strokeStyle = element.color;
      context.lineWidth = element.lineWidth;
      switch (element.type) {
        case "ellipse":
          draw.beginPath();
          draw.ellipse(
            element.centerX,
            element.centerY,
            element.radiusX,
            element.radiusY,
            0,
            0,
            2 * Math.PI
          );
          draw.stroke();
          break;
        case "rectangle":
          draw.strokeRect(
            element.x1,
            element.y1,
            element.width,
            element.height
          );
          break;
        case "grid":
          // draw horizontal lines
          for (let i = 0; i <= element.rows; i++) {
            draw.beginPath();
            draw.moveTo(
              element.x1,
              element.y1 + (i * element.height) / element.rows
            );
            draw.lineTo(
              element.x1 + element.width,
              element.y1 + (i * element.height) / element.rows
            );
            draw.stroke();
            draw.closePath();
          }

          for (let j = 0; j <= element.columns; j++) {
            draw.beginPath();
            draw.moveTo(
              element.x1 + (j * element.width) / element.columns,
              element.y1
            );
            draw.lineTo(
              element.x1 + (j * element.width) / element.columns,
              element.y1 + element.height
            );
            draw.stroke();
            draw.closePath();
          }
          break;
        case "line":
          draw.beginPath();
          draw.moveTo(element.x1, element.y1);
          draw.lineTo(element.x2, element.y2);
          draw.stroke();
          draw.closePath();
          break;
        case "arrow":
          const dX = element.x2 - element.x1;
          const dY = element.y2 - element.y1;
          const theta = Math.atan(dY / dX);
          const phi = element.head.angle; // arrowhead angle in radians
          const headLength = element.head.length;
          const xh1 =
            dX > 0
              ? element.x2 - headLength * Math.cos(theta + phi)
              : element.x2 + headLength * Math.cos(theta + phi);
          const yh1 =
            dX > 0
              ? element.y2 - headLength * Math.sin(theta + phi)
              : element.y2 + headLength * Math.sin(theta + phi);

          const xh2 =
            dX > 0
              ? element.x2 - headLength * Math.cos(theta - phi)
              : element.x2 + headLength * Math.cos(theta - phi);

          const yh2 =
            dX > 0
              ? element.y2 - headLength * Math.sin(theta - phi)
              : element.y2 + headLength * Math.sin(theta - phi);

          draw.beginPath();
          draw.moveTo(element.x1, element.y1);
          draw.lineTo(element.x2, element.y2);
          draw.stroke();
          draw.closePath();

          //draw arrowhead
          draw.beginPath();
          draw.moveTo(element.x2, element.y2);
          draw.lineTo(xh1, yh1);
          draw.stroke();
          draw.lineTo(xh2, yh2);
          draw.stroke();
          draw.lineTo(element.x2, element.y2);
          draw.stroke();
          draw.fillStyle = element.color;
          draw.fill();

          break;
        case "path":
          draw.beginPath();
          draw.moveTo(element.path[0].x, element.path[0].y);
          element.path.forEach((point) => draw.lineTo(point.x, point.y));
          draw.stroke();
          draw.closePath();
          break;
        case "text":
          draw.fillStyle = element.color;

          element.textArray.forEach((lineOfText, lineIndex) =>
            draw.fillText(lineOfText, element.x1, element.y1 + lineIndex * 25)
          );

          break;

        default:
          break;
      }
    });
  }

  const getElementAtPosition = (x, y) => {
    return elements.find((element, index) => isNearby(x, y, element, index));
  };

  const isNearby = (x, y, element, index) => {
    const { type } = element;
    const cursor = { x, y };
    setIsOverElement(false);

    switch (type) {
      case "ellipse": {
        const { centerX, centerY, radiusX, radiusY } = element;
        const centerCoord = { x: centerX, y: centerY };
        const centerToCursorDistance = distance(cursor, centerCoord);
        const dX = x - centerX;
        const dY = y - centerY;
        const rad = Math.atan(dY / dX);
        const centerToEllipseDistance =
          (radiusX * radiusY) /
          Math.sqrt(
            radiusX * radiusX * Math.sin(rad) * Math.sin(rad) +
              radiusY * radiusY * Math.cos(rad) * Math.cos(rad)
          );
        if (centerToCursorDistance < centerToEllipseDistance) {
          setIsOverElement(true);
          setSelectedElementIndex(index);
          return true;
        } else return false;
      }
      case "rectangle":
      case "grid": {
        const { x1, y1, width, height } = element;
        const minX = width > 0 ? x1 : x1 + width;
        const maxX = width > 0 ? x1 + width : x1;
        const minY = height > 0 ? y1 : y1 + width;
        const maxY = height > 0 ? y1 + width : y1;

        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          setIsOverElement(true);
          setSelectedElementIndex(index);
          return true;
        } else return false;
      }
      case "line":
      case "arrow": {
        const { x1, y1, x2, y2 } = element;
        const a = { x: x1, y: y1 };
        const b = { x: x2, y: y2 };
        const cursorToLine =
          distance(a, b) - (distance(a, cursor) + distance(b, cursor));

        if (Math.abs(cursorToLine) < 1) {
          setIsOverElement(true);
          setSelectedElementIndex(index);
          return true;
        } else return false;
      }
      case "path": {
        const { path } = element;
        for (let i = 0; i < path.length; i++) {
          if (distance(path[i], cursor) < 10) {
            setIsOverElement(true);
            setSelectedElementIndex(index);
            return true;
          }
        }
        return false;
      }
      case "text": {
        const { width, height } = element;
        const minX = element.x1;
        const maxX = element.x1 + width;
        const minY = element.y1 - 25;
        const maxY = element.y1 + height - 15;

        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
          setIsOverElement(true);
          setSelectedElementIndex(index);
          return true;
        } else return false;
      }

      default:
        break;
    }
  };

  const distance = (a, b) =>
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

  function clearCanvas() {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  const changeThickness = (event, newThickness) => {
    setThickness(newThickness);
  };

  const changeSaturation = (event, newSaturation) => {
    setSaturation(newSaturation);
  };

  const handleKeyDown = (e) => {
    if (tool !== "text") return;
    // return if non-standard character
    if (e.keyCode >= 16 && e.keyCode <= 31) return;
    if (e.keyCode >= 33 && e.keyCode <= 46) return;
    if (e.keyCode >= 173 && e.keyCode <= 179) return;
    if (e.keyCode === 9 || e.keyCode === 91 || e.keyCode === 93) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const draw = contextRef.current;
    const lastIndex = [elements.length - 1];
    const elementsCopy = [...elements];
    const lastFourChar = text.slice(-5);

    let updatedText = text + e.key;

    if (e.key === "Enter") updatedText = text + "</br>";

    if (e.key === "Backspace" && lastFourChar === "</br>") {
      updatedText = text.slice(0, -5);
    } else if (e.key === "Backspace") {
      updatedText = text.slice(0, -1);
    }

    const updatedTextArray = updatedText.split("</br>");

    const lineWidthArray = updatedTextArray.map(
      (line) => context.measureText(line).width
    );

    const longestLine = lineWidthArray.reduce(function (a, b) {
      return a > b ? a : b;
    });

    const boxWidth = longestLine < 115 ? 150 : longestLine + 35;

    const boxHeight =
      updatedTextArray.length <= 1
        ? 40
        : 40 +
          (updatedTextArray.length - 1) *
            context.measureText(updatedTextArray[0]).fontBoundingBoxAscent *
            1.25;

    const updatedTextElement = {
      type: "text",
      color: selectedColor,
      lineWidth: thickness,
      text: updatedText,
      textArray: updatedTextArray,
      x1: initialCoord.x1,
      y1: initialCoord.y1,
      width: longestLine,
      height: boxHeight,
    };

    elementsCopy[lastIndex] = updatedTextElement;
    setElements(elementsCopy);
    setText(updatedText);

    /// render updatedBox
    if (e.key === "Backspace" && lastFourChar === "</br>") {
      context.clearRect(
        initialCoord.x1 - 11,
        initialCoord.y1 - 31,
        boxWidth + 15,
        boxHeight + 30
      );
      drawElements();
    }

    context.clearRect(
      initialCoord.x1 - 11,
      initialCoord.y1 - 31,
      boxWidth + 15,
      boxHeight
    );
    // draw.fillStyle = color;
    draw.strokeStyle = "lightgray";
    draw.lineWidth = 2;
    draw.setLineDash([6]);

    draw.strokeRect(
      initialCoord.x1 - 10,
      initialCoord.y1 - 27,
      boxWidth,
      boxHeight
    );

    updatedTextArray.forEach((lineOfText, lineIndex) =>
      draw.fillText(
        lineOfText,
        initialCoord.x1,
        initialCoord.y1 + lineIndex * 25
      )
    );
    resetCanvasStyling();
  };

  const handleClick = ({ nativeEvent }) => {
    if (tool !== "text") return;

    if (action === "typing") {
      clearCanvas();
      drawElements();
      setAction("none");
      return;
    }

    if (action === "none") {
      setAction("typing");
    }

    const { offsetX, offsetY } = nativeEvent;
    setInitialCoord({ x1: offsetX, y1: offsetY });
    const draw = contextRef.current;
    draw.strokeStyle = "lightgray";
    draw.lineWidth = 2;
    draw.setLineDash([6]);
    draw.strokeRect(offsetX - 10, offsetY - 27, 150, 40);

    const newText = {
      type: "text",
      color: selectedColor,
      lineWidth: thickness,
      text: "",
      textArray: [],
      x1: initialCoord.x1,
      y1: initialCoord.y1,
      width: 0,
      height: 0,
    };
    setElements([...elements, newText]);
    setText("");
  };

  const handleBlur = (e) => {
    clearCanvas();
    setText("");
    setAction("none");
    resetCanvasStyling();
    drawElements();
  };

  function deleteElement() {
    console.log("delete fired");
    const newArr = elements.filter(
      (element, index) => index !== selectedElementIndex
    );
    setElements(newArr);
    setSelectedElementIndex(null);
  }

  const handleMouseDown = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const elem = {};
    setInitialCoord({ x1: offsetX, y1: offsetY });

    if (tool === "text") return;

    if (tool === "select") {
      const touchedElement = getElementAtPosition(offsetX, offsetY);
      if (!touchedElement) return;
      setSelectedElement(touchedElement);
      setInitialCoord({ x1: offsetX, y1: offsetY });
      setAction("moving");
      return;
    }

    if (tool === "eraser") {
      setAction("erasing");

      const touchedElement = getElementAtPosition(offsetX, offsetY);
      if (!touchedElement) return;
      // setSelectedElement(touchedElement);
      if (isOverElement) {
        deleteElement();
        setIsOverElement(false);
        clearCanvas();
        drawElements();
      }

      return;
    }

    switch (tool) {
      case "ellipse":
        elem.type = "ellipse";
        elem.color = selectedColor;
        elem.lineWidth = thickness;
        elem.centerX = offsetX;
        elem.centerY = offsetY;
        elem.radiusX = 0;
        elem.radiusY = 0;
        break;
      case "rectangle":
        elem.type = "rectangle";
        elem.color = selectedColor;
        elem.lineWidth = thickness;
        elem.x1 = offsetX;
        elem.y1 = offsetY;
        elem.width = 0;
        elem.height = 0;
        break;
      case "grid":
        elem.type = "grid";
        elem.color = selectedColor;
        elem.lineWidth = thickness;
        elem.x1 = offsetX;
        elem.y1 = offsetY;
        elem.width = 0;
        elem.height = 0;
        elem.rows = 10;
        elem.columns = 10;
        break;
      case "line":
        elem.type = "line";
        elem.color = selectedColor;
        elem.lineWidth = thickness;
        elem.x1 = offsetX;
        elem.y1 = offsetY;
        elem.x2 = offsetX;
        elem.y2 = offsetY;
        break;
      case "arrow":
        elem.type = "arrow";
        elem.color = selectedColor;
        elem.lineWidth = thickness;
        elem.x1 = offsetX;
        elem.y1 = offsetY;
        elem.x2 = offsetX;
        elem.y2 = offsetY;
        elem.head = { style: "filled", angle: 0.523, length: 10 };
        break;
      case "path":
        elem.type = "path";
        elem.color = selectedColor;
        elem.lineWidth = thickness;
        elem.path = [{ x: offsetX, y: offsetY }];
        break;
      default:
        break;
    }
    setElements([...elements, elem]);
    setInitialCoord({ x1: offsetX, y1: offsetY });
    setAction("drawing");
  };

  const handleMouseMove = (event) => {
    const { offsetX, offsetY } = event.nativeEvent;
    const elementsCopy = [...elements];

    if (tool === "select" && action !== "moving") {
      getElementAtPosition(offsetX, offsetY);
    }

    if (tool === "eraser") {
      getElementAtPosition(offsetX, offsetY);

      if (isOverElement && action === "erasing") {
        deleteElement();
        setIsOverElement(false);
        clearCanvas();
        drawElements();
        return;
      }
    }

    if (action === "none") return;
    if (action === "typing") return;

    if (action === "drawing") {
      const lastIndex = [elements.length - 1];
      const elem = {};

      switch (tool) {
        case "ellipse":
          elem.type = "ellipse";
          elem.color = selectedColor;
          elem.lineWidth = thickness;
          elem.centerX = (offsetX + initialCoord.x1) / 2;
          elem.centerY = (offsetY + initialCoord.y1) / 2;
          elem.radiusX = Math.abs(offsetX - initialCoord.x1) / 2;
          elem.radiusY = Math.abs(offsetY - initialCoord.y1) / 2;
          break;
        case "rectangle":
          elem.type = "rectangle";
          elem.color = selectedColor;
          elem.lineWidth = thickness;
          elem.x1 = initialCoord.x1;
          elem.y1 = initialCoord.y1;
          elem.width = offsetX - initialCoord.x1;
          elem.height = offsetY - initialCoord.y1;
          break;
        case "grid":
          elem.type = "grid";
          elem.color = selectedColor;
          elem.lineWidth = thickness;
          elem.x1 = initialCoord.x1;
          elem.y1 = initialCoord.y1;
          elem.width = offsetX - initialCoord.x1;
          elem.height = offsetY - initialCoord.y1;
          elem.rows = 10;
          elem.columns = 10;
          break;
        case "line":
          elem.type = "line";
          elem.color = selectedColor;
          elem.lineWidth = thickness;
          elem.x1 = initialCoord.x1;
          elem.y1 = initialCoord.y1;
          elem.x2 = offsetX;
          elem.y2 = offsetY;
          break;
        case "arrow":
          elem.type = "arrow";
          elem.color = selectedColor;
          elem.lineWidth = thickness;
          elem.x1 = initialCoord.x1;
          elem.y1 = initialCoord.y1;
          elem.x2 = offsetX;
          elem.y2 = offsetY;
          elem.head = { style: "filled", angle: 0.523, length: 10 };
          break;

        case "path":
          elem.type = "path";
          elem.color = selectedColor;
          elem.lineWidth = thickness;
          elem.path = [
            ...elements[elements.length - 1].path,
            { x: offsetX, y: offsetY },
          ];
          break;
        default:
          break;
      }
      elementsCopy[lastIndex] = elem;
    }

    if (action === "moving") {
      const elem = { ...selectedElement };
      const deltaX = offsetX - initialCoord.x1;
      const deltaY = offsetY - initialCoord.y1;

      switch (selectedElement.type) {
        case "ellipse":
          elem.centerX = elem.centerX + deltaX;
          elem.centerY = elem.centerY + deltaY;
          break;
        case "rectangle":
        case "grid":
        case "text":
          elem.x1 = elem.x1 + deltaX;
          elem.y1 = elem.y1 + deltaY;
          break;
        case "line":
        case "arrow":
          elem.x1 = elem.x1 + deltaX;
          elem.y1 = elem.y1 + deltaY;
          elem.x2 = elem.x2 + deltaX;
          elem.y2 = elem.y2 + deltaY;
          break;
        case "path":
          const newPath = [];
          selectedElement.path.forEach((point) =>
            newPath.push({ x: point.x + deltaX, y: point.y + deltaY })
          );
          elem.path = newPath;
          break;
        default:
          break;
      }
      elementsCopy[selectedElementIndex] = elem;
    }
    setElements(elementsCopy);
    clearCanvas();
    drawElements();
  };

  const handleMouseUp = ({ nativeEvent }) => {
    if (tool === "text") return;
    setAction("none");
    setIsOverElement(false);
    clearCanvas();
    drawElements();
  };

  const Circle = ({ colorGroup, name }) => (
    <svg
      key={`${name}${saturation}`}
      onClick={() => setSelectedColorGroup(colorGroup)}
      height="50"
      width="28"
      className="hover-pointer"
    >
      <circle
        cx="14"
        cy="25"
        r={
          selectedColor === colorGroup[saturation]
            ? 0.3 * thickness + 7
            : 0.3 * thickness + 4
        }
        fill={colorGroup[saturation]}
        stroke={
          selectedColor === colorGroup[saturation]
            ? "rgba(120,120,120,0.4)"
            : "transparent"
        }
        strokeWidth="4"
      />
    </svg>
  );

  return (
    <Box className="flex row relative">
      <Box className="flex column padding-light align-center" maxWidth="50px">
        <IconButton
          onClick={() => setTool("select")}
          style={tool === "select" ? highlight : null}
        >
          <OpenWith />
        </IconButton>
        <IconButton
          onClick={() => setTool("eraser")}
          style={tool === "eraser" ? highlight : null}
        >
          <Eraser
            strokeColor={tool === "eraser" ? "black" : "rgba(0,0,0,0.54)"}
          />
        </IconButton>
        <Button
          onClick={() => setTool("text")}
          style={tool === "text" ? highlight : { color: "rgba(0,0,0,0.54)" }}
        >
          ABC
        </Button>

        <IconButton
          onClick={() => setTool("path")}
          style={tool === "path" ? highlight : null}
        >
          <Edit />
        </IconButton>
        <IconButton
          onClick={() => setTool("ellipse")}
          style={tool === "ellipse" ? highlight : null}
        >
          <Ellipse />
        </IconButton>
        <IconButton
          onClick={() => setTool("rectangle")}
          style={tool === "rectangle" ? highlight : null}
        >
          <Crop54 />
        </IconButton>
        <IconButton
          onClick={() => setTool("grid")}
          style={tool === "grid" ? highlight : null}
        >
          <GridOn />
        </IconButton>
        <IconButton
          onClick={() => setTool("line")}
          style={tool === "line" ? highlight : null}
        >
          <Line />
        </IconButton>
        <IconButton
          onClick={() => setTool("arrow")}
          style={tool === "arrow" ? highlight : null}
        >
          <Arrow />
        </IconButton>
      </Box>

      <canvas
        style={{
          backgroundColor: "#F8F8F8",
          position: "relative",
        }}
        className={pickCursor(tool, isOverElement)}
        width={canvasWidth}
        height={canvasHeight}
        tabIndex="0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onBlur={handleBlur}
        ref={canvasRef}
      />

      <Box
        className="flex row align-center absolute space-between"
        width="700px"
        style={{ top: "10px", left: "100px" }}
      >
        <Box>
          <Circle name="grayscale" colorGroup={grayscale} />
          <Circle name="blues" colorGroup={blues} />
          <Circle name="greens" colorGroup={greens} />
          <Circle name="purples" colorGroup={purples} />
          <Circle name="corals" colorGroup={corals} />
        </Box>

        <Box className="flex align-center">
          <Typography
            className="relative"
            style={{ marginRight: "10px", bottom: "2px" }}
            variant="caption"
          >
            saturation
          </Typography>
          <Box width="130px">
            <HorizontalSlider
              defaultValue={30}
              style={{ color: "gray" }}
              value={saturation}
              onChange={changeSaturation}
              min={0}
              max={5}
            />
          </Box>
        </Box>

        <Box className="flex align-center">
          <Typography
            className="relative"
            style={{ marginRight: "10px", bottom: "2px" }}
            variant="caption"
          >
            thickness
          </Typography>
          <Box width="130px">
            <HorizontalSlider
              defaultValue={30}
              style={{ color: "gray", marginTop: "2px" }}
              value={thickness}
              onChange={changeThickness}
              min={0.2}
              max={10}
            />
          </Box>
        </Box>
        <Button
          style={{ color: "gray", fontSize: "13px" }}
          onClick={() => {
            clearCanvas();
            setElements([]);
            setAction("none");
          }}
        >
          CLEAR
        </Button>
      </Box>
      {fullscreenOption && (
        <Box
          className="absolute"
          style={{
            top: "5px",
            left: `${canvasWidth - 20}px`,
          }}
        >
          <IconButton
            className="absolute hover-pointer"
            style={{
              top: "10px",
              left: 40,
              color: "rgba(0,0,0,0.54)",
            }}
            href={"/whiteboard/fullscreen"}
            rel="noreferrer"
            target="_blank"
          >
            <OpenInNew style={{ fontSize: "18px" }} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
