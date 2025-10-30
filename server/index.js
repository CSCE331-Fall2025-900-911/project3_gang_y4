const express = require("express");
const app = express();
const PORT = process.env.PORT || 10000;

// Simple API route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express backend!" });
});

// Default route
app.get("/", (req, res) => {
  res.send("Express backend is running ✅");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
