import * as vscode from "vscode";

export const outputChannel = vscode.window.createOutputChannel("C/C++ Project Creator", { log: true });

export function writeLog(compiler: string, stdout: string, error: string) {
   if (error) {
      logError(compiler, error);
      return;
   }
   logCompilerInfo(compiler, stdout);
}

export function logCompilerInfo(compiler: string, stdout: string) {
   outputChannel.info(`[Found] ${compiler}: ${stdout.trim()}`);
}

export function logError(compiler: string, error: string) {
   outputChannel.error(`Failed to find ${compiler}: ${error}`);
   if (error) {
      outputChannel.show(true); // true = preserve focus on editor
   }
}