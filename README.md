Below is a GitHub README for your Solana Explorer project based on the provided code and package.json. This README includes an overview, features, installation instructions, usage, dependencies, and contribution guidelines.
Solana Explorer

A web-based blockchain explorer for the Solana network, built with React, TypeScript, Vite, and Tailwind CSS. This application allows users to explore recent blocks, transactions, and wallet-specific transaction history on Solana's Mainnet, Devnet, or Testnet.
Features

    Network Selection: Switch between Solana Mainnet, Devnet, and Testnet.
    Recent Activity: View the latest blocks and transactions on the selected network.
    Search Functionality: Search by wallet address or transaction signature to retrieve detailed information.
    Wallet Integration: Connect a Phantom wallet to view your transaction history with a refresh option.
    Transaction Details: Detailed modal view for each transaction, including signature, slot, timestamp, fee, transfer details, instructions, and program logs.
    Responsive Design: Fully responsive UI built with Tailwind CSS, optimized for desktop and mobile.
    Real-Time Metrics: Displays TPS (transactions per second) and network health status.

Prerequisites

    Node.js: Version 18.x or higher.
    npm: Version 9.x or higher (or use yarn/pnpm if preferred).
    Phantom Wallet: Browser extension for wallet integration (optional for testing wallet features).

Installation

    Clone the Repository:
    bash

git clone https://github.com/RachitSrivastava12/SolanaExplorer.git
cd SolanaExplorer
Install Dependencies:
bash
npm install
Run the Development Server:
bash
npm run dev
Open your browser and navigate to http://localhost:5173 
Build for Production:
bash
npm run build
Preview the Build:
bash

    npm run preview

Usage

    Explore the Blockchain:
        On the homepage, view recent blocks and transactions for the selected network.
        Use the search bar to look up a specific wallet address or transaction signature.
    Connect a Wallet:
        Click "Connect Wallet" in the header to link your Phantom wallet.
        Once connected, the "Your Transactions" section will display your wallet’s recent transactions.
        Use the "Refresh" button to update the transaction list manually.
        Click the wallet address again to disconnect.
    View Transaction Details:
        Click any transaction in the "Recent Transactions," "Search Results," or "Your Transactions" sections to open a detailed modal view.
    Switch Networks:
        Use the network dropdown in the header to switch between Mainnet, Devnet, or Testnet.

Project Structure
text
solana-explorer/
├── src/
│   ├── App.tsx          # Main application component
│   ├── index.css        # Global styles (Tailwind CSS setup)
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── eslint.config.js     # ESLint configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── README.md            # This file
Dependencies
Production Dependencies

    @solana/web3.js: Solana blockchain interaction library (^1.91.1).
    bs58: Base58 encoding/decoding for Solana keys (^5.0.0).
    lucide-react: Icon library for UI components (^0.344.0).
    react: React library (^18.3.1).
    react-dom: React DOM rendering (^18.3.1).

Development Dependencies

    @eslint/js, eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh: Linting tools.
    @types/react, @types/react-dom: TypeScript type definitions for React.
    @vitejs/plugin-react: Vite plugin for React.
    autoprefixer, postcss, tailwindcss: CSS tooling.
    typescript, typescript-eslint: TypeScript support.
    vite: Fast build tool (^6.2.1).

Full dependency list available in package.json.
Configuration

    Tailwind CSS: Custom styles are defined in tailwind.config.js and applied via index.css.
    Vite: Configuration in vite.config.ts enables React and TypeScript support.
    ESLint: Linting rules are set in eslint.config.js for code quality.

Troubleshooting

    No Mainnet Data:
        The app uses Solana’s public RPC (api.mainnet-beta.solana.com), which has rate limits. Consider using a private RPC endpoint (e.g., from QuickNode or Alchemy) for production use:
        tsx

        setConnection(new Connection('YOUR_PRIVATE_RPC_URL', { commitment: 'confirmed' }));
        Check the console for errors and ensure your network connection is stable.
    Wallet Connection Issues:
        Ensure Phantom Wallet is installed and unlocked.
        Test with a wallet that has Mainnet transaction history.
    Empty Transaction Lists:
        Verify the wallet or network has recent activity.
        Debug with console.log in fetchWalletTransactions or fetchTransactions.

Contributing

    Fork the repository.
    Create a feature branch (git checkout -b feature/your-feature).
    Commit your changes (git commit -m "Add your feature").
    Push to the branch (git push origin feature/your-feature).
    Open a Pull Request.

License

This project is open-source and available under the MIT License.
Author

Made with ❤️ by Rachit.

Contact me on Twitter: @rachit_twts (replace with your actual handle).
