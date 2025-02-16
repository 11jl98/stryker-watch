import * as vscode from "vscode";
import * as fs from "fs";
import { processMutations } from "./process-mutations.util";

export function processJsonFile(
  diagnosticCollection: vscode.DiagnosticCollection,
  jsonPath: string,
  rootPath: string
) {
  try {
    const data = fs.readFileSync(jsonPath, "utf-8");
    const results = JSON.parse(data);

    if (!results.files) {
      vscode.window.showErrorMessage(
        'O arquivo JSON não contém a propriedade "files". Verifique a estrutura.'
      );
      return;
    }

    const diagnosticsMap = processMutations(
      results.files,
      results.testFiles,
      rootPath
    );

    diagnosticCollection.clear();
    diagnosticsMap.forEach(
      (fileDiagnostics: vscode.Diagnostic[], filePath: string) => {
        diagnosticCollection.set(vscode.Uri.file(filePath), fileDiagnostics);
      }
    );

    vscode.window.showInformationMessage(
      "Diagnósticos criados para mutações sobreviventes."
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Erro ao processar o arquivo JSON: ${error}`
    );
  }
}
