
import * as vscode from "vscode";
import { processJsonFile } from "../utils/process-files.util";
import { clearDiagnostics } from "../diagnostics/clear-diagnostics";

export function activateWatcher(
  jsonPath: string,
  rootPath: string,
  fileWatcher: vscode.FileSystemWatcher | undefined,
  diagnosticCollection: vscode.DiagnosticCollection,
) {
  fileWatcher = vscode.workspace.createFileSystemWatcher(jsonPath);

  fileWatcher.onDidChange(() => {
    vscode.window.showInformationMessage(
      "Alteração detectada no arquivo JSON. Processando novamente..."
    );
    processJsonFile(diagnosticCollection, jsonPath, rootPath, );
  });

  fileWatcher.onDidCreate(() => {
    vscode.window.showInformationMessage("Arquivo JSON criado. Processando...");
    processJsonFile(diagnosticCollection, jsonPath, rootPath);
  });

  fileWatcher.onDidDelete(() => {
    vscode.window.showWarningMessage(
      "Arquivo JSON excluído. Diagnósticos limpos."
    );
    clearDiagnostics(diagnosticCollection);
  });

  return true;
}
