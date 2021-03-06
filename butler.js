const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

// Specify variables for use in script below
const apiBaseUrl = "https://app.butlerlabs.ai/api";

// Make sure to add the API Key you wrote down above to the auth headers
const apiKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdXRoMHw2MjM1ZDJhYmI0OGIxZTAwNjhkNWMxZTgiLCJlbWFpbCI6ImVyeEBjYXNlLmVkdSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE2NDc2OTQ1NDM1MDJ9.XAJI2M0UiJi1nxf6rTrsV5UHMfbUDr0KIwIsia9-5g8";
const authHeaders = {
  Authorization: "Bearer " + apiKey,
};

// Use the Queue API Id you grabbed earlier
const queueId = "23eddbcd-d74f-4653-a7f4-7faac2e2d7f9";

// Specify the path to the file you would like to process
const localFilePaths = ["./receipts/receipt1.png"];

// Specify the API URL
const uploadUrl = apiBaseUrl + "/queues/" + queueId + "/uploads";

// This async function uploads the files passed to it and returns the id
// needed for fetching results.
// It is used in our main execution function below
const uploadFiles = async (filePaths) => {
  // Prepare file for upload
  const formData = new FormData();
  filePaths.forEach((filePath) => {
    formData.append("files", fs.createReadStream(filePath));
  });

  // Upload files to the upload API
  console.log("Uploding files to Butler for processing");
  const uploadResponse = await axios
    .post(uploadUrl, formData, {
      headers: {
        ...authHeaders,
        ...formData.getHeaders(),
      },
    })
    .catch((err) => console.log(err));

  // Return the Upload ID
  return uploadResponse.data.uploadId;
};

// This async function polls every 5 seconds for the extraction results using the
// upload id provided and returns the results once ready
const getExtractionResults = async (uploadId) => {
  // URL to fetch the result
  const extractionResultsUrl =
    apiBaseUrl + "/queues/" + queueId + "/extraction_results";
  const params = { uploadId };

  // Simple helper function for use while polling on results
  const sleep = (waitTimeInMs) =>
    new Promise((resolve) => setTimeout(resolve, waitTimeInMs));

  // Make sure to poll every few seconds for results.
  // For smaller documents this will typically take only a few seconds
  let extractionResults = null;
  while (!extractionResults) {
    console.log("Fetching extraction results");
    const resultApiResponse = await axios.get(extractionResultsUrl, {
      headers: { ...authHeaders },
      params,
    });

    const firstDocument = resultApiResponse.data.items[0];
    const extractionStatus = firstDocument.documentStatus;
    // If extraction has not yet completed, sleep for 5 seconds
    if (extractionStatus !== "Completed") {
      console.log("Extraction still in progress. Sleeping for 5 seconds...");
      await sleep(5 * 1000);
    } else {
      console.log("Extraction results ready");
      return resultApiResponse.data;
    }
  }
};

// Use the main function to run our entire script
const main = async () => {
  // Upload Files
  const uploadId = await uploadFiles(localFilePaths);
  // Get the extraction results
  const extractionResults = await getExtractionResults(uploadId);

  // Print out the extraction results for each document
  extractionResults.items.forEach((documentResult) => {
    const fileName = documentResult.fileName;
    console.log("Extraction results from " + fileName);

    // Print out each field name and extracted value
    console.log("Fields");
    documentResult.formFields.forEach((field) => {
      const fieldName = field.fieldName;
      const extractedValue = field.value;

      console.log(fieldName + " : " + extractedValue);
    });

    // Print out the results of each table
    console.log("\n\nTables");
    documentResult.tables.forEach((table) => {
      console.log("Table name: " + table.tableName);
      table.rows.forEach((row, idx) => {
        let rowResults = "Row " + idx + ": \n";
        row.cells.forEach((cell) => {
          // Add each cells name and extracted value to the row results
          rowResults += cell.columnName + ": " + cell.value + " \n";
        });

        console.log(rowResults);
      });
    });
  });
};

main();
