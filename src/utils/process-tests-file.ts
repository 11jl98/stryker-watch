export function processTestsFile(
  testFiles: any,
  fileName: string,
  testIds: string[]
) {
  let testInfo: string | undefined = undefined;
  const { testFileName, relevantTests } = findSimilarTestFile(
    fileName,
    testFiles,
    testIds
  );

  if (relevantTests) {
    testInfo = `- ${relevantTests.name} - (Linha: ${relevantTests.location.start.line})`;
  }

  return { testInfo, testFileName };
}

export function findSimilarTestFile(
  sourceFileName: string,
  tests: any,
  testIds: string[]
): any {
  for (const [testFileName, testFileData] of Object.entries(tests)) {
    const relevantTests = findTestsById(testIds, (testFileData as any).tests);
    if (relevantTests) {
      return {
        testFileName,
        relevantTests,
      };
    }
  }

  return { testFileName: null, relevantTests: null };
}

function findTestsById(testIds: string[], testFileData: any[]) {
  return testFileData.find((test: any) => testIds.includes(test.id));
}
