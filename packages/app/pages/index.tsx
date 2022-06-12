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
import { Button, Typography } from "@mui/material";
import { ethers } from "ethers";
import { useState } from "react";
import { useRouter } from "next/router";

const Home: NextPage = () => {
  const [contractAddress, setcontractAddress] = useState("");
  const { data: account, isSuccess: isAccountSuccess } = useAccount();
  const { data: signer, isSuccess: isSignerSuccess } = useSigner();
  const router = useRouter();

  if (!account?.address) {
    return <Typography variant="h3">Please connect to your wallet</Typography>;
  }

  return (
    <>
      {contractAddress != "" ? (
        <>
          <Button
            variant="contained"
            onClick={() => {
              router.push(`/${contractAddress}`);
            }}
          >
            Go to marketplace contract {contractAddress}
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="contained"
            onClick={async () => {
              var a = new UnlockableNFT__factory(signer);
              var res = await a.deploy({ gasLimit: 10000000 });
              console.log("deploying....: ", res);
              await res.deployed();
              console.log(res);
              setcontractAddress(res.address);
            }}
          >
            Deploy marketplace contract
          </Button>
        </>
      )}
    </>
  );
};

export default Home;
