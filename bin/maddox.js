#!/usr/bin/env node

"use strict";

/* eslint-disable */

const Mocha = require("mocha"),
  Promise = require("bluebird"),
  ArgParse = require("argparse"),
  fs = require("fs-extra"),
  path = require("path");

class State {

  setArguments(args) {this._arguments_ = args;}
  setPerfFile(perfFilePath) {this._perfFilePath_ = perfFilePath;}
  setPerfDirectory(perfDirectory) {this._perfDirectory_ = perfDirectory;}
  setMocha(mocha) {this._mocha_ = mocha;}
  setCurrentResults(currentResults) {this._currentResults_ = currentResults;}
  setExistingResults(existingResults) {this._existingResults_ = existingResults;}
  setCombinedResults(combinedResults) {this._combinedResults_ = combinedResults;}
  setError(error) {this._error_ = error;}

  getArguments() {return this._arguments_;}
  getPerfFilePath() {return this._perfFilePath_;}
  getPerfDirectoryPath() {return this._perfDirectory_;}
  getMocha() {return this._mocha_;}
  getCurrentResults() {return this._currentResults_;}
  getExistingResults() {return this._existingResults_;}
  getCombinedResults() {return this._combinedResults_;}
  getError() {return this._error_;}

  accept(step) {
    return Promise.try(() => {
      return step.next(this)
    });
  }
}

class SetProcessValues {
  static next() {
    process.env.perf = "true";
  }
}
class PrepareArguments {
  static next(state) {
    const ArgumentParser = ArgParse.ArgumentParser;
    const parser = new ArgumentParser({
      version: "1.1.2",
      addHelp: true,
      formatterClass: ArgParse.RawTextHelpFormatter,
      description: "Maddox CLI runs performance tests on Maddox BDD tests that are marked with the .perf() function."
    });

    parser.addArgument([ "-t", "--TIMEOUT" ], {help: "How long a test has (ms) to finish before timing out.", defaultValue: 30000, type: "int"});
    parser.addArgument([ "-u", "--UI" ], {help: "Specify user-interface (bdd|tdd|qunit|exports).", defaultValue: "bdd"});
    parser.addArgument([ "-p", "--PRINT" ], {help: "Print current performance results.", defaultValue: "false"});
    parser.addArgument([ "-P", "--PRINT_ALL" ], {help: "Print combined recent and historical performance results.", defaultValue: "false"});
    parser.addArgument([ "-m", "--MAX_RESULTS" ], {help: "Only keep this many historical results. Will delete results of the number is less than current count.", defaultValue: 10, type: "int"});
    parser.addArgument([ "-s", "--SAVE_RESULTS" ], {help: "Save results of this run.", defaultValue: "true"});
    parser.addArgument([ "-d", "--TEST_DIR" ], {help: "Save results of this run.", required: true});

    state.setArguments(parser.parseArgs());
  }
}

class SetPerfFile {
  static next(state) {
    const perfDirectory = `${process.cwd()}/maddox`;
    const perfFilePath = `${perfDirectory}/perf-report.json`;

    state.setPerfDirectory(perfDirectory);
    state.setPerfFile(perfFilePath);
  }
}

class CreateMochaInstance {
  static next(state) {
    const args = state.getArguments();
    const mocha = new Mocha({timeout: args.TIMEOUT, ui: args.UI, slow: args.TIMEOUT});

    state.setMocha(mocha);
  }
}

class AddTestFilesToMocha {
  static next(state) {
    const mocha = state.getMocha();
    const args = state.getArguments();
    const testDir = args.TEST_DIR;

    fs.readdirSync(testDir).forEach((file) => {
      if (file.endsWith(".js")) {
        mocha.addFile(path.join(testDir, file));
      }
    });
  }
}

class ExecuteTests {
  static next(state) {
    return new Promise((resolve, reject) => {
      const mocha = state.getMocha();

      process.maddox = {currentReport: {}};

      mocha.run((failures) => {
        if (failures) {
          reject();
        } else {
          state.setCurrentResults(process.maddox.currentReport);
          resolve();
        }
      });
    });
  }
}

class PrepareExistingFile {
  static next(state) {
    const perfFilePath = state.getPerfFilePath();
    const perfDirectory = state.getPerfDirectoryPath();

    fs.ensureDirSync(perfDirectory);

    try {
      fs.accessSync(perfFilePath, fs.R_OK | fs.W_OK);
    } catch (err) {
      fs.writeJsonSync(perfFilePath, {});
    }
  }
}

class GetExistingResults {
  static next(state) {
    const perfFilePath = state.getPerfFilePath();

    try {
      const existingResults = fs.readJsonSync(perfFilePath);

      state.setExistingResults(existingResults);
    } catch (err) {
      throw new Error(`Historical performance file is corrupted. Must be valid JSON. See ${perfFilePath}`);
    }
  }
}

class CombineResults {
  static next(state) {
    const currentResults = state.getCurrentResults();
    const existingResults = state.getExistingResults();
    const args = state.getArguments();

    const combinedResults = JSON.parse(JSON.stringify(existingResults, null, 2));

    for (const title in currentResults) {
      if (!combinedResults[title]) {
        combinedResults[title] = {
          results: []
        };
      }

      // Add current results.
      combinedResults[title].results.unshift(currentResults[title]);

      // Drop old results if we have hit or gone over max results.
      for (let i = combinedResults[title].results.length; i > args.MAX_RESULTS; i--) {
        combinedResults[title].results.pop();
      }
    }

    state.setCombinedResults(combinedResults);
  }
}

class SaveResults {
  static next(state) {
    const combinedResults = state.getCombinedResults();
    const args = state.getArguments();
    const perfFilePath = state.getPerfFilePath();

    if (args.SAVE_RESULTS === "true") {
      fs.writeJsonSync(perfFilePath, combinedResults);

      console.log(`Successfully saved combined results to ${perfFilePath}`);
    }
  }
}

class PrintTestResults {
  static next(state) {
    const args = state.getArguments();
    const currentResults = state.getCurrentResults();
    const combinedResults = state.getCombinedResults();

    const printedResults = {};

    if (args.PRINT === "true") {printedResults.currentResults = currentResults;}

    if (args.PRINT_ALL === "true") {printedResults.combinedResults = combinedResults;}

    if (args.PRINT === "true" || args.PRINT_ALL === "true") {
      console.log("********** Printed Results **********");
      console.log(JSON.stringify(printedResults, null, 2));
      console.log();
    }
  }
}

class SuccessResponse {
  static next() {
    console.log("Finished Successfully");
  }
}

class FailureResponse {
  static next(state) {
    const error = state.getError();

    console.error(error.stack);

    process.exit(1);
  }
}

class Runner {
  static run() {
    const state = new State();

    state.accept(SetProcessValues)
      .then(() => state.accept(PrepareArguments))
      .then(() => state.accept(SetPerfFile))
      .then(() => state.accept(CreateMochaInstance))
      .then(() => state.accept(AddTestFilesToMocha))
      .then(() => state.accept(ExecuteTests))
      .then(() => state.accept(PrepareExistingFile))
      .then(() => state.accept(GetExistingResults))
      .then(() => state.accept(CombineResults))
      .then(() => state.accept(SaveResults))
      .then(() => state.accept(PrintTestResults))
      .then(() => state.accept(SuccessResponse))
      .catch((err) => {
        state.setError(err);
        state.accept(FailureResponse)
      });
  }
}

Runner.run();