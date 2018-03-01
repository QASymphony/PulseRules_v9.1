var payload = body;
var testLogs = payload.logs;

for (var res of testLogs) {
    for (var step of res["test_step_logs"]) {
        var stepName = step.description;
        var stepStatus = step.status;
        
        // Undefined means no step definition existed and it should fail
        if(stepStatus == "undefined") {
            stepStatus = "failed";
        }
        
        // one of PASSED (green), FAILED (red), or SKIPPED (yellow)
        var stepStatus = _.upperCase(stepStatus);
        
        // Call the pulsee API to update step results
        Steps.updateStepResults(constants.SCENARIO_ACCOUNT_ID, constants.SCENARIO_PROJECT_ID, stepName, stepStatus);
    }        
}