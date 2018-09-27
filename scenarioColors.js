const ScenarioSdk = require('@qasymphony/scenario-sdk');

const Steps = {
    updateStepResults(qtestToken, scenarioProjectId, name, status) {
        let stepSdk = new ScenarioSdk.Steps({ qtestToken, scenarioProjectId });
        return stepSdk.getSteps(`"${name}"`).then(steps => Promise.all(steps.map(step => stepSdk.updateStep(step.id, Object.assign(step, { status })))));
    }
};

exports.handler = function ({ event: body, constants, triggers }, context, callback) {
    var payload = body;
    var testLogs = payload.logs;

    for (var res of testLogs) {
        for (var step of res["test_step_logs"]) {
            var stepName = step.description;
            var stepStatus = step.status;

            // Undefined means no step definition existed and it should fail
            if (stepStatus == "undefined") {
                stepStatus = "failed";
            }

            // one of PASSED (green), FAILED (red), or SKIPPED (yellow)
            var stepStatus = _.upperCase(stepStatus);

            // Call the pulse API to update step results
            Steps.updateStepResults(constants.QTEST_TOKEN, constants.SCENARIO_PROJECT_ID, stepName, stepStatus);
        }
    }
}
