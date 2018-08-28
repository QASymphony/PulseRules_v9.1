const { parseString } = require('xml2js');
const request = require('request');
const submitTestLog = async (requestData, projectId, qTestConfig) => {
    await new Promise((resolve, reject) => {
        request({
            uri: `${qTestConfig.qTestUrl}/api/v3/projects/${projectId}/auto-test-logs?type=automation`,
            method: 'POST',
            headers: {
                'Authorization': `bearer ${qTestConfig.token}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: requestData
        }, (err, res, body) => {
            if (err) { return reject(err); }
            console.log(body);
            resolve(true);
        });
    });
}
const submitTestResults = async (event, qTestConfig) => {
    let resultData = await new Promise((resolve, reject) => {
        parseString(event.result, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
    let testCases = resultData.testsuite.testcase;
    let requestData = {
        name: event.jobName,
        test_logs: [],
        test_cycle: event.testcycle
    };
    for (let i = 0; i < testCases.length; i++) {
        let testCase = testCases[i]['$'];
        let status = 'PASS';
        if (testCases[i].failure) {
            status = 'FAIL';
        }
        if (testCases[i].skipped) {
            status = 'SKIP';
        }
        requestData.test_logs.push({
            status: status,
            // set start and end date to current time
            exe_start_date: new Date(),
            exe_end_date: new Date(),
            name: testCase.name,
            automation_content: `${testCase.classname}.${testCase.name}`,
            module_names: ['Automation Module']
        });
    }
    await submitTestLog(JSON.stringify(requestData), event.projectID, qTestConfig);
};
const triggerSlackWebhook = async (webhook, content) => {
    await new Promise((resolve, reject) => {
        request({
            uri: webhook,
            method: 'POST',
            json: { text: content }
        }, (err, res, body) => {
            if (err) { return reject(err); }
            resolve();
        });
    });
};
exports.handler = async (event, { clientContext: { constants, triggers } }, callback) => {
    await submitTestResults(event, { qTestUrl: constants.qTestUrl, token: constants.qTestToken});
    await triggerSlackWebhook(constants.SlackWebhook, 'Created test case in qTest Manager');
    console.log('Done processing test results.');
}