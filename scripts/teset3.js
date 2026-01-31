import { network } from "hardhat";
import { expect } from "chai";

const { ethers } = await network.connect({
	network: "localhost",
	chainType: "l1",
});

async function main() {

	const [deployer] = await ethers.getSigners();


	const contractAddress = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed";
	const vest = await ethers.getContractAt("Vesting", contractAddress);


	const decodedError = vest.interface.parseError("0x28459a660000000000000000000000000000000000000000000000000000000000000000");


	console.log(decodedError);
		
	

}

main()
.then(() => process.exit(0))
.catch(err => {
	console.error(err);
	process.exit(1);
});