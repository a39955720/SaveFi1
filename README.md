# SaveFi

## Link:

- Live Demo: https://save-fi.vercel.app/
- SaveFi Celo: https://celoscan.io/address/0x92ad52935b98343040ee3a3e098dcddc284a0aba
- SaveFi Polygon: https://polygonscan.com/address/0x0EAc6f62AC1Eb30e003CdE374a9C394F7eEd16A6

## Project Description

SaveFi is an AI-powered decentralized finance (DeFi) platform helping users build disciplined saving habits through personalized AI financial planning, blockchain-based deposits, and incentive-driven tokenomics.

## How SaveFi Uses MultiBaas

- **Contract Deployment & Labeling**: Automated contract deployment and labeling using `forge-multibaas`.
- **Event Queries**: Leveraged `executeArbitraryEventQuery` API to provide users detailed deposit and withdrawal histories.
- **REST SDK Integration**: Real-time contract state fetching and event filtering through the MultiBaas TypeScript SDK.

SaveFi smart contracts are deployed on the Celo and Polygon networks, taking advantage of their low fees and rapid transactions.

## Team

- **Denny** – Full stack developer ([GitHub](https://github.com/a39955720))

## Experience with MultiBaas

Integrating MultiBaas greatly simplified our event querying and real-time blockchain interactions, significantly reducing development time. The REST API and SDK streamlined our frontend development, though initial integration required careful attention to query structuring. Overall, MultiBaas provided powerful tools enabling seamless integration of blockchain data into our AI-driven frontend.

## Setup Instructions

### Smart Contracts

```bash
cd contract
forge build
```

### Frontend

```bash
cd frontend
yarn install
yarn run dev
```
