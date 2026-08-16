# Election Voting DApp

A decentralized voting application on Ethereum. Candidates and vote tallies live in a Solidity contract, so the count is public and tamper-evident rather than sitting in a database an operator can edit.

## How it works

1. The `Election` contract holds the candidate list and a per-address `voters` mapping
2. A voter connects their wallet through the browser client
3. Casting a vote sends a transaction; the contract **rejects a second vote from the same address**
4. Tallies update live from a contract event subscription

The one-address-one-vote rule is enforced in the contract itself, not the UI — the front end can't be bypassed to double-vote.

## Stack

| Layer | Technology |
|---|---|
| Contracts | Solidity |
| Development | Truffle |
| Client | JavaScript, web3.js, truffle-contract, Bootstrap |
| Tests | Mocha/Chai via Truffle |

## Layout

```
contracts/
  Election.sol       # candidates, vote(), voted mapping, votedEvent
  Migrations.sol
migrations/          # Truffle deployment scripts
src/
  index.html         # voting UI
  js/app.js          # web3 wiring, account detection, vote submission
test/
  election.js        # contract test suite
truffle-config.js
```

## Running it locally

```bash
npm install
truffle compile
truffle migrate            # against Ganache on the port in truffle-config.js
npm run dev                # serves src/ via lite-server
```

Requires [Ganache](https://trufflesuite.com/ganache/) for a local chain and MetaMask pointed at it.

## Tests

```bash
truffle test
```

Covers candidate initialisation, vote counting, and rejection of double votes and invalid candidate IDs.

## Note

A walkthrough video link is in `vid_link.txt`. Be aware this repo has `node_modules` committed from its original coursework submission.
