/**
 * payload sample at ExampleFormattedResults.json
 * Constant:
 * - ManagerURL: Your qtest url (i.e techsupport.qtestnet.com)
 * - QTEST_TOKEN: Your qtest token (i.e 1038cf25-4e14-4332-bcb0-7444cd747905)
 * - SlackWebHook: Your slack webhook
 * outputs:
 * - Upload test cases, test runs, and test logs to qTest Manager
 * - The action "LinkScenarioRequirements" will be called to tie requirements to test case if the names match.
 * Note:
 * - Automation Integration must be active in Qtest setting (Automation Settings) and have to setting Automation status map
 */

const request = require('request');
const { Webhooks } = require('@qasymphony/pulse-sdk');
const ScenarioSdk = require('@qasymphony/scenario-sdk');

const Features = {
    getIssueLinkByFeatureName(qtestToken, scenarioProjectId, name) {
        return new ScenarioSdk.Features({ qtestToken, scenarioProjectId }).getFeatures(`"${name}"`);
    }
};

exports.handler = function ({ event: body, constants, triggers }, context, callback) {
    function emitEvent(name, payload) {
        let t = triggers.find(t => t.name === name);
        return t && new Webhooks().invoke(t, payload);
    }

    // Specific to pulse actions
    var payload = body;

    var testLogs = payload.logs;
    var cycleId = payload["test-cycle"];
    var projectId = payload.projectId;

    var scenarioCount = 0;
    var scenarioList = "";

    var standardHearders = {
        'Content-Type': 'application/json',
        'Authorization': `bearer ${constants.QTEST_TOKEN}`
    }

    var createLogsAndTCs = function () {
        var opts = {
            url: "http://" + constants.ManagerURL + "/api/v3/projects/" + projectId + "/auto-test-logs?type=automation",
            json: true,
            headers: standardHearders,
            body: {
                test_cycle: cycleId,
                test_logs: testLogs
            }
        };

        return request.post(opts, function (err, response, resbody) {

            if (err) {
                Promise.reject(err);
            }
            else {
                console.log(response.statusCode === 201 ? 'Update success!' : 'error: ' + resbody.message);
                emitEvent('SlackEvent', { AutomationLogUploaded: resbody });

                if (response.body.type == "AUTOMATION_TEST_LOG") {
                    Promise.resolve("Uploaded results successfully");
                }
                else {
                    emitEvent('SlackEvent', { Error: "Wrong type" });
                    Promise.reject("Unable to upload test results");
                }
            }
        });
    };

    createLogsAndTCs()
        .on('response', function () {
            console.log("About to call Link Requirements Rule")
            emitEvent('LinkScenarioRequirements', payload);
            //linkReq();
        })
        .on('error', function (err) {
            emitEvent('SlackEvent', { CaughtError: err });
        })
};
