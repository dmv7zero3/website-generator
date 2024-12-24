# DynamoDB Schema - Business Profiles

## Table: mb-business-profiles

### Primary Structure

```typescript
{
  // Primary Keys
  PK: { S: "BUS#${business_id}" },
  SK: { S: "PROFILE#${business_id}" },

  // GSIs
  GSI1PK: { S: "BUS#${business_name}" },
  GSI2PK: { S: "LOCATION#${state}" },
  GSI2SK: { S: "CITY#${city}" },

  // Business Info
  business_id: { S: string },
  business_name: { S: string },
  business_website: { S: string },
  business_industry: { S: string },

  // Contact Details
  contact: {
    M: {
      phone: { S: string },
      email: { S: string },
      address1: { S: string },
      address2: { S: string | null },
      city: { S: string },
      state: { S: string },
      zip: { S: string }
    }
  },

  // Business Details
  description: {
    M: {
      history: { S: string },
      target_audience: { S: string }
    }
  },

  // Service Lists
  services: {
    L: [{
      M: {
        id: { S: string },
        name: { S: string },
        description: { S: string },
        price: { N: string }
      }
    }]
  },

  // Service Areas
  service_areas: {
    L: [{
      M: {
        id: { S: string },
        location: { S: string }
      }
    }]
  },

  // Metadata
  created_at: { S: string },
  updated_at: { S: string },
  version: { N: number }
}
```

### Query Patterns

```typescript
// 1. Get Business Profile by ID
{
  TableName: "mb-business-profiles",
  KeyConditionExpression: "PK = :pk AND SK = :sk",
  ExpressionAttributeValues: {
    ":pk": { S: "BUS#123" },
    ":sk": { S: "PROFILE#123" }
  }
}

// 2. Find Business by Name (using GSI1)
{
  TableName: "mb-business-profiles",
  IndexName: "GSI1",
  KeyConditionExpression: "GSI1PK = :businessName",
  ExpressionAttributeValues: {
    ":businessName": { S: "BUS#Acme Corp" }
  }
}

// 3. Find Businesses by Location (using GSI2)
{
  TableName: "mb-business-profiles",
  IndexName: "GSI2",
  KeyConditionExpression: "GSI2PK = :state AND GSI2SK = :city",
  ExpressionAttributeValues: {
    ":state": { S: "LOCATION#CA" },
    ":city": { S: "CITY#San Francisco" }
  }
}

// 4. Update Business Services
{
  TableName: "mb-business-profiles",
  Key: {
    PK: { S: "BUS#123" },
    SK: { S: "PROFILE#123" }
  },
  UpdateExpression: "SET services = :services, updated_at = :now",
  ExpressionAttributeValues: {
    ":services": {
      L: [{
        M: {
          id: { S: "svc_1" },
          name: { S: "New Service" },
          description: { S: "Service description" },
          price: { N: "99.99" }
        }
      }]
    },
    ":now": { S: new Date().toISOString() }
  }
}

// 5. Update Business Contact Information
{
  TableName: "mb-business-profiles",
  Key: {
    PK: { S: "BUS#123" },
    SK: { S: "PROFILE#123" }
  },
  UpdateExpression: "SET contact.#email = :email, updated_at = :now",
  ExpressionAttributeNames: {
    "#email": "email"
  },
  ExpressionAttributeValues: {
    ":email": { S: "new@email.com" },
    ":now": { S: new Date().toISOString() }
  }
}
```

## AWS CLI Setup Instructions

### 1. Create Base Table

```bash
aws dynamodb create-table \
  --table-name mb-business-profiles \
  --region us-east-1 \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
  --global-secondary-indexes '[
    {
      "IndexName": "GSI1",
      "KeySchema": [{"AttributeName": "GSI1PK", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"},
      "ProvisionedThroughput": {"ReadCapacityUnits": 1, "WriteCapacityUnits": 1}
    }
  ]'
```

### 2. Wait for Table to be Active

```bash
aws dynamodb describe-table \
 --table-name mb-business-profiles \
 --region us-east-1 \
 --query 'Table.[TableStatus,GlobalSecondaryIndexes[*].{IndexName:IndexName,Status:IndexStatus}]'
```

### 3. Add GSI2 (Location Index)

```bash
aws dynamodb update-table \
  --table-name mb-business-profiles \
  --region us-east-1 \
  --attribute-definitions \
    AttributeName=GSI2PK,AttributeType=S \
    AttributeName=GSI2SK,AttributeType=S \
  --global-secondary-index-updates '[
    {
      "Create": {
        "IndexName": "GSI2",
        "KeySchema": [
          {"AttributeName": "GSI2PK", "KeyType": "HASH"},
          {"AttributeName": "GSI2SK", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "ProvisionedThroughput": {"ReadCapacityUnits": 1, "WriteCapacityUnits": 1}
      }
    }
  ]'
```

### 4. Verify Final Configuration

```bash
aws dynamodb describe-table \
  --table-name mb-business-profiles \
  --region us-east-1
```
