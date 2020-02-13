import _ from "lodash";
import { parseCSV } from "src/lib";

function parseCSVPromise(...args) {
  return new Promise(r => parseCSV(...args, r));
}

describe("parseCSV", () => {
  beforeEach(() => {
    global.SUPPRESS_PHONE_VALIDATION = true;
  });

  describe("with PHONE_NUMBER_COUNTRY set", () => {
    beforeEach(() => (process.env.PHONE_NUMBER_COUNTRY = "AU"));
    afterEach(() => delete process.env.PHONE_NUMBER_COUNTRY);

    it("should consider phone numbers from that country as valid", async () => {
      const csv = "firstName,lastName,phone_number\ntest,test,61468511000";
      const { contacts, error } = await parseCSVPromise(csv, {
        optOuts: [],
        maxContacts: 1000
      });

      expect(error).toBeFalsy();
      expect(contacts.length).toEqual(1);
    });
  });

  it("limits the max number of contacts", async () => {
    function csvWithRows(rows) {
      const csvRows = ["first_name,last_name,phone_number"];
      for (let i = 0; i < rows; i++) {
        csvRows.push(`foo,bar,1555123${_.padStart(String(i), 4, "0")}`);
      }

      return csvRows.join("\n");
    }

    const result1 = await parseCSVPromise(csvWithRows(100), {
      maxContacts: 100
    });
    expect(result1.error).toBeFalsy();
    expect(result1.contacts.length).toEqual(100);

    const result2 = await parseCSVPromise(csvWithRows(101), {
      maxContacts: 100
    });
    expect(result2.error).toEqual(
      "You can only have 100 contacts in a single campaign. You uploaded a CSV with 101 contacts."
    );
  });
});
