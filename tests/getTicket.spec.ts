import test, { expect, request } from "@playwright/test";
import { getTestData } from "../Utils/utils";
import path from "path";
import fs from "fs";
import endpoints from "../resources/Data/endpoints.json";

const resultsFolder = path.join(__dirname, 'test-results');
if (!fs.existsSync(resultsFolder)) fs.mkdirSync(resultsFolder);

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
  const count = responseBody.conversations.filter((item: { [x: string]: undefined; }) => item[fieldName] !== undefined).length;
  console.log(`Field "${fieldName}" appears:`, count, 'times');
  // Assertion: the field should appear exactly twice
  expect(count).toBe(3); // Adjust the expected count as needed

})}