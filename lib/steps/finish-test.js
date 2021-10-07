
class FinishTest {

  static async next(state) {
    const mock = state._getMock_();
    const error = state._getError_();
    const testable = state._getTestable_();
    const testResult = state._getTestResult_();

    state._executingTestable_();

    await testable(error, testResult);

    mock.restoreMocks();
  }

}

module.exports = FinishTest;
