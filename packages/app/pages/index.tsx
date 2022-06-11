import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";

import {
  UnlockableNFT,
  UnlockableNFT__factory,
} from "../../hardhat/typechain-types";
import {
  useAccount,
  useContract,
  useContractRead,
  useProvider,
  useSigner,
} from "wagmi";
import UnlockableNFTJSON from "../../hardhat/artifacts/contracts/UnlockableNFT.sol/UnlockableNFT.json";
import { Button } from "@mui/material";
import { ethers } from "ethers";
import { useState } from "react";
import { useRouter } from "next/router";


const Home: NextPage = () => {
  const [contractAddress, setcontractAddress] = useState("");
  const { data: account, isSuccess: isAccountSuccess } = useAccount();
  const { data: signer, isSuccess: isSignerSuccess } = useSigner();
  const router = useRouter();

  return (
    <>
      {contractAddress != "" ? (
        <>
          <Button
            onClick={() => {
              router.push(`/${contractAddress}`);
            }}
          >
            Go to contract {contractAddress}
          </Button>
        </>
      ) : (
        <>
          <button
            onClick={async () => {
              var a = new UnlockableNFT__factory(signer);
              var res = await a.deploy({ gasLimit: 10000000 });
              console.log("deploying....: ", res);
              await res.deployed();
              console.log(res);
              setcontractAddress(res.address);
            }}
          >
            deploy
          </button>
          <div>not intialized</div>
        </>
      )}
    </>
  );
};

export default Home;
