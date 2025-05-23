import { Analytics } from "@vercel/analytics/react";
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Clock, Boxes, Wallet, ArrowRightLeft, Shield, Activity, ChevronRight, ChevronDown, X, RefreshCw } from 'lucide-react';
import { Connection, clusterApiUrl, PublicKey, ConfirmedSignatureInfo, ParsedTransactionWithMeta } from '@solana/web3.js';
import bs58 from 'bs58';

// Define network types
type Network = 'mainnet-beta' | 'devnet' | 'testnet';

// Define Block structure
interface Block {
  slot: number;
  timestamp: number | null;
  transactions: number;
  validator: string;
}

// Define Transaction structure
interface Transaction {
  signature: string;
  slot: number;
  timestamp: number;
  type: string;
  amount?: string;
  from?: string;
  to?: string;
  fee: number;
  result: string;
  instructions: any[];
  programLogs: string[];
}

// Fallback addresses for initial data
const FALLBACK_ADDRESSES = [
  'So11111111111111111111111111111111111111112', // Wrapped SOL
  '9n4nbM75f5nZ8g5g5g5g5g5g5g5g5g5g5g5g5g5g', // Example Token Address
  '4k3Dyjzvzp8e1Z1g1g1g1g1g1g1g1g1g1g1g1g1g', // Another known address
];

// StatsCard Component: Displays a stat with an icon
function StatsCard({ icon, title, value, subValue }: { icon: React.ReactNode, title: string, value: string, subValue: string }) {
  return (
    <div className="bg-[#1a1b23] rounded-xl border border-[#2a2b35] p-6">
      <div className="flex items-center space-x-4 mb-4">
        <div className="bg-[#2a2b35] p-3 rounded-lg">
          <div className="text-[#9945FF]">{icon}</div>
        </div>
        <div>
          <h3 className="text-white/70 text-sm font-medium">{title}</h3>
          <div className="text-white text-2xl font-bold">{value}</div>
        </div>
      </div>
      <div className="text-white/60 text-sm">{subValue}</div>
    </div>
  );
}

// TransactionDetailModal: Pop-up showing transaction details
function TransactionDetailModal({ transaction, onClose }: { transaction: Transaction | null, onClose: () => void }) {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1b23] rounded-2xl border border-[#2a2b35] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-[#1a1b23] border-b border-[#2a2b35] p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Transaction Details</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-sm text-white/70 uppercase tracking-wide">Signature</span>
              <div className="bg-[#2a2b35] p-3 rounded-lg text-white font-mono text-sm break-all">
                {transaction.signature}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-white/70 uppercase tracking-wide">Result</span>
              <div className={`p-3 rounded-lg text-white font-medium ${transaction.result === 'Success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {transaction.result}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <span className="text-sm text-white/70 uppercase tracking-wide">Slot</span>
              <div className="bg-[#2a2b35] p-3 rounded-lg text-white">#{transaction.slot.toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-white/70 uppercase tracking-wide">Timestamp</span>
              <div className="bg-[#2a2b35] p-3 rounded-lg text-white text-sm">
                {new Date(transaction.timestamp * 1000).toLocaleString()}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-white/70 uppercase tracking-wide">Fee</span>
              <div className="bg-[#2a2b35] p-3 rounded-lg text-white">{(transaction.fee / 1_000_000_000).toFixed(9)} SOL</div>
            </div>
          </div>
          {(transaction.from || transaction.to || transaction.amount) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Transfer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transaction.from && (
                  <div className="space-y-2">
                    <span className="text-sm text-white/70 uppercase tracking-wide">From</span>
                    <div className="bg-[#2a2b35] p-3 rounded-lg text-white font-mono text-sm break-all">
                      {transaction.from}
                    </div>
                  </div>
                )}
                {transaction.to && (
                  <div className="space-y-2">
                    <span className="text-sm text-white/70 uppercase tracking-wide">To</span>
                    <div className="bg-[#2a2b35] p-3 rounded-lg text-white font-mono text-sm break-all">
                      {transaction.to}
                    </div>
                  </div>
                )}
                {transaction.amount && (
                  <div className="space-y-2">
                    <span className="text-sm text-white/70 uppercase tracking-wide">Amount</span>
                    <div className="bg-[#2a2b35] p-3 rounded-lg text-white">{transaction.amount} SOL</div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Instructions</h3>
            <div className="bg-[#2a2b35] p-4 rounded-lg max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-[#3a3b45] scrollbar-track-[#2a2b35]">
              {transaction.instructions.length > 0 ? (
                transaction.instructions.map((instr, idx) => (
                  <div key={idx} className="text-white text-sm font-mono mb-2 last:mb-0">
                    {JSON.stringify(instr, null, 2)}
                  </div>
                ))
              ) : (
                <div className="text-white/60 text-sm">No instructions available</div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Program Logs</h3>
            <div className="bg-[#2a2b35] p-4 rounded-lg max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-[#3a3b45] scrollbar-track-[#2a2b35]">
              {transaction.programLogs.length > 0 ? (
                transaction.programLogs.map((log, idx) => (
                  <div key={idx} className="text-white text-sm font-mono mb-1 last:mb-0">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-white/60 text-sm">No program logs available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const NETWORK_ENDPOINTS = {
  'mainnet-beta': 'https://solana-rpc.publicnode.com',
  'devnet': 'https://api.devnet.solana.com',
  'testnet': 'https://api.testnet.solana.com'
};

// Main App Component
function App() {
  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<Network>('devnet');
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [connection, setConnection] = useState<Connection>(() =>
    new Connection(NETWORK_ENDPOINTS['devnet'], {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000
    })
  );
  const [recentBlocks, setRecentBlocks] = useState<Block[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<Transaction[]>([]);
  const [tps, setTps] = useState<number>(0);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isWalletTxLoading, setIsWalletTxLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Transaction[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Network options for dropdown
  const networks = {
    'mainnet-beta': { name: 'Mainnet', className: 'bg-green-500' },
    'devnet': { name: 'Devnet', className: 'bg-purple-500' },
    'testnet': { name: 'Testnet', className: 'bg-blue-500' },
  };

  // Fetch transaction details by signature
  const fetchTransactionDetails = async (signature: string): Promise<Transaction | null> => {
    console.log(`Fetching details for signature: ${signature} (length: ${signature.length})`);
    try {
      let attempts = 0;
      let tx = null;
      
      while (attempts < 3 && !tx) {
        try {
          tx = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed'
          });
          break;
        } catch (err) {
          console.warn(`Attempt ${attempts + 1} failed for signature ${signature}:`, err);
          attempts++;
          if (attempts < 3) await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
  
      if (!tx) {
        console.log(`Transaction not found for ${signature} after ${attempts} attempts`);
        return null;
      }
  
      console.log(`Raw transaction data for ${signature}:`, tx);
  
      const timestamp = tx.blockTime || Math.floor(Date.now() / 1000);
      const result = tx.meta?.err ? 'Failed' : 'Success';
      const fee = tx.meta?.fee || 0;
      const instructions = tx.transaction.message.instructions;
      const programLogs = tx.meta?.logMessages || [];
  
      let from = '', to = '', amount = '';
      let transactionType = 'Unknown';
      
      if (tx.transaction.message.instructions && tx.transaction.message.instructions.length > 0) {
        const instruction = tx.transaction.message.instructions[0];
        
        if ('parsed' in instruction) {
          transactionType = instruction.parsed?.type || 'Unknown';
          
          if (instruction.parsed?.type === 'transfer') {
            from = instruction.parsed.info.source;
            to = instruction.parsed.info.destination;
            amount = (instruction.parsed.info.lamports / 1_000_000_000).toString();
          }
        } else if (instruction.programId) {
          transactionType = instruction.programId.toString();
        }
      }
  
      const txDetails = {
        signature,
        slot: tx.slot,
        timestamp,
        type: transactionType,
        from,
        to,
        amount,
        fee,
        result,
        instructions,
        programLogs
      };
      console.log('Transaction details fetched:', txDetails);
      return txDetails;
    } catch (error) {
      console.warn(`Error fetching transaction details for ${signature}:`, error);
      return null;
    }
  };

  // Fetch recent transactions from fallback addresses
  // const fetchTransactions = useCallback(async () => {
  //   for (const address of FALLBACK_ADDRESSES) {
  //     try {
  //       const pubKey = new PublicKey(address);
  //       const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 5 }, 'confirmed');
        
  //       if (signatures.length > 0) {
  //         const txs: Transaction[] = [];
  //         for (const sig of signatures) {
  //           const txDetails = await fetchTransactionDetails(sig.signature);
  //           if (txDetails) txs.push(txDetails);
  //         }
  //         console.log('Recent transactions fetched:', txs);
  //         return txs;
  //       }
  //     } catch (error) {
  //       console.warn(`Error fetching transactions for ${address}:`, error);
  //       continue;
  //     }
  //   }
  //   return [];
  // }, [connection]);

  // // Fetch recent blocks
  // const fetchBlocks = useCallback(async () => {
  //   try {
  //     const slot = await connection.getSlot('finalized');
  //     const blocks: Block[] = [];
      
  //     let fetchPromises = [];
  //     for (let i = 0; i < 5; i++) {
  //       fetchPromises.push(
  //         connection.getBlock(slot - i, {
  //           maxSupportedTransactionVersion: 0,
  //           commitment: 'confirmed'
  //         }).then(blockInfo => {
  //           if (blockInfo) {
  //             blocks.push({
  //               slot: slot - i,
  //               timestamp: blockInfo.blockTime,
  //               transactions: blockInfo.transactions.length,
  //               validator: blockInfo.rewards?.[0]?.pubkey || 'Unknown',
  //             });
  //           }
  //         }).catch(blockError => {
  //           console.warn(`Error fetching block ${slot - i}:`, blockError);
  //         })
  //       );
  //     }
      
  //     await Promise.allSettled(fetchPromises);
      
  //     return blocks.sort((a, b) => b.slot - a.slot);
  //   } catch (error) {
  //     console.warn('Error fetching blocks:', error);
  //     return [];
  //   }
  // }, [connection]);

  // Fetch recent blocks
  const fetchBlocks = useCallback(async () => {

    try {
  
      const slot = await connection.getSlot('finalized');
  
      console.log("Fetching blocks from slot:", slot); // Log the slot being fetched
  
      const blocks: Block[] = [];
  
      
  
      let fetchPromises = [];
  
      for (let i = 0; i < 5; i++) {
  
        fetchPromises.push(
  
          connection.getBlock(slot - i, {
  
            maxSupportedTransactionVersion: 0,
  
            commitment: 'confirmed'
  
          }).then(blockInfo => {
  
            if (blockInfo) {
  
              blocks.push({
  
                slot: slot - i,
  
                timestamp: blockInfo.blockTime,
  
                transactions: blockInfo.transactions.length,
  
                validator: blockInfo.rewards?.[0]?.pubkey || 'Unknown',
  
              });
  
            }
  
          }).catch(blockError => {
  
            console.warn(`Error fetching block ${slot - i}:`, blockError);
  
          })
  
        );
  
      }
  
      
  
      await Promise.allSettled(fetchPromises);
  
      
  
      console.log("Fetched blocks:", blocks); // Log the fetched blocks
  
      return blocks.sort((a, b) => b.slot - a.slot);
  
    } catch (error) {
  
      console.warn('Error fetching blocks:', error);
  
      return [];
  
    }
  
  }, [connection]);
  
  
  const fetchTransactions = useCallback(async () => {
  
    for (const address of FALLBACK_ADDRESSES) {
  
      try {
  
        const pubKey = new PublicKey(address);
  
        const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 5 }, 'confirmed');
  
        console.log(`Fetched signatures for address ${address}:`, signatures); // Log signatures
  
        
  
        if (signatures.length > 0) {
  
          const txs: Transaction[] = [];
  
          for (const sig of signatures) {
  
            const txDetails = await fetchTransactionDetails(sig.signature);
  
            if (txDetails) txs.push(txDetails);
  
          }
  
          console.log('Recent transactions fetched:', txs); // Log fetched transactions
  
          return txs;
  
        }
  
      } catch (error) {
  
        console.warn(`Error fetching transactions for ${address}:`, error);
  
        continue;
  
      }
  
    }
  
    return [];
  
  }, [connection]);

  // Fetch wallet transactions
  const fetchWalletTransactions = async () => {
    if (!connectedWallet) {
      setWalletTransactions([]);
      return;
    }
    
    setIsWalletTxLoading(true);
    try {
      const walletPubkey = new PublicKey(connectedWallet);
      const signatures = await connection.getSignaturesForAddress(walletPubkey, { limit: 10 }, 'confirmed');
      
      if (signatures.length > 0) {
        const txs: Transaction[] = [];
        for (const sig of signatures) {
          const txDetails = await fetchTransactionDetails(sig.signature);
          if (txDetails) txs.push(txDetails);
        }
        setWalletTransactions(txs);
      } else {
        setWalletTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      setWalletTransactions([]);
    } finally {
      setIsWalletTxLoading(false);
    }
  };

  // Fetch initial data and update periodically
  useEffect(() => {

    let isMounted = true;

    let retryTimeout: NodeJS.Timeout;


    const fetchData = async () => {

        if (!isMounted) return;


        try {

            // Fetch blocks and transactions using the current connection

            const fetchedBlocks = await fetchBlocks();

            const fetchedTransactions = await fetchTransactions();


            // Update state with fetched data

            if (isMounted) {

                setRecentBlocks(fetchedBlocks);

                setRecentTransactions(fetchedTransactions);

                setRetryCount(0);

            }

        } catch (error) {

            console.error('Error fetching data:', error);

            if (isMounted && retryCount < 3) {

                setRetryCount(prev => prev + 1);

                retryTimeout = setTimeout(fetchData, 2000 * (retryCount + 1));

            }

        } finally {

            if (isMounted) setIsLoading(false);

        }

    };


    fetchData(); // Call fetchData when the component mounts or connection changes

    const interval = setInterval(fetchData, 10000); // Fetch data every 10 seconds


    return () => {

        isMounted = false;

        clearInterval(interval);

        if (retryTimeout) clearTimeout(retryTimeout);

    };

}, [connection]); // Add connection as a dependency
  // useEffect(() => {
  //   let isMounted = true;
  //   let retryTimeout: NodeJS.Timeout;
  
  //   const fetchData = async () => {
  //     if (!isMounted) return;
      
  //     try {
  //       let fetchedBlocks: Block[] = [];
  //       try {
  //         fetchedBlocks = await fetchBlocks();
  //       } catch (blocksError) {
  //         console.warn('Error fetching blocks:', blocksError);
  //         fetchedBlocks = [
  //           {
  //             slot: 1000000,
  //             timestamp: Math.floor(Date.now() / 1000),
  //             transactions: 420,
  //             validator: "Fallback Validator"
  //           },
  //           {
  //             slot: 999999,
  //             timestamp: Math.floor(Date.now() / 1000) - 300,
  //             transactions: 380,
  //             validator: "Fallback Validator"
  //           }
  //         ];
  //       }
        
  //       let fetchedTransactions: Transaction[] = [];
  //       try {
  //         fetchedTransactions = await fetchTransactions();
  //       } catch (txError) {
  //         console.warn('Error fetching transactions:', txError);
  //         fetchedTransactions = [
  //           {
  //             signature: "Fallback Signature 1",
  //             slot: 1000000,
  //             timestamp: Math.floor(Date.now() / 1000),
  //             type: "Transfer",
  //             fee: 5000,
  //             result: "Success",
  //             instructions: [],
  //             programLogs: []
  //           },
  //           {
  //             signature: "Fallback Signature 2",
  //             slot: 999999,
  //             timestamp: Math.floor(Date.now() / 1000) - 300,
  //             type: "Transfer",
  //             fee: 5000,
  //             result: "Success",
  //             instructions: [],
  //             programLogs: []
  //           }
  //         ];
  //       }
        
  //       let tpsValue = 0;
  //       try {
  //         const perfSamples = await connection.getRecentPerformanceSamples(1);
  //         if (perfSamples.length > 0) {
  //           tpsValue = Math.round(perfSamples[0].numTransactions / perfSamples[0].samplePeriodSecs);
  //         }
  //       } catch (perfError) {
  //         console.warn('Error fetching performance samples:', perfError);
  //         tpsValue = 2500; // Fallback TPS value
  //       }
  
  //       if (isMounted) {
  //         if (fetchedBlocks.length > 0) setRecentBlocks(fetchedBlocks);
  //         if (fetchedTransactions.length > 0) setRecentTransactions(fetchedTransactions);
  //         setTps(tpsValue);
  //         setRetryCount(0);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //       if (isMounted && retryCount < 3) {
  //         setRetryCount(prev => prev + 1);
  //         retryTimeout = setTimeout(fetchData, 2000 * (retryCount + 1));
  //       }
  //     } finally {
  //       if (isMounted) setIsLoading(false);
  //     }
  //   };
  
  //   fetchData();
  //   const interval = setInterval(fetchData, 10000);
  
  //   return () => {
  //     isMounted = false;
  //     clearInterval(interval);
  //     if (retryTimeout) clearTimeout(retryTimeout);
  //   };
  // }, [connection, fetchBlocks, fetchTransactions, retryCount]);

  // Fetch wallet transactions when wallet connects
  useEffect(() => {
    fetchWalletTransactions();
  }, [connectedWallet, connection]);

  // Change network
  const handleNetworkChange = (network: Network) => {

    setSelectedNetwork(network);

    setIsNetworkDropdownOpen(false);

    setIsLoading(true);

    

    // Create a new connection for the selected network

    const newConnection = new Connection(NETWORK_ENDPOINTS[network], {

        commitment: 'confirmed',

        confirmTransactionInitialTimeout: 60000

    });

    
    console.log("Current connection endpoint:", newConnection.rpcEndpoint);
    // Update the connection state

    setConnection(newConnection);

};

  // Connect wallet (Phantom)
  const handleConnectWallet = async () => {
    if (connectedWallet) {
      setConnectedWallet(null);
      setWalletTransactions([]);
      return;
    }
    
    setIsWalletConnecting(true);
    try {
      const { solana } = window as any;
      if (!solana?.isPhantom) {
        window.open('https://phantom.app/', '_blank');
        return;
      }
      const response = await solana.connect();
      setConnectedWallet(response.publicKey.toString());
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsWalletConnecting(false);
    }
  };

  // Handle search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    console.log('Starting search for:', searchQuery, 'on network:', selectedNetwork, 'length:', searchQuery.length);
    setIsSearchLoading(true);
    setHasSearched(true);
    setSearchResults([]); // Clear previous results
    
    try {
      // First attempt to treat as transaction signature regardless of length
      try {
        console.log('Attempting to treat as transaction signature...');
        const txDetails = await fetchTransactionDetails(searchQuery);
        console.log('txDetails after fetch:', txDetails);
        
        if (txDetails) {
          console.log('Setting searchResults with:', [txDetails]);
          setSearchResults([txDetails]);
          setIsSearchLoading(false);
          return; // Exit early if we found a transaction
        }
      } catch (sigError) {
        console.warn('Not a valid transaction signature:', sigError);
      }
      
      // Then check for address (32-44 characters typically)
      try {
        console.log('Attempting to treat as address...');
        const pubKey = new PublicKey(searchQuery);
        const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 10 });
        console.log('Signatures found for address:', signatures);
        
        if (signatures.length > 0) {
          const txs: Transaction[] = [];
          for (const sig of signatures) {
            const txDetails = await fetchTransactionDetails(sig.signature);
            if (txDetails) txs.push(txDetails);
          }
          console.log('Transactions from address:', txs);
          setSearchResults(txs);
          setIsSearchLoading(false);
          return; // Exit if we found address transactions
        }
      } catch (addrError) {
        console.warn('Not a valid address:', addrError);
      }
      
      // Finally try to see if it's a block number
      try {
        const blockNum = parseInt(searchQuery);
        if (!isNaN(blockNum)) {
          console.log('Attempting to treat as block number...');
          const blockInfo = await connection.getBlock(blockNum, {
            maxSupportedTransactionVersion: 0
          });
          
          if (blockInfo) {
            const blockTxs: Transaction[] = [];
            for (let i = 0; i < Math.min(5, blockInfo.transactions.length); i++) {
              const txSig = blockInfo.transactions[i].transaction.signatures[0];
              const txDetails = await fetchTransactionDetails(txSig);
              if (txDetails) blockTxs.push(txDetails);
            }
            setSearchResults(blockTxs);
          }
        }
      } catch (blockError) {
        console.warn('Not a valid block number:', blockError);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearchLoading(false);
      console.log('Search complete, isSearchLoading set to false');
    }
  };

  // Format timestamp as "time ago"
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() / 1000) - timestamp);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  // Show transaction details on click
  const handleTransactionClick = (tx: Transaction) => {
    setSelectedTransaction(tx);
  };

  // Render the UI
  return (
    <div className="min-h-screen bg-[#0c0d10]">
      {/* Header */}
      <header className="bg-[#1a1b23] border-b border-[#2a2b35] sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                alt="Solana Logo"
                className="w-8 h-8"
              />
              <span className="text-2xl font-bold text-white">Solana Explorer</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <div className="relative">
                <button
                  onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                  className="flex items-center space-x-2 bg-[#2a2b35] rounded-lg px-3 py-2 text-white hover:bg-[#3a3b45] transition-colors text-sm md:text-base"
                >
                  <div className={`w-2 h-2 rounded-full ${networks[selectedNetwork].className}`} />
                  <span>{networks[selectedNetwork].name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {isNetworkDropdownOpen && (
                  <div className="absolute top-full mt-2 w-full bg-[#2a2b35] rounded-lg border border-[#3a3b45] overflow-hidden z-50">
                    {Object.entries(networks).map(([key, { name, className }]) => (
                      <button
                        key={key}
                        onClick={() => handleNetworkChange(key as Network)}
                        className="flex items-center space-x-2 w-full px-4 py-2 hover:bg-[#3a3b45] text-white"
                      >
                        <div className={`w-2 h-2 rounded-full ${className}`} />
                        <span>{name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="hidden md:flex items-center bg-[#2a2b35] rounded-full px-3 py-2">
                <Activity className={`w-4 h-4 ${isLoading ? "text-yellow-400" : "text-green-400"}`} />
                <span className={`ml-2 text-sm ${isLoading ? "text-yellow-400" : "text-green-400"}`}>
                  {isLoading ? "Syncing..." : "Network Healthy"}
                </span>
              </div>
              <div className="hidden md:block text-white/80 text-sm">
                <span className="font-mono">{tps.toLocaleString()} TPS</span>
              </div>
              <button
                onClick={handleConnectWallet}
                disabled={isWalletConnecting}
                className={`flex items-center space-x-2 ${connectedWallet ? 'bg-[#3a3b45]' : 'bg-[#9945FF] hover:bg-[#7a37cc]'} text-white rounded-lg px-3 py-2 transition-colors disabled:opacity-70 text-sm md:text-base`}
              >
                <Wallet className="w-4 h-4" />
                <span>
                  {connectedWallet
                    ? `${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}`
                    : isWalletConnecting
                    ? 'Connecting...'
                    : 'Connect Wallet'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-white mb-6 md:mb-8">
            Explore the Solana Blockchain
          </h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by address, transaction, block, or token"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 md:px-6 py-3 md:py-4 bg-[#1a1b23] border border-[#2a2b35] rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#2a2b35] hover:bg-[#3a3b45] p-2 rounded-lg"
            >
              <Search className="text-white w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="container mx-auto px-4 mb-8">
          <div className="bg-[#1a1b23] rounded-xl border border-[#2a2b35] p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Search Results</h2>
            {isSearchLoading ? (
              <div className="text-white/60 text-center py-4">Searching...</div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((tx, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-[#2a2b35] rounded-lg hover:bg-[#3a3b45] transition-colors cursor-pointer"
                    onClick={() => handleTransactionClick(tx)}
                  >
                    <div className="flex items-center space-x-4">
                      <ArrowRightLeft className="w-5 h-5 text-[#9945FF]" />
                      <div>
                        <div className="text-white font-mono">
                          {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                        </div>
                        <div className="text-white/60 text-sm">{tx.type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white">Slot #{tx.slot.toLocaleString()}</div>
                      <div className="text-white/60 text-sm">{formatTimeAgo(tx.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-white/60 text-center py-4">No results found</div>
            )}
          </div>
        </div>
      )}

      {/* Wallet Transactions */}
      {connectedWallet && (
        <div className="container mx-auto px-4 mb-8">
          <div className="bg-[#1a1b23] rounded-xl border border-[#2a2b35] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Your Transactions</h2>
              <button
                onClick={fetchWalletTransactions}
                disabled={isWalletTxLoading}
                className="flex items-center space-x-2 text-[#9945FF] hover:text-[#7a37cc] transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isWalletTxLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
            <div className="space-y-4">
              {isWalletTxLoading ? (
                <div className="text-white/60 text-center py-4">Loading transactions...</div>
              ) : walletTransactions.length > 0 ? (
                walletTransactions.map((tx, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-[#2a2b35] rounded-lg hover:bg-[#3a3b45] transition-colors cursor-pointer"
                    onClick={() => handleTransactionClick(tx)}
                  >
                    <div className="flex items-center space-x-4">
                      <ArrowRightLeft className="w-5 h-5 text-[#9945FF]" />
                      <div>
                                                <div className="text-white font-mono">
                          {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                        </div>
                        <div className="text-white/60 text-sm">{tx.type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white">Slot #{tx.slot.toLocaleString()}</div>
                      <div className="text-white/60 text-sm">{formatTimeAgo(tx.timestamp)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-white/60 text-center py-4">No recent transactions found for this wallet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="container mx-auto px-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <StatsCard
            icon={<Clock className="w-5 h-5" />}
            title="Latest Block"
            value={`#${recentBlocks[0]?.slot.toLocaleString() || '---'}`}
            subValue={recentBlocks[0]?.timestamp ? formatTimeAgo(recentBlocks[0].timestamp) : '---'}
          />
          <StatsCard
            icon={<ArrowRightLeft className="w-5 h-5" />}
            title="Transactions"
            value={recentBlocks[0]?.transactions.toLocaleString() || '---'}
            subValue="Latest block"
          />
          <StatsCard
            icon={<Shield className="w-5 h-5" />}
            title="Current Validator"
            value={recentBlocks[0]?.validator.slice(0, 8) + '...' || '---'}
            subValue="Active node"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1a1b23] rounded-xl border border-[#2a2b35] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Blocks</h2>
              <button className="text-[#9945FF] hover:text-[#7a37cc] flex items-center">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-white/60 text-center py-4">Loading...</div>
              ) : recentBlocks.length > 0 ? (
                recentBlocks.map((block, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-[#2a2b35] rounded-lg hover:bg-[#3a3b45] transition-colors">
                    <div className="flex items-center space-x-4">
                      <Boxes className="w-5 h-5 text-[#9945FF]" />
                      <div>
                        <div className="text-white font-mono">#{block.slot.toLocaleString()}</div>
                        <div className="text-white/60 text-sm">
                          {block.timestamp ? formatTimeAgo(block.timestamp) : '---'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white">{block.transactions} txns</div>
                      <div className="text-white/60 text-sm">{block.validator.slice(0, 8)}...</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-white/60 text-center py-4">No blocks available</div>
              )}
            </div>
          </div>

          <div className="bg-[#1a1b23] rounded-xl border border-[#2a2b35] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Transactions</h2>
              <button className="text-[#9945FF] hover:text-[#7a37cc] flex items-center">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-white/60 text-center py-4">Loading...</div>
              ) : recentTransactions.length > 0 ? (
                recentTransactions.map((tx, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-[#2a2b35] rounded-lg hover:bg-[#3a3b45] transition-colors cursor-pointer"
                    onClick={() => handleTransactionClick(tx)}
                  >
                    <div className="flex items-center space-x-4">
                      <ArrowRightLeft className="w-5 h-5 text-[#9945FF]" />
                      <div>
                        <div className="text-white font-mono">
                          {tx.signature.slice(0, 4)}...{tx.signature.slice(-4)}
                        </div>
                        <div className="text-white/60 text-sm">{tx.type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white">Slot #{tx.slot.toLocaleString()}</div>
                      <div className="text-white/60 text-sm">{formatTimeAgo(tx.timestamp)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-white/60 text-center py-4">No transactions available</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-[#1a1b23] py-8" style={{ backgroundColor: 'rgba(12,13,16,255)' }}>
        <div className="container mx-auto px-4 text-center">
          <div className="space-y-4">
            <div className="text-white text-2xl font-bold tracking-wider">
              Build Build Build !!!
            </div>
            <div className="flex items-center justify-center space-x-2">
              <img
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                alt="Solana Logo"
                className="w-6 h-6"
                width="65"
                height="65"
              />
              <span className="text-white text-lg font-semibold"> IS FOR EVERYONE</span>
            </div>
            <div className="text-white/70 text-sm">
              Made with ❤️ by Rachit
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-white/70 text-sm">Contact me:</span>
              <a
                href="https://x.com/Rachit_twts"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9945FF] hover:text-[#7a37cc] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
      <Analytics />
    </div>
  );
}

export default App;
                        
