## Step 1. Send payload to DynamoDB

DynamoDB Table structure

Send the following in the payload:

- copy of prompt active prompt
- url list

## Step 2.Send URLS to Queue

Send the urls to a DynamoDB Database

API ENDPOINT: https://wcvi65m780.execute-api.us-east-1.amazonaws.com/prod/website-generator/send-urls-to-queue

DynamoDB Schema Notes

# DynamoDB Schema Documentation

## Table of Contents

- [Primary Keys](#primary-keys)
- [Business Information](#business-information)
- [Location](#location)
- [Description](#description)
- [Metadata](#metadata)
- [Prompts](#prompts)
- [SEO Keywords](#seo-keywords)
- [SEO Websites](#seo-websites)
- [Service Areas](#service-areas)

## Primary Keys

- **PK**: Partition key representing the business identifier
  - Example: `"BUS#sls-dispensary"`
- **SK**: Sort key indicating the status of the business profile
  - Example: `"STATUS#active"`

## Business Information

- **name**: Name of the business
- **industry**: Industry category of the business
- **website**: URL of the business website

## Location

```json
{
  "location": {
    "addressLine1": "Primary address line",
    "addressLine2": "Secondary address line (optional)",
    "city": "City name",
    "state": "State abbreviation",
    "zipCode": "ZIP code"
  }
}
```

## Description

```json
{
  "description": {
    "audience": "Target audience description",
    "history": "Brief history of the business"
  }
}
```

## Metadata

```json
{
  "metadata": {
    "createdAt": "Creation timestamp",
    "updatedAt": "Last update timestamp",
    "version": "Schema version number"
  }
}
```

## Prompts

```json
{
  "prompts": [
    {
      "id": "Unique identifier",
      "title": "Title of the prompt",
      "content": "Detailed content",
      "category": "Category of prompt",
      "isActive": "Status boolean"
    }
  ]
}
```

## SEO Keywords

- **seoKeywords**: Array of strings containing relevant SEO keywords

## SEO Websites

```json
{
  "seoWebsites": {
    "[website-url]": {
      "id": "Website identifier",
      "isActive": "Status boolean",
      "name": "Website name",
      "aiGeneratedPages": {
        "url": "keyword/city-state",
        "contentLength": "Content length",
        "dataStructure": "Data structure used",
        "errorDetails": "Error information if any",
        "promptInUse": "copy of the prompt saved here.",
        "metaData": {
          "createdAt": "Creation timestamp",
          "generatedBy": "AI model used",
          "lastUpdated": "Last update timestamp",
          "revisionCount": "Number of revisions",
          "tokenAmount": "Tokens used"
        },
        "metaDescription": "Meta description",
        "pageContent": {
          "conclusionParagraph": "Conclusion content",
          "contentParagraph": "Main content",
          "introParagraph": "Introduction content"
        },
        "status": "Page status",
        "title": "Page title"
      }
    }
  }
}
```

## Service Areas

```json
{
  "serviceAreas": [
    {
      "city": "City name",
      "state": "State abbreviation"
    }
  ]
}
```

## Usage Example

```json
{
  "PK": { "S": "BUS#sls-dispensary" },
  "SK": { "S": "STATUS#active" },
  "name": { "S": "SLS Dispensary" },
  "website": { "S": "https://slsdispensary.com" },
  "industry": { "S": "Cannabis Dispensary" }
}
```

## Notes

- All timestamps should be in ISO 8601 format
- State codes should use standard two-letter abbreviations
- Version numbers should be incremented on schema changes
- All IDs should be unique within their scope
- Boolean fields should use true/false values

Design a new DynamoDB Table with a more optimized SK for querying urls and status. PK is the business id.

```json
{
  "PK": "BUS#sls-dispensary",
  "URL": "URL#https://example.com/page1",
  "STATUS": "STATUS#generated",
  "url": "https://example.com/page1",
  "status": "generated",
  "content": {
    "introParagraph": "Introduction content",
    "contentParagraph": "Main content",
    "conclusionParagraph": "Conclusion content"
  },
  "prompt": "Your active prompt here",
  "createdAt": "2024-03-19T00:00:00Z",
  "updatedAt": "2024-03-20T00:00:00Z",
  "errorDetails": "Detailed error message",
  "contentLength": 500,
  "dataStructure": "Data structure used",
  "lastAiModel": "AI model used",
  "lastTokenAmount": 200
}
```

Documentation Example:
PK: Partition key representing the business identifier.
Example: "BUS#sls-dispensary"
URL: Sort key for the URL.
Example: "URL#https://example.com/page1"
STATUS: Sort key for the status.
Example: "STATUS#generated"
url: The URL of the generated content.
Example: "https://example.com/page1"
status: The status of the content generation.
Example: "generated"
content: The generated content divided into three parts:
introParagraph: Introduction content.
Example: "Introduction content"
contentParagraph: Main content.
Example: "Main content"
conclusionParagraph: Conclusion content.
Example: "Conclusion content"
prompt: The prompt used for content generation.
Example: "Your active prompt here"
createdAt: The timestamp when the content was created.
Example: "2024-03-19T00:00:00Z"
updatedAt: The timestamp when the content was last updated.
Example: "2024-03-20T00:00:00Z"
errorDetails: Error information if any.
Example: "Detailed error message"
contentLength: The length of the generated content.
Example: 500
dataStructure: The data structure used.
Example: "Data structure used"
lastAiModel: The AI model used for the last generation.
Example: "AI model used"
lastTokenAmount: The number of tokens used for the last generation.
Example: 200
