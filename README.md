# Pulse Rules

## Default/Sample Pulse rules for your enjoyment

## Instructions
Fields with a $ and all caps that look like a variable must be updated

Example: In cucumberJenkinsExecuteShell.sh, please replace $YOUR_PULSE_RULE_EVENT_URL,  $YOUR_TEST_CYCLE_ID, $YOUR_PROJECT_ID, etc

Set up rules with your own event and with these actions. Note, anything that uses constants.X will need your own constants value.

Finally, these are only samples. Some of the actions are not 100% robust in case of failure.


### cucumberJenkinsExecuteShell.sh
Jenkins Execution Post Shell Action Configuration for Cucumber for Java with .json output

### triggerJenkins.js
Triggers a Jenkins Job using the API of Jenkins. Note that your jenkins instance needs to be configured to allow a remove trigger. Verify with CURL before using this action from Pulse.




