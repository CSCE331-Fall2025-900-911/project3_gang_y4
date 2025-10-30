import React, { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState("Loading...");

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || ""}/api/hello`)
      .then((res) => res.json())
      .then((data) => setData(data.message))
      .catch(() => setData("Error connecting to backend"));
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>React + Express Test</h1>
      <p>{data}</p>
    </div>
  );
}

export default App;
