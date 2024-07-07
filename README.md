# LSP for dfx.json validation

Based on https://github.com/microsoft/vscode-extension-samples/tree/main/lsp-sample

## Functionality

This Language Server works for dfx.json file. It has the following language features:
- Autocomplete
- Validation
All based on schema provided in /server/src/dfx.json

## Structure

```
.
├── client // Language Client
│   ├── extension.ts // Language Client entry point 
├── package.json // The extension manifest.
├── src // code for react app for webview
└── server // Language Server
    └── server.ts // Language Server entry point

```

## How to run

- Run `npm install` in this folder. This installs all necessary npm modules in both the client and server folder
- Run `npm run build` for building vscode extension client, corresponding server for vscode language server and react app for webview
- Switch to the Run and Debug View in the Sidebar (Ctrl+Shift+D).
- Select `Launch Extension` from the drop down (if it is not already).
- Press ▷ to run the launch config (F5).
- In the [Extension Development Host](https://code.visualstudio.com/api/get-started/your-first-extension#:~:text=Then%2C%20inside%20the%20editor%2C%20press%20F5.%20This%20will%20compile%20and%20run%20the%20extension%20in%20a%20new%20Extension%20Development%20Host%20window.) instance of VSCode, open a document in with '.json' extension and validate document and see suggestions for autocomplete.