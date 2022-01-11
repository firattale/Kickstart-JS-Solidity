const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
const compiledFactory = require("./build/CampaignFactory.json");
require("dotenv").config({ path: "../.env" });

const provider = new HDWalletProvider({
	mnemonic: {
		phrase: process.env.MNEMONIC,
	},
	providerOrUrl: process.env.GOERLI_ENDPOINT,
});
const web3 = new Web3(provider);

const deploy = async () => {
	const accounts = await web3.eth.getAccounts();

	console.log("Attempting to deploy from account", accounts[0]);

	const result = await new web3.eth.Contract(compiledFactory.abi)
		.deploy({ data: "0x" + compiledFactory.evm.bytecode.object })
		.send({ from: accounts[0] });

	console.log("Contract deployed to", result.options.address);
	provider.engine.stop();
};
deploy();
