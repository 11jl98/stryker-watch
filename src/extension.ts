import * as vscode from "vscode";
import { deactivateWatcher } from "./watcher/deactive-watcher";
import { toggleWatcher } from "./commands/toggle-watcher";
import { runMutationFile } from "./commands/run-mutation-file";

let fileWatcher: vscode.FileSystemWatcher | undefined;
let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
  diagnosticCollection =
    vscode.languages.createDiagnosticCollection("strykerMutations");

  const toggleWatcherCommand = vscode.commands.registerCommand(
    "strykerHelper.toggleWatcher",
    () =>
      toggleWatcher(
        fileWatcher,
        diagnosticCollection
      )
  );

  const runMutationTestsCommand = vscode.commands.registerCommand(
    "strykerHelper.runMutationTestsForFile",
    async () => runMutationFile()
  );

  context.subscriptions.push(
    runMutationTestsCommand,
    toggleWatcherCommand,
  );
}

export function deactivate() {
  deactivateWatcher(fileWatcher, diagnosticCollection);
}
