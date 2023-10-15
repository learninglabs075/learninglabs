import { Box, Typography } from "@material-ui/core";

export default function AccessRestricted() {
  return (
    <Box className="flex-center-all column full-width full-height">
      <img
        src={process.env.REACT_APP_ACCESS_RESTRICTED_IMAGE}
        alt="fish"
        width="30%"
      />
      <Box className="padding-medium">
        <Typography>
          You are not authorized to access this area of the website
        </Typography>
      </Box>
    </Box>
  );
}
