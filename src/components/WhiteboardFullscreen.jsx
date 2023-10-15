import { Box } from "@material-ui/core";
import DrawingCanvas from "../app/utils/DrawingCanvas";
import MainNavBar from "./MainNavBar";

export default function WhiteboardFullscreen() {
  return (
    <>
      <MainNavBar />
      <Box className="whiteboard-full">
        <DrawingCanvas
          canvasWidth={window.innerWidth}
          canvasHeight={window.innerHeight}
          fullscreenButton={false}
        />
      </Box>
    </>
  );
}
