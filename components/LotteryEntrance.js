/* eslint-disable react-hooks/exhaustive-deps */
import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"

export default function LotteryEntrance() {
    const { chainId: chainIdHex, isWeb3Enabled, Moralis } = useMoralis()
    const chainId = parseInt(chainIdHex)

    //Compares chainId to the chain the contract is deployed on. This gives the user feedback rather than an error.
    const raffleAddress =
        chainId.toString() == Object.keys(contractAddresses)[0]
            ? contractAddresses[chainId][0]
            : null
    const [entranceFee, setEntranceFee] = useState("0")
    const [numPlayers, setNumPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")
    const [provider, setProvider] = useState()

    //Web3UiKit's useNotification returns "dispatch"
    const dispatch = useNotification()

    const {
        runContractFunction: enterRaffle,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "enterRaffle",
        params: {},
        msgValue: entranceFee,
    })

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getEntranceFee",
        params: {},
    })

    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getNumberOfPlayers",
        params: {},
    })

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getRecentWinner",
        params: {},
    })

    async function updateUI() {
        if (raffleAddress) {
            const entranceFeeFromCall = (await getEntranceFee()).toString()
            const numPlayersFromCall = (await getNumberOfPlayers()).toString()
            const recentWinnerFromCall = await getRecentWinner()
            setNumPlayers(numPlayersFromCall)
            setRecentWinner(recentWinnerFromCall)
            setEntranceFee(entranceFeeFromCall)
        }
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()

            if (raffleAddress) {
                const raffleContract = new ethers.Contract(
                    raffleAddress,
                    abi,
                    provider.web3
                )

                raffleContract.on("WinnerPicked", async () => {
                    console.log("Winner Picked!")
                    updateUI()
                })
            }
        }
        Moralis.onWeb3Enabled((provider) => {
            setProvider(provider)
        })
    }, [isWeb3Enabled])

    const handleSuccess = async function (tx) {
        await tx.wait(1)
        handleNewNotification(tx)
        updateUI()
    }

    const handleNewNotification = function () {
        dispatch({
            type: "info",
            message: "Transaction Complete!",
            title: "Tx Notification",
            position: "topR",
            icon: "bell",
        })
    }

    return (
        <div className="p-5">
            {raffleAddress ? (
                <div>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4  rounded ml-auto"
                        onClick={async function () {
                            await enterRaffle({
                                //Just checks if Tx was sent to metamask
                                onSuccess: handleSuccess,
                                onError: (error) => console.log(error),
                            })
                        }}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            <div>Enter Raffle</div>
                        )}
                    </button>
                    <ul className="pt-4">
                        <li>
                            The fee to enter is: {""}
                            {ethers.utils.formatUnits(entranceFee, "ether")}
                        </li>
                        <li>Players: {numPlayers}</li>
                        <li>recentWinner: {recentWinner}</li>
                    </ul>
                </div>
            ) : (
                <div>Please connect to Goerli </div>
            )}
        </div>
    )
}
