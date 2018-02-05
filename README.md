# Pulse Rules

## Default/Sample Pulse rules for your enjoyment

### Instructions
Fields with a $ and all caps that look like a variable must be updated

Example: In cucumberJenkinsExecuteShell.sh, please replace $YOUR_PULSE_RULE_EVENT_URL,  $YOUR_TEST_CYCLE_ID, $YOUR_PROJECT_ID, etc

Set up rules with your own event and with these actions. Note, anything that uses constants.X will need your own constants value.

Finally, these are only samples. Some of the actions are not 100% robust in case of failure.


### cucumberJenkinsExecuteShell.sh
Jenkins Execution Post Shell Action Configuration for Cucumber for Java with .json output

### triggerJenkins.js
Triggers a Jenkins Job using the API of Jenkins. Note that your jenkins instance needs to be configured to allow a remove trigger. Verify with CURL before using this action from Pulse.

### slackAction.js
Sends a message to slack. A webhook must be set up in slack so you can send info to a channel or person.

### FormatJavaCucumberAndReport.js
This takes raw Cucumber for Java .json surefire reports and formats them into a format that the auto-test-logs endpoint will understand. At the end of this action, the rule that uses the action "UpdateQTestAndScenarioWithFormattedResults" will be called

### UpdateQTestAndScenarioWithFormattedResults.js
This sets the color coding in scenario for pass/fail at the start of the script. It then logs into qTest manager and uses the auto-test-logs endpoint to bulk upload test cases, test runs, and test logs to qTest Manager. The final step is that it attemps to link requirements (you must have requirements already mapped and integrated from JIRA to qTest Manager on) with the new test cases.

## Sample Slack Rule Setup
![createslackrule](https://user-images.githubusercontent.com/4780166/35834455-db1fdc72-0aa3-11e8-89de-075b3d51c1e5.gif)





