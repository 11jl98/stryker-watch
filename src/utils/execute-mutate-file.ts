import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function runMutationTestsForFile(filePath: string) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
  
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage("Nenhuma pasta de workspace aberta.");
      return;
    }
  
    const rootPath = workspaceFolders[0].uri.fsPath;
    const strykerConfigPath = path.join(rootPath, "stryker.conf.json");
  
    if (!fs.existsSync(strykerConfigPath)) {
      vscode.window.showErrorMessage(
        `Arquivo de configuração do Stryker não encontrado: ${strykerConfigPath}`
      );
      return;
    }
    if (
      filePath.endsWith(".unit.spec.ts") ||
      filePath.endsWith(".unit.spec.js")
    ) {
      vscode.window.showErrorMessage(
        "Não é permitido rodar testes de mutação diretamente em arquivos de testes."
      );
      return;
    }
  
    const command = `npx stryker run --mutate "${filePath}"`;
  
    const terminal = vscode.window.createTerminal("Testes de Mutação");
    terminal.show();
    terminal.sendText(command, true);
  }