import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy();
  
    console.log("Token address:", token.address);
    console.log("Token owner:", await token.owner());
    console.log("Token before:", await token.balanceOf(deployer.address));
    console.log("Token trx:", await token.transfer("0x0000000000000000000000000000000000000000", 300));
  
    console.log("Token after:", await token.balanceOf(deployer.address));
    console.log("Account balance:", (await deployer.getBalance()).toString());

  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  