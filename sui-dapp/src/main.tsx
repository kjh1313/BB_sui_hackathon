import React from 'react';
import ReactDOM from 'react-dom/client';
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import '@mysten/dapp-kit/dist/index.css';

const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl('localnet') },
  testnet:  { url: getFullnodeUrl('testnet') },
  mainnet:  { url: getFullnodeUrl('mainnet') },
});

const DEFAULT_NETWORK = (import.meta.env.VITE_NETWORK as 'localnet'|'testnet'|'mainnet') || 'localnet';
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={DEFAULT_NETWORK}>
        {/* 개발용 번너 지갑. 실제 배포 때는 제거 */}
        <WalletProvider autoConnect enableUnsafeBurner>
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
