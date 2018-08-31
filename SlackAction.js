const { Webhooks } = require('@qasymphony/pulse-sdk');

exports.handler = function ({ event: body, constants, triggers }, context, callback) {
    function emitEvent(name, payload) {
        let t = triggers.find(t => t.name === name);
        return t && new Webhooks().invoke(t, payload);
    }

    var str = body;

    var request = require('request');
    var slack_webhook = constants.SlackWebHook;

    console.log('About to request slack webhook: ', slack_webhook);

    request({
        uri: slack_webhook,
        method: 'POST',
        json: { "text": JSON.stringify(str) }
    }, function (error, response, body) { }
    );
}
