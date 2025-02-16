export function generateTestPrompt(testInfo?: string, testFileName?: string) {
  if (testInfo) {
    return `Analise o teste unitário: \n${testInfo}.\n Presente no arquivo: \n ${testFileName}.\n E indique como cobrir os mutantes indicados com novos testes unitário utilizando as regras do stryker js.`;
  }
  if (testFileName) {
    return `Ainda não existe teste que tente cobrir a mutação gerada no arquivo: \n ${testFileName}.\n Me indique como cobrir os mutantes indicados com novos testes unitários`;
  }
  return `Ainda não existe nenhum arquivo de teste que tente cobrir a mutação gerada. Me indique como cobrir os mutantes indicados com novos testes unitários`;
}
