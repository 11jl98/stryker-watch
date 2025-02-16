import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { createDiagnostic } from "../diagnostics/create-diagnostics";

export function processMutations(
  files: any,
  testFiles: any,
  rootPath: string
): Map<string, vscode.Diagnostic[]> {
  const diagnosticsMap: Map<string, vscode.Diagnostic[]> = new Map();

  Object.entries(files).forEach(([fileName, fileData]: [string, any]) => {
    const absoluteFilePath = path.resolve(rootPath, fileName);

    if (!fs.existsSync(absoluteFilePath)) {
      return;
    }

    const fileDiagnostics: vscode.Diagnostic[] = [];
    (fileData.mutants || []).forEach((mutant: any) => {
      if (mutant.status.toLowerCase() === "survived") {
        const diagnostic = createDiagnostic(mutant, testFiles, fileName);
        if (diagnostic) {
          fileDiagnostics.push(diagnostic);
        }
      }
    });

    if (fileDiagnostics.length > 0) {
      diagnosticsMap.set(absoluteFilePath, fileDiagnostics);
    }
  });

  return diagnosticsMap;
}