import { Box, TextField } from "@material-ui/core";
import { useState } from "react";
import { wolframExprToTeX } from "../../app/utils/expressionTranslators.js";
import TeX from "@matejmazur/react-katex";

export default function ExprToTeX() {
  const [expression, setExpression] = useState("");
  const handleChange = (e) => setExpression(() => e.target.value);
  return (
    <Box className="padding-medium">
      <TextField fullWidth variant="outlined" onChange={handleChange} />
      <pre>{expression}</pre>
      <pre>{JSON.stringify(wolframExprToTeX(expression, null, 2))}</pre>
      <TeX>{wolframExprToTeX(expression, null, 2)}</TeX>
    </Box>
  );
}
