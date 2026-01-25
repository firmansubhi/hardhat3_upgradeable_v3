import { network } from "hardhat";
import { expect } from "chai";

const { ethers } = await network.connect({
	network: "localhost",
	chainType: "l1",
});

async function main() {

	const [deployer] = await ethers.getSigners();


	const contractAddress = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
	const vest = await ethers.getContractAt("Vesting", contractAddress);


	const decodedError = vest.interface.parseError("0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000009676167616c206e69680000000000000000000000000000000000000000000000");


	console.log(decodedError);
		
	

}

main()
.then(() => process.exit(0))
.catch(err => {
	console.error(err);
	process.exit(1);
});