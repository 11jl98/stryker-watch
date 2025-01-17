import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

let fileWatcher: vscode.FileSystemWatcher | undefined;
let isWatcherActive = false;
let statusBarItem: vscode.StatusBarItem;
let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  diagnosticCollection =
    vscode.languages.createDiagnosticCollection("strykerMutations");

  updateStatusBar();

  const toggleWatcherCommand = vscode.commands.registerCommand(
    "strykerHelper.toggleWatcher",
    () => {
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
        deactivateWatcher();
        vscode.window.showInformationMessage(
          "Observador de alterações desativado."
        );
      } else {
        activateWatcher(defaultJsonPath, rootPath);
        vscode.window.showInformationMessage(
          "Observador de alterações ativado."
        );
      }

      updateStatusBar();
    }
  );

  const runMutationTestsCommand = vscode.commands.registerCommand(
    "strykerHelper.runMutationTestsForFile",
    async () => {
      const activeEditor = vscode.window.activeTextEditor;

      if (!activeEditor) {
        vscode.window.showErrorMessage(
          "Nenhum arquivo está aberto no editor. Abra um arquivo para rodar os testes de mutação."
        );
        return;
      }

      const filePath = activeEditor.document.uri.fsPath;
      const relativeFilePath = vscode.workspace.asRelativePath(filePath);

      runMutationTestsForFile(relativeFilePath);
    }
  );

  context.subscriptions.push(
    runMutationTestsCommand,
    toggleWatcherCommand,
    statusBarItem
  );
}

function activateWatcher(jsonPath: string, rootPath: string) {
  fileWatcher = vscode.workspace.createFileSystemWatcher(jsonPath);

  fileWatcher.onDidChange(() => {
    vscode.window.showInformationMessage(
      "Alteração detectada no arquivo JSON. Processando novamente..."
    );
    processJsonFile(jsonPath, rootPath);
  });

  fileWatcher.onDidCreate(() => {
    vscode.window.showInformationMessage("Arquivo JSON criado. Processando...");
    processJsonFile(jsonPath, rootPath);
  });

  fileWatcher.onDidDelete(() => {
    vscode.window.showWarningMessage(
      "Arquivo JSON excluído. Diagnósticos limpos."
    );
    clearDiagnostics();
  });

  isWatcherActive = true;
}

function deactivateWatcher() {
  if (fileWatcher) {
    fileWatcher.dispose();
    fileWatcher = undefined;
  }
  clearDiagnostics();
  isWatcherActive = false;
}

function processJsonFile(jsonPath: string, rootPath: string) {
  try {
    const data = fs.readFileSync(jsonPath, "utf-8");
    const results = JSON.parse(data);

    if (!results.files) {
      vscode.window.showErrorMessage(
        'O arquivo JSON não contém a propriedade "files". Verifique a estrutura.'
      );
      return;
    }

    const diagnosticsMap = processMutations(results.files, rootPath);

    diagnosticCollection.clear();
    diagnosticsMap.forEach((fileDiagnostics, filePath) => {
      diagnosticCollection.set(vscode.Uri.file(filePath), fileDiagnostics);
    });

    vscode.window.showInformationMessage(
      "Diagnósticos criados para mutações sobreviventes."
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Erro ao processar o arquivo JSON: ${error}`
    );
  }
}

function processMutations(
  files: any,
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
        const diagnostic = createDiagnostic(mutant, fileName);
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

function createDiagnostic(
  mutant: any,
  fileName: string
): vscode.Diagnostic | null {
  const { location, mutatorName, replacement } = mutant;

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

  const prompt = `
    O Stryker detectou que a mutação "${mutatorName}" sobreviveu no arquivo "${fileName}", na linha ${
    location.start.line
  }.
  
    **Código Original:**
    ${originalCode.trim()}
  
    **Código Mutado pelo Stryker:**
    ${replacement.trim()}

    **Instruções:**
    1. Sugira um novo caso de teste que cubra essa mutação.
    2. Proponha uma melhoria no código original para evitar que a mutação sobreviva.
    3. Explique por que essa mutação sobreviveu. Indique se isso é esperado (um falso positivo) ou se há um problema no código/testes.

    **Objetivo:**
    Garanta que o código seja mais robusto e cubra adequadamente a mutação detectada.
  `.trim();

  const diagnostic = new vscode.Diagnostic(
    range,
    prompt,
    vscode.DiagnosticSeverity.Warning
  );
  diagnostic.source = "Stryker";
  return diagnostic;
}

function clearDiagnostics() {
  diagnosticCollection.clear();
}

function updateStatusBar() {
  statusBarItem.text = isWatcherActive
    ? "$(eye) Stryker Watcher: Ativado"
    : "$(eye-closed) Stryker Watcher: Desativado";
  statusBarItem.show();
}

function runMutationTestsForFile(filePath: string) {
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

export function deactivate() {
  deactivateWatcher();
  statusBarItem.dispose();
}
