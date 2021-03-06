const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const provider = ganache.provider();
const web3 = new Web3(provider);

const compiledFactory = require("../ethereum/build/CampaignFactory.json");
const compiledCampaign = require("../ethereum/build/Campaign.json");
const { it } = require("mocha");

let accounts;
let factory;
let campaignAddress;
let campaign;

beforeEach(async () => {
	accounts = await web3.eth.getAccounts();
	factory = await new web3.eth.Contract(compiledFactory.abi)
		.deploy({ data: "0x" + compiledFactory.evm.bytecode.object })
		.send({ from: accounts[0], gas: "2000000" });

	await factory.methods.createCampaign("100").send({
		from: accounts[0],
		gas: "1000000",
	});

	[campaignAddress] = await factory.methods.getDeployedCampaigns().call();
	campaign = await new web3.eth.Contract(compiledCampaign.abi, campaignAddress);
});

describe("Campaigns", () => {
	it("deploys a factory and campaign", () => {
		assert.ok(factory.options.address);
		assert.ok(campaign.options.address);
	});
	it("marks the as the campaign manager", async () => {
		const manager = await campaign.methods.manager().call();
		assert.equal(manager, accounts[0]);
	});
	it("allows people to contribute money and marks them as approvers", async () => {
		await campaign.methods.contribute().send({
			value: "200",
			from: accounts[1],
		});
		const isContributor = await campaign.methods.approvers(accounts[1]).call();
		assert(isContributor);
	});
	it("requires a minimum contribution", async () => {
		try {
			await campaign.methods.contribute().send({
				value: "5",
				from: accounts[1],
			});
			// we add assert.fail here because if the test does not fail, it will fail
			assert.fail();
		} catch (err) {
			assert(err);
		}
	});
	it("allows a manager to make a payment request", async () => {
		let balance = await web3.eth.getBalance(accounts[0]);
		const { toWei, fromWei } = web3.utils;

		console.log("balance: ", fromWei(balance, "ether"));
		await campaign.methods.createRequest("Buy batteries", "100", accounts[1]).send({
			from: accounts[0],
			gas: "1000000",
		});
		const request = await campaign.methods.requests(0).call();
		assert.equal("Buy batteries", request.description);
	});
	it("processes requests", async () => {
		const { toWei, fromWei } = web3.utils;
		await campaign.methods.contribute().send({
			from: accounts[0],
			value: toWei("10", "ether"),
		});
		await campaign.methods.createRequest("A", toWei("5", "ether"), accounts[1]).send({
			from: accounts[0],
			gas: "1000000",
		});
		await campaign.methods.approveRequest(0).send({
			from: accounts[0],
			gas: "1000000",
		});
		await campaign.methods.finalizeRequest(0).send({
			from: accounts[0],
			gas: "1000000",
		});
		let balance = await web3.eth.getBalance(accounts[1]);
		balance = fromWei(balance, "ether");
		balance = parseFloat(balance);

		assert(balance > 104);
	});
});
