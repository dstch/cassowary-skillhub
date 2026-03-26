import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { MarketplaceService } from '../services/MarketplaceService';
import { CacheManager } from '../services/CacheManager';

export class MarketplaceView {
  private panel: vscode.WebviewPanel | undefined;

  constructor(
    private marketplaceService: MarketplaceService,
    private cacheManager: CacheManager
  ) {}

  async show() {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'skillshub.marketplace',
      'Skillshub Marketplace',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    const htmlPath = path.join(__dirname, '../../webview/index.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');
    this.panel.webview.html = html;

    this.panel.webview.onDidReceiveMessage(async (msg) => {
      try {
        if (msg.action === 'ready' || msg.action === 'search') {
          const query = msg.action === 'search' ? { keyword: msg.keyword } : {};
          const result = await this.marketplaceService.list(query);
          
          const cached = await this.cacheManager.getCached('marketplace_list');
          if (!await this.cacheManager.isOnline() && cached) {
            this.panel?.webview.postMessage({ type: 'skills', items: cached.data });
          } else {
            this.panel?.webview.postMessage({ type: 'skills', items: result.items });
            await this.cacheManager.setCached('marketplace_list', result.items);
          }
        } else if (msg.action === 'install') {
          const result = await this.marketplaceService.download(msg.id);
          this.panel?.webview.postMessage({ type: 'installed', name: msg.name });
          vscode.window.showInformationMessage(`Installed: ${msg.name}`);
        }
      } catch (error) {
        this.panel?.webview.postMessage({ 
          type: 'error', 
          message: (error as Error).message 
        });
      }
    });

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }
}