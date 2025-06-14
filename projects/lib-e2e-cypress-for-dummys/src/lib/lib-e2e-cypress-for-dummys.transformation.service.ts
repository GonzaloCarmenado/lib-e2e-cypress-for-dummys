import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class LibE2eCypressForDummysTransformationService {

public generateItDescription(description: string, commands: string[]): string {
  const commandsBlock = commands.map(cmd => `  ${cmd}`).join('\n');
  return `it('${description}', () => {\n${commandsBlock}\n});`;
}
}