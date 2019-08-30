#!/bin/bash

cd "$WORKSPACE/target"

#Read in file, writing payload to a consolidated file to bypass curl character limitations in direct payload
echo '{ "test-cycle" : $YOUR_QTEST_TEST_CYCLE_ID_HERE, "result" : ' > payload.json
cat $YOUR_RESULTS_FILENAME_HERE >> payload.json
echo ', "projectId" : $YOUR_QTEST_PROJECT_ID_HERE }' >> payload.json

curl -X POST \
  $YOUR_PULSE_RULE_EVENT_URL \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -d @payload.json

echo $WORKSPACE
