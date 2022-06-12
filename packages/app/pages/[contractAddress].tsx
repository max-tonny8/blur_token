import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { ethers } from "ethers";
import {
  UnlockableNFT,
  UnlockableNFT__factory,
} from "../../hardhat/typechain-types";
import { NextPage } from "next";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import {
  useAccount,
  useSigner,
  useContract,
  useContractRead,
  useProvider,
  useConnect,
} from "wagmi";

import UnlockableNFTJSON from "../../hardhat/artifacts/contracts/UnlockableNFT.sol/UnlockableNFT.json";
import { Blurhash } from "react-blurhash";
import { encodeImageToBlurhash } from "../src/blurhashHelper";
import { providers } from "ethers";
import { Web3Storage } from "web3.storage";
import * as sigUtil from "@metamask/eth-sig-util";
import * as ethUtil from "ethereumjs-util";

enum NFTState {
  onSale,
  WaitingForApproval,
  Sold,
}

const ContractPage = (props: { contractAddress: string }) => {
  const { data: account, isSuccess: isAccountSuccess } = useAccount();
  const { data: signer, isSuccess: isSignerSuccess } = useSigner();
  const connector = useConnect();

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

  console.log("nfts", nfts);
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (!account?.address) {
    return <Typography variant="h3">Please connect to your wallet</Typography>;
  }

  if (isAccountSuccess && isSignerSuccess && account && signer) {
    console.log("signer: ", account, contract, UnlockableNFTJSON);

    return (
      <>
        <Button onClick={handleClickOpen}>Mint NFT</Button>
        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          scroll="paper"
        >
          <DialogTitle id="alert-dialog-title">
            <Typography variant="h4" align="center">
              Mint NFT
            </Typography>
          </DialogTitle>
          <DialogContent>
            <MintNFT
              contractAddress={props.contractAddress}
              close={handleClose}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
          </DialogActions>
        </Dialog>

        <br />

        {!nftsLoading ? (
          <Box>
            {/* <div
                style={{
                  wordWrap: "break-word",
                }}
              >
                {JSON.stringify(nfts)}
              </div> */}

            <Box
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {nfts
                ?.concat(nfts)
                ?.slice()
                .reverse()
                .map((nft) => {
                  return (
                    <Card key={"id" + nft.id} sx={{ width: 350, margin: 2 }}>
                      <CardMedia
                        component={UnlockImage}
                        unlockableURL={nft.unlockableURL}
                        blurhash={nft.publicURL}
                        tryUnlock={nft.owner === account!.address}
                      />
                      <CardContent>
                        <Typography gutterBottom variant="h6" component="div">
                          {nft.name}
                        </Typography>

                        <Typography variant="body1" color="text.secondary">
                          {nft.description}
                        </Typography>
                        <Typography
                          gutterBottom
                          variant="body2"
                          component="div"
                        >
                          Owner: {nft.owner.slice(0, 4)}...
                          {nft.owner.slice(nft.owner.length - 4)}
                          {nft.owner === account!.address ? " (You)" : ""}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Price: {ethers.utils.formatEther(nft.price) + " ETH"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID:{nft.id.toString()}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        {nft.owner === account.address ? (
                          <>
                            {nft.state === NFTState.Sold && (
                              <Button
                                onClick={async () => {
                                  let price = prompt("Price ETH?");
                                  if (price && !Number.isNaN(Number(price))) {
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
                                Sell
                              </Button>
                            )}
                            {nft.state === NFTState.WaitingForApproval && (
                              <Button
                                size="small"
                                onClick={async () => {
                                  let a =
                                    (await connector.activeConnector?.getProvider()) as providers.Web3Provider;

                                  let decrypted = await decrypt(
                                    a,
                                    account!.address,
                                    nft.unlockableURL
                                  );

                                  let encrpytedLink = encrypt(
                                    nft.nextOwnerPublicKey,
                                    decrypted
                                  );
                                  console.log("encrpytedCid", encrpytedLink);

                                  await contract.functions.approveSale(
                                    nft.id,
                                    encrpytedLink,
                                    {
                                      gasLimit: 4000000,
                                    }
                                  );
                                }}
                              >
                                Approve Sale
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
                                Cancel Sale
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            {nft.state === NFTState.onSale && (
                              <Button
                                size="small"
                                onClick={async () => {
                                  let a =
                                    (await connector.activeConnector?.getProvider()) as providers.Web3Provider;
                                  console.log("mtt:", a);

                                  let publicKey = await requestPublicKey(
                                    a,
                                    account!.address
                                  );

                                  await contract.functions.buyNFT(
                                    nft.id,
                                    publicKey,
                                    {
                                      value: nft.price,
                                      gasLimit: 4000000,
                                    }
                                  );
                                }}
                              >
                                Buy to unlock
                              </Button>
                            )}
                            {nft.state === NFTState.WaitingForApproval &&
                              nft.nextOwner === account!.address && (
                                <Button
                                  disabled
                                  size="small"
                                  onClick={async () => {
                                    let a =
                                      (await connector.activeConnector?.getProvider()) as providers.Web3Provider;
                                    console.log("mtt:", a);

                                    let publicKey = await requestPublicKey(
                                      a,
                                      account!.address
                                    );

                                    await contract.functions.buyNFT(
                                      nft.id,
                                      publicKey,
                                      {
                                        value: nft.price,
                                        gasLimit: 4000000,
                                      }
                                    );
                                  }}
                                >
                                  waiting for approval
                                </Button>
                              )}
                          </>
                        )}
                      </CardActions>
                    </Card>
                  );
                })}
            </Box>
          </Box>
        ) : (
          <Typography gutterBottom variant="h6" component="div">
            Loading...
          </Typography>
        )}
      </>
    );
  } else {
    return (
      <Typography gutterBottom variant="h6" component="div">
        Loading...
      </Typography>
    );
  }
};

const requestPublicKey = async (
  web3: providers.Web3Provider,
  account: string
) => {
  return (await web3.send("eth_getEncryptionPublicKey", [account])).result;
};

const encrypt = (publicKey: string, text: string) => {
  const result = sigUtil.encrypt({
    publicKey,
    data: text,
    // https://github.com/MetaMask/eth-sig-util/blob/v4.0.0/src/encryption.ts#L40
    version: "x25519-xsalsa20-poly1305",
  });

  // https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods
  return ethUtil.bufferToHex(Buffer.from(JSON.stringify(result), "utf8"));
};

const decrypt = async (
  web3: providers.Web3Provider,
  account: string,
  text: string
) => {
  const result = (await web3.send("eth_decrypt", [text, account])).result;
  return result;
};

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const MintNFT = (props: { contractAddress: string; close: () => void }) => {
  const { data: account, isSuccess: isAccountSuccess } = useAccount();
  const { data: signer, isSuccess: isSignerSuccess } = useSigner();
  const connector = useConnect();

  const contract = useContract<UnlockableNFT>({
    addressOrName: props.contractAddress,
    contractInterface: UnlockableNFTJSON.abi,
    signerOrProvider: signer,
  });

  const fileInput = useRef<HTMLInputElement>(null);

  const [selectedFile, setselectedFile] = useState<File | null>(null);

  const [base64Img, setbase64Img] = useState("");

  const [blurImg, setblurImg] = useState("");
  useEffect(() => {
    if (selectedFile) {
      toBase64(selectedFile).then((base64) => {
        setbase64Img(base64);
        encodeImageToBlurhash(base64).then((blurhash) => {
          console.log("blurhash", blurhash);
          setblurImg(blurhash);
        });
      });
    }
  }, [selectedFile]);

  const [publicKey, setpublicKey] = useState("");

  const [name, setname] = useState("");
  const [description, setdescription] = useState("");

  const uploadFile = async (file: File) => {
    console.log("> 📦 creating web3.storage client");
    const client = new Web3Storage({
      token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDU4NjdiYzJCRDg1MTMxODVFNDcyMWFjNzFlY2U1NThCMDk5OUE5NTQiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NTMxNjgwMDY3NzksIm5hbWUiOiJhIn0.0qstMA40uMWGKc1qIyDK3MdaXooUT5v1ChcyRWKLwXE",
    });

    console.log(
      "> 🤖 chunking and hashing the files (in your browser!) to calculate the Content ID"
    );
    const cid = await client.put([file], {
      onRootCidReady: (localCid) => {
        console.log(`> 🔑 locally calculated Content ID: ${localCid} `);
        console.log("> 📡 sending files to web3.storage ");
      },
      onStoredChunk: (bytes) =>
        console.log(`> 🛰 sent ${bytes.toLocaleString()} bytes to web3.storage`),
    });
    console.log(`> ✅ web3.storage now hosting ${cid}`);
    console.log(`https://dweb.link/ipfs/${cid}`);

    // console.log("> 📡 fetching the list of all unique uploads on this account");
    // let totalBytes = 0;
    // for await (const upload of client.list()) {
    //   console.log(`> 📄 ${upload.cid}  ${upload.name}`);
    //   totalBytes += upload.dagSize || 0;
    // }
    // console.log(`> ⁂ ${totalBytes.toLocaleString()} bytes stored!`);
    return cid;
  };

  const [minting, setminting] = useState(false);

  return (
    <>
      <TextField
        value={name}
        onChange={(e) => setname(e.target.value)}
        id="outlined-basic"
        label="Name"
        variant="outlined"
        margin="normal"
        required
        fullWidth
      />
      <TextField
        value={description}
        onChange={(e) => setdescription(e.target.value)}
        id="outlined-basic"
        label="Description"
        variant="outlined"
        margin="normal"
        required
        fullWidth
        multiline
      />

      <TextField
        value={publicKey}
        onChange={(e) => setpublicKey(e.target.value)}
        id="outlined-basic"
        label={
          publicKey
            ? "Public Key"
            : "Please click to get public key from MetaMask"
        }
        variant="outlined"
        disabled
        onClick={async () => {
          if (!publicKey) {
            let a =
              (await connector.activeConnector?.getProvider()) as providers.Web3Provider;
            console.log("mtt:", a);

            requestPublicKey(a, account!.address).then((res) => {
              console.log("public key:", res);
              setpublicKey(res);
            });
          }
        }}
        margin="normal"
        required
        fullWidth
      />

      {blurImg && (
        <>
          <Typography variant="body2" color="text.secondary">
            Public Image:
          </Typography>
          <Blurhash
            hash={blurImg}
            width={300}
            height={170}
            resolutionX={32}
            resolutionY={32}
            punch={1}
          />
        </>
      )}
      {base64Img && (
        <>
          <Typography variant="body2" color="text.secondary">
            Secret Image:
          </Typography>
          <img src={base64Img} alt="" height={170} />
        </>
      )}
      <br />

      <input
        type="file"
        name="image"
        ref={fileInput}
        onChange={(e) => {
          if (e.target.files?.length && e.target.files?.length > 0) {
            setblurImg("");
            setselectedFile(e.target.files[0]);
          }
        }}
        style={{ display: "none" }}
      />

      <Button onClick={() => fileInput?.current?.click()}>Select Image</Button>
      <br />
      <Button
        disabled={
          !(publicKey && blurImg && selectedFile && name && description) ||
          minting
        }
        onClick={async () => {
          setminting(true);
          let cid = await uploadFile(selectedFile!);
          let link = `https://ipfs.io/ipfs/${cid}/${encodeURIComponent(
            selectedFile!.name
          )}`;
          let encrpytedCid = encrypt(publicKey, link);
          console.log("encrpytedCid", encrpytedCid);

          console.log(
            "createNFT",
            await contract.createNFT(
              name,
              description,
              blurImg,
              encrpytedCid,
              1
            )
          );
          setminting(false);
          props.close();
        }}
      >
        {minting ? "Minting" : "Upload"}
      </Button>
    </>
  );
};

const UnlockImage = (props: {
  blurhash: string;
  unlockableURL: string;
  tryUnlock: boolean;
}) => {
  const { data: account, isSuccess: isAccountSuccess } = useAccount();
  const { data: signer, isSuccess: isSignerSuccess } = useSigner();

  const connector = useConnect();

  const [decrypted, setdecrypted] = useState(false);

  const unlock = async () => {
    let a =
      (await connector.activeConnector?.getProvider()) as providers.Web3Provider;

    decrypt(a, account!.address, props.unlockableURL).then((res) => {
      setdecrypted(res);
    });
  };

  return (
    <>
      {props.tryUnlock && decrypted ? (
        <img src={decrypted} width={400} height={300} />
      ) : (
        <div style={{ position: "relative", height: 300 }}>
          <div style={{ position: "absolute", margin: "auto" }}>
            <Blurhash
              style={{ position: "absolute" }}
              hash={props.blurhash}
              width={400}
              height={300}
              resolutionX={32}
              resolutionY={32}
              punch={1}
            />
          </div>
          {props.tryUnlock && (
            <div
              style={{
                position: "absolute",
                margin: "auto",
                left: 0,
                right: 0,
                bottom: 0,
                top: 0,
                alignItems: "center",
                justifyContent: "center",
                display: "flex",
              }}
              onClick={() => {
                unlock();
              }}
            >
              <Typography variant="h5" color="text.secondary">
                Click to Unlock Image
              </Typography>
            </div>
          )}
        </div>
      )}
    </>
  );
};

const Contract: NextPage = () => {
  const router = useRouter();

  const { contractAddress } = router.query;
  if (!contractAddress || Array.isArray(contractAddress)) {
    return (
      <Typography gutterBottom variant="h6" component="div">
        Loading... - No contract address
      </Typography>
    );
  }

  return <ContractPage contractAddress={contractAddress} />;
};

export default Contract;
