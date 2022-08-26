import { useState, useEffect } from "react";

import { useLocation } from "react-router";
import { useNavigate } from 'react-router-dom';
import useSmartContract from "./useSmartContract";

const INITIAL_STATE = {
  chainId: 1,
  account: null,
};

const useWalletConnect = () => {
  const [data, setData] = useState(INITIAL_STATE);
  const [pending, setPending] = useState(false);
  const { chainId, account} = data
  const wallet = sessionStorage.getItem("wallet")

  const location = useLocation()
  const navigate = useNavigate();
  const { connector } = useSmartContract()

  useEffect(() => {
    const onConnect = async (chainId, connectedAccount) => {
      setData({chainId: chainId, account: connectedAccount})
      sessionStorage.setItem('account', connectedAccount)
      sessionStorage.setItem("wallet", "walletConnect")
    };

    async function refreshData() {
      const { chainId, accounts } = connector;
      await onConnect(chainId, accounts[0]);
      setPending(false);
    }

    if (connector) {
      connector.on("connect", async (error, payload) => {
        console.log("connected", payload);
        if (error) {
          console.error(error);
          return;
        }
        refreshData();
      });

      connector.on("disconnect", async (error, payload) => {
        if (error) {
          console.error(error);
        }

        resetApp();
      });

      if ((!chainId || !account) && connector.connected) {
        refreshData();
        console.log("connector changed: ", connector);
      }
    }
    if (wallet === "walletConnect") refreshData();
  }, [connector, account, chainId, wallet]);

  const connectWalletConnect = async () => {
    setPending(true);

    await connector.enable()

    setData({ connector: connector})
  };

  const disconnectWalletConnect = async() => {
    if (connector) {
      await connector.disconnect()
    }
    resetApp();
  };

  const resetApp = () => {
    setData(INITIAL_STATE)
    setPending(false);

    if(location.pathname === "/cabinet") navigate('/', { replace: true })
    // else if(location.pathname === "/") window.location.reload()
    sessionStorage.removeItem("wallet")
    sessionStorage.removeItem("account")
  };

  const anotherDisconnect = async()=>{
    // if (connector) {
    //   await connector.disconnect()
    // }
    setData(INITIAL_STATE)
    setPending(false);
    sessionStorage.removeItem("wallet")
    sessionStorage.removeItem("account")

  }
  return {
    data,
    connectWalletConnect,
    disconnectWalletConnect,
    anotherDisconnect
  };
};

export default useWalletConnect;
