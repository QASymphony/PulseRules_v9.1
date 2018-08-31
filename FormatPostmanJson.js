const { Webhooks } = require('@qasymphony/pulse-sdk');

exports.handler = function ({ event: body, constants, triggers }, context, callback) {
    function emitEvent(name, payload) {
        let t = triggers.find(t => t.name === name);
        return t && new Webhooks().invoke(t, payload);
    }

    // Payload to be passed in: json style cucumber for java test results

    /////// Pulse version
    var payload = body;
    var testResults = payload.result;
    var projectId = payload.projectId;
    var cycleId = payload["test-cycle"];

    var collectionName = testResults.collection.info.name;
    var testLogs = [];

    testResults.run.executions.forEach(function (testCase) {

        var featureName = testCase.item.name;

        TCStatus = "passed";
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
        order = 0;
        stepNames = [];

        if (!("assertions" in testCase)) {
            return;
        }

        testCase.assertions.forEach(function (step) {
            stepNames.push(step.assertion);
            stepErrorVal = "passed";

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
        "test-cycle": cycleId,
        "logs": testLogs
    };


    // Pulse Version
    emitEvent('$YOUR_UPLOAD_TO_QTEST_EVENT_URL', formattedResults);
}
