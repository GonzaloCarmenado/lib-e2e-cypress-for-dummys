import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class AdvancedtestTransformationService {
  // Inserta un bloque beforeEach tras el primer describe
  public insertBeforeEach(content: string, interceptors: string, alertFn?: (msg: string) => void): string {
    const describeRegex = /(describe\s*\(.*?{)/s;
    const match = content.match(describeRegex);
    if (!match) { alertFn?.('ADVANCED_EDITOR.NO_DESCRIBE'); return ''; }
    const insertPos = match.index! + match[0].length;
    const beforeEachBlock = `\n  beforeEach(() => {\n${interceptors}  })\n`;
    return content.slice(0, insertPos) + beforeEachBlock + content.slice(insertPos);
  }

  // Inserta el bloque it() antes del último '});'
  public insertItBlock(content: string, itBlock: string, alertFn?: (msg: string) => void): string {
    const idx = content.lastIndexOf('})');
    if (idx === -1) { alertFn?.('ADVANCED_EDITOR.NO_END'); return ''; }
    return content.slice(0, idx) + '\n' + itBlock + '\n' + content.slice(idx);
  }

  // Valida si es archivo
  public isFile(file: any): boolean {
    return file && file.kind === 'file';
  }

  // Construye el árbol de directorios
  public async scanDirectory(dirHandle: FileSystemDirectoryHandle): Promise<any> {
    const result: any = { name: dirHandle.name, kind: 'directory', children: [] as any[] };
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'directory') result.children.push(await this.scanDirectory(entry as FileSystemDirectoryHandle));
      else if (entry.kind === 'file') result.children.push({ name: entry.name, kind: 'file' });
    }
    result.children = result.children.filter(Boolean);
    return result;
  }
}