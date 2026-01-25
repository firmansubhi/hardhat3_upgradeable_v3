import { network } from "hardhat";


const { ethers } = await network.connect({
  network: "sepolia",
  override: { loggingEnabled: true }
});


async function main() {

	const [deployer] = await ethers.getSigners();

	const accountBalance = await deployer.provider.getBalance(deployer.address);

	console.log(`Deploying contracts with the account: ${deployer.address}`);
	console.log(`Account balance: ${ethers.formatEther(accountBalance)} ETH`);


	const contractAddress = "0xe1560EcA1096e3bC1Cd6cdbca9b781698A0Abcc3";
	const vest = await ethers.getContractAt("Vesting", contractAddress);

	try {

		console.log("Vesting address:", await vest.getAddress());

		let orderNumber = ethers.parseEther("2");


		const aaa = await vest.teset4(orderNumber);
		//const aaa = await vest.teset3();
		
		console.log(aaa);
	

	} catch (error) {


		console.error("A:", error.message);
		console.error("==========================================================");
		console.error("B:", error.data);
		console.error("==========================================================");

		
		//console.error(error);

		// In ethers v6, for custom errors, you can decode the error data
		if (error.data && vest.interface) {
		const decodedError = vest.interface.parseError(error.data);
		 console.log(`Transaction failed with custom error: ${decodedError?.name}`);
		} else {
		 //For simple require/revert strings, it's often in the error message string itself
		console.log(`Revert reason: ${error.reason}`);
		}


		const decodedError = vest.interface.parseError(error.data);
		console.log("C:", decodedError);
	}
}

main()
.then(() => process.exit(0))
.catch(err => {
	console.error("_______________________________________________");
	console.error(err);
	process.exit(1);
});