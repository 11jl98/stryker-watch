import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('strykerHelper.suggestFixes', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('Nenhuma pasta de workspace aberta no VSCode.');
      return;
    }

    // Caminho do JSON
    const rootPath = workspaceFolders[0].uri.fsPath;
    const defaultJsonPath = path.join(rootPath, 'reports/mutation/stryker-incremental.json');

    if (!fs.existsSync(defaultJsonPath)) {
      vscode.window.showErrorMessage(`Arquivo JSON não encontrado em: ${defaultJsonPath}`);
      return;
    }

    try {
      const data = fs.readFileSync(defaultJsonPath, 'utf-8');
      const results = JSON.parse(data);

      if (!results.files) {
        vscode.window.showErrorMessage('O arquivo JSON não contém a propriedade "files". Verifique a estrutura.');
        return;
      }

      const diagnostics = vscode.languages.createDiagnosticCollection('strykerMutations');
      diagnostics.clear();

      const survivingMutants: any[] = [];

      // Processar mutantes sobreviventes
      Object.entries(results.files).forEach(([fileName, fileData]: [string, any]) => {
        if (fileData.mutants && Array.isArray(fileData.mutants)) {
          const fileSurvivingMutants = fileData.mutants.filter(
            (mutant: any) => mutant.status === 'Survived'
          );

          fileSurvivingMutants.forEach((mutant: any) => {
            survivingMutants.push({
              fileName,
              source: fileData.source,
              ...mutant,
            });
          });
        }
      });

      // Gerar diagnósticos para mutantes sobreviventes
      survivingMutants.forEach(mutant => {
        const { fileName, location, mutatorName, replacement } = mutant;
        const absoluteFilePath = path.resolve(rootPath, fileName);

        if (!fs.existsSync(absoluteFilePath)) {
          vscode.window.showErrorMessage(`Arquivo não encontrado: ${absoluteFilePath}`);
          return;
        }

        // Criar diagnóstico
        const start = new vscode.Position(location.start.line - 1, location.start.column);
        const end = new vscode.Position(location.end.line - 1, location.end.column);
        const range = new vscode.Range(start, end);

        const diagnostic = new vscode.Diagnostic(
          range,
          `Mutação sobreviveu: "${mutatorName}". Sugestão: Adicione testes para cobrir esta mutação ou revise a lógica. Código mutado: ${replacement}`,
          vscode.DiagnosticSeverity.Warning
        );

        diagnostic.source = 'Stryker';
        diagnostics.set(vscode.Uri.file(absoluteFilePath), [diagnostic]);
      });

      vscode.window.showInformationMessage('Diagnósticos criados para mutações sobreviventes.');
    } catch (error) {
      vscode.window.showErrorMessage(`Erro ao processar o arquivo JSON: ${error}`);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
