// Specific to pulse actions
var payload = body;

var testLogs = payload.logs;
var cycleId = payload["test-cycle"];
var projectId = payload.projectId;

var scenarioCount = 0;
var scenarioList = "";

// Update results in pulse - NOTE: This is for the color coding in pulse! This could be broken out into a separate rule
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


// Login and get token (basic authentication)
var login = new Promise (
    
    // TODO: Swap this out for using the API token instead of username/password for simplicity; don't need an explicit login
    function(resolve, reject) {
        var auth = 'Basic ' + new Buffer(constants.email + ':').toString('base64');

        var opts = {
            url: "http://" + constants.ManagerURL + "/oauth/token",
            headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': auth
                    },
            form: {
                grant_type: 'password',
                username: constants.ManagerEmail,
                password: constants.ManagerPassword
            }
        };

        request.post(opts, function(err, response, body) {
            if(err) {
                emitEvent('SlackEvent', { CannotLogIn: err });
                reject(err);
            }
            else {
                var jsonbody = JSON.parse(body);
                if(!jsonbody.access_token) {
                    reject("Missing token: " + body);
                }

                resolve(jsonbody.access_token);
            }
        });
    }
);

var createLogsAndTCs = function(token) {
    var opts = {
        url: "http://" + constants.ManagerURL + "/api/v3/projects/" + projectId + "/auto-test-logs?type=automation",
        json: true,
        headers: {
                'Content-Type': 'application/json',
                'Authorization': "bearer " + token
                },
        body: {
            test_cycle: cycleId,
            test_logs: testLogs
        }
    };

    request.post(opts, function(err, response, resbody) {

        if(err) {
            Promise.reject(err); 
        }
        else {
            emitEvent('$YOUR_SLACK_EVENT_NAME', { AutomationLogUploaded: resbody });
            
            if(response.body.type == "AUTOMATION_TEST_LOG") {
                Promise.resolve("Uploaded results successfully");
            }
            else {
                emitEvent('SlackEvent', { Error: "Wrong type"});
                Promise.reject("Unable to upload test results");
            }
        }
    });
};


// TODO: This makes a best effort to link. If the TCs aren't uploaded yet, this won't work, but will on subsequent tries
var linkReq = function(token) {
    
    testLogs.forEach(function(testcase) {
        var feat = Features.getIssueLinkByFeatureName(constants.SCENARIO_ACCOUNT_ID, constants.SCENARIO_PROJECT_ID, testcase.featureName);

        if(feat.length === 0) // No corresponding feature exists in scenario
            return;
        
        var reqopts = getReqBody(token, feat[0].issueKey);
        request.post(reqopts, function(err, response, featureResBody) {
            if(err) {
                reject(err); 
            }
            else {
                
                var reqid = featureResBody.items[0].id;
           
                // Grab the cooresponding test case ID
                var tcopts = getTCBody(token, testcase.name);
                request.post(tcopts, function(err, response, testCaseResBody) {
                    if(err) {
                        reject(err); 
                    }
                    else {
                        var tcid = testCaseResBody.items[0].id;
                        var opts = getLinkBody(token, reqid, tcid);
                        
                        request.post(opts, function(err, response, resbody) {
                            if(err) {
                                reject(err); 
                            }
                            else {
                                // Success, we added a link!
                                emitEvent('$YOUR_SLACK_EVENT_NAME', { Linking: "link added for TC: " + testcase.name + " to requirement " + feat[0].issueKey });
                            }
                        });
                    }
                });
            }
        });
    });
};

function getTCBody(token, TCName) {
    return {
        url: "https://" + constants.ManagerURL + "/api/v3/projects/" + projectId + "/search",
        json: true,
        headers: {
                'Content-Type': 'application/json',
                'Authorization': "bearer " + token
                },
        body: {
            "object_type": "test-cases",
            "fields": [
                "*"
            ],
            "query": "Name = '" + TCName + "'"
        }
    };
}

function getReqBody(token, key) {
    return {
        url: "https://" + constants.ManagerURL + "/api/v3/projects/" + projectId + "/search",
        json: true,
        headers: {
                'Content-Type': 'application/json',
                'Authorization': "bearer " + token
                },
        body: {
            "object_type": "requirements",
            "fields": [
                "*"
            ],
            "query": "Name ~ '" + key + "'"
        }
    };
}

function getLinkBody(token, reqid, tcid) {
    return {
        url: "https://" + constants.ManagerURL + "/api/v3/projects/" + projectId + "/requirements/" + reqid + "/link?type=test-cases",
        json: true,
        headers: {
                'Content-Type': 'application/json',
                'Authorization': "bearer " + token
                },
        body: [
            tcid
        ]
    };
}

login.then(function(token) {
    return token
}).then(function(token) {
    createLogsAndTCs(token)
    return token
})
.then(function(token) {
    linkReq(token)
})
.catch(function(err) {
    emitEvent('$YOUR_SLACK_EVENT_NAME', { CaughtError: err });
})



