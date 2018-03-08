# Pulse Rules

## Default/Sample Pulse rules for your enjoyment

### Quick Setup Instructions
Import all of these sample rules directly into Pulse by using the "Import" feature within Pulse and the AllRules.json file included. All constants will need to be filled out for rules that you would like to use.

### Instructions
Fields with a $ and all caps that look like a variable must be updated

Example: In cucumberJenkinsExecuteShell.sh, please replace $YOUR_PULSE_RULE_EVENT_URL,  $YOUR_TEST_CYCLE_ID, $YOUR_PROJECT_ID, etc

Set up rules with your own event and with these actions. Note, anything that uses constants.X will need your own constants value.

Finally, these are only samples. Some of the actions are not 100% robust in case of failure.

### Formatters
Each formatter will format raw test results into something the UpdateQTestWithFormattedResults action will understand. And example of what these formatted results look like can be found in the [ExampleFormattedResults.json](ExampleFormattedResults.json) file. Attachments may be included within the formatted results as an array of attachment objects.

``` 
    attachmentObject = {
                        name: step.name + " Attachment " + attCount,
                        "content_type": att.mime_type,
                        data: att.data
                       };
```

#### FormatJavaCucumber.js
This takes raw Cucumber for Java .json surefire reports and formats them into a format that the auto-test-logs endpoint will understand. At the end of this action, the rule that uses the action "UpdateQTestWithFormattedResults" will be called

#### FormatPostmanJson.js
This takes raw Postman .json and formats them into a format that the auto-test-logs endpoint will understand. At the end of this action, the rule that uses the action "UpdateQTestWithFormattedResults" will be called

#### FormatPythonPyTestJUnit.js
This takes raw Python PyTest .xml (JUnit style) results and formats them into a format that the auto-test-logs endpoint will understand. At the end of this action, the rule that uses the action "UpdateQTestWithFormattedResults" will be called

### cucumberJenkinsExecuteShell.sh
Jenkins Execution Post Shell Action Configuration for Cucumber for Java with .json output

### triggerJenkins.js
Triggers a Jenkins Job using the API of Jenkins. Note that your jenkins instance needs to be configured to allow a remove trigger. Verify with CURL before using this action from Pulse.

### SlackAction.js
Sends a message to slack. A webhook must be set up in slack so you can send info to a channel or person.

### UpdateQTestWithFormattedResults.js
This uses the auto-test-logs endpoint to bulk upload test cases, test runs, and test logs to qTest Manager. It also attempts to tie requirements to test case if the names match.

### scenarioColors.js
This sets the color coding in scenario for pass/fail at the start of the script. 

## Sample Slack Rule Setup
![createslackrule](https://user-images.githubusercontent.com/4780166/35834455-db1fdc72-0aa3-11e8-89de-075b3d51c1e5.gif)





