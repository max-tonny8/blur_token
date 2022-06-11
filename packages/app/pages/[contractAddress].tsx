import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
} from "@mui/material";
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
import { Blurhash } from "react-blurhash";

enum NFTState {
  onSale,
  WaitingForApproval,
  Sold,
}

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
  ) as { data?: UnlockableNFT.NFTStructOutput[]; isLoading: boolean };

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
              await contract.createNFT(
                "|EHV6nWB2yk8$NxujFNGt6pyo0adR*=ss:I[R%of.7kCMdnjx]S2NHs:i_S#M|%1%2ENRis9ai%1Sis.slNHW:WBxZ%2NbogaekBW;ofo0NHS4j?W?WBsloLR+oJofS2s:ozj@s:jaR*Wps.j[RkT0of%2afR*fkoJjZof",
                "https://lh3.googleusercontent.com/WmaRv4FGAXhUp1XArydCgLToQaWLHMd8qxO_14ti0kGso7Iv9xIPy1qgPTajB6ThpHaUzFfY_7vG_bxlNRSv8FWfaJak4MEJ2fKxpw=s0",
                ethers.utils.parseEther("3")
              )
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
              (await contract.balanceOf(account!.address)).toString()
            );
          }}
        >
          balance
        </Button>
        <br />
        <GlowText>
          {!nftsLoading ? (
            <Box>
              <div
                style={{
                  wordWrap: "break-word",
                }}
              >
                {JSON.stringify(nfts)}
              </div>

              <br />
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                }}
              >
                {nfts
                  ?.slice()
                  .reverse()
                  .map((nft) => {
                    return (
                      <Card
                        key={"id" + nft.id}
                        sx={{ maxWidth: 300, margin: 2 }}
                      >
                        <CardMedia
                          component={Blurhash}
                          hash={nft.publicURL}
                          width={400}
                          height={300}
                          resolutionX={32}
                          resolutionY={32}
                          punch={1}
                        />
                        <CardContent>
                          <Typography gutterBottom variant="h6" component="div">
                            Lizard id:{nft.id.toString()} eth:
                            {nft.price.toString()}
                          </Typography>
                          <Typography gutterBottom variant="h6" component="div">
                            owner:0x...{nft.owner.slice(nft.owner.length - 6)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Lizards are a widespread group of squamate reptiles,
                            with over 6,000 species, ranging across all
                            continents except Antarctica
                          </Typography>
                        </CardContent>
                        <CardActions>
                          {nft.owner === account.address ? (
                            <>
                              {nft.state === NFTState.Sold && (
                                <Button
                                  size="small"
                                  onClick={async () => {
                                    let price = prompt("price ETH?");
                                    if (
                                      price &&
                                      Number.isInteger(Number(price))
                                    ) {
                                      await contract.functions.updateNFT(
                                        nft.id,
                                        ethers.utils.parseEther(price),
                                        true,
                                        {
                                          gasLimit: 4000000,
                                        }
                                      );
                                    }
                                  }}
                                >
                                  <Typography color="text.secondary">
                                    Sell
                                  </Typography>
                                </Button>
                              )}
                              {nft.state === NFTState.WaitingForApproval && (
                                <Button
                                  size="small"
                                  onClick={async () => {
                                    await contract.functions.approveSale(
                                      nft.id,
                                      "newunlockablenft",
                                      {
                                        gasLimit: 4000000,
                                      }
                                    );
                                  }}
                                >
                                  <Typography color="text.secondary">
                                    Approve Sale
                                  </Typography>
                                </Button>
                              )}
                              {nft.state === NFTState.onSale && (
                                <Button
                                  size="small"
                                  onClick={async () => {
                                    await contract.functions.updateNFT(
                                      nft.id,
                                      1,
                                      false,
                                      {
                                        gasLimit: 4000000,
                                      }
                                    );
                                  }}
                                >
                                  <Typography color="text.secondary">
                                    Revoke sell
                                  </Typography>
                                </Button>
                              )}
                            </>
                          ) : (
                            nft.state === NFTState.onSale && (
                              <Button
                                size="small"
                                onClick={async () => {
                                  await contract.functions.buyNFT(nft.id, {
                                    value: nft.price,
                                    gasLimit: 4000000,
                                  });
                                }}
                              >
                                <Typography color="text.secondary">
                                  {nft.price.toString()} ETH - Buy to unlock
                                </Typography>
                              </Button>
                            )
                          )}
                        </CardActions>
                      </Card>
                    );
                  })}
              </div>
            </Box>
          ) : (
            <div>Loading...</div>
          )}
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
