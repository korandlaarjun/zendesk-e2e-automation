import test, { expect, request } from "@playwright/test";
import { getTestData } from "../Utils/utils";
import path from "path";
import fs from "fs";
import endpoints from "../resources/Data/endpoints.json";


const resultsFolder = path.join(__dirname, 'test-results');
if (!fs.existsSync(resultsFolder)) fs.mkdirSync(resultsFolder);

const REQUESTS_PER_10_SECONDS = 10;
const WINDOW_MS = 20_000;
const INTERVAL_MS = Math.ceil(WINDOW_MS / REQUESTS_PER_10_SECONDS);

const rateLimitWait = async () => new Promise<void>((resolve) => setTimeout(resolve, INTERVAL_MS));

var filtersRecords: any = [];
const filters = new Map([
    ["Scenario", 'create ticket1']
]);
filtersRecords = getTestData(filters, 'resources/Data/createTickets.csv');

test.beforeAll(() => {
  // Clean up old test results
  const devCsvPath = path.join(resultsFolder, 'ticket_ids_dev.csv');
  const stagingCsvPath = path.join(resultsFolder, 'ticket_ids_staging.csv');
  if(process.env.ENVIRONMENT === 'staging') {
    if (fs.existsSync(stagingCsvPath)) fs.unlinkSync(stagingCsvPath);
  } else {
    if (fs.existsSync(devCsvPath)) fs.unlinkSync(devCsvPath);
  }
});

test.describe('Create Tickets', () => {
  test.describe.configure({ mode: 'serial' });

  for (const record of filtersRecords) {
    test(`CreateTicket: ${record.TicketName}`, async () => {
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
      // 2. Define the request body
      const requestBody = {
        ticket: {
          subject: record.TicketSummary,
          comment: {
            body: record.TicketDescription
          },
          requester: {
            name: "Arjun",
            email: "arjun@orx.ai"
          }
        }
      };
      // 3. Send POST request
      const response = await apiContext.post('/api/v2/tickets.json',
        {
          data: requestBody
        });
      // 4. Assert response status
      expect(response.status()).toBe(201); // or 200 depending on API
      // 5. Optional: parse response and check
      const responseBody = await response.json();
      console.log(responseBody);
      expect(responseBody.ticket).toBeDefined();

      const ticketId = responseBody.ticket.id; // adjust according to API response structure
      let csvPath = path.join(resultsFolder, 'ticket_ids_dev.csv');
      if(process.env.ENVIRONMENT === 'staging') {
        csvPath = path.join(resultsFolder, 'ticket_ids_staging.csv');
      }

      // If file doesn't exist, add header
      if (!fs.existsSync(csvPath)) {
        fs.writeFileSync(csvPath, 'Scenario,ticket_id\n', 'utf8');
      }
      fs.appendFileSync(csvPath, `Get Ticket,${ticketId}\n`, 'utf8');

      await rateLimitWait();
    });
  }
});