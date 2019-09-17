/**
 * payload sample at TestResultExamples/PostmanPayloadSample.json
 * payload example:
 * {
     {number} projectId - Your Qtest project id
     {number} test-cycle - Your Qtest test cycle id
     {object} result - Your test result(JSON) from Postman
 * }
 * Constant:
 * - ManagerURL: Your qtest url (i.e techsupport.qtestnet.com)
 * - QTEST_TOKEN: Your qtest token (i.e 1038cf25-4e14-4332-bcb0-7444cd747905)
 * outputs:
 * - The Formatted result look like can be found in the ExampleFormattedResults.json file
 * - The action "UpdateQTestWithFormattedResults" will be called with the formatted result
 * Note:
 * - Automation Integration must be active in Qtest setting (Automation Settings) and have to setting Automation status map
 */

const { Webhooks } = require('@qasymphony/pulse-sdk');

exports.handler = function ({ event: body, constants, triggers }, context, callback) {
    function emitEvent(name, payload) {
        let t = triggers.find(t => t.name === name);
        return t && new Webhooks().invoke(t, payload);
    }

    /////// Pulse version
    var payload = body;
    var testResults = payload.result;
    var projectId = payload.projectId;
    var testCycleId = payload["test-cycle"];

    var collectionName = testResults.collection.info.name;
    var testLogs = [];

    testResults.run.executions.forEach(function (testCase) {

        var featureName = testCase.item.name;

        var TCStatus = "passed";
        var reportingLog = {
            exe_start_date: new Date(), // TODO These could be passed in
            exe_end_date: new Date(),
            module_names: [
                'Postman'
            ],
            name: testCase.item.name,
            automation_content: collectionName + "#" + testCase.item.name // TODO See if ID is static or when that changes
        };

        var testStepLogs = [];
        var order = 0;
        var stepNames = [];

        if (!("assertions" in testCase)) {
            return;
        }

        testCase.assertions.forEach(function (step) {
            stepNames.push(step.assertion);
            var stepErrorVal = "passed";

            var actual = step.assertion;

            if ("error" in step) {
                stepErrorVal = "failed";
                TCStatus = "failed";
                actual = step.error.message;
            }

            var stepLog = {
                order: order,
                description: step.assertion,
                expected_result: step.assertion,
                status: stepErrorVal,
                actual_result: actual
            };

            testStepLogs.push(stepLog);
            order++;
        });

        reportingLog.description = "Created by Pulse"; // testCase.request;
        reportingLog.status = TCStatus;
        reportingLog.test_step_logs = testStepLogs;
        reportingLog.featureName = featureName;
        testLogs.push(reportingLog);

    });

    var formattedResults = {
        "projectId": projectId,
        "test-cycle": testCycleId,
        "logs": testLogs
    };

    // Pulse Version
    emitEvent('UpdateQTestWithFormattedResultsEvent', formattedResults);
};
