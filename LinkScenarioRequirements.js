// Specific to pulse actions
var payload = body;

var testLogs = payload.logs;
var projectId = payload.projectId;

var standardHeaders = {
    'Content-Type': 'application/json',
    'Authorization': constants.qTestAPIToken
}        

// This makes a best effort to link if test cases exist. Not if you just uploaded via the auto-test-logs endpoint, the job is batched and may not be completed yet
testLogs.forEach(function(testcase) {
    
    var feat = Features.getIssueLinkByFeatureName(constants.SCENARIO_ACCOUNT_ID, constants.SCENARIO_PROJECT_ID, testcase.featureName);
    
    if(feat.length === 0) // No corresponding feature exists in scenario
        return;
    
    feat.forEach(function(matchingFeature) {
        
       var reqopts = getReqBody(matchingFeature.issueKey);
        request.post(reqopts, function(err, response, featureResBody) {
            
            if(err) {
                emitEvent('$YOUR_SLACK_EVENT_NAME', { Error: "Problem getting requirement: " + err });
            }
            else {
                if(featureResBody.items.length === 0) // No corresponding feature exists in scenario
                    return;
                
                var reqid = featureResBody.items[0].id;
                var tcopts = getTCBody(testcase.name);
                
                request.post(tcopts, function(tcerr, tcresponse, testCaseResBody) {
                    
                    if(tcerr) {
                        emitEvent('$YOUR_SLACK_EVENT_NAME', { Error: "Problem getting test case: " + err });
                    }
                    else {
                        var tcid = testCaseResBody.items[0].id;
                        var linkopts = getLinkBody(reqid, tcid);
    
                        request.post(linkopts, function(optserr, optsresponse, resbody) {
                            if(optserr) {
                                emitEvent('$YOUR_SLACK_EVENT_NAME', { Error: "Problem creating test link to requirement: " + err });
                            }
                            else {
                                // Success, we added a link!
                                emitEvent('$YOUR_SLACK_EVENT_NAME', { Linking: "link added for TC: " + testcase.name + " to requirement " + matchingFeature.issueKey });
                            }
                        });
                    }
                });
            }
        }); 
    });
    
});


function getTCBody(TCName) {
    return {
        url: "https://" + constants.ManagerURL + "/api/v3/projects/" + projectId + "/search",
        json: true,
        headers: standardHeaders,
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
        headers: standardHeaders,
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



