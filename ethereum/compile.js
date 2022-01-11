const path = require("path");
const fs = require("fs-extra");
const solc = require("solc");

// remove build folder
const buildPath = path.resolve(__dirname, "build");
fs.removeSync(buildPath);

const campaignPath = path.resolve(__dirname, "contracts", "Campaign.sol");
const source = fs.readFileSync(campaignPath, "utf8");
const input = JSON.stringify({
	language: "Solidity",
	sources: {
		"campaign.sol": {
			content: source,
		},
	},
	settings: {
		outputSelection: {
			"*": {
				"*": ["*"],
			},
		},
	},
});
const abiString = solc.compile(input);
const contracts = JSON.parse(abiString).contracts["campaign.sol"];

// create build folder again
fs.ensureDirSync(buildPath);
// write output to build folder
for (let contract in contracts) {
	fs.outputJsonSync(path.resolve(buildPath, contract.replace(":", "") + ".json"), contracts[contract]);
}
