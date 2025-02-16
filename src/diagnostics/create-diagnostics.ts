import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { processTestsFile } from "../utils/process-tests-file";
import { generateTestPrompt } from "../utils/generate-test-prompt";

export function createDiagnostic(
  mutant: any,
  testFiles: any,
  fileName: string
): vscode.Diagnostic | null {
  const { location, mutatorName, replacement, coveredBy } = mutant;

  if (!location || !location.start || !location.end) {
    return null;
  }

  const start = new vscode.Position(
    location.start.line - 1,
    location.start.column
  );
  const end = new vscode.Position(location.end.line - 1, location.end.column);
  const range = new vscode.Range(start, end);

  const absoluteFilePath = path.resolve(
    vscode.workspace.workspaceFolders![0].uri.fsPath,
    fileName
  );

  // lê o arquivo original para extrair o código original e mutado
  let originalCode = "<não disponível>";
  try {
    const fileContent = fs.readFileSync(absoluteFilePath, "utf-8");
    const lines = fileContent.split(/\r?\n/);
    const extractedLines = lines.slice(
      location.start.line - 1,
      location.end.line
    );
    if (extractedLines.length > 0) {
      if (extractedLines.length === 1) {
        originalCode = extractedLines[0]
          .substring(1, location.end.column)
          .trim();
      } else {
        extractedLines[0] = extractedLines[0].substring(1);
        extractedLines[extractedLines.length - 1] = extractedLines[
          extractedLines.length - 1
        ].substring(0, location.end.column);
        originalCode = extractedLines.join("\n").trim();
      }
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Erro ao ler o arquivo original: ${error}`);
  }

  const { testInfo, testFileName } = processTestsFile(
    testFiles,
    fileName,
    coveredBy
  );

  const prompt = `
    O Stryker detectou que a mutação "${mutatorName}" sobreviveu no arquivo "${fileName}", na linha ${
    location.start.line
  }.
  
    **Código Original:**
    ${originalCode.trim()}
  
    **Código Mutado pelo Stryker:**
    ${replacement.trim()}

    ${generateTestPrompt(testInfo, testFileName)}
  `.trim();

  const diagnostic = new vscode.Diagnostic(
    range,
    prompt,
    vscode.DiagnosticSeverity.Warning
  );
  diagnostic.source = "Stryker";
  return diagnostic;
}
