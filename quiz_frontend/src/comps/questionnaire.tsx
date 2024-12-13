import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import {
  fetchFavoriteTracks,
  generateAnswerOptions,
  generateTrackQuestion,
} from "../utils/spotifyUtils";
import { useUser } from "../context/UserContext";
import { updateUserScore } from "../api/userApi";

const ChoiceButton = styled.button<{
  isCorrect?: boolean;
  isSelected?: boolean;
}>`
  background-color: ${({ isSelected, isCorrect }) =>
    isSelected ? (isCorrect ? "#4caf50" : "#e74c3c") : "#f9f9f9"};
  border: 1px solid #ccc;
  padding: 20px;
  font-size: 1rem;
  cursor: ${({ isSelected }) => (isSelected ? "not-allowed" : "pointer")};
  border-radius: 20px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  margin: 20px;

  &:hover {
    background-color: ${({ isSelected }) => (isSelected ? "" : "#ddd")};
  }

  img {
    width: 300px;
    height: 300px;
    object-fit: cover;
    border-radius: 5px;
  }
`;

const ResultMessage = styled.div`
  margin-top: 20px;
  font-size: 1.2rem;
  color: #333;
`;

const ScoreBoard = styled.div`
  margin-top: 20px;
  font-size: 2rem;
  color: black;
`;

const MenuButton = styled.button`
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;

interface Question {
  text: string;
  choices: string[];
  correctIndex: number;
  track?: any;
  questionType: string;
}

interface QuestionnaireProps {
  selectedType: string;
}

const Questionnaire: React.FC<QuestionnaireProps> = ({ selectedType }) => {
  const { user, setUser } = useUser();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const maxQuestions = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!user?.accessToken) {
        console.error("No access token found!");
        return;
      }

      try {
        let tracks = await fetchFavoriteTracks(user.accessToken);

        if (tracks.length === 0) {
          console.log("No favorite tracks found.");
          return;
        }
        tracks = [...tracks].sort(() => Math.random() - 0.5);

        const generatedQuestions: Question[] = await Promise.all(
          tracks.slice(0, maxQuestions).map(async (track) => {
            const questionType =
              selectedType === "random"
                ? ["release_date", "artist", "popularity", "album_cover"][
                    Math.floor(Math.random() * 4)
                  ]
                : selectedType;

            const { question, correctAnswer } = generateTrackQuestion(
              track,
              questionType
            );

            const answerOptions = generateAnswerOptions(
              correctAnswer,
              questionType,
              tracks
            );

            const textOptions = answerOptions.map((option) => String(option));

            return {
              text: question,
              choices: textOptions,
              correctIndex: textOptions.indexOf(String(correctAnswer)),
              track,
              questionType,
            };
          })
        );

        setQuestions(generatedQuestions.slice(0, maxQuestions));
      } catch (error) {
        console.error("Error fetching tracks or generating questions:", error);
      }
    };

    fetchQuestions();
  }, [user?.accessToken, selectedType]);

  const navToHome = () => {
    navigate("/home");
  };

  const handleChoiceClick = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    const correct = index === questions[currentQuestion].correctIndex;
    setIsCorrect(correct);
    if (correct) {
      setScore((prev) => prev + 10);
    }
  };

  const handleNextQuestion = () => {
    setSelected(null);
    setIsCorrect(null);
    setCurrentQuestion((prev) => prev + 1);
  };

  const isQuizOver = currentQuestion >= questions.length;

  const handleScoreUpdate = async () => {
    if (user) {
      try {
        const updatedUser = await updateUserScore(
          user.name,
          user.points + score
        );
        setUser({ ...user, points: updatedUser.score });
      } catch (error) {
        console.error("Failed to update score:", error);
      }
    }
  };

  return (
    <div>
      {isQuizOver ? (
        <div>
          <h1>Quiz Completed!</h1>
          <ScoreBoard>
            Your Score: {score} / {questions.length * 10}
          </ScoreBoard>
          <MenuButton
            onClick={async () => {
              await handleScoreUpdate();
              navToHome();
            }}
          >
            Return to Menu
          </MenuButton>
        </div>
      ) : (
        <>
          <div>
            <h1>{questions[currentQuestion].text}</h1>

            <div>
              {questions[currentQuestion].choices.map((choice, index) => (
                <ChoiceButton
                  key={index}
                  onClick={() => handleChoiceClick(index)}
                  isSelected={selected === index}
                  isCorrect={index === questions[currentQuestion].correctIndex}
                >
                  {questions[currentQuestion].questionType === "album_cover" ? (
                    <img src={choice} alt={`Choice ${index}`} />
                  ) : (
                    <span>{choice}</span>
                  )}
                </ChoiceButton>
              ))}
            </div>
            <ScoreBoard>Score: {score}</ScoreBoard>

            {selected !== null && (
              <>
                <ResultMessage
                  style={{
                    marginTop: "20px",
                    fontSize: "1.5rem",
                    color: isCorrect ? "green" : "red",
                  }}
                >
                  {isCorrect ? "Correct!" : "Wrong!"}
                </ResultMessage>
                <button
                  style={{
                    border: "2px solid black",
                    marginTop: "20px",
                    padding: "10px 20px",
                    backgroundColor: "white",
                    color: "black",
                    cursor: "pointer",
                  }}
                  onClick={handleNextQuestion}
                >
                  Next Question
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Questionnaire;
