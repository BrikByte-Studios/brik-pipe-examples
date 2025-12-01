/**
 * BrikByteOS — HTTP bootstrapper
 * Express app runs here only when executed manually (not during tests)
 */

import app from "./src/index.js";

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`API running on http://localhost:${port}`)
);
