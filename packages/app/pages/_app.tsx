import type { AppProps } from "next/app";

import "@rainbow-me/rainbowkit/styles.css";
import {
  apiProvider,
  configureChains,
  getDefaultWallets,
  RainbowKitProvider,
  ConnectButton,
} from "@rainbow-me/rainbowkit";
import { allChains, chain, createClient, WagmiConfig } from "wagmi";
import { Box, Container, CssBaseline } from "@mui/material";
import Head from "next/head";
import dynamic from "next/dynamic";
import React from "react";

const { chains, provider } = configureChains(allChains, [
  apiProvider.fallback(),
]);
const { connectors } = getDefaultWallets({
  appName: "My RainbowKit App",
  chains,
});
const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const NoSSRWrapper = dynamic(() => Promise.resolve(React.Fragment), {
  ssr: false,
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <NoSSRWrapper>
        <WagmiConfig client={wagmiClient}>
          <RainbowKitProvider
            coolMode
            showRecentTransactions={true}
            chains={chains}
          >
            <CssBaseline />
            <Box sx={{}}>
              <ConnectButton />
            </Box>
            <Container>
              <Component {...pageProps} />
            </Container>
          </RainbowKitProvider>
        </WagmiConfig>
      </NoSSRWrapper>
    </>
  );
}

export default MyApp;
