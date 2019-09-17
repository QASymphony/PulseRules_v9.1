/**
 * payload example:
 * {
     {number} tcid - Your Qtest test case id
     {number} issueKey - Your Jira issue id
 * }
 * Constant:
 * - ManagerURL: Your qtest url (i.e techsupport.qtestnet.com)
 * - QTEST_TOKEN: Your qtest token (i.e 1038cf25-4e14-4332-bcb0-7444cd747905)
 * - ProjectID: Your qtest project id (i.e 229509)
 * outputs:
 * - Link an existing qTest Test Case to a Jira requirement
 * Note:
 * - Jira & qTest integration is already set up and that Jira Issue already exists in qTest as a requirement
 */

const { Webhooks } = require('@qasymphony/pulse-sdk');
const request = require('request');

exports.handler = function ({ event: body, constants, triggers }, context, callback) {
  function emitEvent(name, payload) {
      let t = triggers.find(t => t.name === name);
      return t && new Webhooks().invoke(t, payload);
  }

  var standardHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `bearer ${constants.QTEST_TOKEN}`
  }

  var reqopts = getReqBody(body.issueKey);
  request.post(reqopts, function (err, response, reqResBody) {

      if (err) {
          emitEvent('SlackEvent', { Error: "Problem getting requirement: " + err });
      }
      else {
          if (reqResBody.items.length === 0)
              return;

          var reqid = reqResBody.items[0].id;
            var linkopts = getLinkBody(reqid, body.tcid);

            request.post(linkopts, function (optserr, optsresponse, resbody) {
                if (optserr) {
                    emitEvent('SlackEvent', { Error: "Problem creating test link to requirement: " + err });
                }
                else {
                    // Success, we added a link!
                    emitEvent('SlackEvent', { Linking: "link added for TC: " + body.tcid + " to requirement " + body.issueKey });
                }
            });
      }
  });

  function getReqBody(key) {
    return {
        url: `https://${constants.ManagerURL}/api/v3/projects/${constants.ProjectID}/search`,
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
        url: `https://${constants.ManagerURL}/api/v3/projects/${constants.ProjectID}/requirements/${reqid}/link?type=test-cases`,
        json: true,
        headers: standardHeaders,
        body: [
            tcid
        ]
    };
  }
};

