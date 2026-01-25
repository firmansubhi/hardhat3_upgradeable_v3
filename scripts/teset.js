import { network } from "hardhat";

//const { ethers } = await network.connect({
//	network: "localhost",
//	chainType: "l1",
//});


//const { ethers } = await network.connect({
//  network: "localhost",
//  override: { loggingEnabled: true }
//});

const { ethers } = await network.connect({
  network: "sepolia",
  override: { loggingEnabled: true }
});


async function main() {
	// ... contract deployment setup (similar to test example) ...


	const [deployer] = await ethers.getSigners();

	const accountBalance = await deployer.provider.getBalance(deployer.address);

	console.log(`Deploying contracts with the account: ${deployer.address}`);
	console.log(`Account balance: ${ethers.formatEther(accountBalance)} ETH`);


	const token = await ethers.deployContract("Dorz");
	await token.waitForDeployment();

	const ta = await token.getAddress();

	const vest = await ethers.deployContract("Vesting", [ta]);
	await vest.waitForDeployment();


	console.log("Token address:", ta);
	console.log("Vesting address:", await vest.getAddress());


	const aaa = await vest.teset3();
	console.log(aaa);



	try {

		//let orderNumber = ethers.parseEther("2");

		//const aaa = await vest.teset(orderNumber);




	} catch (error) {

		console.error("A:", error.message);
		console.error("==========================================================");

		// In ethers v6, for custom errors, you can decode the error data
		if (error.data && vest.interface) {
			const decodedError = vest.interface.parseError(error.data);
			// console.log(`Transaction failed with custom error: ${decodedError?.name}`);
		} else {
			// For simple require/revert strings, it's often in the error message string itself
			//console.log(`Revert reason: ${error.reason}`);
		}
	}

	
}


main()
.then(() => process.exit(0))
.catch((error) => {
console.error(error);
process.exit(1);
});