import * as vscode from "vscode";
import { runMutationTestsForFile } from "../utils/execute-mutate-file";

export const runMutationFile = () => {
    const activeEditor = vscode.window.activeTextEditor;
    
          if (!activeEditor) {
            vscode.window.showErrorMessage(
              "Nenhum arquivo está aberto no editor. Abra um arquivo para rodar os testes de mutação."
            );
            return;
          };
    
          const filePath = activeEditor.document.uri.fsPath;
          const relativeFilePath = vscode.workspace.asRelativePath(filePath);
    
          runMutationTestsForFile(relativeFilePath);
};
