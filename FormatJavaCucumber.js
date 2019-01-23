const { Webhooks } = require('@qasymphony/pulse-sdk');

// Returns an array of step names
const getStepNames = testCase => testCase.steps.map(step => step.name);

// Create a deep clone of object when wanting to avoid mutating original data, this method is only safe if the supplied object is 100% parsable in JSON
const createDeepCloneOfJsonObject = object => JSON.parse(JSON.stringify(object));

// Injects the step name into the attachment object, relying on the context of 'this' to be set to a step object 
// e.g. an arrow function cannot be used
const injectStepName = function(attachment) {
    attachment.step_name = ("name" in this) ? this.name : "";
    return attachment;
} 

// Creates a clone of the step before iterating through the attachments contained within it, adding a 'step_name' field
const attachmentsWithStepNameInjected = (step) => createDeepCloneOfJsonObject(step).embeddings.map(injectStepName, step);

// Flattens a multidimensional array, into a simple array by storing each value in the accumulator
const flattenArray = (acc, arrayValue) => acc.concat(arrayValue);

// Checks that the passed in object contains an embeddings field
const hasEmbeddings = object => "embeddings" in object;

// Creates an attachment object, using the passed in attachment and index values
const attachmentInformation = (attachment, index) => { 
    return { 
                name: `${attachment.step_name} Attachment ${index + 1}`,
                "content_type": attachment.mime_type,
                data: attachment.data
            }
};

// Iterates over each step and grabs all attachments and returns a flat array containing the attachment information
const getStepAttachments = testCase => testCase.steps.filter(hasEmbeddings).map(attachmentsWithStepNameInjected)
    .reduce(flattenArray, []).map(attachmentInformation);

// Iterates over each hook and grabs all attachments and returns a flat array containing the attachment information
const getHookAttachments = testCase => ("after" in testCase) ? testCase.after.filter(hasEmbeddings).map(attachmentsWithStepNameInjected)
    .reduce(flattenArray, []).map(attachmentInformation) : [];

// Grabs all attachments from the hooks and steps and combines them into a single flat array of attachment information
const getAllAttachments = testCase => getStepAttachments(testCase).concat(getHookAttachments(testCase));

// Enum object to handle possible statuses within cucumber json output and in qTest Manager
const Status = {
    PASSED: "passed",
    FAILED: "failed",
    SKIPPED: "skipped",
    UNDEFINED: "undefined",
    PENDING: "pending",
    BLOCKED: "blocked",
}

// Calculates the overall testcase status based on the result of the passed in step, storing the result in the accumulator
const testCaseStatus = (acc, step) => (Status.PASSED === acc) ? step.result.status: acc;

// Gets the testcase status based on the result of each step
const getTCStatus = testCase => testCase.steps.reduce(testCaseStatus, Status.PASSED);

// Returns an  actual result based on step.result.status
// A step is skipped when a previous step, background step or before hook fails
// A step is undefined when it exists in a feature but no definition is found
// A step is pending when it exists in a feature file, has a defition, but explicitly throws a PendingException
const getActualResult = step => {
    return {
        [Status.PASSED]: step.name,
        [Status.FAILED]: step.result.error_message,
        [Status.SKIPPED]: "This step has been skipped due to a previous failure",
        [Status.UNDEFINED]: "This step does not match any step definitions",
        [Status.PENDING]: "This step is marked as pending"
    }[step.result.status];
}

// Generates a step log object for injection into a test log
const testStepLogs = testCase => testCase.steps.map((step, index) => {
    return {
        order: index,
        description: `${step.keyword}`,
        expected_result: step.name,
        actual_result: getActualResult(step),
        status: step.result.status
    };
});

// Injects the feature name and URI into the test case object, relying on the context of 'this' to be set to a test case object 
// e.g. an arrow function cannot be used
const injectFeatureNameAndUri = function(testCase) {
    testCase.feature_uri = this.uri;
    testCase.feature_name = this.name;
    return testCase;
}

// Creates a clone of the feature before iterating through the test cases contained within it, adding the 'feature_name' and 'feature_uri' fields.
const testCasesWithFeatureNameAndUriInjected = feature => createDeepCloneOfJsonObject(feature).elements.map(injectFeatureNameAndUri, feature);

// gets all of the folders after the 'features' directory
var getModules = URI => {
    let modules = ["Features"].concat(URI.replace(/.+features\//i,"").split("/"));
    modules.pop();
    return modules;
}

// Create a new object to represent a test log and populate it's fields
const testLogs = testCase => ({
            exe_start_date: new Date(), // TODO These could be passed in
            exe_end_date: new Date(),
            module_names: getModules(testCase.feature_uri),
            name: "name" in testCase ? testCase.name : "Unnamed",
            automation_content: testCase.feature_uri + "#" + testCase.name,
            attachments: getAllAttachments(testCase),
            status: getTCStatus(testCase),
            test_step_logs: testStepLogs(testCase),
            featureName: testCase.feature_name,
        });

// Loops through all of the features and test cases creating a test log for each
const generateTestLogs = features => features.map(testCasesWithFeatureNameAndUriInjected).reduce(flattenArray, []).map(testLogs);

// Entry point to the script, it takes the cucumber json input and reformat it into qTest Manager friendly
// json before handing it off to the down stream rule
exports.handler = ({ event: body, constants, triggers }, context, callback) => {

    const emitEvent = (name, payload) => {
        let t = triggers.find(t => t.name === name);
        return t && new Webhooks().invoke(t, payload);
    }

    const payload = body;

    const formattedResults = {
        "projectId": payload.projectId,
        "test-cycle": payload["test-cycle"],
        "logs": generateTestLogs(payload.result)
    };

    // Pulse Version
    // Emit next fxn to upload results/parse
    emitEvent('UpdateQTestWithFormattedResultsEvent', formattedResults);
}