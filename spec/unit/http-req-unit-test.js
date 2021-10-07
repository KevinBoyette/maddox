
const Maddox = require('../../lib/index'), // require("maddox");
  random = require('../random'),
  Controller = require('../testable/modules/test-module/from-http-req-controller'),
  testConstants = require('../test-constants'),
  StatefulSingletonProxy = require('../testable/proxies/stateful-singleton-proxy');

const Scenario = Maddox.functional.HttpReqScenario;

describe('Given the HttpReqScenario', function () {
  let testContext;

  describe('when using the HttpReqScenario, it', function () {
    beforeEach(function () {
      testContext = {};

      testContext.setupTest = function () {
        testContext.entryPointObject = Controller;
        testContext.entryPointFunction = 'statefulSingletonProxy';
        testContext.proxyInstance = StatefulSingletonProxy.getInstance();
      };

      testContext.setupHttpRequest = function () {
        testContext.httpRequest = {
          params: {
            personId: '123456789'
          },
          query: {
            homeState: 'IL'
          }
        };

        testContext.httpRequestParams = [testContext.httpRequest];
      };

      testContext.setupGetFirstName = function () {
        testContext.getFirstName1Params = [testContext.httpRequest.params.personId];
        testContext.getFirstName1Result = random.firstName();

        testContext.getFirstName2Params = [testContext.httpRequest.params.personId, testContext.getFirstName1Result];
        testContext.getFirstName2Result = random.firstName();
      };

      testContext.setupGetMiddleName = function () {
        testContext.getMiddleNameParams = [testContext.httpRequest.params.personId, testContext.getFirstName2Result];
        testContext.getMiddleNameResult = random.firstName();
      };

      testContext.setupGetLastName = function () {
        testContext.getLastNameParams = [testContext.httpRequest.params.personId, testContext.getFirstName2Result, testContext.getMiddleNameResult];
        testContext.getLastNameResult = [undefined, random.lastName()];
      };

      testContext.setupExpected = function () {
        testContext.expectedResponse = [{
          personId: testContext.httpRequest.params.personId,
          homeState: testContext.httpRequest.query.homeState,
          lastName: testContext.getLastNameResult[1]
        }];

        testContext.expectedStatusCode = [200];
      };
    });

    it('should handle a successful request.', function (done) {
      testContext.setupTest();
      testContext.setupHttpRequest();
      testContext.setupGetFirstName();
      testContext.setupGetMiddleName();
      testContext.setupGetLastName();
      testContext.setupExpected();

      new Scenario(this)
        .mockThisFunction('StatefulSingletonProxy', 'getInstance', StatefulSingletonProxy)
        .mockThisFunction('proxyInstance', 'getFirstName', testContext.proxyInstance)
        .mockThisFunction('proxyInstance', 'getMiddleName', testContext.proxyInstance)
        .mockThisFunction('proxyInstance', 'getLastName', testContext.proxyInstance)

        .withEntryPoint(testContext.entryPointObject, testContext.entryPointFunction)
        .withHttpRequest(testContext.httpRequestParams)

        .resShouldBeCalledWith('send', testContext.expectedResponse)
        .resShouldBeCalledWith('status', testContext.expectedStatusCode)
        .resDoesReturnSelf('status')

        .shouldBeCalledWith('StatefulSingletonProxy', 'getInstance', Maddox.constants.EmptyParameters)
        .doesReturn('StatefulSingletonProxy', 'getInstance', testContext.proxyInstance)

        .shouldBeCalledWith('proxyInstance', 'getFirstName', testContext.getFirstName1Params)
        .doesReturnWithPromise('proxyInstance', 'getFirstName', testContext.getFirstName1Result)

        .shouldBeCalledWith('proxyInstance', 'getFirstName', testContext.getFirstName2Params)
        .doesReturnWithPromise('proxyInstance', 'getFirstName', testContext.getFirstName2Result)

        .shouldBeCalledWith('proxyInstance', 'getMiddleName', testContext.getMiddleNameParams)
        .doesReturn('proxyInstance', 'getMiddleName', testContext.getMiddleNameResult)

        .shouldBeCalledWith('proxyInstance', 'getLastName', testContext.getLastNameParams)
        .doesReturnWithCallback('proxyInstance', 'getLastName', testContext.getLastNameResult)

        .perf()
        .test(done);
    });

    it('should handle a checked exception.', function (done) {
      testContext.setupHttpRequest = function () {
        testContext.httpRequest = {
          params: {},
          query: {
            homeState: 'IL'
          }
        };

        testContext.httpRequestParams = [testContext.httpRequest];
      };

      testContext.setupExpected = function () {
        testContext.expectedResponse = [testConstants.MissingPersonIdParam];

        testContext.expectedStatusCode = [404];
      };

      testContext.setupTest();
      testContext.setupHttpRequest();
      testContext.setupGetFirstName();
      testContext.setupGetMiddleName();
      testContext.setupGetLastName();
      testContext.setupExpected();

      new Scenario(this)
        .mockThisFunction('StatefulSingletonProxy', 'getInstance', StatefulSingletonProxy)
        .mockThisFunction('proxyInstance', 'getFirstName', testContext.proxyInstance)
        .mockThisFunction('proxyInstance', 'getMiddleName', testContext.proxyInstance)
        .mockThisFunction('proxyInstance', 'getLastName', testContext.proxyInstance)

        .withEntryPoint(testContext.entryPointObject, testContext.entryPointFunction)
        .withHttpRequest(testContext.httpRequestParams)

        .resShouldBeCalledWith('send', testContext.expectedResponse)
        .resShouldBeCalledWith('status', testContext.expectedStatusCode)
        .resDoesReturnSelf('status')

        .test(done);
    });

  });

  describe('when initiating an async process and using a finisher function, it', function () {
    beforeEach(function () {
      testContext = {};

      testContext.setupTest = function () {
        testContext.entryPointObject = Controller;
        testContext.entryPointFunction = 'initiateAsyncProcessing';
        testContext.proxyInstance = StatefulSingletonProxy.getInstance();
      };

      testContext.setupHttpRequest = function () {
        testContext.httpRequest = {
          params: {
            personId: '123456789'
          },
          query: {
            homeState: 'IL'
          }
        };

        testContext.httpRequestParams = [testContext.httpRequest];
      };

      testContext.setupGetFirstName = function () {
        testContext.getFirstName1Params = [testContext.httpRequest.params.personId];
        testContext.getFirstName1Result = random.firstName();

        testContext.getFirstName2Params = [testContext.httpRequest.params.personId, testContext.getFirstName1Result];
        testContext.getFirstName2Result = random.firstName();
      };

      testContext.setupGetMiddleName = function () {
        testContext.getMiddleNameParams = [testContext.httpRequest.params.personId, testContext.getFirstName2Result];
        testContext.getMiddleNameResult = random.firstName();
      };

      testContext.setupGetLastName = function () {
        testContext.getLastNameParams = [testContext.httpRequest.params.personId, testContext.getFirstName2Result, testContext.getMiddleNameResult];
        testContext.getLastNameResult = [undefined, random.lastName()];
      };

      testContext.setupExpected = function () {
        testContext.expectedResponse = [{
          result: 'OK'
        }];

        testContext.expectedStatusCode = [200];
      };
    });

    it('should still test HTTP Response if it happens before the finisher function is executed.', function (done) {
      testContext.setupTest();
      testContext.setupHttpRequest();
      testContext.setupGetFirstName();
      testContext.setupGetMiddleName();
      testContext.setupGetLastName();
      testContext.setupExpected();

      new Scenario(this)
        .mockThisFunction('StatefulSingletonProxy', 'getInstance', StatefulSingletonProxy)
        .mockThisFunction('proxyInstance', 'getFirstName', testContext.proxyInstance)
        .mockThisFunction('proxyInstance', 'getMiddleName', testContext.proxyInstance)
        .mockThisFunction('proxyInstance', 'getLastName', testContext.proxyInstance)

        .withEntryPoint(testContext.entryPointObject, testContext.entryPointFunction)
        .withHttpRequest(testContext.httpRequestParams)
        .withTestFinisherFunction('proxyInstance', 'getLastName', 0)

        .resShouldBeCalledWith('send', testContext.expectedResponse)
        .resShouldBeCalledWith('status', testContext.expectedStatusCode)
        .resDoesReturnSelf('status')

        .shouldBeCalledWith('StatefulSingletonProxy', 'getInstance', Maddox.constants.EmptyParameters)
        .doesReturn('StatefulSingletonProxy', 'getInstance', testContext.proxyInstance)

        .shouldBeCalledWith('proxyInstance', 'getFirstName', testContext.getFirstName1Params)
        .doesReturnWithPromise('proxyInstance', 'getFirstName', testContext.getFirstName1Result)

        .shouldBeCalledWith('proxyInstance', 'getFirstName', testContext.getFirstName2Params)
        .doesReturnWithPromise('proxyInstance', 'getFirstName', testContext.getFirstName2Result)

        .shouldBeCalledWith('proxyInstance', 'getMiddleName', testContext.getMiddleNameParams)
        .doesReturn('proxyInstance', 'getMiddleName', testContext.getMiddleNameResult)

        .shouldBeCalledWith('proxyInstance', 'getLastName', testContext.getLastNameParams)
        .doesReturnWithCallback('proxyInstance', 'getLastName', testContext.getLastNameResult)

        .test(done);
    });
  });

  describe('when using the specialResponseFunctionality, it', function () {
    beforeEach(function () {
      testContext = {};

      testContext.setupTest = function () {
        testContext.entryPointObject = Controller;
        testContext.entryPointFunction = 'specialResponseFunctionality';
        testContext.proxyInstance = StatefulSingletonProxy.getInstance();
      };

      testContext.setupHttpRequest = function () {
        testContext.httpRequest = {
          params: {
            personId: '123456789'
          },
          query: {
            homeState: 'IL'
          }
        };

        testContext.httpRequestParams = [testContext.httpRequest];
      };

      testContext.setupGetFirstName = function () {
        testContext.getFirstName1Params = [testContext.httpRequest.params.personId];
        testContext.getFirstName1Result = random.firstName();

        testContext.getFirstName2Params = [testContext.httpRequest.params.personId, testContext.getFirstName1Result];
        testContext.getFirstName2Result = random.firstName();
      };

      testContext.setupGetMiddleName = function () {
        testContext.getMiddleNameParams = [testContext.httpRequest.params.personId, testContext.getFirstName2Result];
        testContext.getMiddleNameResult = random.firstName();
      };

      testContext.setupGetLastName = function () {
        testContext.getLastNameParams = [testContext.httpRequest.params.personId, testContext.getFirstName2Result, testContext.getMiddleNameResult];
        testContext.getLastNameResult = [undefined, random.lastName()];
      };

      testContext.setupHttpHeaders = function () {
        testContext.headerKey1 = 'someHeader1';
        testContext.headerValue1 = testContext.httpRequest.params.personId;

        testContext.headerKey2 = 'someHeader2';
        testContext.headerValue2 = testContext.httpRequest.query.homeState;

        testContext.headerKey3 = 'someHeader3';
        testContext.headerValue3 = testContext.httpRequest.query.homeState;
      };

      testContext.setupExpected = function () {
        testContext.someResParams1 = [testContext.getLastNameResult[1]];
        testContext.someResResponse1 = random.uniqueId();
        testContext.someResParams2 = [testContext.getLastNameResult[1]];
        testContext.someResResponse2 = random.uniqueId();

        testContext.expectedResponse = [{
          personId: testContext.httpRequest.params.personId,
          homeState: testContext.httpRequest.query.homeState,
          lastName: testContext.getLastNameResult[1],
          someHeaderResponse1: testContext.someResResponse1,
          someHeaderResponse2: testContext.someResResponse2
        }];

        testContext.expectedStatusCode = [200];
      };
    });

    it('should use \'resShouldContainerHeader\' and \'resDoesReturn\'.', function (done) {
      testContext.setupTest();
      testContext.setupHttpRequest();
      testContext.setupGetFirstName();
      testContext.setupGetMiddleName();
      testContext.setupGetLastName();
      testContext.setupHttpHeaders();
      testContext.setupExpected();

      new Scenario(this)
        .mockThisFunction('StatefulSingletonProxy', 'getInstance', StatefulSingletonProxy)
        .mockThisFunction('proxyInstance', 'getFirstName', testContext.proxyInstance)
        .mockThisFunction('proxyInstance', 'getMiddleName', testContext.proxyInstance)
        .mockThisFunction('proxyInstance', 'getLastName', testContext.proxyInstance)

        .withEntryPoint(testContext.entryPointObject, testContext.entryPointFunction)
        .withHttpRequest(testContext.httpRequestParams)

        .resShouldBeCalledWith('send', testContext.expectedResponse)

        .resShouldBeCalledWith('someResFunction', testContext.someResParams1)
        .resDoesReturn('someResFunction', testContext.someResResponse1)

        .resShouldBeCalledWith('someResFunction', testContext.someResParams2)
        .resDoesReturn('someResFunction', testContext.someResResponse2)

        .resShouldBeCalledWith('status', testContext.expectedStatusCode)
        .resDoesReturnSelf('status')

        .resShouldContainHeader(testContext.headerKey1, testContext.headerValue1, 'set')
        .resShouldContainHeader(testContext.headerKey2, testContext.headerValue2) // Should default to set
        .resShouldContainHeader(testContext.headerKey3, testContext.headerValue3, 'fakeHeaderFunction')

        .shouldBeCalledWith('StatefulSingletonProxy', 'getInstance', Maddox.constants.EmptyParameters)
        .doesReturn('StatefulSingletonProxy', 'getInstance', testContext.proxyInstance)

        .shouldBeCalledWith('proxyInstance', 'getFirstName', testContext.getFirstName1Params)
        .doesReturnWithPromise('proxyInstance', 'getFirstName', testContext.getFirstName1Result)

        .shouldBeCalledWith('proxyInstance', 'getFirstName', testContext.getFirstName2Params)
        .doesReturnWithPromise('proxyInstance', 'getFirstName', testContext.getFirstName2Result)

        .shouldBeCalledWith('proxyInstance', 'getMiddleName', testContext.getMiddleNameParams)
        .doesReturn('proxyInstance', 'getMiddleName', testContext.getMiddleNameResult)

        .shouldBeCalledWith('proxyInstance', 'getLastName', testContext.getLastNameParams)
        .doesReturnWithCallback('proxyInstance', 'getLastName', testContext.getLastNameResult)

        .test(done);
    });

    it('should use \'resDoesAlwaysReturn\' and \'resShouldAlwaysBeCalledWith\'.', function (done) {
      testContext.setupExpected = function () {
        testContext.someResParams1 = [testContext.getLastNameResult[1]];
        testContext.someResResponse1 = random.uniqueId();
        testContext.someResParams2 = [testContext.getLastNameResult[1]];
        testContext.someResResponse2 = random.uniqueId();

        testContext.expectedResponse = [{
          personId: testContext.httpRequest.params.personId,
          homeState: testContext.httpRequest.query.homeState,
          lastName: testContext.getLastNameResult[1],
          someHeaderResponse1: testContext.someResResponse1,
          someHeaderResponse2: testContext.someResResponse1
        }];

        testContext.expectedStatusCode = [200];
      };

      testContext.setupTest();
      testContext.setupHttpRequest();
      testContext.setupGetFirstName();
      testContext.setupGetMiddleName();
      testContext.setupGetLastName();
      testContext.setupHttpHeaders();
      testContext.setupExpected();

      new Scenario(this)
        .mockThisFunction('StatefulSingletonProxy', 'getInstance', StatefulSingletonProxy)
        .mockThisFunction('proxyInstance', 'getFirstName', testContext.proxyInstance)
        .mockThisFunction('proxyInstance', 'getMiddleName', testContext.proxyInstance)
        .mockThisFunction('proxyInstance', 'getLastName', testContext.proxyInstance)

        .withEntryPoint(testContext.entryPointObject, testContext.entryPointFunction)
        .withHttpRequest(testContext.httpRequestParams)

        .resShouldBeCalledWith('send', testContext.expectedResponse)

        .resShouldAlwaysBeCalledWith('someResFunction', testContext.someResParams1)
        .resDoesAlwaysReturn('someResFunction', testContext.someResResponse1)

        .resShouldBeCalledWith('status', testContext.expectedStatusCode)
        .resDoesReturnSelf('status')

        .resShouldContainHeader(testContext.headerKey1, testContext.headerValue1, 'set')
        .resShouldContainHeader(testContext.headerKey2, testContext.headerValue2) // Should default to set
        .resShouldContainHeader(testContext.headerKey3, testContext.headerValue3, 'fakeHeaderFunction')

        .shouldBeCalledWith('StatefulSingletonProxy', 'getInstance', Maddox.constants.EmptyParameters)
        .doesReturn('StatefulSingletonProxy', 'getInstance', testContext.proxyInstance)

        .shouldBeCalledWith('proxyInstance', 'getFirstName', testContext.getFirstName1Params)
        .doesReturnWithPromise('proxyInstance', 'getFirstName', testContext.getFirstName1Result)

        .shouldBeCalledWith('proxyInstance', 'getFirstName', testContext.getFirstName2Params)
        .doesReturnWithPromise('proxyInstance', 'getFirstName', testContext.getFirstName2Result)

        .shouldBeCalledWith('proxyInstance', 'getMiddleName', testContext.getMiddleNameParams)
        .doesReturn('proxyInstance', 'getMiddleName', testContext.getMiddleNameResult)

        .shouldBeCalledWith('proxyInstance', 'getLastName', testContext.getLastNameParams)
        .doesReturnWithCallback('proxyInstance', 'getLastName', testContext.getLastNameResult)

        .test(done);
    });

    it('should use \'resDoesAlwaysReturn\' by itself.', function (done) {
      testContext.setupExpected = function () {
        testContext.someResParams1 = [testContext.getLastNameResult[1]];
        testContext.someResResponse1 = random.uniqueId();
        testContext.someResParams2 = [testContext.getLastNameResult[1]];
        testContext.someResResponse2 = random.uniqueId();

        testContext.expectedResponse = [{
          personId: testContext.httpRequest.params.personId,
          homeState: testContext.httpRequest.query.homeState,
          lastName: testContext.getLastNameResult[1],
          someHeaderResponse1: testContext.someResResponse1,
          someHeaderResponse2: testContext.someResResponse1
        }];

        testContext.expectedStatusCode = [200];
      };

      testContext.setupTest();
      testContext.setupHttpRequest();
      testContext.setupGetFirstName();
      testContext.setupGetMiddleName();
      testContext.setupGetLastName();
      testContext.setupHttpHeaders();
      testContext.setupExpected();

      new Scenario(this)
        .mockThisFunction('StatefulSingletonProxy', 'getInstance', StatefulSingletonProxy)
        .mockThisFunction('proxyInstance', 'getFirstName', testContext.proxyInstance)
        .mockThisFunction('proxyInstance', 'getMiddleName', testContext.proxyInstance)
        .mockThisFunction('proxyInstance', 'getLastName', testContext.proxyInstance)

        .withEntryPoint(testContext.entryPointObject, testContext.entryPointFunction)
        .withHttpRequest(testContext.httpRequestParams)

        .resShouldBeCalledWith('send', testContext.expectedResponse)

        .resShouldBeCalledWith('someResFunction', testContext.someResParams1)
        .resShouldBeCalledWith('someResFunction', testContext.someResParams2)

        .resDoesAlwaysReturn('someResFunction', testContext.someResResponse1)

        .resShouldBeCalledWith('status', testContext.expectedStatusCode)
        .resDoesReturnSelf('status')

        .resShouldContainHeader(testContext.headerKey1, testContext.headerValue1, 'set')
        .resShouldContainHeader(testContext.headerKey2, testContext.headerValue2) // Should default to set
        .resShouldContainHeader(testContext.headerKey3, testContext.headerValue3, 'fakeHeaderFunction')

        .shouldBeCalledWith('StatefulSingletonProxy', 'getInstance', Maddox.constants.EmptyParameters)
        .doesReturn('StatefulSingletonProxy', 'getInstance', testContext.proxyInstance)

        .shouldBeCalledWith('proxyInstance', 'getFirstName', testContext.getFirstName1Params)
        .doesReturnWithPromise('proxyInstance', 'getFirstName', testContext.getFirstName1Result)

        .shouldBeCalledWith('proxyInstance', 'getFirstName', testContext.getFirstName2Params)
        .doesReturnWithPromise('proxyInstance', 'getFirstName', testContext.getFirstName2Result)

        .shouldBeCalledWith('proxyInstance', 'getMiddleName', testContext.getMiddleNameParams)
        .doesReturn('proxyInstance', 'getMiddleName', testContext.getMiddleNameResult)

        .shouldBeCalledWith('proxyInstance', 'getLastName', testContext.getLastNameParams)
        .doesReturnWithCallback('proxyInstance', 'getLastName', testContext.getLastNameResult)

        .test(done);
    });

    it('should use \'resShouldAlwaysBeCalledWith\' by itself.', function (done) {
      testContext.setupTest();
      testContext.setupHttpRequest();
      testContext.setupGetFirstName();
      testContext.setupGetMiddleName();
      testContext.setupGetLastName();
      testContext.setupHttpHeaders();
      testContext.setupExpected();

      new Scenario(this)
        .mockThisFunction('StatefulSingletonProxy', 'getInstance', StatefulSingletonProxy)
        .mockThisFunction('proxyInstance', 'getFirstName', testContext.proxyInstance)
        .mockThisFunction('proxyInstance', 'getMiddleName', testContext.proxyInstance)
        .mockThisFunction('proxyInstance', 'getLastName', testContext.proxyInstance)

        .withEntryPoint(testContext.entryPointObject, testContext.entryPointFunction)
        .withHttpRequest(testContext.httpRequestParams)

        .resShouldBeCalledWith('send', testContext.expectedResponse)

        .resShouldAlwaysBeCalledWith('someResFunction', testContext.someResParams1)
        .resDoesReturn('someResFunction', testContext.someResResponse1)
        .resDoesReturn('someResFunction', testContext.someResResponse2)

        .resShouldBeCalledWith('status', testContext.expectedStatusCode)
        .resDoesReturnSelf('status')

        .resShouldContainHeader(testContext.headerKey1, testContext.headerValue1, 'set')
        .resShouldContainHeader(testContext.headerKey2, testContext.headerValue2) // Should default to set
        .resShouldContainHeader(testContext.headerKey3, testContext.headerValue3, 'fakeHeaderFunction')

        .shouldBeCalledWith('StatefulSingletonProxy', 'getInstance', Maddox.constants.EmptyParameters)
        .doesReturn('StatefulSingletonProxy', 'getInstance', testContext.proxyInstance)

        .shouldBeCalledWith('proxyInstance', 'getFirstName', testContext.getFirstName1Params)
        .doesReturnWithPromise('proxyInstance', 'getFirstName', testContext.getFirstName1Result)

        .shouldBeCalledWith('proxyInstance', 'getFirstName', testContext.getFirstName2Params)
        .doesReturnWithPromise('proxyInstance', 'getFirstName', testContext.getFirstName2Result)

        .shouldBeCalledWith('proxyInstance', 'getMiddleName', testContext.getMiddleNameParams)
        .doesReturn('proxyInstance', 'getMiddleName', testContext.getMiddleNameResult)

        .shouldBeCalledWith('proxyInstance', 'getLastName', testContext.getLastNameParams)
        .doesReturnWithCallback('proxyInstance', 'getLastName', testContext.getLastNameResult)

        .test(done);
    });
  });
});
