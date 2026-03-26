import * as vscode from 'vscode';

export class Logger {
  static output = vscode.window.createOutputChannel('Skillshub');

  static info(message: string) {
    this.output.appendLine(`[INFO] ${message}`);
  }

  static error(message: string, error?: Error) {
    this.output.appendLine(`[ERROR] ${message}${error ? `: ${error.message}` : ''}`);
  }

  static show() {
    this.output.show();
  }
}