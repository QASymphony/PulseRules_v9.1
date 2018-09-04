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
            console.log(body);
            const requirements = JSON.parse(body);
            let reqFinder = requirements.find(requirement => requirement.name.split(' ')[0] === issueKey);
            if (!reqFinder) { return reject('Requirement not found somehow'); }
            resolve(reqFinder.id);
        });
    });
};

const getLinkedTestCase = (qTestUrl, projectId, token, requirementId) => {
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
            resolve(linkedTestCases)
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
            if (err) { return reject(err); }
            resolve();
        });
    });
};

const buildSlackMessage = (linkedTestCases, qTestUrl, projectId, requirementId, changes) => {
    let msg = `The requirement (${qTestUrl}/p/${projectId}/portal/project#tab=requirements&object=5&id=${requirementId}) with these linked test cases is updated:`;
    linkedTestCases.forEach(tc => msg += `
        ${qTestUrl}/p/${projectId}/portal/project#tab=testdesign&object=1&id=${tc.id}`);
    msg += '\nChanges:';
    changes.forEach(change => msg += `
        _field:_ ${change.field}; _from:_ ${change.fromString}; _to:_ ${change.toString}`);
    return msg;
}

exports.handler = async ({ event: body, constants, triggers }, context, callback) => {
    const slackWebhook = constants.SlackWebHook;  // Slack channel's
    const projectId = constants.ProjectId;        // qTest's, ex: 1
    const qTestUrl = constants.qTestUrl;          // ex: 'http://example.com'
    const qTestToken = constants.qTestToken;      // ex: 'bearer abc-adasdd-cxzc'

    const issueKey = body.issue.key;              // Jira's, ex: 'SKV-2'
    let requirementId;                            // qTest's, ex: '20'
    let linkedTestCases;

    try {
        requirementId = await getRequirementId(qTestUrl, projectId, qTestToken, issueKey);
        linkedTestCases = await getLinkedTestCase(qTestUrl, projectId, qTestToken, requirementId);

        console.log('issue key:', issueKey);
        console.log('requirement ID:', requirementId);

        if (linkedTestCases.length === 0) {
            console.log('Execution completed successfully without triggering any Slack webhook.');
        } else {
            await triggerSlackWebhook(
                slackWebhook,
                buildSlackMessage(linkedTestCases, qTestUrl, projectId, requirementId, body.changelog.items),
            );
            console.log('A webhook to Slack channel is triggered:', slackWebhook);
        }
    } catch (err) {
        console.log(err);
        return;
    }
}
