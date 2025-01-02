## How to run

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

## Key Files and Directories

- **client/extension.ts**: Responsible for starting the client and registering commands.
- **server/server.ts**: Entry point for the Language Server, where the server is configured and started.
- **package.json**: Contains metadata about the extension, including dependencies, activation events, and contributions to VS Code.
- **modules/**: Contains helper modules for commands, global variables, dfx json provider, logs and replica management.
- **tools/ui/**: Contains Candid UI source code acquired from [Dfinity Candid Implementation](https://github.com/dfinity/candid) with our changes for better visual experience in Visual Studio Code.