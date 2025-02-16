import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { deactivateWatcher } from "../watcher/deactive-watcher";
import { activateWatcher } from "../watcher/activate-watcher";
import { processJsonFile } from "../utils/process-files.util";

let isWatcherActive = false;

export const toggleWatcher = (
  fileWatcher: vscode.FileSystemWatcher | undefined,
  diagnosticCollection: vscode.DiagnosticCollection
) => {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage(
      "Nenhuma pasta de workspace aberta no VSCode."
    );
    return;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const defaultJsonPath = path.join(
    rootPath,
    "reports/mutation/stryker-incremental.json"
  );

  if (!fs.existsSync(defaultJsonPath)) {
    vscode.window.showErrorMessage(
      `Arquivo JSON não encontrado em: ${defaultJsonPath}`
    );
    return;
  }

  if (isWatcherActive) {
    isWatcherActive = deactivateWatcher(fileWatcher, diagnosticCollection);
    vscode.window.showInformationMessage(
      "Observador de alterações desativado."
    );
  } else {
    isWatcherActive = activateWatcher(
      defaultJsonPath,
      rootPath,
      fileWatcher,
      diagnosticCollection,
    );
    processJsonFile(diagnosticCollection, defaultJsonPath, rootPath);
    vscode.window.showInformationMessage("Observador de alterações ativado.");
  }

};
