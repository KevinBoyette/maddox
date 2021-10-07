
const constants = require('../constants'),
  ShouldUseSubset = require('../predicates/should-use-subset'),
  ErrorFactory = require('../plugins/error-factory');

const Promise = require('bluebird'),
  sinon = require('sinon'),
  Preconditions = require('preconditions'),
  deepClone = require('lodash.clonedeep');

const preconditions = Preconditions.errr(),
  ordinalValues = constants.ordinalValues;

class Private {
  static _getNewMockInfo(objectToMock) {
    return {
      expected: [],
      actual: [],
      doesReturn: [],
      callCount: 0,
      objectToMock: objectToMock,
      shouldBeCalledUsedAtIndex: {},
      shouldBeCalledWithSubsetUsedAtIndex: {}
    };
  }
}

class Mock {
  constructor(tester) {
    this._mocks_ = {};
    this.tester = tester;
    this.hasTestFinisherBeenExecuted = false;
    this.maddoxRuntimeError = undefined;
  }

  restoreMocks() {
    const mocks = this._mocks_;
    const mockKeys = Object.keys(mocks);

    mockKeys.forEach((mockName) => {
      const mockedFunctions = mocks[mockName];
      const mockedFunctionsKeys = Object.keys(mockedFunctions || {});

      mockedFunctionsKeys.forEach((funcName) => {
        if (mocks[mockName][funcName].objectToMock[funcName].restore) {
          mocks[mockName][funcName].objectToMock[funcName].restore();
        }
      });
    });
  }

  restoreMockCallCounts() {
    this.hasTestFinisherBeenExecuted = false;
    const mocks = this._mocks_;
    const mockKeys = Object.keys(mocks);

    mockKeys.forEach((mockName) => {
      const mockedFunctions = mocks[mockName];
      const mockedFunctionsKeys = Object.keys(mockedFunctions || {});

      mockedFunctionsKeys.forEach((funcName) => {
        mocks[mockName][funcName].callCount = 0;
      });
    });
  }

  promiseResult(mockName, funcName, mockedData) {
    return mockedData.isError ? Promise.reject(mockedData.dataToReturn) :
      Promise.resolve(mockedData.dataToReturn);
  }

  callbackResult(mockName, funcName, mockedData, args) {
    var callback = args[args.length - 1];

    try {
      const message = ErrorFactory.build(constants.errorMessages.MissingCallback, [mockName, funcName]);

      preconditions.shouldBeFunction(callback, message)
        .debug({ callbackType: typeof callback }).test();
    } catch (err) {
      this.setMaddoxRuntimeError(err);

      throw err;
    }

    delete args[args.length - 1];
    callback.apply(this, mockedData.dataToReturn);
  }

  synchronousResult(mockName, funcName, mockedData) {
    if (mockedData.isError) {
      throw mockedData.dataToReturn;
    } else {
      return mockedData.dataToReturn;
    }
  }

  doesReturn(mockName, funcName, dataToReturn, returnType, isError) {
    const message = ErrorFactory.build(constants.errorMessages.MissingMockThisFunction, [mockName, funcName]);

    preconditions.shouldBeDefined(this._mocks_[mockName], message).debug({ mockName, funcName }).test();
    preconditions.shouldBeDefined(this._mocks_[mockName][funcName], message).debug({ mockName, funcName }).test();

    this._mocks_[mockName][funcName].doesReturn.push({
      dataToReturn: dataToReturn,
      dataReturnType: returnType,
      isError: isError
    });
  }

  doesAlwaysReturn(mockName, funcName, dataToReturn, returnType, isError) {
    const message = ErrorFactory.build(constants.errorMessages.MissingMockThisFunction, [mockName, funcName]);

    preconditions.shouldBeDefined(this._mocks_[mockName], message).debug({ mockName, funcName }).test();
    preconditions.shouldBeDefined(this._mocks_[mockName][funcName], message).debug({ mockName, funcName }).test();

    this._mocks_[mockName][funcName].doesAlwaysReturn = {
      dataToReturn: dataToReturn,
      dataReturnType: returnType,
      isError: isError
    };
  }

  shouldBeCalledWith(mockName, funcName, params) {
    const message = ErrorFactory.build(constants.errorMessages.MissingMockThisFunction, [mockName, funcName]);

    preconditions.shouldBeDefined(this._mocks_[mockName], message).debug({ mockName, funcName }).test();
    preconditions.shouldBeDefined(this._mocks_[mockName][funcName], message).debug({ mockName, funcName }).test();

    const args = {};
    const paramKeys = Object.keys(params);

    paramKeys.forEach((paramKey) => {
      args[paramKey] = params[paramKey];
    });

    this._mocks_[mockName][funcName].expected.push(args);
  }

  shouldBeCalledWithSubset(mockName, funcName, params) {
    const message = ErrorFactory.build(constants.errorMessages.MissingMockThisFunction, [mockName, funcName]);

    preconditions.shouldBeDefined(this._mocks_[mockName], message).debug({ mockName, funcName }).test();
    preconditions.shouldBeDefined(this._mocks_[mockName][funcName], message).debug({ mockName, funcName }).test();

    const args = {};
    const paramKeys = Object.keys(params);

    paramKeys.forEach((paramKey) => {
      args[paramKey] = params[paramKey];
    });

    this._mocks_[mockName][funcName].expected.push(args);

    const index = this._mocks_[mockName][funcName].expected.length - 1;

    this._mocks_[mockName][funcName].shouldBeCalledWithSubsetUsedAtIndex[index] = true;
  }

  shouldBeCalled(mockName, funcName) {
    const message = ErrorFactory.build(constants.errorMessages.MissingMockThisFunction, [mockName, funcName]);

    preconditions.shouldBeDefined(this._mocks_[mockName], message).debug({ mockName, funcName }).test();
    preconditions.shouldBeDefined(this._mocks_[mockName][funcName], message).debug({ mockName, funcName }).test();

    this._mocks_[mockName][funcName].expected.push([]);

    const index = this._mocks_[mockName][funcName].expected.length - 1;

    this._mocks_[mockName][funcName].shouldBeCalledUsedAtIndex[index] = true;
  }

  shouldAlwaysBeCalledWith(mockName, funcName, params) {
    const message = ErrorFactory.build(constants.errorMessages.MissingMockThisFunction, [mockName, funcName]);

    preconditions.shouldBeDefined(this._mocks_[mockName], message).debug({ mockName, funcName }).test();
    preconditions.shouldBeDefined(this._mocks_[mockName][funcName], message).debug({ mockName, funcName }).test();

    const args = {};
    const paramKeys = Object.keys(params);

    paramKeys.forEach((paramKey) => {
      args[paramKey] = params[paramKey];
    });

    this._mocks_[mockName][funcName].expectedAlways = args;
  }

  shouldAlwaysBeCalledWithSubset(mockName, funcName, params) {
    const message = ErrorFactory.build(constants.errorMessages.MissingMockThisFunction, [mockName, funcName]);

    preconditions.shouldBeDefined(this._mocks_[mockName], message).debug({ mockName, funcName }).test();
    preconditions.shouldBeDefined(this._mocks_[mockName][funcName], message).debug({ mockName, funcName }).test();

    const args = {};
    const paramKeys = Object.keys(params);

    paramKeys.forEach((paramKey) => {
      args[paramKey] = params[paramKey];
    });

    this._mocks_[mockName][funcName].expectedWithSubset = true;
    this._mocks_[mockName][funcName].expectedAlways = args;
  }

  shouldAlwaysBeIgnored(mockName, funcName) {
    const message = ErrorFactory.build(constants.errorMessages.MissingMockThisFunction, [mockName, funcName]);

    preconditions.shouldBeDefined(this._mocks_[mockName], message).debug({ mockName, funcName }).test();
    preconditions.shouldBeDefined(this._mocks_[mockName][funcName], message).debug({ mockName, funcName }).test();

    this._mocks_[mockName][funcName].shouldAlwaysBeIgnored = true;
  }

  setResponseEndFunction(mockName, funcName, iteration) {
    iteration = iteration || 0;

    this._mocks_[mockName][funcName].responseEnd = true;
    this._mocks_[mockName][funcName].iteration = iteration;
  }

  clearAllResponseEndFunction() {
    const mocks = this._mocks_;
    const mockKeys = Object.keys(mocks);

    mockKeys.forEach((mockName) => {
      const mockedFunctions = mocks[mockName];
      const mockedFunctionsKeys = Object.keys(mockedFunctions || {});

      mockedFunctionsKeys.forEach((funcName) => {
        delete mocks[mockName][funcName].responseEnd;
        delete mocks[mockName][funcName].iteration;

      });
    });
  }

  mockThisFunctionAtMostOnce(mockName, funcName, objectToMock) {
    if (!this._mocks_[mockName] || !this._mocks_[mockName][funcName]) {
      this.mockThisFunction(mockName, funcName, objectToMock);
    }
  }

  mockThisFunction(mockName, funcName, objectToMock) {
    preconditions.shouldBeDefined(objectToMock[funcName],
      ErrorFactory.build(constants.errorMessages.FunctionNotInMock, [funcName, mockName])).test();

    this._mocks_[mockName] = this._mocks_[mockName] || {};

    preconditions.shouldBeUndefined(this._mocks_[mockName][funcName],
      ErrorFactory.build(constants.errorMessages.MockAlreadyExists, [mockName, funcName])).test();

    this._mocks_[mockName][funcName] = Private._getNewMockInfo(objectToMock);

    if (objectToMock[funcName].isSinonProxy) {
      objectToMock[funcName].restore();
    }

    sinon.stub(objectToMock, funcName).callsFake(function () {
      const argsArr = Array.prototype.slice.call(arguments); // need to do this otherwise clone deep does not carry over the length property of the arguments object
      const args = deepClone(argsArr); // clones the arguments so that the mock will have them in the state when they were called regardless if they get modified by the code later on.
      const mock = this._mocks_[mockName][funcName];
      const mockedData = mock.doesAlwaysReturn || mock.doesReturn[mock.callCount];

      // Stop recording results after test finisher has been executed.
      if (!this.hasTestFinisherBeenExecuted) {
        mock.actual.push(args);

        try {
          const message = ErrorFactory.build(constants.errorMessages.MissingMockedData,
            [ordinalValues[mock.callCount], mockName, funcName]);

          preconditions.shouldBeDefined(mockedData, message).debug({ args }).test();
          preconditions.shouldBeDefined(mockedData.dataToReturn, message).debug({ args }).test();

        } catch (err) {
          this.setMaddoxRuntimeError(err);

          throw err;
        }
      }

      if (mock.responseEnd && mock.iteration === mock.callCount && !this.hasTestFinisherBeenExecuted) {
        this.hasTestFinisherBeenExecuted = true;
        if (this.resolveForResponseEnd) {
          this.resolveForResponseEnd();
        }
      }

      mock.callCount = mock.callCount + 1;

      // This execution will call one of these three functions synchronousResult, callbackResult, or promiseResult.
      return this[mockedData.dataReturnType](mockName, funcName, mockedData, args);
    }.bind(this));
  }

  wasFinisherFunctionExecuted() {
    return this.hasTestFinisherBeenExecuted;
  }

  setCallbackForResponseEnd(resolveForResponseEnd) {
    this.resolveForResponseEnd = resolveForResponseEnd;
  }

  setMaddoxRuntimeError(error) {
    this.maddoxRuntimeError = error;
  }

  getMaddoxRuntimeError() {
    return this.maddoxRuntimeError;
  }

  noDebug() {
    this._noDebug_ = true;
  }

  test() {
    const mocks = this._mocks_;

    this._responseMocks_ = this._mocks_[constants.ResponseMockName];
    delete this._mocks_[constants.ResponseMockName];

    const mockKeys = Object.keys(mocks);

    // LOOPING THROUGH MOCKS
    mockKeys.forEach((mockName) => {
      const mockedFunctions = mocks[mockName];

      this.testMock(mockedFunctions, mockName);
    });

    // Verify the response mock is tested last.
    this.testMock(this._responseMocks_, constants.ResponseMockName);

    // Add back response mocks so perf tests can use them.
    this._mocks_[constants.ResponseMockName] = this._responseMocks_;

  }

  testMock(mockedFunctions, mockName) {
    // LOOPING THROUGH FUNCTIONS IN THE MOCKS
    const mockedFunctionKeys = Object.keys(mockedFunctions || {});

    mockedFunctionKeys.forEach((funcName) => {
      const mockedFunction = mockedFunctions[funcName];

      let actualResults = mockedFunction.actual;
      let expectedResults = mockedFunction.expected;
      let expectedResultsFromShouldAlways = mockedFunction.expectedAlways;
      let expectedResultsAlwaysWithSubset = mockedFunction.expectedWithSubset;
      let shouldAlwaysBeIgnored = mockedFunction.shouldAlwaysBeIgnored;

      if (shouldAlwaysBeIgnored) {
        return;
      }

      // ONLY CHECK NUMBER OF CALLS LENGTH IF 'expectedResultsFromShouldAlways' HAS NOT BEEN SET.
      if (!expectedResultsFromShouldAlways) {

        try {
          const message = ErrorFactory.build(constants.errorMessages.MockCalledWrongNumberOfTimes, [mockName, funcName, expectedResults.length, actualResults.length]);

          preconditions.checkArgument((actualResults.length === expectedResults.length), message).test();
        } catch (err) {
          this.setMaddoxRuntimeError(err);

          throw err;
        }
      }

      const actualResultsKeys = Object.keys(actualResults);

      // LOOPING THROUGH ACTUAL RESULTS BY FUNCTION
      actualResultsKeys.forEach((actualResultIndex) => {
        const actualResult = actualResults[actualResultIndex];

        let countOrdinalValue = ordinalValues[actualResultIndex] || actualResultIndex,
          expectedResult = expectedResultsFromShouldAlways || expectedResults[actualResultIndex],
          numActualParams = 0, numExpectedParams = 0;

        // DON'T CHECK PARAMS WHEN USING 'shouldBeCalled'
        if (mockedFunction.shouldBeCalledUsedAtIndex[actualResultIndex] !== true) {
          // LOOPING THROUGH PARAMETERS OF A SINGLE ACTUAL RESULT

          const actualResultKeys = Object.keys(actualResult);

          actualResultKeys.forEach((actualParamResultIndex) => {
            const actualParamResult = actualResult[actualParamResultIndex];

            if (actualParamResult) {
              numActualParams++;
            }

            let paramOrdinalValue = ordinalValues[actualParamResultIndex] || actualResultIndex,
              expectedParamResult, usingShouldAlways;

            if (expectedResultsFromShouldAlways && expectedResultsFromShouldAlways[actualParamResultIndex]) {
              expectedParamResult = expectedResultsFromShouldAlways[actualParamResultIndex];
              usingShouldAlways = true;
            } else {
              expectedParamResult = (expectedResult) ? expectedResult[actualParamResultIndex] : expectedResult;
              usingShouldAlways = false;
            }

            funcName = (mockName === constants.ResponseMockName) ? `${funcName} (i.e. res.${funcName})` : funcName;

            let message = ErrorFactory.build(constants.errorMessages.ComparisonShouldEqual, [paramOrdinalValue, mockName, funcName, countOrdinalValue]);

            if (expectedParamResult !== constants.IgnoreParam) {
              try {
                if (ShouldUseSubset.assert(mockedFunction, actualResultIndex, actualParamResult, expectedResultsAlwaysWithSubset)) {
                  this.tester.shouldBeSubset({
                    actual: actualParamResult,
                    expected: expectedParamResult,
                    message: message,
                    usingShouldAlways: usingShouldAlways,
                    noDebug: this._noDebug_
                  });
                } else {
                  this.tester.shouldEqual({
                    actual: actualParamResult,
                    expected: expectedParamResult,
                    message: message,
                    usingShouldAlways: usingShouldAlways,
                    noDebug: this._noDebug_
                  });
                }
              } catch (comparisonError) {
                this.setMaddoxRuntimeError(comparisonError);

                throw comparisonError;
              }
            }
          });
        }

        const expectedResultKeys = Object.keys(expectedResult);

        expectedResultKeys.forEach((expectedResultKey) => {
          const expectedParamResult = expectedResult[expectedResultKey];

          if (expectedParamResult) {
            numExpectedParams++;
          }
        });

        try {
          const message = ErrorFactory.build(constants.errorMessages.WrongNumberOfParams,
            [countOrdinalValue, mockName, funcName, numExpectedParams, numActualParams]);

          preconditions.checkArgument(numActualParams === numExpectedParams, message).test();
        } catch (err) {
          this.setMaddoxRuntimeError(err);

          throw err;
        }
      });
    });
  }
}

Mock.PromiseType = 'promiseResult';
Mock.CallbackType = 'callbackResult';
Mock.SynchronousType = 'synchronousResult';

module.exports = Mock;
