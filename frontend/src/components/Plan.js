"use client";
import {
  useAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
  useReadContract,
  useChainId,
  usePublicClient,
} from "wagmi";
import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { maxUint256, erc20Abi, parseUnits } from "viem";
import { saveFiAbi, SAVEFI_ADDRESS, USDC_ADDRESS } from "../constants";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState("");
  const [modalContent, setModalContent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSepolia, setIsSepolia] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [resultObject, setResultObject] = useState(null);
  const { switchChain } = useSwitchChain();
  const { address } = useAccount();

  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: chainId });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatPrompt = `You are a smart financial assistant helping the user design a personalized long-term savings plan based on their real financial situation.

Start with a friendly introduction and explain what you need.

Then ask the user to provide:
1. Their average monthly income in detail (e.g. Salary, Freelance, Passive income)
2. Their average monthly expenses in detail (e.g. Rent, Food, Subscriptions, etc.)
3. Optionally, ask for their savings goal (what they are saving for, and how much they wish to save).  
   Example: "I want to save $20,000 to buy a car."

Once the above information is collected, calculate:
- Monthly net income = income - expenses
- A realistic fixed monthly savings amount (should not exceed 60% of net income)

Determine the savings duration using one of the following approaches:

- **If the user provided a savings goal amount**, calculate the number of months needed to reach that goal using:  
  months = goalAmount / monthlySavings  
  Ensure it's at least 12 months (1 year) and round up to the nearest whole month.

- **If no savings goal is provided**, estimate a suitable duration between 12 and 60 months, based on how much the user can comfortably save:
  - Use a longer duration (e.g. 48–60 months) if their savings capacity is low
  - Use a shorter duration (e.g. 12–24 months) if their savings capacity is high

Always return **one clear recommendation**:

"Based on your financial situation goalInfo, I recommend saving $___ per month for ___ months (approx. ___ years)."

Then ask:

"If this looks good to you, click the **Submit** button below to confirm your savings plan."

Be friendly, supportive, and guide the user step-by-step. Never show multiple options — always return a single recommended savings amount and period.
`;

  const submitPrompt = `You are a smart savings assistant helping the user generate a personalized savings plan.

    From the previous conversation, if a sentence such as:
    
    "Based on your financial situation, I recommend saving $___ per month for ___ months..."
    
    or anything similar is present, extract and validate the following fields:
    
    1. Monthly Deposit Amount:
       - Must be a valid positive number greater than 0.
    
    2. Total Deposit Duration:
       - Convert months to days (using 1 month = 30 days).
       - Must be a valid number, minimum 1.
    
    ⚠️ Important:  
    If both fields are valid, return the result in **strict JSON format only** — no additional text, comments, explanations, or markdown formatting.  
    If any field is missing or invalid, return only an error message indicating the specific issue.
    
    ✅ Example output (when valid):
    {
      "amountPerDeposit": 438,
      "totalDepositDays": 720
    }
    `;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setMessages([
      {
        role: "system",
        content: `Welcome to SaveFi 👋
  
  I'm your smart assistant here to help you plan long-term savings.
  
  First, list your average monthly income sources and amounts.  
  Example: Salary: $2500, Freelance: $400
  
  What are your income sources?`,
      },
    ]);
    scrollToBottom();
  }, []);

  const { data: allowance } = useReadContract({
    abi: erc20Abi,
    address: USDC_ADDRESS,
    functionName: "allowance",
    args: [address, SAVEFI_ADDRESS],
  });

  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
  } = useWriteContract({});

  const { writeContractAsync } = useWriteContract({});

  const {
    error1,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setIsSepolia(chainId === 11155111);
  }, [chainId]);

  useEffect(() => {
    if (isConfirmed) {
      setShowSuccessModal(true);
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (writeError || error) {
      setShowErrorModal(true);
    }
  }, [writeError, error1]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages, loading]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setError("");

    const newMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    setLoading(true);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: chatPrompt },
            ...updatedMessages,
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!res.ok) {
        throw new Error(`API responded with status ${res.status}`);
      }

      const data = await res.json();

      if (data.choices && data.choices[0].message) {
        setMessages([...updatedMessages, data.choices[0].message]);
      } else {
        throw new Error("Invalid response format from API");
      }
    } catch (error) {
      setError(`Error: ${error.message}`);
      console.error("Error fetching OpenAI response:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setLoadingSubmit(true);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: submitPrompt }, ...messages],
          temperature: 0.5,
          max_tokens: 1000,
        }),
      });

      if (!res.ok) {
        throw new Error(`API responded with status ${res.status}`);
      }

      const data = await res.json();

      if (data.choices && data.choices[0].message) {
        const resultText = data.choices[0].message.content;
        console.log("Result text:", resultText);
        let formattedContent;
        try {
          const jsonMatch = resultText.match(/{[\s\S]*}/);
          if (!jsonMatch) {
            console.error("No JSON object found in response");
          }
          const resultObj = JSON.parse(jsonMatch[0]);
          setShowConfirmButton(true);
          setResultObject(resultObj);
          formattedContent = (
            <div className="text-white">
              <div className="mb-4">
                <p className="text-lg font-semibold">Monthly Deposit Amount:</p>
                <p className="text-sm">{resultObj.amountPerDeposit} USDC</p>
              </div>

              <div className="mb-4">
                <p className="text-lg font-semibold">Total Deposit Duration:</p>
                <p className="text-sm">{resultObj.totalDepositDays} days</p>
              </div>
            </div>
          );
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          formattedContent = <pre>{resultText}</pre>;
        }
        setModalContent(formattedContent);
        setModalOpen(true);
      } else {
        throw new Error("Invalid response format from API");
      }
    } catch (error) {
      setError(`Error: ${error.message}`);
      console.error("Error fetching submit response:", error);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleConfirm = async (resultObj) => {
    setIsLoading(true);
    try {
      const requiredAllowance = parseUnits(
        resultObj.amountPerDeposit.toString(),
        6
      );

      if (allowance < requiredAllowance) {
        const approveHash = await writeContractAsync({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          args: [SAVEFI_ADDRESS, maxUint256],
        });

        await publicClient.waitForTransactionReceipt({
          hash: approveHash,
        });
      }

      writeContract({
        address: SAVEFI_ADDRESS,
        abi: saveFiAbi,
        functionName: "startDeposit",
        args: [requiredAllowance, resultObj.totalDepositDays],
      });
    } catch (error) {
      setIsLoading(false);
      console.error("Error submitting deposit:", error);
    }
  };

  const SuccessModal = () => (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 z-60"
      role="dialog"
      aria-labelledby="success-title"
      aria-modal="true"
    >
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center transform transition-all duration-300 scale-95">
        <h2
          id="success-title"
          className="text-3xl font-bold text-green-400 mb-4"
        >
          Success!
        </h2>
        <p className="text-gray-300 mb-4">
          Your transaction has been confirmed.
        </p>
        {hash && (
          <div className="bg-gray-700 p-4 rounded-lg text-left text-sm text-gray-400 mb-4">
            <strong>Transaction Hash:</strong>{" "}
            <span className="break-all">{hash}</span>
          </div>
        )}
        <button
          onClick={() => {
            setShowSuccessModal(false);
            setIsLoading(false);
            setModalOpen(false);
          }}
          className="mt-6 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow transition-all duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );

  const ErrorModal = () => (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 z-60"
      role="dialog"
      aria-labelledby="error-title"
      aria-modal="true"
    >
      <div className="bg-gray-800 w-2/3 p-6 rounded-lg shadow-lg text-center transform transition-all duration-300 scale-95">
        <h2 id="error-title" className="text-3xl font-bold text-red-400 mb-4">
          Error!
        </h2>
        <p className="text-gray-300">
          {writeError?.shortMessage || error?.shortMessage}
        </p>
        {hash && (
          <div className="bg-gray-700 p-4 rounded-lg text-left text-sm text-gray-400">
            <strong>Transaction Hash:</strong>{" "}
            <span className="break-all">{hash}</span>
          </div>
        )}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-4 px-6 py-2 mr-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-all duration-200"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
        {showDetails && (
          <div className="mt-4 p-4 bg-gray-700 rounded text-left text-sm text-gray-400">
            <pre>{writeError?.message || error?.message}</pre>
          </div>
        )}
        <button
          onClick={() => {
            setShowErrorModal(false);
            setIsLoading(false);
          }}
          className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition-all duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-4 h-[90vh] flex flex-col bg-gray-900 text-white">
      <div className="flex-1 border rounded-lg p-4 overflow-y-auto bg-gray-800">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-700 shadow-sm rounded-bl-none"
              }`}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>AI is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-800 border border-red-600 rounded-lg text-red-200">
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 p-3 border rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span>Send</span>
        </button>
      </div>

      <div className="mt-4">
        <button
          onClick={() => {
            if (!isSepolia && switchChain) {
              switchChain({ chainId: 11155111 });
            } else {
              handleSubmit();
            }
          }}
          disabled={loadingSubmit}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed w-full"
        >
          {loadingSubmit
            ? "Loading..."
            : isSepolia
            ? "Submit"
            : "Switch to Sepolia Testnet"}
        </button>
      </div>

      {showSuccessModal && <SuccessModal />}
      {showErrorModal && <ErrorModal />}
      {modalOpen && !showSuccessModal && !showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300 ease-out opacity-100">
          <div className="bg-gray-900 p-6 rounded-lg max-w-2xl w-full relative shadow-xl transform transition-transform duration-300 ease-out">
            <h2 className="text-2xl font-bold text-white mb-4">
              Submission Result
            </h2>
            <div className="text-sm text-gray-200">{modalContent}</div>
            <button
              onClick={() => {
                setModalOpen(false);
                setShowConfirmButton(false);
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            {showConfirmButton && (
              <div className="mt-4">
                <button
                  onClick={() => handleConfirm(resultObject)}
                  className={`px-5 py-2.5 rounded-lg shadow-lg transition-all duration-300 
             ${
               isLoading || isPending || isConfirming
                 ? "bg-gray-400 cursor-not-allowed"
                 : "bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95"
             } 
             text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={isLoading || isPending || isConfirming}
                >
                  {isLoading || isPending || isConfirming
                    ? "Confirming..."
                    : "Confirm"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
