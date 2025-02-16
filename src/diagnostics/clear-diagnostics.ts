import * as vscode from "vscode";

export function clearDiagnostics(diagnosticCollection: vscode.DiagnosticCollection) {
    diagnosticCollection.clear();
  }