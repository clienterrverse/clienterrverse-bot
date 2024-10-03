import fs from 'fs/promises';
import path from 'path';

class pluginSystem {
  constructor(client) {
    this.client = client;
    this.plugin = new Map();
    this.pluginDir = path.join(process.cwd(), '..', 'plugins');
  }
  getPlugin(name) {
    return this.plugin.get(name);
  }
}
