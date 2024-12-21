import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3000;

// Define the pg pool (recommended for better performance)
const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432, // Default to 5432 if DB_PORT is not defined
});

let quiz = [];
let totalCorrect = 0;
let currentQuestion = {};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Get home page
app.get("/", async (req, res) => {
  totalCorrect = 0;
  await nextQuestion();
  console.log(currentQuestion); // Debug log
  if (!currentQuestion.country) {
    return res.status(500).send("Error: Could not fetch quiz data.");
  }
  res.render("index.ejs", { question: currentQuestion });
});

// Post submit answer
app.post("/submit", async (req, res) => {
  let answer = req.body.answer.trim();
  let isCorrect = false;

  if (currentQuestion.capital.toLowerCase() === answer.toLowerCase()) {
    totalCorrect++;
    console.log(totalCorrect);
    isCorrect = true;
  }

  await nextQuestion();
  res.render("index.ejs", {
    question: currentQuestion,
    wasCorrect: isCorrect,
    totalScore: totalCorrect,
  });
});

// Fetch a random question
async function nextQuestion() {
  if (quiz.length === 0) {
    await loadQuizData(); // Ensure quiz data is loaded before selecting a question
  }

  if (quiz.length > 0) {
    const randomCountry = quiz[Math.floor(Math.random() * quiz.length)];
    currentQuestion = randomCountry;
  } else {
    console.error("Quiz data is empty.");
  }
}

// Load quiz data from the database once at the start
async function loadQuizData() {
  try {
    const res = await pool.query("SELECT * FROM capitals");
    quiz = res.rows;
    console.log("Quiz data loaded:", quiz.length, "questions available");
  } catch (err) {
    console.error("Error loading quiz data:", err.stack);
  }
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
