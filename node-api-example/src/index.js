import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "Node API Example — BrikByteOS pipelines OK" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
