const request = require('request');
const { Webhooks } = require('@qasymphony/pulse-sdk');

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
        'Authorization': constants.qTestAPIToken
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

        request.post(opts, function (err, response, resbody) {

            if (err) {
                Promise.reject(err);
            }
            else {
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


    // TODO: This makes a best effort to link. If the TCs aren't uploaded yet, this won't work, but will on subsequent tries
    var linkReq = function () {

        testLogs.forEach(function (testcase) {
            var feat = Features.getIssueLinkByFeatureName(constants.SCENARIO_ACCOUNT_ID, constants.SCENARIO_PROJECT_ID, testcase.featureName);

            if (feat.length === 0) // No corresponding feature exists in scenario
                return;

            var reqopts = getReqBody(feat[0].issueKey);
            request.post(reqopts, function (err, response, featureResBody) {
                if (err) {
                    reject(err);
                }
                else {

                    var reqid = featureResBody.items[0].id;

                    // Grab the cooresponding test case ID
                    var tcopts = getTCBody(testcase.name);
                    request.post(tcopts, function (err, response, testCaseResBody) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            var tcid = testCaseResBody.items[0].id;
                            var opts = getLinkBody(reqid, tcid);

                            request.post(opts, function (err, response, resbody) {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    // Success, we added a link!
                                    emitEvent('SlackEvent', { Linking: "link added for TC: " + testcase.name + " to requirement " + feat[0].issueKey });
                                }
                            });
                        }
                    });
                }
            });
        });
    };

    function getTCBody(TCName) {
        return {
            url: "https://" + constants.ManagerURL + "/api/v3/projects/" + projectId + "/search",
            json: true,
            headers: standardHearders,
            body: {
                "object_type": "test-cases",
                "fields": [
                    "*"
                ],
                "query": "Name = '" + TCName + "'"
            }
        };
    }

    function getReqBody(key) {
        return {
            url: "https://" + constants.ManagerURL + "/api/v3/projects/" + projectId + "/search",
            json: true,
            headers: standardHearders,
            body: {
                "object_type": "requirements",
                "fields": [
                    "*"
                ],
                "query": "Name ~ '" + key + "'"
            }
        };
    }

    function getLinkBody(reqid, tcid) {
        return {
            url: "https://" + constants.ManagerURL + "/api/v3/projects/" + projectId + "/requirements/" + reqid + "/link?type=test-cases",
            json: true,
            headers: standardHeaders,
            body: [
                tcid
            ]
        };
    }

    createLogsAndTCs()
        .then(function () {
            linkReq();
        })
        .catch(function (err) {
            emitEvent('SlackEvent', { CaughtError: err });
        })
}
