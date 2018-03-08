// Specific to pulse actions
var payload = body;

var testLogs = payload.logs;
var cycleId = payload["test-cycle"];
var projectId = payload.projectId;

var standardHeaders = {
    'Content-Type': 'application/json',
    'Authorization': constants.qTestAPIToken
}        

var opts = {
    url: "https://" + constants.ManagerURL + "/api/v3/projects/" + projectId + "/auto-test-logs?type=automation",
    json: true,
    headers: standardHeaders,
    body: {
        test_cycle: cycleId,
        test_logs: testLogs
    }
};

request.post(opts, function(err, response, resbody) {

    if(err) {
        emitEvent('$YOUR_SLACK_EVENT_NAME', { createLogsAndTCsErr: err });
    }
    else {
        emitEvent('$YOUR_SLACK_EVENT_NAME', { AutomationLogUploaded: resbody });
        
        if(response.body.type == "AUTOMATION_TEST_LOG") {
            // Try to link requirements
            emitEvent('LinkScenarioRequirements', payload);
        }
        else {
            emitEvent('$YOUR_SLACK_EVENT_NAME', { Error: "Wrong type"});
        }
    }
});



