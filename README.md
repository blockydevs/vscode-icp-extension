#  VSCODE MOTOKO
## Overview

This Visual Studio Code extension provides a specialized Language Server to help developers working with `dfx.json` files. The main features of this extension include:

- **Autocomplete**: Helps users by suggesting possible completions for their input based on the schema.
- **Validation**: Checks the `dfx.json` file against the provided schema and highlights any errors or inconsistencies.

These features are powered by a schema located in `/server/src/dfx.json`.

- **Canisters View**: A visual representation of the `dfx.json` file in a tree format, allowing easy navigation and interaction with canisters. The extension is activated from the side panel of Visual Studio Code.
- **Canister Actions**: For each canister, you can perform various actions such as deploying the canister. You can also perform actions on all canisters collectively.
- **Options Section**: Provides additional options for managing the `dfx.json` file and the related canisters.

### Key Files and Directories

- **client/src/extension.ts**: Responsible for starting the client and registering commands.
- **server/src/server.ts**: Entry point for the Language Server, where the server is configured and started.
- **package.json**: Contains metadata about the extension, including dependencies, activation events, and contributions to VS Code.
- **modules/**: Contains helper modules for commands, global variables, project management, and replica management.

## How to Run

To get started with the extension, follow these steps:

1. **Install dependencies**: Run `npm install` in the root directory to install all necessary npm modules for both the client and server.

2. **Compile the project**:
   - Press `Ctrl+Shift+B` to start compiling the client and server in watch mode. This will automatically recompile the project whenever you make changes.

3. **Launch the extension**:
   - Switch to the Run and Debug View in the Sidebar (`Ctrl+Shift+D`).
   - Select `Launch Client` from the dropdown menu.
   - Press `▷` (or `F5`) to run the launch configuration.

4. **Test the extension**:
   - In the new instance of VS Code that opens (known as the Extension Development Host), open a document with a `.json` extension.
   - You should see validation errors and autocomplete suggestions specific to `dfx.json` files.

## Example Use Cases

The extension comes with several built-in commands to manage and interact with `dfx.json` and related development tasks. These commands are executed through the context menu in the Canisters View.

`options`:
1. **Refresh the JSON Tree**:
   - **Use Case**: When you have made changes to the `dfx.json` file outside of VS Code or through other processes and want to ensure the tree view is up-to-date.
   - **Action**: Click on "options" on the tree view and select "Refresh" to update the view.

2. **Create a New Project**:
   - **Use Case**: When you want to start a new project with a fresh `dfx.json` configuration.
   - **Action**: Select "Create New Project" from the options menu and follow the prompts to define the project name and location.

3. **Configure DFX Path**:
   - **Use Case**: When you need to set or change the path to the `dfx` executable, especially useful for WSL (Windows Subsystem for Linux) users.
   - **Action**: Select "Configure WSL DFX Path" from the options menu and enter the desired path.

`canisters> Show Actions`:

1. **Start the Replica**:
   - **Use Case**: When you need to start the local Internet Computer (IC) replica to test your canisters.
   - **Action**: Select "Start Replica" from the options menu to initiate the local IC instance.

2. **Deploy All Canisters**:
   - **Use Case**: When you want to deploy all canisters defined in the `dfx.json` file.
   - **Action**: Select "Deploy Canisters" from the options menu to deploy all canisters at once.

`Show Canister Actions`:

1. **Deploy a Canister**:
   - **Use Case**: When you have made changes to a specific canister and need to deploy it.
   - **Action**: Click on the canister in the tree view and select "Deploy Canister"

2. **View Logs**:
   - **Use Case**: View logs for specific canister.
   - **Action**: Click on a canister and select "View Logs"
