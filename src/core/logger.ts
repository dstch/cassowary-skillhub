export interface Logger {
  info(message: string): void;
  error(message: string, error?: Error): void;
  debug?(message: string): void;
}

export class ConsoleLogger implements Logger {
  info(message: string) {
    console.log(`[INFO] ${message}`);
  }
  error(message: string, error?: Error) {
    console.error(`[ERROR] ${message}${error ? `: ${error.message}` : ''}`);
  }
  debug?(message: string) {
    console.debug(`[DEBUG] ${message}`);
  }
}
