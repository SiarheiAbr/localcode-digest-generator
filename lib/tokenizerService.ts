export class TokenizerService {
  tokenize(text: string): string[] {
    return text.split(/[\s\n\r\t]+/).filter((token) => token.length > 0);
  }

  countTokens(text: string): number {
    return this.tokenize(text).length;
  }
}

export const tokenizerService = new TokenizerService();
