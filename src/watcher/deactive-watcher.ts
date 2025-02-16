import * as vscode from "vscode";
import { clearDiagnostics } from "../diagnostics/clear-diagnostics";

export function deactivateWatcher(
  fileWatcher: vscode.FileSystemWatcher | undefined,
  diagnosticCollection: vscode.DiagnosticCollection,
) {
  if (fileWatcher) {
    fileWatcher.dispose();
    fileWatcher = undefined;
  }
  clearDiagnostics(diagnosticCollection);
  return false;
}
