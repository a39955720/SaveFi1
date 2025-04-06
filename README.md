# SaveFi

## Link:

- Live Demo: https://save-fi.vercel.app/
- SaveFi Celo: https://celoscan.io/address/0x92ad52935b98343040ee3a3e098dcddc284a0aba
- SaveFi Polygon: https://polygonscan.com/address/0x0EAc6f62AC1Eb30e003CdE374a9C394F7eEd16A6

## Project Description:

SaveFi is an AI-powered decentralized finance (DeFi) savings platform designed to help users cultivate long-term saving habits using blockchain technology, AI financial planning, and a robust incentive mechanism.   &#x20;

Here's how SaveFi works: &#x20;

1. **AI-Powered Financial Analysis**: Users interact with a personalized AI assistant by providing their financial details such as monthly income, expenses, and saving goals. The AI evaluates this data and generates a customized, manageable monthly savings plan tailored to the user's financial capability. &#x20;

2. **Smart Contract-Based Deposit Mechanism**: After establishing their personalized savings plan, users deposit stablecoins (USDC) into a secure smart contract each month. These funds are automatically allocated into the AAVE DeFi protocol to generate interest through decentralized lending markets. This ensures transparent, secure, and automated interest accumulation without intermediaries. &#x20;

3. **Reward & Penalty Incentive Structure**: &#x20;

   - **Reward Mechanism**: If users consistently make their deposits on time, they receive 90% of the accumulated interest converted into SaveFi's native token, \$SAVE. These tokens can be claimed once the plan matures, incentivizing disciplined financial behavior. &#x20;
   - **Penalty Mechanism**: If users fail to deposit on time, their earned interest (in \$SAVE tokens) is burned, reducing the total circulating supply and thus creating a deflationary effect. This discourages delays and promotes punctual savings behavior. &#x20;

4. **Tokenomics of \$SAVE Token**: The \$SAVE token underpins the economic model of SaveFi: &#x20;

   - Users who wish to withdraw their deposited funds before the maturity date can do so by burning all accumulated \$SAVE tokens, which ensures adherence to the long-term savings commitment. &#x20;
   - The burning mechanism from both late deposits and early withdrawal creates continuous deflationary pressure, enhancing the long-term value proposition of the \$SAVE token. &#x20;

In summary, SaveFi uniquely combines AI financial advisory with decentralized finance mechanisms to foster better financial habits, leveraging reward-based tokenomics and penalty-driven deflationary mechanisms to deliver sustained value to users. &#x20;

## How it's Made:

🧠 **AI Integration**

- **OpenAI GPT-4o-mini API** powers financial planning conversations with users. Based on income, expenses, and goals, the AI suggests personalized monthly savings plans.
- **Prompt Engineering** enables follow-up questions to refine input and simulate financial advisory interactions.

💻 **Frontend**

- **Next.js + App Router** builds a modern and scalable UI framework.
- **Tailwind CSS + shadcn/ui** creates a clean, responsive, utility-first UI.
- **RainbowKit + Wagmi + viem** enables smooth wallet connection and smart contract interactions.
- **Vercel** hosts the frontend with global CI/CD support.

🧾 **Smart Contracts**

- **Solidity + Foundry** for core savings contract logic: recurring deposits, interest, and penalties.
- **AAVE Protocol** to deposit USDC and earn yield.
- **Uniswap v3 Router** to convert interest into $SAVE tokens.
- **ERC20Burnable** for $SAVE token logic with penalty burns and early unlocks.

🧩 **MultiBaas Integration**

- **Contract Deployment & Labeling** via `forge-multibaas`.
- **Event Queries** fetch user deposit/withdrawal history using `executeArbitraryEventQuery`.
- **REST SDK Integration** allows frontend to read smart contract state and query events with filters.

🌍 **Deployed on Celo & Polygon**

- Smart contracts are deployed on both **Celo** and **Polygon**, enabling fast, low-cost transactions and interoperability across EVM chains.

🔗 **Tech Stack Summary**  
Frontend: Next.js, Tailwind, RainbowKit, Wagmi, viem, Vercel  
Backend: Solidity, Foundry, AAVE, Uniswap v3  
AI: OpenAI GPT-4o-mini  
Infra: MultiBaas, Celo, Polygon, GitHub, Vercel
