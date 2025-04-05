"use client";
import { useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import Header from "../components/Header";

export default function Home() {
  let index = 0;

  useEffect(() => {
    const text =
      "An AI-powered savings platform with DeFi yield, rewards, and smart contracts.";
    const speed = 40;
    const cursor = document.getElementById("cursor");
    const subtitle = document.getElementById("subtitle");

    if (subtitle) {
      subtitle.innerHTML = "";
    }

    function typeWriter() {
      if (index < text.length) {
        if (subtitle) {
          subtitle.innerHTML += text.charAt(index);
        }
        index++;
        setTimeout(typeWriter, speed);
      } else {
        if (cursor) {
          cursor.style.display = "none";
        }
      }
    }

    setTimeout(typeWriter, 500);
  }, []);

  return (
    <>
      <Head>
        <title>SaveFi</title>
        <meta
          name="description"
          content="AI-powered savings platform with DeFi yield, rewards, and smart contracts."
        />
      </Head>

      <main
        className="bg-black text-white min-h-screen"
        style={{ fontFamily: "Verdana" }}
      >
        <Header />
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden px-6">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/savefi_bg.png"
              alt="Background"
              className="w-full h-full object-cover opacity-60"
            />
          </div>

          {/* Foreground Content */}
          <div className="relative z-10 flex flex-col items-center justify-center px-4 text-white">
            <h1 className="text-5xl font-bold mb-6 animate-pop tracking-wide">
              SaveFi
            </h1>

            <div className="text-2xl mb-6 typing-container max-w-3xl animate-pop">
              <span id="subtitle" style={{ whiteSpace: "pre-wrap" }}></span>
              <span id="cursor" className="blinking-cursor">
                |
              </span>
            </div>

            <div className="mt-6">
              <Link href="/plan" legacyBehavior>
                <a className="bg-custom-blue hover:bg-blue-500 shadow-lg text-white py-4 px-8 rounded-lg flex items-center text-lg font-semibold">
                  Chat with AI Planner
                </a>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6 bg-gray-900 text-center">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-2xl font-semibold mb-3">
                AI Financial Planning
              </h3>
              <p className="text-gray-300">
                Chat with our AI to set your savings goals, analyze your income,
                and generate a personalized monthly plan.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-3">
                Smart Contract Savings
              </h3>
              <p className="text-gray-300">
                Lock funds monthly into DeFi protocols like AAVE to earn
                interest automatically with no middleman.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-3">
                Rewards & Penalties
              </h3>
              <p className="text-gray-300">
                Get rewarded with $SAVE tokens for staying consistent — or lose
                rewards when you miss a deposit.
              </p>
            </div>
          </div>
        </section>

        {/* Tokenomics Section */}
        <section className="py-20 px-6 bg-gray-950 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6"> $SAVE Token Utility</h2>
            <p className="text-gray-300 mb-4">
              $SAVE is our native utility token used to unlock early
              withdrawals, and burned when users miss deposits.
            </p>
            <p className="text-gray-400">
              The more consistent you are, the more $SAVE you earn — with real
              value backed by DeFi yield.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-indigo-700 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to build your savings plan?
          </h2>
          <p className="text-lg text-indigo-100 mb-6">
            Let our AI help you start saving smarter — and earning while you're
            at it.
          </p>
          <Link href="/plan" legacyBehavior>
            <a className="bg-white text-indigo-700 hover:bg-gray-100 transition px-6 py-3 rounded-lg text-lg font-semibold">
              Start Now
            </a>
          </Link>
        </section>

        {/* Footer */}
        <footer className="py-10 text-center text-gray-500 text-sm bg-black">
          © {new Date().getFullYear()} SaveFi. All rights reserved.
        </footer>
      </main>

      <style jsx>{`
        @keyframes pop {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-pop {
          animation: pop 1s ease-out forwards;
        }

        @keyframes blink {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .blinking-cursor {
          animation: blink 0.7s infinite;
        }

        .typing-container {
          display: inline-block;
          text-align: left;
          line-height: 1.5;
        }

        .bg-custom-blue {
          background-color: #315a87;
        }

        .bg-custom-blue:hover {
          background-color: #2b4d74;
        }

        .shadow-lg {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </>
  );
}
