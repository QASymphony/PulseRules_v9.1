#!/bin/bash

cd "$WORKSPACE/target"

#Read in file
logs=$(<cucumber-report.json)
echo "$logs"

curl -X POST \
  $YOUR_PULSE_RULE_EVENT_URL \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -d '{
    "test-cycle" : $YOUR_TEST_CYCLE_ID,
    "result" : '"$logs"',
    "projectId" : $YOUR_PROJECT_ID
}'

echo $WORKSPACE