import { useState, useCallback, useEffect } from "react";
import { BscConnector } from '@binance-chain/bsc-connector'

import useError from "./useError";
import { config } from "../config"
import useSmartContract from "./useSmartContract";

// imports
const { BinanceChain } = window

export const bsc = new BscConnector({
    supportedChainIds: [config.chainId]
})

const isInstalled = () => {
    return !!BinanceChain
};

const isChainIdCorrect = async () => {
    const chainId = await BinanceChain.request({ method: 'eth_chainId' });

    return chainId == config.chainId ? true : false
}

const useBinance = () => {
    const [account, setAccount] = useState();

    const [errorBinance, setError, withErrorHandler] = useError();

    const connectWallet = async (cb) => {
        if (!isInstalled()) {
            if(navigator.userAgent.indexOf("Firefox") != -1 ) window.open("https://addons.mozilla.org/ru/firefox/addon/binance-chain/")
            else window.open('https://chrome.google.com/webstore/detail/binance-wallet/fhbohimaelbohpjbbldcngcnapndodjp', '_blank')
            return
        }
        if (!localStorage.getItem("account")) setError("Connect your wallet")
        if(!await isChainIdCorrect()) {
            setError("Select testnet")
            return;
        };

        await bsc.activate();

        const account = await bsc.getAccount();

        cb?.(config.chainId, account);
    };

    const connectBinance = async () => {
        await connectWallet(( chainId, account) => {
            localStorage.setItem("wallet", "binance")

            handleChainChanged(chainId);
            handleAccountsChanged(account);
        });
    };

    const handleAccountsChanged = useCallback(
        (account) => {
            if (account) {
                setAccount(account);
                localStorage.setItem("account", account)

                // window.location.reload()
            } else disconnectBinance()
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
    }, [errorBinance])

    const disconnectBinance = useCallback(() => {
        localStorage.removeItem('wallet')
        localStorage.removeItem('account')

        window.location.reload()
    }, []);
    useEffect(() => {
        let wallet = localStorage.getItem('wallet')
        if (!BinanceChain?.on || !wallet) return;

        BinanceChain.on('accountsChanged', handleAccountsChanged)
        BinanceChain.on("chainChanged", disconnectBinance);
        BinanceChain.on("disconnect", disconnectBinance);
    }, [BinanceChain, handleAccountsChanged,  disconnectBinance]);

    return {
        account,
        connectBinance,
        disconnectBinance,
        errorBinance
    };
};

export default useBinance;