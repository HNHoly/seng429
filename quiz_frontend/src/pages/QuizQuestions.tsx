import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; 
import { getQuizQuestions } from "../api/userApi";
import Container from "../comps/Container";
import Topheader from "../comps/Topheader";
import LeftSideBar from "../comps/leftSidebar";
import { styled } from "styled-components";

const Layout = styled.div`
 	display: flex;
`;

const HistoryTitle = styled.h1`
	margin-bottom: 20px;
	color: rgb(224, 244, 255);
	font-size: 2rem;
`;

const HistoryContainer = styled.div`
	flex-grow: 1;
	padding: 20px;

	height: 86vh; /* Sets a fixed height relative to the viewport */
	overflow-y: auto; /* Makes the container scrollable */
`;

const HistoryCard = styled.div`
	border: 1px solid #ddd;
	padding: 20px;
	margin-bottom: 15px;
	border-radius: 10px;
	background-color: rgba(46, 46, 46, 0.91);
	color: rgb(255, 255, 255);
	border: 1px solid rgb(102, 102, 102);
`;

const OptionsContainer = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 20px; /* Add spacing between options */
`;

const Option = styled.div<{ isCorrect: boolean; isSelected: boolean }>`
	background-color: ${({ isCorrect, isSelected }) =>
			isCorrect
				? "rgb(26, 197, 49)" // Green for correct
				: isSelected
					? "rgb(224, 16, 16)" // Red for wrong
					: "rgb(80, 80, 80)"};
	flex: 1 1 200px; /* Makes each option grow and have a base width of 200px */
	text-align: center;
	padding: 10px;
	border-radius: 20px;
	color: ${({ isCorrect, isSelected }) =>
			isCorrect || isSelected ? "white" : "white"};
	font-weight: ${({ isCorrect, isSelected }) =>
			isCorrect || isSelected ? "bold" : "normal"};
	border: 1px solid rgb(160, 160, 160);
	margin: 8px;

	img {
		width: 250px;
		height: 250px;
		object-fit: cover;
		border-radius: 20px;
	}
`;

interface Question {
	id: number;
	text: string;
	choices: string[];
	correct_index: number;
	user_answer_index: number;
	// Add other question properties
}

const QuizQuestions: React.FC = () => {
	const { quizId } = useParams(); // Get quizId from URL
	const [questions, setQuestions] = useState<Question[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchQuestions = async () => {
			if (!quizId) {
				setError("Quiz ID is missing.");
				return;
			}

			try {
				const data = await getQuizQuestions(Number(quizId)); // Fetch questions by quizId
				setQuestions(data);
			} catch (err: any) {
				setError("Failed to fetch questions.");
			}
		};

		fetchQuestions();
	}, [quizId]); // Re-run effect when quizId changes

	return (
		<Container gradient="linear-gradient(0deg,rgb(0, 0, 0),rgb(5, 143, 255))">
			<Topheader />
			<Layout>
				<LeftSideBar></LeftSideBar>
				<HistoryContainer>
					<HistoryTitle>Answered Questions History</HistoryTitle>
					{questions.length > 0 ? (
						questions.map((item) => (
							<HistoryCard key={item.id}>
								<p>
									<strong>Question:</strong> {item.text}
								</p>
								<OptionsContainer>
									{item.choices.map((choice, index) => (
										<Option
											key={index}
											isCorrect={index === item.correct_index}
											isSelected={index === item.user_answer_index}
										>
											{choice.startsWith("http") ? ( // Too lazy to fetch questionType
												<img src={choice} alt={`Option ${index}`} />
											) : (
												<span>{choice}</span> // Shows the choices as text instead of images if it is not a link
											)}
										</Option>
									))}
								</OptionsContainer>
							</HistoryCard>
						))
					) : (
						<p>No answered questions found.</p>
					)}
				</HistoryContainer>
			</Layout>
		</Container>
	);
};

export default QuizQuestions;
