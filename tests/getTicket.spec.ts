import test, { expect, request } from "@playwright/test";
import { getTestData } from "../Utils/utils";
import path from "path";
import fs from "fs";
import endpoints from "../resources/Data/endpoints.json";

const testresultsFolder = path.join(__dirname, 'test-results');
let resultsFolder = path.join(testresultsFolder, 'dev_failed');
if(process.env.ENVIRONMENT === 'staging') {
  resultsFolder = path.join(testresultsFolder, 'staging_failed');
  if (!fs.existsSync(resultsFolder)){
    fs.mkdirSync(resultsFolder, { recursive: true });
  }
} else {
  if (!fs.existsSync(resultsFolder)){
    fs.mkdirSync(resultsFolder, { recursive: true });
  }
}
// test.beforeAll(() => {
//   // Clean up old test results
//   const devCsvPath = path.join(resultsFolder, 'ticket_ids_dev_failed.csv');
//   const stagingCsvPath = path.join(resultsFolder, 'ticket_ids_staging_failed.csv');
//   if(process.env.ENVIRONMENT === 'staging') {
//     if (fs.existsSync(stagingCsvPath)) fs.unlinkSync(stagingCsvPath);
//   } else {
//     if (fs.existsSync(devCsvPath)) fs.unlinkSync(devCsvPath);
//   }
// });

var filtersRecords: any = [];
const filters = new Map([
    ["Scenario", 'Get Ticket']
]);
if(process.env.ENVIRONMENT === 'staging') {
  filtersRecords = getTestData(filters, 'tests/test-results/ticket_ids_staging.csv');
} else {
  filtersRecords = getTestData(filters, 'tests/test-results/ticket_ids_dev.csv');
}
for (const record of filtersRecords) {
    test(`GetTicket: ${record.ticket_id}`, async () => {    
   const envValue = process.env.ENVIRONMENT;
      if (!envValue || !(envValue in endpoints)) {
        throw new Error(`Invalid ENVIRONMENT value: ${envValue}`);
      }
      const environment = envValue as keyof typeof endpoints;
      console.log("url: ", endpoints[environment].host);

      const apiContext = await request.newContext({
        baseURL: endpoints[environment].host,
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${endpoints[environment].AUTH_API_TOKEN}`, // Replace with your auth if needed
        },
      });
  
  // 3. Send GET request
  const response = await apiContext.get(`/api/lotus/tickets/${record.ticket_id}/conversations.json?include=users&sort_order=desc`);
  // 4. Assert response status
  expect(response.status()).toBe(200); // or 201 depending on API
  // 5. Optional: parse response and check
  const responseBody = await response.json();
  console.log(responseBody);
  expect(responseBody.conversations).toBeDefined();

  const fieldName = 'body'; // Replace with the actual field name
  const count = responseBody.conversations.filter((item: Record<string, unknown>) => item[fieldName] !== undefined).length;
  console.log(`Field "${fieldName}" appears:`, count, 'times');

  let foundExpectedValue = false;
  let testFailedDueToTimeDiff = false;
  let conversationTimes: any[] = [];
  const conversations = responseBody.conversations;
  if (!Array.isArray(conversations) || conversations.length === 0) {
    throw new Error("No conversations found");
  }

    const sorted = [...conversations].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const oldest = sorted[0];
  const oldestTime = new Date(oldest.created_at).getTime();
  const MAX_DIFF_MS = 5 * 60 * 1000; // 5 minute

  let createdTimeDiff = new Date().getTime() - new Date(oldest.created_at).getTime();

  if(createdTimeDiff > MAX_DIFF_MS && count == 1) 
    conversationTimes.push('Msg - 1: ' +(createdTimeDiff / (60 * 1000)));

  let invalidConversations: any[] = [];

  sorted.slice(1).forEach((item, index) => {
    const fieldValue = item[fieldName];
      if (fieldValue !== undefined && fieldValue !== null) {
        console.log(`Field "${fieldName}" value:`, fieldValue);
        if (String(fieldValue).includes("ORX AI")) {
          console.log("Found the expected value in the field.");          
        }else {          
          invalidConversations.push(`Msg - ${index + 2}: ${fieldValue}`);          
        }
      }
    const diffMs =
      new Date(item.created_at).getTime() - oldestTime;
    if (diffMs > MAX_DIFF_MS) {
      let diffMinutes = Math.floor(diffMs / (60 * 1000));
      conversationTimes.push(`Msg - ${index + 2}: ${diffMinutes}`);            
    }
  });
  let csvPath = path.join(resultsFolder,'failedDueToTimeDiff_dev.csv');
  if(process.env.ENVIRONMENT === 'staging') {
    csvPath = path.join(resultsFolder, 'failedDueToTimeDiff_staging.csv');
  }
  if(conversationTimes.length > 0) {
    // If file doesn't exist, add header
    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, 'ticket_id,created_at\n', 'utf8');
    }
    fs.appendFileSync(csvPath, `${record.ticket_id},${conversationTimes.join(',')}\n`, 'utf8');
  }

  let failedReasonCSV = path.join(resultsFolder,'invalidConversations_dev.csv');
  if(process.env.ENVIRONMENT === 'staging') {
    failedReasonCSV = path.join(resultsFolder,'invalidConversations_staging.csv');
  }
  if(invalidConversations.length > 0) {
    // If file doesn't exist, add header
    if (!fs.existsSync(failedReasonCSV)) {
      fs.writeFileSync(failedReasonCSV, 'ticket_id,Reason,Conversation\n', 'utf8');
    }
    fs.appendFileSync(failedReasonCSV, `${record.ticket_id},'Invalid Conversation',${invalidConversations.join(',')}\n`, 'utf8');
  } 
  if(invalidConversations.length > 0 || count < 3) {
    test.fail(true, `Test failed for ticket_id: ${record.ticket_id}. Time difference issue: ${testFailedDueToTimeDiff}, Found expected value: ${foundExpectedValue}, Field count: ${count}`);
  }

})}