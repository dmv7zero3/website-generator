## URL Processing System Architecture

### 1. Core Infrastructure

#### DynamoDB Table

- **Name**: mb-generated-urls
- **Stream**: arn:aws:dynamodb:us-east-1:752567131183:table/mb-generated-urls/stream/2024-11-08T20:28:05.921
- **Keys**:
  - Partition: "PK (String) - BUS#{businessId}"
  - Sort: "URL (String) - URL#{url}"
- **Attributes**:
  - status: String (pending|processing|completed|error)
  - createdAt: String (ISO 8601)
  - updatedAt: String (ISO 8601)

#### SQS Queue

- **URL**: https://sqs.us-east-1.amazonaws.com/752567131183/ContentGenerationQueue
- **ARN**: arn:aws:sqs:us-east-1:752567131183:ContentGenerationQueue
- **Settings**:
  - VisibilityTimeout: 300
  - MessageRetention: 1209600
  - MaxMessageSize: 262144
  - DelaySeconds: 0
  - ReceiveMessageWaitTime: 0
  - SSE: Enabled
  - DLQ: Enabled (maxReceives: 3)

#### EventBridge Rule

- **Name**: mb-website-generator-new-urls
- **ARN**: arn:aws:events:us-east-1:752567131183:rule/mb-website-generator-new-urls
- **Pattern**:
  - source: ["aws.dynamodb"]
  - detail-type: ["AWS API Call via CloudTrail"]
  - detail:
    - eventSource: ["dynamodb.amazonaws.com"]
    - eventName: ["INSERT", "MODIFY"]
    - dynamodb:
      - NewImage:
        - status:
          - S: ["pending"]
- **Target**: ContentGenerationQueue

### 2. Processing Flow

1. **Data Entry**:

   - New URL added to DynamoDB
   - Status set to "pending"
   - Triggers DynamoDB Stream

2. **Event Routing**:

   - DynamoDB Stream triggers EventBridge
   - EventBridge rule filters for pending status
   - Events routed to SQS queue

3. **Message Processing**:
   - Lambda consumes SQS messages
   - Updates DynamoDB status to "processing"
   - Executes URL processing logic
   - Updates final status (completed/error)

### 3. Lambda Functions

#### URL Dispatcher

- **Name**: mb-website-generator-url-processor-1
- **Trigger**: SQS Queue
- **Purpose**: Process URLs from queue
- **Timeout**: 300 seconds
- **Memory**: 256 MB
- **Concurrency**: 10
- **BatchSize**: 500
- **MaximumBatchingWindowInSeconds**: 10
- **Destination**: mb-website-generator-save-validation-results

#### Results Handler

- **Name**: mb-website-generator-save-validation-results
- **Purpose**: Save validation results to DynamoDB

### 4. Monitoring Setup

#### CloudWatch Alarms

- **SQS**:

  - QueueDepth:
    - Threshold: 10000
    - Period: 300
  - DLQDepth:
    - Threshold: 10
    - Period: 300

- **Lambda**:

  - ErrorRate:
    - Threshold: 5%
    - Period: 300
  - Duration:
    - Threshold: 80%
  - Throttles:
    - Threshold: 1

- **DynamoDB**:
  - ThrottledRequests:
    - Threshold: 1
  - SystemErrors:
    - Threshold: 1

### 5. Error Handling

#### Retry Policies

- **SQS**:

  - VisibilityTimeout: 300s
  - MaxReceiveCount: 3
  - DLQ Enabled

- **Lambda**:
  - Retry Attempts: 2
  - BackoffRate: 2
  - MaximumRetryAttempts: 2

#### Error Logging

- **Required Fields**:
  - correlationId
  - businessId
  - url
  - errorType
  - errorMessage

### 6. IAM Permissions

#### EventBridge Role

- events:PutEvents
- sqs:SendMessage

#### Lambda Role

- sqs:ReceiveMessage
- sqs:DeleteMessage
- sqs:GetQueueAttributes
- dynamodb:UpdateItem
- dynamodb:GetItem
- logs:CreateLogGroup
- logs:CreateLogStream
- logs:PutLogEvents

#### DynamoDB Stream

- dynamodb:DescribeStream
- dynamodb:GetRecords
- dynamodb:GetShardIterator
- dynamodb:ListStreams

### 7. Testing & Validation

#### Test Cases

1. **New URL Entry**:

   - Add item to DynamoDB
   - Verify EventBridge trigger
   - Check SQS message
   - Confirm Lambda processing

2. **Error Handling**:

   - Test invalid URL format
   - Verify DLQ routing
   - Check error logging

3. **Load Testing**:
   - Batch URL submissions
   - Monitor queue depth
   - Check processing latency

#### Monitoring Points

- SQS queue depth
- Lambda execution times
- Error rates
- DLQ messages
- EventBridge successful invocations

### Example Configuration for Larger Batch Size

If you set the BatchSize to 500, you might increase the MaximumBatchingWindowInSeconds to 10 or 15 seconds to allow more time to gather a full batch.

### AWS CLI Command to Update Event Source Mapping

```sh
aws lambda update-event-source-mapping \
    --uuid ebcd4328-ba31-43b1-a81a-3beca9251161 \
    --batch-size 500 \
    --maximum-batching-window-in-seconds 10
```

Page Title: Weed Dispensary near [city] [state] serving premium cannabis, flower, edibles,
MetaDescription: 155-160 characters.
IntroParagraph:
ContentParagraph:
ConclusionParagraph:
