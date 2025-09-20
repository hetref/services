import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(express.json());

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, "search-logs.csv");

// Initialize CSV file with headers if it doesn't exist
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, "timestamp,search_query\n");
  console.log("CSV file initialized with headers");
}

// API endpoint to log search queries
app.post("/search-logs", async (req, res) => {
  try {
    const { searchQuery } = req.body;
    
    if (!searchQuery) {
      return res.status(400).json({ 
        error: "searchQuery is required" 
      });
    }

    const timestamp = new Date().toISOString();
    const cleanSearchQuery = searchQuery.replace(/,/g, ';'); // Replace commas to avoid CSV issues

    // Write directly to CSV file
    const csvLine = `${timestamp},${cleanSearchQuery}\n`;
    fs.appendFileSync(logFilePath, csvLine);
    
    console.log(`Search log written to CSV: ${searchQuery}`);
    
    res.status(200).json({ 
      message: "Search logged successfully", 
      timestamp: timestamp
    });
  } catch (error) {
    console.error("Error in search logging:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).send(err.message);
});

app.listen(8002, () => {
  console.log("Search logs service is running on port 8002");
  console.log(`CSV file location: ${logFilePath}`);
});