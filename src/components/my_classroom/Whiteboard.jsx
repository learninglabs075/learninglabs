import { Box } from "@material-ui/core";
import DrawingCanvas from "../../app/utils/DrawingCanvas.jsx";

export default function Whiteboard() {
  return (
    <Box className="display-area">
      <DrawingCanvas
        canvasWidth={1.15 * 950}
        canvasHeight={1.14 * 605}
        fullscreenOption={true}
      />
    </Box>
  );
}
