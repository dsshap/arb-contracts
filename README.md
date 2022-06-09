# ARB Bot Contracts (w/ Flashloans)

Helper contracts used by an off-chain arbitrage searcher.

### Contracts:

MultiCall.sol - executed multiple calls in a single transaction.
MultiCallFL.sol - Similar functionality to `MultiCall.sol` but includes the ability to take out flashloans from Aave.

### Getting Started

`npm install`

compile contracts:
`npm run sc:compile`

Running tests:
`npm run fork:local-ethereum`
`npm run sc:test`
