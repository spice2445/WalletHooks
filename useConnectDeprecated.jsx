import { useCallback, useEffect, useState } from "react";

import Web3 from "web3";

import Web3Modal from "web3modal";
import { providerOptions } from "../utils/providerOptions";
import { useDispatch } from "react-redux";
import { connectSmart} from "../redux/blockchain/blockchainActions";
import { refreshSmartContract, updateAccount } from "../redux/blockchain/blockchainReducer";
import useError from './useError';
import { switchNetworkIfRequired } from '../utils/utils';

const web3Modal = new Web3Modal({
    cacheProvider: true, // optional
    providerOptions, // required
    network: "mainnet", //required
  });

const connect = async (cb) => {
  const provider = await web3Modal.connect();
  const library = new Web3(provider);
  const accounts = await library.eth.getAccounts();
  const chainId = await library.eth.net.getId();
  cb?.(provider, library, accounts, chainId);
};

function useConnectModal() {
  const [provider, setProvider] = useState();
  const [library, setLibrary] = useState();
  const [account, setAccount] = useState();
  const [chainId, setChainId] = useState();
  const [network, setNetwork] = useState(97);
  const [error, withErrorHandler] = useError();
  const dispatch = useDispatch();

  const connectWallet = withErrorHandler(async () => {
    await connect((provider, library, accounts, chainId) => {
      dispatch(connectSmart());
      setProvider(provider);
      setLibrary(library);

      handleChainChanged(chainId);
      handleAccountsChanged(accounts);
    });
  });

  const switchNetworkWrapped = withErrorHandler(switchNetworkIfRequired(library, chainId, network ));

  const refreshState = useCallback(() => {
    setAccount();
    setChainId();
    setNetwork("");
    dispatch(refreshSmartContract());
  }, [dispatch]);

  const disconnect = useCallback(() => {
    web3Modal.clearCachedProvider();
    refreshState();
  }, [refreshState]);

  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts) {
        setAccount(accounts[0]);
        dispatch(updateAccount(accounts[0]))
    }
  }, [dispatch]);

  const handleChainChanged = useCallback((_hexChainId) => {
    setChainId(_hexChainId);
    switchNetworkWrapped();
  }, [switchNetworkWrapped]);

  useEffect(() => {
    if (!provider?.on) {
      return;
    }

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);
    provider.on("disconnect", disconnect);

    return () => {
      if (provider.removeListener) {
        provider.removeListener("accountsChanged", handleAccountsChanged);
        provider.removeListener("chainChanged", handleChainChanged);
        provider.removeListener("disconnect", disconnect);
      }
    };
  }, [provider, handleAccountsChanged, handleChainChanged, disconnect]);

  return {
    connectWallet,
    disconnect,
    chainId,
    account,
    library,
    error,
    web3Modal,
  };
}

export default useConnectModal;