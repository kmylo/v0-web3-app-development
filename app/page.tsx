"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Wallet, MessageSquare, Send, PlusCircle, TrendingUp } from "lucide-react"
import Link from "next/link"

// Mock smart contract ABI
const CONTRACT_ABI = [
  {
    inputs: [],
    name: "getMessage",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_message", type: "string" }],
    name: "setMessage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]

// Mock contract address (replace with actual deployed contract)
const CONTRACT_ADDRESS = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"

declare global {
  interface Window {
    ethereum?: any
  }
}

export default function Web3DApp() {
  const [isConnected, setIsConnected] = useState(false)
  const [currentAccount, setCurrentAccount] = useState("")
  const [message, setMessage] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [isTxPending, setIsTxPending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [ethers, setEthers] = useState<any>(null)

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

  const disconnectWallet = () => {
    setIsConnected(false)
    setCurrentAccount("")
    setMessage("")
    setNewMessage("")
    setError("")
  }

  const getContractMessage = async () => {
    if (!ethers || !window.ethereum || !isConnected) return

    try {
      setError("")
      setIsLoading(true)

      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

      // For demo purposes, we'll simulate a contract call
      // In a real scenario, this would call the actual contract
      setTimeout(() => {
        setMessage("Hello from the blockchain! This is a mock message from your smart contract.")
        setIsLoading(false)
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Failed to read contract data")
      setIsLoading(false)
    }
  }

  const setContractMessage = async () => {
    if (!ethers || !window.ethereum || !isConnected || !newMessage.trim()) return

    try {
      setError("")
      setIsTxPending(true)

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      // For demo purposes, we'll simulate a transaction
      // In a real scenario, this would send an actual transaction
      setTimeout(() => {
        setMessage(newMessage)
        setNewMessage("")
        setIsTxPending(false)
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Failed to send transaction")
      setIsTxPending(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">OkBond DApp</h1>
          <p className="text-gray-600 dark:text-gray-300">Decentralized Bond Auctions on Blockchain</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Actions Card - NEW */}
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Get started with bond auctions</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/create-auction">
              <Button className="w-full" variant="default" size="lg">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Auction
              </Button>
            </Link>
            <Button className="w-full" variant="outline" size="lg" disabled>
              <TrendingUp className="mr-2 h-4 w-4" />
              Browse Auctions
            </Button>
          </CardContent>
        </Card>

        {/* Wallet Connection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Connection
            </CardTitle>
            <CardDescription>Connect your MetaMask wallet to interact with the blockchain</CardDescription>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <Button onClick={connectWallet} disabled={isLoading} className="w-full" size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Connected to: <span className="font-mono font-semibold">{formatAddress(currentAccount)}</span>
                  </p>
                </div>
                <Button onClick={disconnectWallet} variant="outline" className="w-full bg-transparent">
                  Disconnect Wallet
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Interaction Cards */}
        {isConnected && (
          <>
            {/* Read Contract Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Read Contract Data
                </CardTitle>
                <CardDescription>Fetch the current message from the smart contract</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={getContractMessage} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Get Message"
                  )}
                </Button>

                {message && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Contract Message:</p>
                    <p className="text-blue-900 dark:text-blue-100">{message}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Send Transaction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Transaction
                </CardTitle>
                <CardDescription>Update the contract message by sending a transaction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Enter new message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={isTxPending}
                />

                <Button onClick={setContractMessage} disabled={isTxPending || !newMessage.trim()} className="w-full">
                  {isTxPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Transaction Pending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Set Message
                    </>
                  )}
                </Button>

                {isTxPending && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Transaction is being processed. Please wait...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            OkBond • Decentralized Bond Protocol • Powered by React & ethers.js
          </p>
        </div>
      </div>
    </div>
  )
}
