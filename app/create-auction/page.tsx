"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Wallet, AlertCircle, CheckCircle2, Calendar, Coins, Shield, Clock } from "lucide-react"
import Link from "next/link"

// AuctionFactory ABI - only the functions we need
const AUCTION_FACTORY_ABI = [
    {
        inputs: [
            {
                components: [
                    { internalType: "uint256", name: "principalGoal", type: "uint256" },
                    { internalType: "uint256", name: "maxRate", type: "uint256" },
                    { internalType: "uint256", name: "minCRToHold", type: "uint256" },
                    { internalType: "uint256", name: "auctionDuration", type: "uint256" },
                    { internalType: "uint256", name: "auctionStartTime", type: "uint256" },
                    { internalType: "uint256", name: "loanDuration", type: "uint256" },
                    { internalType: "address", name: "principalToken", type: "address" },
                    { internalType: "address", name: "collateralToken", type: "address" },
                    { internalType: "uint256", name: "initialCollateralAmount", type: "uint256" }
                ],
                internalType: "struct IAuctionFactory.AskLoanInfo",
                name: "askLoanData",
                type: "tuple"
            },
            {
                internalType: "uint256",
                name: "collateralInitialDeposit",
                type: "uint256"
            }
        ],
        name: "createAuction",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "address", name: "auctionAddress", type: "address" },
            { indexed: true, internalType: "address", name: "asker", type: "address" }
        ],
        name: "AuctionCreated",
        type: "event"
    }
]

// Replace with your deployed AuctionFactory address
const AUCTION_FACTORY_ADDRESS = "0x0000000000000000000000000000000000000000" // TODO: Update with actual address

// Common token addresses (example for Ethereum mainnet)
const COMMON_TOKENS = {
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
}

declare global {
    interface Window {
        ethereum?: any
    }
}

export default function CreateAuctionPage() {
    const [isConnected, setIsConnected] = useState(false)
    const [currentAccount, setCurrentAccount] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [ethers, setEthers] = useState<any>(null)
    const [newAuctionAddress, setNewAuctionAddress] = useState("")

    // Form state
    const [formData, setFormData] = useState({
        principalGoal: "",
        maxRate: "",
        minCRToHold: "150", // Default 150% collateralization
        auctionDuration: "7", // Default 7 epochs (7 * 30 days)
        auctionStartTime: "",
        loanDuration: "12", // Default 12 epochs (12 * 30 days)
        principalToken: COMMON_TOKENS.USDC,
        collateralToken: COMMON_TOKENS.WETH,
        collateralInitialDeposit: ""
    })

    // Load ethers.js dynamically
    useEffect(() => {
        const loadEthers = async () => {
            try {
                const ethersModule = await import("ethers")
                setEthers(ethersModule)
            } catch (err) {
                setError("Failed to load ethers.js library")
            }
        }
        loadEthers()
    }, [])

    // Check for existing wallet connection on component mount
    useEffect(() => {
        if (ethers && window.ethereum) {
            checkWalletConnection()
        }
    }, [ethers])

    // Set default auction start time (1 week from now)
    useEffect(() => {
        const oneWeekFromNow = new Date()
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)
        const timestamp = Math.floor(oneWeekFromNow.getTime() / 1000)
        setFormData(prev => ({ ...prev, auctionStartTime: timestamp.toString() }))
    }, [])

    const checkWalletConnection = async () => {
        try {
            const accounts = await window.ethereum.request({ method: "eth_accounts" })
            if (accounts.length > 0) {
                setCurrentAccount(accounts[0])
                setIsConnected(true)
            }
        } catch (err) {
            console.error("Error checking wallet connection:", err)
        }
    }

    const connectWallet = async () => {
        if (!window.ethereum) {
            setError("MetaMask is not installed. Please install MetaMask to continue.")
            return
        }

        if (!ethers) {
            setError("Ethers.js is not loaded yet. Please try again.")
            return
        }

        try {
            setError("")
            setIsLoading(true)

            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            })

            if (accounts.length > 0) {
                setCurrentAccount(accounts[0])
                setIsConnected(true)
            }
        } catch (err: any) {
            setError(err.message || "Failed to connect wallet")
        } finally {
            setIsLoading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const createAuction = async () => {
        if (!ethers || !window.ethereum || !isConnected) {
            setError("Please connect your wallet first")
            return
        }

        try {
            setError("")
            setSuccess("")
            setIsLoading(true)

            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()

            // Create contract instance
            const auctionFactory = new ethers.Contract(
                AUCTION_FACTORY_ADDRESS,
                AUCTION_FACTORY_ABI,
                signer
            )

            // Convert form values to proper types
            const askLoanData = {
                principalGoal: ethers.parseUnits(formData.principalGoal, 6), // Assuming USDC (6 decimals)
                maxRate: ethers.parseUnits(formData.maxRate, 16), // Convert percentage to BPS (basis points)
                minCRToHold: ethers.parseUnits(formData.minCRToHold, 16), // Convert to proper units
                auctionDuration: BigInt(formData.auctionDuration),
                auctionStartTime: BigInt(formData.auctionStartTime),
                loanDuration: BigInt(formData.loanDuration),
                principalToken: formData.principalToken,
                collateralToken: formData.collateralToken,
                initialCollateralAmount: ethers.parseEther(formData.collateralInitialDeposit) // Assuming ETH (18 decimals)
            }

            const collateralInitialDeposit = ethers.parseEther(formData.collateralInitialDeposit)

            // First approve collateral token if needed
            const collateralToken = new ethers.Contract(
                formData.collateralToken,
                ["function approve(address spender, uint256 amount) returns (bool)"],
                signer
            )

            const approveTx = await collateralToken.approve(AUCTION_FACTORY_ADDRESS, collateralInitialDeposit)
            await approveTx.wait()

            // Create the auction
            const tx = await auctionFactory.createAuction(askLoanData, collateralInitialDeposit)

            setSuccess("Creating auction... Please wait for confirmation.")

            const receipt = await tx.wait()

            // Find the AuctionCreated event in the receipt
            const auctionCreatedEvent = receipt.logs.find((log: any) => {
                try {
                    const parsedLog = auctionFactory.interface.parseLog(log)
                    return parsedLog?.name === "AuctionCreated"
                } catch {
                    return false
                }
            })

            if (auctionCreatedEvent) {
                const parsedEvent = auctionFactory.interface.parseLog(auctionCreatedEvent)
                const auctionAddress = parsedEvent?.args?.auctionAddress
                setNewAuctionAddress(auctionAddress)
                setSuccess(`Auction created successfully! Address: ${auctionAddress}`)
            } else {
                setSuccess("Auction created successfully!")
            }

            // Reset form
            setFormData({
                principalGoal: "",
                maxRate: "",
                minCRToHold: "150",
                auctionDuration: "7",
                auctionStartTime: "",
                loanDuration: "12",
                principalToken: COMMON_TOKENS.USDC,
                collateralToken: COMMON_TOKENS.WETH,
                collateralInitialDeposit: ""
            })

        } catch (err: any) {
            console.error("Error creating auction:", err)
            setError(err.message || "Failed to create auction")
        } finally {
            setIsLoading(false)
        }
    }

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center py-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Create Bond Auction</h1>
                    <p className="text-gray-600 dark:text-gray-300">Set up your lending terms and start an auction</p>
                    <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Error/Success Alerts */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                            {success}
                            {newAuctionAddress && (
                                <div className="mt-2">
                                    <a
                                        href={`https://etherscan.io/address/${newAuctionAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        View on Etherscan →
                                    </a>
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Wallet Connection Card */}
                {!isConnected ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5" />
                                Connect Wallet
                            </CardTitle>
                            <CardDescription>Connect your wallet to create an auction</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={connectWallet} disabled={isLoading} className="w-full" size="lg">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Wallet className="mr-2 h-4 w-4" />
                                        Connect MetaMask
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Connected Wallet Info */}
                        <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
                            <CardContent className="pt-6">
                                <p className="text-sm text-green-800 dark:text-green-200">
                                    Connected: <span className="font-mono font-semibold">{formatAddress(currentAccount)}</span>
                                </p>
                            </CardContent>
                        </Card>

                        {/* Auction Creation Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Coins className="h-5 w-5" />
                                    Loan Parameters
                                </CardTitle>
                                <CardDescription>Configure your bond auction parameters</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Principal Goal */}
                                    <div className="space-y-2">
                                        <Label htmlFor="principalGoal">
                                            Principal Goal (USDC)
                                            <span className="text-xs text-gray-500 ml-2">Amount to borrow</span>
                                        </Label>
                                        <Input
                                            id="principalGoal"
                                            name="principalGoal"
                                            type="number"
                                            placeholder="10000"
                                            value={formData.principalGoal}
                                            onChange={handleInputChange}
                                            disabled={isLoading}
                                        />
                                    </div>

                                    {/* Max Interest Rate */}
                                    <div className="space-y-2">
                                        <Label htmlFor="maxRate">
                                            Max Interest Rate (%)
                                            <span className="text-xs text-gray-500 ml-2">Annual rate</span>
                                        </Label>
                                        <Input
                                            id="maxRate"
                                            name="maxRate"
                                            type="number"
                                            placeholder="10"
                                            value={formData.maxRate}
                                            onChange={handleInputChange}
                                            disabled={isLoading}
                                        />
                                    </div>

                                    {/* Min Collateralization Ratio */}
                                    <div className="space-y-2">
                                        <Label htmlFor="minCRToHold">
                                            Min Collateralization Ratio (%)
                                            <span className="text-xs text-gray-500 ml-2">Minimum CR to maintain</span>
                                        </Label>
                                        <Input
                                            id="minCRToHold"
                                            name="minCRToHold"
                                            type="number"
                                            placeholder="150"
                                            value={formData.minCRToHold}
                                            onChange={handleInputChange}
                                            disabled={isLoading}
                                        />
                                    </div>

                                    {/* Initial Collateral Deposit */}
                                    <div className="space-y-2">
                                        <Label htmlFor="collateralInitialDeposit">
                                            Initial Collateral (ETH)
                                            <span className="text-xs text-gray-500 ml-2">Your collateral deposit</span>
                                        </Label>
                                        <Input
                                            id="collateralInitialDeposit"
                                            name="collateralInitialDeposit"
                                            type="number"
                                            placeholder="5"
                                            step="0.01"
                                            value={formData.collateralInitialDeposit}
                                            onChange={handleInputChange}
                                            disabled={isLoading}
                                        />
                                    </div>

                                    {/* Auction Duration */}
                                    <div className="space-y-2">
                                        <Label htmlFor="auctionDuration">
                                            Auction Duration (epochs)
                                            <span className="text-xs text-gray-500 ml-2">1 epoch = 30 days</span>
                                        </Label>
                                        <Input
                                            id="auctionDuration"
                                            name="auctionDuration"
                                            type="number"
                                            placeholder="7"
                                            value={formData.auctionDuration}
                                            onChange={handleInputChange}
                                            disabled={isLoading}
                                        />
                                    </div>

                                    {/* Loan Duration */}
                                    <div className="space-y-2">
                                        <Label htmlFor="loanDuration">
                                            Loan Duration (epochs)
                                            <span className="text-xs text-gray-500 ml-2">1 epoch = 30 days</span>
                                        </Label>
                                        <Input
                                            id="loanDuration"
                                            name="loanDuration"
                                            type="number"
                                            placeholder="12"
                                            value={formData.loanDuration}
                                            onChange={handleInputChange}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {/* Token Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                    <div className="space-y-2">
                                        <Label htmlFor="principalToken">Principal Token Address</Label>
                                        <Input
                                            id="principalToken"
                                            name="principalToken"
                                            placeholder="0x..."
                                            value={formData.principalToken}
                                            onChange={handleInputChange}
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="collateralToken">Collateral Token Address</Label>
                                        <Input
                                            id="collateralToken"
                                            name="collateralToken"
                                            placeholder="0x..."
                                            value={formData.collateralToken}
                                            onChange={handleInputChange}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {/* Create Auction Button */}
                                <Button
                                    onClick={createAuction}
                                    disabled={isLoading || !formData.principalGoal || !formData.collateralInitialDeposit}
                                    className="w-full"
                                    size="lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating Auction...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="mr-2 h-4 w-4" />
                                            Create Auction
                                        </>
                                    )}
                                </Button>

                                {/* Info Box */}
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Important:</strong> Make sure the AuctionFactory contract address is configured correctly and that your tokens are whitelisted in the factory before creating an auction.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    )
} 