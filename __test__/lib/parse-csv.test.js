import _ from "lodash";
import parseCSV from "src/containers/CSVUploader/parseCSV";
import { PRESET_FIELDS } from "src/lib/fields-helpers";

const columnConfig = PRESET_FIELDS.filter(field => !field.virtual);

describe("parseCSV", () => {
  beforeEach(() => {
    global.SUPPRESS_PHONE_VALIDATION = true;
  });

  describe("with PHONE_NUMBER_COUNTRY set", () => {
    beforeEach(() => (process.env.PHONE_NUMBER_COUNTRY = "US"));
    afterEach(() => delete process.env.PHONE_NUMBER_COUNTRY);

    it("should consider phone numbers from that country as valid", async () => {
      const csv = "firstName,lastName,phone_number\ntest,test,6146851100";
      const { data, error } = await parseCSV(csv, {
        maxRows: 1000,
        columnConfig
      });

      expect(error).toBeFalsy();
      expect(data.length).toEqual(1);
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

    const result1 = await parseCSV(csvWithRows(100), {
      maxRows: 100,
      columnConfig
    });
    expect(result1.error).toBeFalsy();
    expect(result1.data.length).toEqual(100);

    const result2 = await parseCSV(csvWithRows(101), {
      maxRows: 100,
      columnConfig
    });
    expect(result2.error).toEqual(
      "You may not upload a CSV with more than 100 rows. You uploaded a CSV with 101 rows"
    );
  });
});
