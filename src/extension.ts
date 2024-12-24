import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Interface para Mutante
interface Mutant {
  mutatorName: string;
  replacement: string;
  status: string;
  location: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  filePath?: string;
}

// Lista global de mutantes sobreviventes
let survivingMutants: Mutant[] = [];

export function activate(context: vscode.ExtensionContext) {
  console.log('Stryker Mutation Monitor está ativo.');

  // Monitorar o arquivo de relatório do Stryker
  const watcher = vscode.workspace.createFileSystemWatcher('**/reports/mutation/stryker-incremental.json');
  watcher.onDidChange((uri) => {
    try {
      processStrykerReport(uri);
    } catch (error) {
      console.log('Erro no callback onDidChange:', error);
    }
  });
  
  watcher.onDidCreate((uri) => {
    try {
      processStrykerReport(uri);
    } catch (error) {
      console.log('Erro no callback onDidCreate:', error);
    }
  });

  context.subscriptions.push(watcher);
  console.log('FileSystemWatcher registrado.');

  // Registrar comando para sugerir melhorias
  const suggestFixCommand = vscode.commands.registerCommand('mutation.suggestFix', async () => {
    console.log('Comando mutation.suggestFix executado.');
    
    if (!vscode.window.activeTextEditor) {
      vscode.window.showErrorMessage('Nenhum arquivo aberto no editor.');
      return;
    }

    if (survivingMutants.length === 0) {
      vscode.window.showInformationMessage('Nenhum mutante sobrevivente encontrado.');
      return;
    }

    const editor = vscode.window.activeTextEditor;
    const line = editor.selection.active.line;
    console.log('Linha atual no editor:', line);

    const relevantMutant = survivingMutants.find((mutant: Mutant) =>
      mutant.location.start.line - 1 <= line && mutant.location.end.line - 1 >= line
    );
    console.log('Mutação relevante encontrada:', relevantMutant);

    if (!relevantMutant) {
      vscode.window.showInformationMessage('Nenhuma mutação associada encontrada nesta linha.');
      return;
    }

    const quickPickOptions = [
      { label: 'Aplicar Correção', description: `Aplicar mutação "${relevantMutant.mutatorName}"` },
      { label: 'Ignorar Mutação', description: 'Não aplicar a correção' }
    ];

    const selection = await vscode.window.showQuickPick(quickPickOptions, { placeHolder: 'Escolha uma ação para a mutação' });
    console.log('Seleção do usuário:', selection);

    if (selection && selection.label === 'Aplicar Correção') {
      suggestFix(relevantMutant, editor);
    } else {
      vscode.window.showInformationMessage('Mutação ignorada.');
    }
  });

  context.subscriptions.push(suggestFixCommand);
  console.log('Comando suggestFix registrado.');
}

async function processStrykerReport(uri?: vscode.Uri) {
  const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
  const reportPath = uri?.fsPath || path.join(workspaceFolder, 'reports/mutation/stryker-incremental.json');

  console.log('Processando relatório de mutação no caminho:', reportPath);

  if (!fs.existsSync(reportPath)) {
    vscode.window.showErrorMessage('Relatório de mutação não encontrado.');
    return;
  }

  try {
    const content = fs.readFileSync(reportPath, 'utf8');
    console.log('Conteúdo do relatório:', content); // Verificar o conteúdo do relatório

    const report = JSON.parse(content);
    console.log('Relatório processado:', report); // Verificar a estrutura do JSON

    // Extrair mutantes sobreviventes
    survivingMutants = [];
    for (const file in report.files) {
      if (report.files.hasOwnProperty(file)) {
        console.log(`Processando arquivo: ${file}`); // Log para cada arquivo

        const mutants = report.files[file].mutants.filter((mutant: Mutant) => mutant.status.toLowerCase() === 'survived');
        console.log(`Mutantes sobreviventes em ${file}:`, mutants); // Verificar mutantes filtrados

        survivingMutants.push(...mutants.map((mutant: Mutant) => ({ ...mutant, filePath: file })));
      }
    }

    if (survivingMutants.length > 0) {
      vscode.window.showInformationMessage(`${survivingMutants.length} mutantes sobreviventes identificados.`);
      console.log('Mutantes sobreviventes:', survivingMutants); // Verificar mutantes sobreviventes
      highlightMutations();
    } else {
      vscode.window.showInformationMessage('Nenhum mutante sobrevivente encontrado.');
    }
  } catch (error) {
    vscode.window.showErrorMessage('Erro ao processar o relatório do Stryker: ' + error);
    console.error('Erro ao processar o relatório:', error);
  }
}

function highlightMutations() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255,0,0,0.3)',
    border: '1px solid red'
  });

  const decorations: vscode.DecorationOptions[] = [];

  survivingMutants.forEach(mutant => {
    if (mutant.filePath && path.basename(mutant.filePath) === 'container.ts') {
      const range = new vscode.Range(
        new vscode.Position(mutant.location.start.line - 1, mutant.location.start.column),
        new vscode.Position(mutant.location.end.line - 1, mutant.location.end.column)
      );

      decorations.push({ range });
    }
  });

  editor.setDecorations(decorationType, decorations);
}

function suggestFix(mutant: Mutant, editor: vscode.TextEditor) {
  const { mutatorName, replacement } = mutant;
  const range = new vscode.Range(
    mutant.location.start.line - 1,
    mutant.location.start.column,
    mutant.location.end.line - 1,
    mutant.location.end.column
  );

  editor.edit((editBuilder) => {
    editBuilder.replace(range, replacement);
  }).then(success => {
    if (success) {
      vscode.window.showInformationMessage(`Mutação "${mutatorName}" corrigida com sucesso!`);
      console.log(`Mutação "${mutatorName}" corrigida com sucesso!`);
    } else {
      vscode.window.showErrorMessage('Erro ao aplicar a correção.');
      console.log('Erro ao aplicar a correção.');
    }
  });
}

export function deactivate() {
  console.log('Stryker Mutation Monitor desativado.');
}