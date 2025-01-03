# Stryker watcher Extension for VSCode

Esta extensão para VSCode monitora os relatórios de mutação gerados pelo Stryker e destaca as mutações sobreviventes diretamente no código-fonte. Além disso, fornece sugestões para lidar com mutações sobreviventes, ajudando a melhorar a cobertura dos testes e a robustez do código.

## Funcionalidades

- Observação em tempo real de alterações no arquivo de relatório de mutação (`stryker-incremental.json`).
- Destaque de mutações sobreviventes diretamente no código.
- Diagnósticos e mensagens para orientar melhorias nos testes e código.
- Controle ativar/desativar observação via comando.

---

## Como Usar

- Ele consta com um comando principal, pressionando o ctrl+ shift + P e digitando "Ativar/Desativar Stryker Watcher", com ele você será notificado que a o observador vai estar ativo e a partir desse momento qualquer alteração que foi feita no stryker-incremental.json, será capturada e destacada no código-fonte.
- Caso seja atingido o score desejado, basta encontrar novamente o comando que a extensão será desabilitada e os warning irão sumir

### Requisitos

- **Node.js** instalado na máquina.
- **VSCode** instalado.
- Relatórios de mutação gerados pelo [Stryker Mutator](https://stryker-mutator.io/).
- Caminho do arquivo "reports/mutation/stryker-incremental.json"

### Configuração Inicial (Desenvolvimento)

1. **Instale a Extensão no VSCode**:

   - Clone este repositório:
     ```bash
     git clone <URL_DO_REPOSITORIO>
     ```
   - Abra a pasta do projeto no VSCode.
     prcure pela extensão [Extension Test Runner](https://marketplace.visualstudio.com/items?itemName=ms-vscode.extension-test-runner), e a inicie
   - Pressione `F5` para iniciar a extensão em um ambiente de depuração (VSCode abrirá uma nova janela para teste, que a partir dela poderá ser aberto qualquer projeto para que interaja com a extensão em deburação).

2. **Geração de Relatórios de Mutação**:

   - Configure o Stryker em seu projeto:
     ```bash
     npx stryker init ou npm run test:mutation
     ```
   - Certifique-se de que o arquivo de relatório esteja sendo gerado no caminho padrão: `reports/mutation/stryker-incremental.json`.

3. **Inicie o Observador**:

   - Use o comando no Pallet de Comandos do VSCode (Ctrl+Shift+P ou Cmd+Shift+P):

     ```
     Ativar/Desativar Stryker Watcher
     ```

   - Certifique-se de que o arquivo de relatório está presente no local esperado.

---

### Estrutura do Projeto

- `src/`: Contém o código-fonte da extensão.
- `package.json`: Configurações e dependências da extensão.
- `tsconfig.json`: Configurações do TypeScript.

### Dependências

Certifique-se de instalar as dependências antes de iniciar o desenvolvimento:

```bash
npm install
npm run compile
```

#### by Joao Luiz Pereira (joao.pereira@compasso.com.br)
