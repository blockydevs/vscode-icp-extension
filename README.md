#  VSCODE MOTOKO
## Overview

This Visual Studio Code extension provides a specialized Language Server to help developers working with `dfx.json` files. The main features of this extension include:

- **Autocomplete**: Helps users by suggesting possible completions for their input based on the schema.
- **Validation**: Checks the `dfx.json` file against the provided schema and highlights any errors or inconsistencies.

These features are powered by a schema located in `/server/dfx.json`.

- **Canisters View**: A visual representation of the `dfx.json` file in a tree format, allowing easy navigation and interaction with canisters. The extension is activated from the side panel of Visual Studio Code.
- **Canister Actions**: For each canister, you can perform various actions such as deploying the canister. You can also perform actions on all canisters collectively.

### Key Files and Directories

- **client/extension.ts**: Responsible for starting the client and registering commands.
- **server/server.ts**: Entry point for the Language Server, where the server is configured and started.
- **package.json**: Contains metadata about the extension, including dependencies, activation events, and contributions to VS Code.
- **modules/**: Contains helper modules for commands, global variables, dfx json provider, logs and replica management.
- **tools/ui/**: Contains Candid UI source code acquired from [Dfinity Candid Implementation](https://github.com/dfinity/candid) with our changes for better visual experience in Visual Studio Code.

## How to Run

To get started with the extension, follow these steps:

1. **Install dependencies**: Run `npm install` in the root directory to install all necessary npm modules for the client, server and tools/ui packages.

2. **Build the project**:
   - Run `npm run build` to build project and put sources of client and server to target directory `build` and also build necessary Candid UI packages.

3. **Launch the extension**:
   - Switch to the Run and Debug View in the Sidebar (`Ctrl+Shift+D`).
   - Select `Launch Extension` from the dropdown menu.
   - Press `▷` (or `F5`) to run the launch configuration.

4. **Test the extension**:
   - In the new instance of VS Code that opens (known as the Extension Development Host), open a document with a `.json` extension.
   - You should see validation errors and autocomplete suggestions specific to `dfx.json` files.
   - You can also start local replica, deploy canisters based on `dfx.json` definitions and by selecting option of deploying Candid UI 
   also launch Candid UI for selected canister in webview.

## Pack to one file and Run Local
To use this VS Code extension locally without publishing it to the Marketplace, follow these steps:

1. **Install `vsce` (Visual Studio Code Extension Manager) if you haven't already:**

   ```sh
   npm install -g vsce
   ```
2. Package the extension:

   Navigate to your extension project directory and run:

   ```sh
   vsce package
   ```

3. Install the .vsix package in Visual Studio Code:

- Open Visual Studio Code.
- Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window or by pressing Ctrl+Shift+X.
- Click on the three dots in the top right corner of the Extensions view.
- Select Install from VSIX....
- Browse to the .vsix file generated in step 2 and select it.
- 
## Example Use Cases
  
The extension comes with several built-in commands to manage and interact with `dfx.json` and related development tasks. These commands are executed through the context menu in the Canisters View.

**Refresh**: When you have made changes to the `dfx.json` file outside of VS Code or through other processes and want to ensure the tree view is up-to-date.

`canisters> Show Actions`:

1. **Start the Replica**:
   - **Use Case**: When you need to start the local Internet Computer (IC) replica to test your canisters.
   - **Action**: Select "Start Replica" from the options menu to initiate the local IC instance.

2. **Deploy All Canisters**:
   - **Use Case**: When you want to deploy all canisters defined in the `dfx.json` file.
   - **Action**: Select "Deploy Canisters" from the options menu to deploy all canisters at once.

3. **Deploy Candid**:
   - **Use Case**: When you want to use Candid UI to test deployed canister methods in webview in VS Code.
   - **Action**: Select "Deploy Candid" from the options menu to deploy Candid UI canister.

`Show Canister Actions`:

1. **Deploy a Canister**:
   - **Use Case**: When you have made changes to a specific canister and need to deploy it.
   - **Action**: Click on the canister in the tree view and select "Deploy Canister"

2. **View Logs**:
   - **Use Case**: View logs for specific canister.
   - **Action**: Click on a canister and select "View Logs"

3. **Open Candid UI**:
   - **Use Case**: Open Candid UI in webview.
   - **Action**: Click on a canister which has been deployed and select "Open Candid UI"

4. **Open Candid UI in sidebar**:
   - **Use Case**: Open Candid UI in webview in sidebar.
   - **Action**: Click on a canister which has been deployed and select "Open Candid UI in sidebar"
  
## Using `dfx` with WSL in Visual Studio Code

To use `dfx` with Windows Subsystem for Linux (WSL) in Visual Studio Code, follow these steps:

1. **Install and Set Up WSL:**

   Ensure you have WSL installed and set up on your system. Follow the [official Microsoft guide](https://docs.microsoft.com/en-us/windows/wsl/install) if you haven't done this yet.

2. **Install `dfx` in WSL:**

   Open your WSL terminal and install `dfx` according to the [Internet Computer documentation](https://internetcomputer.org/docs/current/developer-docs/getting-started/install/).

3. **Open Visual Studio Code:**

   Open Visual Studio Code on your Windows machine.

4. **Connect to WSL:**

   - Click on the green remote connection icon in the bottom left corner of the VS Code window.
   - Select `Connect to WSL` from the dropdown menu.
   - Choose your WSL distribution if prompted.

5. **Access `dfx` commands in VS Code:**

   Once connected to WSL, you will be able to run `dfx` commands directly from the integrated terminal in VS Code.

   - Open a new terminal in VS Code by clicking on `Terminal` in the top menu and selecting `New Terminal`.
   - Check `dfx --version` to verify the installation.
