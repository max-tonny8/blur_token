import { Button, Typography } from "@mui/material";
import { ethers } from "ethers";
import {
  UnlockableNFT,
  UnlockableNFT__factory,
} from "../../hardhat/typechain-types";
import { NextPage } from "next";
import { useRouter } from "next/router";
import React from "react";
import { useAccount, useSigner, useContract, useContractRead } from "wagmi";

import UnlockableNFTJSON from "../../hardhat/artifacts/contracts/UnlockableNFT.sol/UnlockableNFT.json";

const ContractPage = (props: { contractAddress: string }) => {
  const { data: account, isSuccess: isAccountSuccess } = useAccount();
  const { data: signer, isSuccess: isSignerSuccess } = useSigner();

  const contract = useContract<UnlockableNFT>({
    addressOrName: props.contractAddress,
    contractInterface: UnlockableNFTJSON.abi,
    signerOrProvider: signer,
  });
  window!.contract = contract;

  const { data: nfts, isLoading: nftsLoading } = useContractRead(
    {
      addressOrName: props.contractAddress,
      contractInterface: UnlockableNFTJSON.abi,
    },
    "fetchNFTs",
    {
      watch: true,
    }
  );

  if (isAccountSuccess && isSignerSuccess && account && signer) {
    console.log("signer: ", account, contract, UnlockableNFTJSON);

    return (
      <div>
        <button
          onClick={async () => {
            console.log("owner", await contract.greet());
          }}
        >
          owner
        </button>

        <button
          onClick={async () => {
            console.log(
              "owner",
              await contract.makePayment("payment", {
                value: ethers.utils.parseEther("1"),
              })
            );
          }}
        >
          payment
        </button>

        <button
          onClick={async () => {
            console.log(
              "createNFT",
              await contract.createNFT("publicURL", "privateURL", 3)
            );
          }}
        >
          createNFT
        </button>

        <button
          onClick={async () => {
            console.log(
              "change owner",
              await contract.setGreeting("new" + Math.random())
            );
          }}
        >
          owner
        </button>
        <Button
          onClick={async () => {
            console.log(
              "tx: ",

              await signer.sendTransaction({
                to: contract.address,
                value: ethers.utils.parseEther("1"),
              })
            );

            // console.log(
            //   "owner",
            //   await contract.functions.transfer(
            //     "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            //     1,
            //     { gasLimit: 1000000, value: 10 }
            //   )
            // );
          }}
        >
          Transfer
        </Button>

        <Button
          onClick={async () => {
            console.log(
              "balance",
              (await contract.balanceOf(account!.address)).toNumber()
            );
          }}
        >
          balance
        </Button>
        <br />
        <GlowText>
          {!nftsLoading ? JSON.stringify(nfts) : <div>Loading...</div>}
        </GlowText>
      </div>
    );
  } else {
    return <div>fail</div>;
  }
};

const GlowText = (props) => {
  return <Typography>{props.children}</Typography>;
};

const Contract: NextPage = () => {
  const router = useRouter();

  const { contractAddress } = router.query;
  if (!contractAddress || Array.isArray(contractAddress)) {
    return <div>no contract address</div>;
  }

  return <ContractPage contractAddress={contractAddress} />;
};

export default Contract;
