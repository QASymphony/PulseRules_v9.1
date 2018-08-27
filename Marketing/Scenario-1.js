const request = require('request');

const getRequirementId = (qTestUrl, projectId, token, issueKey) => {
    return new Promise((resolve, reject) => {
        request({
            uri: `${qTestUrl}/api/v3/projects/${projectId}/requirements`,
            method: 'GET',
            headers: {
                'Authorization': `bearer ${token}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            }
        }, (err, res, body) => {
            if (err) { return reject(err); }
            const requirements = JSON.parse(body);
            let reqFinder = requirements.find(requirement => requirement.name.split(' ')[0] === issueKey);
            if (!reqFinder) { return reject('Requirement not found somehow'); }
            resolve(reqFinder.id);
        });
    });
};

const checkIfThereIsLinkedTestCase = (qTestUrl, projectId, token, requirementId) => {
    return new Promise((resolve, reject) => {
        request({
            uri: `${qTestUrl}/api/v3/projects/${projectId}/linked-artifacts?type=requirements&ids=${requirementId}`,
            method: 'GET',
            headers: {
                'Authorization': `bearer ${token}`,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            }
        }, (err, res, body) => {
            if (err) { return reject(err); }
            const linkedArtifacts = JSON.parse(body)[0].objects;
            const linkedTestCases = linkedArtifacts.filter(artifact => artifact.link_type === 'is_covered_by')
            resolve(linkedTestCases.length > 0)
        });
    });
};

const triggerSlackWebhook = (webhook, content) => {
    return new Promise((resolve, reject) => {
        request({
            uri: webhook,
            method: 'POST',
            json: { text: content }
        }, (err, res, body) => {
            if (err) { reject('Error triggering Slack webhook') }
            resolve();
        });
    });
};

exports.handler = async (body, { clientContext: { constants, triggers } }, callback) => {
    const slackWebhook = constants.SlackWebHook;  // Slack channel's
    const projectId = constants.ProjectId;        // qTest's, ex: 1
    const qTestUrl = constants.qTestUrl;          // ex: 'http://example.com'
    const qTestToken = constants.qTestToken;      // ex: 'bearer abc-adasdd-cxzc'

    const issueKey = body.issue.key;              // Jira's, ex: 'SKV-2'
    let requirementId;                            // qTest's, ex: '20'

    try {
        requirementId = await getRequirementId(qTestUrl, projectId, qTestToken, issueKey);

        console.log('issue key:', issueKey);
        console.log('requirement ID:', requirementId);

        if (await checkIfThereIsLinkedTestCase(qTestUrl, projectId, qTestToken, requirementId)) {
            console.log('Execution completed successfully without triggering any Slack webhook.');
        } else {
            await triggerSlackWebhook(
                slackWebhook, 
                `Warning: An issue without any linked test case is moved to 'Done': ${issueKey}`, 
            );
            console.log('A webhook to Slack channel is triggered:', slackWebhook);
        }
    } catch (e) {
        console.log(e);
        return;
    }
}
