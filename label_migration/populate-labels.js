import parseArgs from "minimist";
import Papa from "papaparse";
import db from "src/server/db";
import fs from "fs";

const trim = str => (str || "").trim();
db.enableTracing();
async function processCannedResponses(mapping) {
  await db.transaction(async transaction => {
    const allCannedResponses = await transaction("canned_response")
      .innerJoin("campaign", "canned_response.campaign_id", "campaign.id")
      .select("campaign.organization_id", "canned_response.*");

    for (const cr of allCannedResponses) {
      const key = `${trim(cr.survey_question)}|${trim(cr.title)}`;
      const match = mapping[key];
      if (match) {
        console.log(
          "Matched canned response",
          cr.id,
          "to",
          match.slug1,
          match.slug2
        );
        const labelIds = [];
        const label1 = await db.Label.getByOrgAndSlug(
          cr.organization_id,
          match.slug1,
          { transaction }
        );
        if (!label1) {
          console.log(
            "Label",
            match.slug1,
            "does not match in org",
            cr.organization_id
          );
        } else {
          labelIds.push(label1.id);
        }
        let label2;
        if (match.slug2) {
          label2 = await db.Label.getByOrgAndSlug(
            cr.organization_id,
            match.slug2,
            {
              transaction
            }
          );
          if (!label2) {
            console.log(
              "Label",
              match.slug1,
              "does not match in org",
              cr.organization_id
            );
          } else {
            labelIds.push(label2.id);
          }
        }
        await db.CannedResponse.updateLabels(cr.id, labelIds, {
          transaction
        });
      } else {
        console.log("NO MATCH FOR:", cr.id);
      }
    }
  });
}

// Takes a CSV mapping of legacy survey questions + title to slugs. Format:
// surveyQuest, title, slug1, slug2
async function main() {
  try {
    const { mappingFilePath } = parseArgs(process.argv);
    const file = fs.readFileSync(mappingFilePath, "utf8");
    const parsed = Papa.parse(file, { header: true });
    const mapping = parsed.data.reduce((acc, row) => {
      if (!row.surveyQuestion && !row.title) {
        return acc;
      }
      const key = `${trim(row.surveyQuestion)}|${trim(row.title)}`;
      return { [key]: row, ...acc };
    }, {});
    await processCannedResponses(mapping);
  } catch (e) {
    console.error(e);
  }
}

main().then(() => process.exit());
