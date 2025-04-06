"use client";
import { useEffect, useState } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
  useReadContract,
  useChainId,
  usePublicClient,
} from "wagmi";
import { maxUint256, erc20Abi, parseUnits } from "viem";
import * as MultiBaas from "@curvegrid/multibaas-sdk";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Loader2, UndoIcon } from "lucide-react";
import { saveFiAbi, SAVEFI_ADDRESS, USDC_ADDRESS } from "../constants";
import Link from "next/link";

const config = new MultiBaas.Configuration({
  basePath: process.env.NEXT_PUBLIC_MULTIBAAS_URL,
  accessToken: process.env.NEXT_PUBLIC_MULTIBAAS_API_KEY,
});
const contractsApi = new MultiBaas.ContractsApi(config);
const eventQueriesApi = new MultiBaas.EventQueriesApi(config);

const fetchDepositPlan = async (userAddress) => {
  const payload = { args: [userAddress] };
  const chain = "ethereum";
  const alias = "savefi5";
  const label = "savefi";

  const planResp = await contractsApi.callContractFunction(
    chain,
    alias,
    label,
    "getDepositPlan",
    payload
  );
  const totalDepositResp = await contractsApi.callContractFunction(
    chain,
    alias,
    label,
    "getUserTotalDepositedAmount",
    payload
  );
  const interestResp = await contractsApi.callContractFunction(
    chain,
    alias,
    label,
    "getUserTotalSaveTokenAmount",
    payload
  );

  return {
    plan: planResp.data.result.output,
    totalDeposited: Number(totalDepositResp.data.result.output) / 1e6,
    accruedSave: Number(interestResp.data.result.output) / 1e18,
  };
};

const fetchUserHistory = async (userAddress) => {
  const query = {
    order: "DESC",
    events: [
      {
        filter: {
          children: [
            {
              fieldType: "input",
              inputIndex: 0,
              operator: "Equal",
              value: userAddress.toString().toLowerCase(),
            },
          ],
          rule: "and",
        },
        select: [
          {
            name: "user",
            type: "input",
            alias: "",
            inputIndex: 0,
          },
          {
            name: "amount",
            type: "input",
            alias: "",
            inputIndex: 2,
          },
          {
            name: "triggered_at",
            type: "triggered_at",
            alias: "",
          },
          {
            name: "tx_hash",
            type: "tx_hash",
            alias: "",
          },
          {
            name: "event_signature",
            type: "event_signature",
            alias: "",
          },
        ],
        eventName:
          "DepositPlanStarted(address,address,uint256,uint256,uint256)",
      },
      {
        filter: {
          children: [
            {
              fieldType: "input",
              inputIndex: 0,
              operator: "Equal",
              value: userAddress.toString().toLowerCase(),
            },
          ],
          rule: "and",
        },
        select: [
          {
            name: "user",
            type: "input",
            alias: "",
            inputIndex: 0,
          },
          {
            name: "amount",
            type: "input",
            alias: "",
            inputIndex: 1,
          },
          {
            name: "triggered_at",
            type: "triggered_at",
            alias: "",
          },
          {
            name: "tx_hash",
            type: "tx_hash",
            alias: "",
          },
          {
            name: "event_signature",
            type: "event_signature",
            alias: "",
          },
        ],
        eventName: "Deposited(address,uint256,uint256,bool)",
      },
      {
        filter: {
          children: [
            {
              fieldType: "input",
              inputIndex: 0,
              operator: "Equal",
              value: userAddress.toString().toLowerCase(),
            },
          ],
          rule: "and",
        },
        select: [
          {
            name: "user",
            type: "input",
            alias: "",
            inputIndex: 0,
          },
          {
            name: "amount",
            type: "input",
            alias: "",
            inputIndex: 1,
          },
          {
            name: "triggered_at",
            type: "triggered_at",
            alias: "",
          },
          {
            name: "tx_hash",
            type: "tx_hash",
            alias: "",
          },
          {
            name: "event_signature",
            type: "event_signature",
            alias: "",
          },
        ],
        eventName: "Withdrawn(address,uint256,bool)",
      },
    ],
    orderBy: "triggered_at",
  };
  const resp = await eventQueriesApi.executeArbitraryEventQuery(query);
  return resp.data.result.rows;
};

export default function Dashboard() {
  const { address } = useAccount();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [earlyWithdrawing, setEarlyWithdrawing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState("");
  const [userHistory, setUserHistory] = useState([]);

  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: chainId });

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
    if (!address) return;

    const loadData = async () => {
      try {
        const planResult = await fetchDepositPlan(address);
        const userHistory = await fetchUserHistory(address);
        console.log("User History:", userHistory);
        setUserHistory(userHistory);
        setPlan({
          isWithdrawn: planResult.plan.isWithdrawn,
          isStarted: planResult.plan.isStarted,
          amountPerDeposit: Number(planResult.plan.amountPerDeposit) / 1e6,
          depositEndTime: new Date(
            Number(planResult.plan.depositEndTime) * 1000
          ),
          nextDepositDeadline: new Date(
            Number(planResult.plan.nextDepositDeadline) * 1000
          ),
          totalDeposited: planResult.totalDeposited,
          accruedSave: planResult.accruedSave,
        });
      } catch (err) {
        console.error("Multibaas error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [address, isConfirmed]);

  const handleDeposit = async () => {
    setDepositing(true);
    try {
      const requiredAllowance = parseUnits(plan.amountPerDeposit.toString(), 6);

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
        functionName: "deposit",
        args: [0],
      });
    } catch (error) {
      setDepositing(false);
      console.error("Error submitting deposit:", error);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      writeContract({
        address: SAVEFI_ADDRESS,
        abi: saveFiAbi,
        functionName: "withdraw",
        args: [0],
      });
    } catch (error) {
      setWithdrawing(false);
      console.error("Error submitting withdrawal:", error);
    }
  };

  const handleEarlyWithdraw = async () => {
    setEarlyWithdrawing(true);
    try {
      writeContract({
        address: SAVEFI_ADDRESS,
        abi: saveFiAbi,
        functionName: "earlyWithdraw",
        args: [0],
      });
    } catch (error) {
      setEarlyWithdrawing(false);
      console.error("Error submitting earlyWithdraw:", error);
    }
  };

  const parseEventName = (signature) => {
    if (!signature) return "Unknown";
    if (signature.startsWith("DepositPlanStarted")) return "Started Plan";
    if (signature.startsWith("Deposited")) return "Deposited";
    if (signature.startsWith("Withdrawn")) return "Withdrawn";
    return "Other";
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
            setDepositing(false);
            setWithdrawing(false);
            setEarlyWithdrawing(false);
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
            setDepositing(false);
            setWithdrawing(false);
            setEarlyWithdrawing(false);
          }}
          className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition-all duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-300 text-center px-4">
        <h2 className="text-2xl font-semibold mb-2">Wallet Not Connected</h2>
        <p className="text-sm mb-4">
          Please connect your wallet to view the dashboard.
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading dashboard...
      </div>
    );
  }

  if (!plan || !plan.isStarted) {
    const formatAmount = (event) => {
      const value = Number(event.amount) / 1e6;
      if (
        event.event_signature.startsWith("Deposited") ||
        event.event_signature.startsWith("DepositPlanStarted")
      ) {
        return { sign: "+", color: "text-green-400", value };
      }
      if (event.event_signature.startsWith("Withdrawn")) {
        return { sign: "-", color: "text-red-400", value };
      }
      return { sign: "", color: "text-white", value };
    };

    return (
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-12 text-white">
        {/* Plan Status */}
        <div className="flex flex-col items-center justify-center text-gray-300 space-y-4">
          <h2 className="text-2xl font-semibold">No Active Savings Plan</h2>
          <p className="text-sm">
            Start a savings plan with SaveFi to view your dashboard.
          </p>
          <Link href="/plan" legacyBehavior>
            <a className="bg-blue-600 hover:bg-blue-500 shadow-lg text-white py-4 px-8 rounded-lg text-lg font-semibold">
              Go to Create Plan
            </a>
          </Link>
        </div>

        {/* History */}
        <section className="bg-gray-800 p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold mb-6 text-center">History</h2>
          <div className="space-y-4">
            {userHistory.length === 0 ? (
              <p className="text-gray-400 text-center">No history found.</p>
            ) : (
              userHistory.map((event, idx) => {
                const { sign, color, value } = formatAmount(event);
                return (
                  <div
                    key={idx}
                    className="bg-gray-700 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center"
                  >
                    <div className="mb-2 sm:mb-0">
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                        {parseEventName(event.event_signature)}
                      </p>
                      <p className="text-sm text-gray-400">Amount</p>
                      <p className={`text-lg font-semibold ${color}`}>
                        {sign}
                        {value} USDC
                      </p>
                    </div>
                    <div className="mb-2 sm:mb-0">
                      <p className="text-sm text-gray-400">Timestamp</p>
                      <p className="text-sm text-white">
                        {new Date(event.triggered_at).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </div>
                    <div className="text-sm text-blue-400 truncate">
                      <Link
                        href={`https://sepolia.etherscan.io/tx/${event.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on Etherscan
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    );
  }

  const remainingDays = Math.max(
    0,
    Math.floor(
      (plan.depositEndTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );
  const cycleStart = new Date(
    plan.nextDepositDeadline.getTime() - 30 * 24 * 60 * 60 * 1000
  );

  return (
    <div className="max-w-6xl mx-auto p-6 text-white space-y-10">
      <h1 className="text-3xl font-bold text-center mb-8">Dashboard</h1>

      <section className="bg-gray-800 p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-6 text-center">
          Plan Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full">
            <p className="text-sm text-gray-400 mb-2">Amount per Deposit</p>
            <p className="text-2xl font-semibold">
              {plan.amountPerDeposit} USDC
            </p>
          </div>
          <div className="bg-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full">
            <p className="text-sm text-gray-400 mb-2">Deposit Window</p>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-semibold">
                {cycleStart.toDateString()}
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-2xl font-semibold">
                {plan.nextDepositDeadline.toDateString()}
              </span>
            </div>
          </div>
          <div className="bg-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full">
            <p className="text-sm text-gray-400 mb-2">Plan Ends In</p>
            <p className="text-2xl font-semibold">{remainingDays} days</p>
          </div>
        </div>
      </section>

      <section className="bg-gray-800 p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-6 text-center">Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full">
            <p className="text-sm text-gray-400 mb-2">Total Deposits</p>
            <p className="text-2xl font-semibold">{plan.totalDeposited} USDC</p>
          </div>
          <div className="bg-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full">
            <p className="text-sm text-gray-400 mb-2">Accrued $SAVE Interest</p>
            <p className="text-2xl font-semibold">{plan.accruedSave} $SAVE</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
        {Date.now() >= plan.depositEndTime.getTime() ? (
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow-lg w-full sm:w-auto">
            Withdraw
          </button>
        ) : Date.now() >= cycleStart.getTime() ? (
          <button
            onClick={handleDeposit}
            className={`text-white px-6 py-3 rounded-xl shadow-lg w-full sm:w-auto ${
              depositing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95"
            }`}
            disabled={depositing || isPending || isConfirming}
          >
            {depositing
              ? "Confirming..."
              : `Deposit ${plan.amountPerDeposit} USDC`}
          </button>
        ) : (
          <div className="relative group w-full sm:w-auto inline-flex items-center">
            <button
              className="bg-gray-600 cursor-not-allowed text-white px-6 py-3 rounded-xl shadow-lg w-full sm:w-auto pr-10"
              disabled
            >
              Deposit Not Available
            </button>
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="relative flex flex-col items-center">
                <div className="w-5 h-5 flex items-center justify-center bg-yellow-400 text-black font-bold rounded-full text-xs">
                  !
                </div>
                <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition bg-gray-700 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  Too early to deposit
                </div>
              </div>
            </div>
          </div>
        )}
        {plan.depositEndTime.getTime() <= Date.now() ? (
          <button
            onClick={handleWithdraw}
            className={`bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow-lg w-full sm:w-auto pr-10${
              withdrawing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95"
            }`}
            disabled={withdrawing || isPending || isConfirming}
          >
            {withdrawing ? "Confirming..." : "Withdraw"}
          </button>
        ) : (
          <button
            onClick={handleEarlyWithdraw}
            className={`bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl shadow-lg w-full sm:w-auto pr-10${
              earlyWithdrawing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95"
            }`}
            disabled={earlyWithdrawing || isPending || isConfirming}
          >
            {earlyWithdrawing ? "Confirming..." : "Unlock Early (Burn Rewards)"}
          </button>
        )}
      </section>

      <section className="bg-gray-800 p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-6 text-center">History</h2>
        <div className="space-y-4">
          {userHistory.length === 0 ? (
            <p className="text-gray-400 text-center">No history found.</p>
          ) : (
            userHistory.map((event, idx) => (
              <div
                key={idx}
                className="bg-gray-700 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center"
              >
                <div className="mb-2 sm:mb-0">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                    {parseEventName(event.event_signature)}
                  </p>
                  <p className="text-sm text-gray-400">Amount</p>
                  <p
                    className={`text-lg font-semibold ${
                      event.event_signature.startsWith("Deposited") ||
                      event.event_signature.startsWith("DepositPlanStarted")
                        ? "text-green-400"
                        : event.event_signature.startsWith("Withdrawn")
                        ? "text-red-400"
                        : "text-white"
                    }`}
                  >
                    {event.event_signature.startsWith("Deposited") ||
                    event.event_signature.startsWith("DepositPlanStarted")
                      ? `+${Number(event.amount) / 1e6}`
                      : event.event_signature.startsWith("Withdrawn")
                      ? `-${Number(event.amount) / 1e6}`
                      : `${Number(event.amount) / 1e6}`}{" "}
                    USDC
                  </p>
                </div>
                <div className="mb-2 sm:mb-0">
                  <p className="text-sm text-gray-400">Timestamp</p>
                  <p className="text-sm text-white">
                    {new Date(event.triggered_at).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
                <div className="text-sm text-blue-400 truncate">
                  <Link
                    href={`https://sepolia.etherscan.io/tx/${event.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Etherscan
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {showSuccessModal && <SuccessModal />}
      {showErrorModal && <ErrorModal />}
    </div>
  );
}
