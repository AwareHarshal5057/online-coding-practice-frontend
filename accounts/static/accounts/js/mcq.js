
const MCQ_API_URL = "http://127.0.0.1:8000/api/mcq-questions/";
const MCQ_SUBMIT_URL = "http://127.0.0.1:8000/api/mcq-submit/";

let mcqQuestions = [];

console.log("MCQ JavaScript loaded successfully!");

// Load MCQ Questions
async function loadMCQQuestions() {
    const questionsList = document.getElementById("questions-list");
    const loading = document.getElementById("loading");

    try {
        const response = await fetch(MCQ_API_URL);

        if (!response.ok) {
            throw new Error("Unable to load questions");
        }

        mcqQuestions = await response.json();

        loading.style.display = "none";

        if (mcqQuestions.length === 0) {
            questionsList.innerHTML = "<p>No MCQ questions available.</p>";
            return;
        }

        questionsList.innerHTML = mcqQuestions.map((question, index) => `
            <div class="mcq-question">
                <h3>${index + 1}. ${question.question}</h3>

                ${question.options.map(option => `
                    <label>
                        <input
                            type="radio"
                            name="question_${question.id}"
                            value="${option.id}"
                        >
                        ${option.option_text}
                    </label>
                    <br>
                `).join("")}
            </div>
        `).join("");

    } catch (error) {
        loading.textContent = "Error loading questions: " + error.message;
        console.error(error);
    }
}


// Submit MCQ Answers
async function submitMCQQuiz() {
    const resultDiv = document.getElementById("quiz-result");
    const submitButton = document.getElementById("submit-quiz");

    const token = localStorage.getItem("authToken");

    if (!token) {
        resultDiv.textContent = "Please login again to submit your answers.";
        return;
    }

    if (mcqQuestions.length === 0) {
        resultDiv.textContent = "No questions available.";
        return;
    }

    // Check selected answers
    const answers = [];

    for (const question of mcqQuestions) {
        const selectedOption = document.querySelector(
            `input[name="question_${question.id}"]:checked`
        );

        if (!selectedOption) {
            resultDiv.textContent = "Please answer all questions first.";
            return;
        }

        answers.push({
            question: question.id,
            selected_option: Number(selectedOption.value)
        });
    }

    submitButton.disabled = true;
    resultDiv.textContent = "Submitting your answers...";

    let score = 0;
    let submittedCount = 0;

    try {
        for (const answer of answers) {

            const response = await fetch(MCQ_SUBMIT_URL, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify(answer)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(JSON.stringify(data));
            }

            submittedCount++;

            if (data.is_correct) {
                score++;
            }
        }

        resultDiv.innerHTML = `
            <h2>Quiz Completed!</h2>
            <p>Total Questions: ${submittedCount}</p>
            <p>Correct Answers: ${score}</p>
            <p>Wrong Answers: ${submittedCount - score}</p>
            <h3>Your Score: ${score} / ${submittedCount}</h3>
        `;

    } catch (error) {
        resultDiv.textContent =
            `${submittedCount} answers submitted. Error: ${error.message}`;

        console.error("MCQ Submit Error:", error);

    } finally {
        submitButton.disabled = false;
    }
}


// Button Click Event
document.getElementById("submit-quiz").addEventListener(
    "click",
    submitMCQQuiz
);


// Load questions when page opens
loadMCQQuestions();
