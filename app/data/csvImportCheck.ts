import type { Article } from './articles';

export const csvImportCheck: Article = {
  "slug": "check-client-csv-before-import",
  "title": "How to Check a Client CSV Before Importing It: A Freelancer Checklist",
  "description": "Check a client CSV for damaged IDs, ambiguous dates, broken columns and duplicate records, then reconcile a test import with a reusable review worksheet.",
  "publishedAt": "2026-11-26",
  "category": "Freelance Data",
  "keywords": [
    "client CSV checklist",
    "freelance data cleanup",
    "check CSV before import"
  ],
  "aiSummary": "Keep the original CSV untouched, agree what each column means, preserve identifiers as text, inspect exported records, and reconcile a small authorized test import before handing over the full file. Record unresolved rows instead of guessing at their values.",
  "ctaHref": "/articles",
  "ctaLabel": "Read more practical freelance guides",
  "relatedLinks": [
    {
      "label": "Source: RFC 4180 CSV format",
      "href": "https://www.rfc-editor.org/rfc/rfc4180"
    },
    {
      "label": "Source: Microsoft on leading zeros and large numbers",
      "href": "https://support.microsoft.com/en-us/excel/keeping-leading-zeros-and-large-numbers"
    },
    {
      "label": "Prepare a usable client handoff guide",
      "href": "/articles/freelance-client-handoff-guide-template"
    },
    {
      "label": "Estimate the work before setting a delivery date",
      "href": "/articles/estimate-freelance-project-hours"
    }
  ],
  "sections": [
    {
      "heading": "A file that opens is not necessarily ready to import",
      "body": [
        "A client asks you to clean a product list and load it into a website. The spreadsheet looks tidy, but one product code has lost its first zero, a date could mean two different days, and a description containing a comma has shifted into another column. Those are data questions, not formatting problems.",
        "This guide is for freelancers preparing a small CSV delivery or reviewing a file before an import. It is not a procedure for changing a live customer database. Use the tools already available to you, keep the source untouched, and agree who is authorized to run any import.",
        "All product names, codes, counts, dates, messages and project details below are hypothetical teaching examples. The running example is a fictional workshop-supply catalog, not real client data or a report of customer results. The technical checks draw on the two official sources linked with this guide."
      ]
    },
    {
      "heading": "1. Preserve the original and define the receiving system",
      "body": [
        "Save the received file as an unchanged source copy. Make a separate working copy and give exports distinct version names. Record who supplied the file, when it arrived, which version you inspected, and where the cleaned version is intended to go. Do not overwrite the only copy while experimenting with import settings.",
        "Ask for the receiving system’s actual import instructions or a known-good template. Confirm the delimiter, encoding, header names, required fields, date format and whether an existing record is matched by an ID or created again. Do not infer that two systems interpret a file identically just because both accept a .csv extension.",
        "Hypothetical brief: “Prepare catalog-review-v02.csv for a test import into the client-approved test catalog. Match products by product_code. Required columns: product_code, product_name, available_from and unit. Do not import prices, customer details or inventory adjustments. Production import is outside this review.”"
      ]
    },
    {
      "heading": "2. Write a small column dictionary",
      "body": [
        "For each column, record its meaning, expected type, whether it is required, an example, and what a blank value means. Distinguish an identifier from a quantity. A product code made only of digits is still an identifier if you are not meant to calculate with it.",
        "Hypothetical dictionary: “product_code: required text, exactly five digits, example 00127, unique within this file. product_name: required text, example Clay, fine grade. available_from: optional date in YYYY-MM-DD form. unit: required choice of bag or box.” These are rules for the fictional project, not universal CSV requirements.",
        "Ask what a blank date means: unknown, not yet scheduled, or no restriction? Preserve that uncertainty until the client decides. Do not turn every blank into zero, today’s date, or a plausible-looking value just to satisfy an importer. Record the affected product code and the question in an exceptions list."
      ]
    },
    {
      "heading": "3. Protect codes before the spreadsheet converts them",
      "body": [
        "Microsoft documents that Excel can remove leading zeros when numerical text is converted to numbers, and that numeric precision is limited to 15 significant digits. That matters for codes and other identifiers even when no arithmetic is involved. A visually plausible number may no longer be the original value.",
        "If you already use Excel, its documented Text/CSV import workflow lets you set relevant columns to Text in the query editor. Inspect the import preview and transformation steps before loading. Menu labels and automatic-conversion controls vary by version; use the linked instructions for the version you have rather than purchasing an upgrade for this task.",
        "Hypothetical check: the original product_code is 00127. Confirm that the imported value is still the five-character text 00127, not the number 127 with a display format that adds zeros. If conversion has already discarded information, return to the untouched source and import again with the correct type.",
        "Do not reconstruct missing digits by guessing. A fixed-width padding rule is appropriate only when the client’s documented code rules establish the intended value. Keep a long identifier as text from the start; changing a rounded number to text afterward cannot recover the original digits."
      ]
    },
    {
      "heading": "4. Inspect delimiters, quotation marks and dates",
      "body": [
        "RFC 4180 describes a common CSV format and notes differences among implementations; it is an informational document, not evidence that every importer follows one universal rule. In its described format, records have a consistent field count. Fields containing commas, line breaks or double quotation marks should be enclosed in double quotes, and an embedded double quote is represented by two double quotes.",
        "Hypothetical raw record for the four-column dictionary: 00127,\"Clay, fine grade\",2026-12-03,bag. The quotation marks keep the comma inside the product name instead of making it a fifth column. A hypothetical name containing quotation marks is represented as \"Brush \"\"starter\"\" set\" when written as a quoted CSV field.",
        "Inspect the export with a text viewer as well as the intended importer’s preview. Check accented characters, embedded commas, quotation marks and any multiline descriptions. Count parsed records, not merely visible lines: a quoted field can contain a line break. Do not repair a broken file by globally replacing commas, which may be part of real content.",
        "Hypothetical date question: “Does 03/12/2026 mean March 12 or December 3 in the supplied file?” Resolve it with the source owner before converting it. The example dictionary uses 2026-12-03 for December 3, but the receiving system must also accept that representation. Consistent-looking dates can still be consistently wrong."
      ]
    },
    {
      "heading": "5. Review duplicates and exceptions without deleting evidence",
      "body": [
        "Use the agreed identity column to find repeated records. Two rows with the same product name may represent different products; two rows with the same product code may conflict. Compare the other fields before deciding what should happen. A duplicate detector finds candidates for review, not permission to discard data.",
        "Hypothetical exception: code 00127 appears twice, once with unit bag and once with unit box. Keep both source rows in the review record and ask which unit is correct or whether a different code is missing. Do not keep the first row simply because the spreadsheet’s remove-duplicates button does so.",
        "Maintain a change log with source row or stable identifier, issue, proposed correction, decision owner, approved action and output status. Keep unresolved rows in a separate review file, not hidden in the export. Share client material only through the approved project location; this workflow does not require uploading it to a new conversion service.",
        "If the file comes from an untrusted source or contains unexpected formulas or links, stop and have the responsible technical owner assess it before opening it in an interactive spreadsheet or importing it. The checks here concern data quality, not a security certification of arbitrary files."
      ]
    },
    {
      "heading": "6. Reconcile a test import and package the result",
      "body": [
        "Where a separate test environment is available and its use is authorized, try a small representative set: a leading-zero code, a comma-containing name, a blank optional date, an accented name and a duplicate case. Confirm what the importer does with each. If there is no suitable test environment, report the file review as complete but import behavior as untested; do not experiment against live records.",
        "Record the import mode and mapping before running the test. Check accepted, rejected, skipped, created and updated counts according to that system’s definitions, and inspect the actual resulting values. A success banner alone does not show that the product codes, dates and units survived.",
        "Hypothetical reconciliation: 12 source records become 10 approved export records and 2 unresolved records retained for review. During the authorized test, 9 export records are accepted and 1 is rejected. The arithmetic reconciles, but the import is not complete: identify the rejected record, record the reason and confirm how a retry avoids creating duplicates.",
        "Reusable review worksheet: source filename and version; destination and import mode; column dictionary; source record count; approved export count; unresolved records; transformations approved; special-character checks; test mapping; accepted and rejected counts; inspected output values; remaining questions; and who may perform the next import.",
        "Hypothetical delivery note: “The review export contains 10 approved records. Two source records remain unresolved and are listed separately. The test accepted 9 records and rejected one because its code already exists in the test catalog. No production import was performed. Please confirm the intended treatment of that existing record and the outstanding source-row decisions before the next export.”",
        "Deliver the cleaned file, dictionary, exceptions list and test record together. The useful result is a traceable explanation of what changed and what still needs attention, not a spreadsheet that merely looks neat."
      ]
    }
  ]
};
