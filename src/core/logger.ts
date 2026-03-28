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

import type { Client } from '@opencode-ai/sdk';

export class OpenCodeLogger implements Logger {
  constructor(private client: Client) {}

  info(message: string) {
    this.client.app.log({ body: { level: 'info', message } });
  }

  error(message: string, error?: Error) {
    this.client.app.log({ 
      body: { level: 'error', message: `${message}${error ? `: ${error.message}` : ''}` }
    });
  }

  debug?(message: string) {
    this.client.app.log({ body: { level: 'debug', message } });
  }
}
