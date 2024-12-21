import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = 3000;

// Use pg.Pool for better connection management
const pool = new pg.Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Variable to hold the quiz data
let quiz = [];
let totalCorrect = 0;
let currentQuestion = {};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Function to load quiz data from the database
const loadQuizData = async () => {
  try {
    const res = await pool.query("SELECT * FROM capitals");
    quiz = res.rows;  // Store quiz data
    console.log(`Loaded ${quiz.length} quiz questions`);
  } catch (err) {
    console.error("Error loading quiz data:", err.stack);
  }
};

// Function to get a random question
async function nextQuestion() {
  if (quiz.length === 0) {
    await loadQuizData(); // Ensure quiz data is loaded before selecting a question
  }

  const randomCountry = quiz[Math.floor(Math.random() * quiz.length)];
  currentQuestion = randomCountry;
}

// GET home page
app.get("/", async (req, res) => {
  totalCorrect = 0;
  await nextQuestion();  // Wait for quiz data to be loaded before fetching the question
  console.log(currentQuestion); // Debug log
  if (!currentQuestion.country) {
    return res.status(500).send("Error: Could not fetch quiz data.");
  }
  res.render("index.ejs", { question: currentQuestion });
});

// POST submit answer
app.post("/submit", async (req, res) => {
  let answer = req.body.answer.trim();
  let isCorrect = false;

  if (currentQuestion.capital.toLowerCase() === answer.toLowerCase()) {
    totalCorrect++;
    console.log(totalCorrect);
    isCorrect = true;
  }

  await nextQuestion();  // Load the next question
  res.render("index.ejs", {
    question: currentQuestion,
    wasCorrect: isCorrect,
    totalScore: totalCorrect,
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
