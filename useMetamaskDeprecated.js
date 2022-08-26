import { useState, useCallback, useEffect } from "react";

import useError from "./useError";
import useSmartContract from "./useSmartContract";
import { config } from "../config"

const { ethereum } = window
const isInstalled = () => {
    return !!ethereum
};

const isChainIdCorrect = async () => {
    const chainId = Number(await ethereum.request({ method: 'eth_chainId' }));

    return chainId === config.chainId
}
const isWalletConnected = async() =>{
    const isConnected = await ethereum.request({ method: "eth_accounts" })

    return isConnected.length >  0
}

const useMetamask = () => {
    const [account, setAccount] = useState();

    const [smartContract, web3, smartContractWSS] = useSmartContract()
    const [errorMetamask, setError, withErrorHandler] = useError();

    const connectWallet = async (cb) => {
        if (!isInstalled()) {
            window.open('https://metamask.io/download/', '_blank');
            return
        }
        if (!await isWalletConnected()) {
            setError("Connect your wallet")
        }
        if(!await isChainIdCorrect()) {
            setError("Select testnet")
            return;
        };

        await ethereum.request({ method: "eth_requestAccounts" });

        const accounts = await web3.eth.getAccounts();
        const chainId = config.chainId;


        cb?.( chainId, accounts);
    };

    const connectMetamask = async () => {
        await connectWallet((chainId, accounts) => {

            localStorage.setItem("wallet", "metamask")

            handleChainChanged(chainId);
            handleAccountsChanged(accounts);
        });
    };

    const handleAccountsChanged = useCallback(
        (accounts) => {
            console.log(accounts)
            if (accounts.length > 0) {
                localStorage.setItem('account', accounts[0])
                setAccount(accounts[0]);

                window.location.reload()
            } else  disconnectMetamask()
        },
        []
    );

    const handleChainChanged = useCallback(
        (hexChainId) => {
            window.location.reload()
        },
        []
    );

    useEffect(()=>{
        return () => {
            setError("")
        }
    }, [errorMetamask])
    const disconnectMetamask = useCallback(() => {
        localStorage.removeItem('wallet')
        localStorage.removeItem('account')

        ethereum.removeListener("accountsChanged", handleAccountsChanged);
        ethereum.removeListener("chainChanged", disconnectMetamask);
        ethereum.removeListener("disconnect", disconnectMetamask);

        window.location.reload()
    }, [handleAccountsChanged, handleChainChanged]);
    useEffect(() => {
        let wallet = localStorage.getItem('wallet')
        if (!ethereum?.on || !wallet) return;

        ethereum.on("accountsChanged", handleAccountsChanged);
        ethereum.on("chainChanged", disconnectMetamask);
        ethereum.on("disconnect", disconnectMetamask);
    }, [disconnectMetamask, handleAccountsChanged]);

    return {
        account,
        connectMetamask,
        errorMetamask,
        disconnectMetamask,
    };
};

export default useMetamask;
