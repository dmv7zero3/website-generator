# DynamoDB Schema - Webpage Content

## Table: mb-webpage-content

### Primary Structure

```typescript
{
  // Primary Keys
  PK: { S: "BUS#${business_id}" },
  SK: { S: "URL#${url_id}" },

  // GSIs
  GSI1PK: { S: "STATUS#${status}" },
  GSI1SK: { S: "BUS#${business_id}" },

  // URL Info
  url_id: { S: string },
  url: { S: string },
  path: { S: string },

  // Content
  content: {
    M: {
      title: { S: string },
      meta_description: { S: string },
      body: { S: string },
      s3_key: { S: string | null }  // For content > 400KB
    }
  },

  // Generation Info
  status: { S: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" },
  generation: {
    M: {
      model: { S: "gpt-4" | "claude-2" },
      prompt_template: { S: string },
      attempts: { N: number },
      last_attempt: { S: string },
      error: { S: string | null }
    }
  },

  // Metadata
  created_at: { S: string },
  updated_at: { S: string },
  last_generated: { S: string },
  version: { N: number }
}
```

### Query Patterns

```typescript
// 1. Get All URLs for a Business
{
  TableName: "mb-webpage-content",
  KeyConditionExpression: "PK = :pk",
  ExpressionAttributeValues: {
    ":pk": { S: "BUS#123" }
  }
}

// 2. Get Specific URL Content
{
  TableName: "mb-webpage-content",
  KeyConditionExpression: "PK = :pk AND SK = :sk",
  ExpressionAttributeValues: {
    ":pk": { S: "BUS#123" },
    ":sk": { S: "URL#abc" }
  }
}

// 3. Find All URLs with Specific Status (using GSI1)
{
  TableName: "mb-webpage-content",
  IndexName: "GSI1",
  KeyConditionExpression: "GSI1PK = :status",
  ExpressionAttributeValues: {
    ":status": { S: "STATUS#PENDING" }
  }
}

// 4. Find Failed URLs for Specific Business (using GSI1)
{
  TableName: "mb-webpage-content",
  IndexName: "GSI1",
  KeyConditionExpression: "GSI1PK = :status AND GSI1SK = :businessId",
  ExpressionAttributeValues: {
    ":status": { S: "STATUS#FAILED" },
    ":businessId": { S: "BUS#123" }
  }
}

// 5. Update Content Status
{
  TableName: "mb-webpage-content",
  Key: {
    PK: { S: "BUS#123" },
    SK: { S: "URL#abc" }
  },
  UpdateExpression: "SET #status = :status, updated_at = :now",
  ExpressionAttributeNames: {
    "#status": "status"
  },
  ExpressionAttributeValues: {
    ":status": { S: "COMPLETED" },
    ":now": { S: new Date().toISOString() }
  }
}
```
