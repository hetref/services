import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();

app.use(
  cors({
    origin: "*",
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

// API endpoint to get most recent 10 unique search queries (no duplicates, case-insensitive)
app.get('/search-logs/recent', (req, res) => {
  try {
    if (!fs.existsSync(logFilePath)) {
      return res.json({ logs: [] });
    }

    const data = fs.readFileSync(logFilePath, 'utf8');
    // split into non-empty lines
    const lines = data.split(/\r?\n/).filter((l) => l.trim() !== '');

    // If only header or empty
    if (lines.length <= 1) {
      return res.json({ logs: [] });
    }

    const results = [];
    const seen = new Set();

    // iterate from bottom (most recent) to top, skip header at index 0
    for (let i = lines.length - 1; i > 0 && results.length < 10; i--) {
      const line = lines[i].trim();
      if (!line) continue;

      // split only at first comma to allow commas (if any) in query (we already replace commas on write)
      const idx = line.indexOf(',');
      if (idx === -1) continue; // malformed line

      const timestamp = line.slice(0, idx);
      const searchQuery = line.slice(idx + 1);
      const key = searchQuery.trim().toLowerCase();

      if (seen.has(key)) continue; // skip duplicates (case-insensitive)
      seen.add(key);

      results.push({ timestamp, searchQuery });
    }

    // results are in most-recent-first order. Return as-is.
    return res.json({ logs: results });
  } catch (error) {
    console.error('Error reading recent logs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).send(err.message);
});

app.listen(8005, () => {
  console.log("Search logs service is running on port 8005");
  console.log(`CSV file location: ${logFilePath}`);
});