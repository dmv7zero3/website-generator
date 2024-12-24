# Google Business Profile Photo Upload System

## Overview

This system enables automatic photo uploads to Google Business Profile for multiple store locations. It uses a serverless architecture on AWS, implementing a secure and scalable solution for managing business photos.

## Architecture

### Components

1. **Frontend Application**

   - React-based dashboard
   - Drag-and-drop photo upload interface
   - Progress tracking
   - Store location selector

2. **AWS Services**
   - **S3 Bucket**: `street-lawyer-services`
     - Base path: `local-seo-photos/`
     - Folder structure:
       ```
       local-seo-photos/
       ├── uploads/          # Initial uploads
       ├── processed/        # Processed photos
       └── archived/         # Successfully uploaded photos
       ```
   - **Lambda Functions**
   - **API Gateway**
   - **DynamoDB** (optional, for status tracking)

### Lambda Functions

1. **presigned-url-generator**

   - **Purpose**: Generate secure S3 upload URLs
   - **Trigger**: API Gateway endpoint
   - **Input**:
     ```json
     {
       "storeId": "dc|towson",
       "files": [
         {
           "name": "storefront.jpg",
           "contentType": "image/jpeg",
           "size": 1024000
         }
       ]
     }
     ```
   - **Output**:
     ```json
     {
       "urls": [
         {
           "fileName": "storefront.jpg",
           "uploadUrl": "https://...",
           "key": "local-seo-photos/uploads/dc/..."
         }
       ]
     }
     ```

2. **photo-processor**

   - **Purpose**: Process and validate uploaded photos
   - **Trigger**: S3 upload completion
   - **Actions**:
     - Validate image format and size
     - Optimize for Google Business Profile
     - Move to processed folder
     - Trigger google-business-uploader

3. **google-business-uploader**
   - **Purpose**: Upload photos to Google Business Profile
   - **Trigger**: Photo processor completion
   - **Actions**:
     - Authenticate with Google API
     - Upload photos
     - Archive successful uploads
     - Update status tracking

## Store Locations

| Store ID | Name                  | Location       | Google Business ID                                                                                                       |
| -------- | --------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| dc       | SLS Dispensary DC     | Washington, DC | [Profile Link](https://www.google.com/maps/place/SLS+DC+Weed+Dispensary/@38.9000446,-77.0027354,17z)                     |
| towson   | SLS Dispensary Towson | Towson, MD     | [Profile Link](https://www.google.com/maps/place/Street+Lawyer+Services+-+Baltimore+Location/@39.288204,-76.6150084,17z) |

## Implementation Flow

1. **Frontend Upload Initiation**

   ```mermaid
   sequenceDiagram
       Frontend->>API Gateway: Request upload URLs
       API Gateway->>presigned-url-generator: Generate URLs
       presigned-url-generator->>Frontend: Return presigned URLs
       Frontend->>S3: Upload files directly
   ```

2. **Photo Processing**

   ```mermaid
   sequenceDiagram
       S3->>photo-processor: Upload complete
       photo-processor->>S3: Save processed photo
       photo-processor->>google-business-uploader: Trigger upload
   ```

3. **Google Upload**
   ```mermaid
   sequenceDiagram
       google-business-uploader->>Google API: Upload photo
       Google API->>google-business-uploader: Confirm upload
       google-business-uploader->>S3: Move to archived
   ```

## Security

### S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Id": "PolicyForCloudFrontPrivateContent",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalE34BHBYCWQMYEU",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::street-lawyer-services/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::752567131183:distribution/E34BHBYCWQMYEU"
        }
      }
    },
    {
      "Sid": "AllowCloudFrontServicePrincipalE17AMT08F85Y5T",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::street-lawyer-services/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::752567131183:distribution/E17AMT08F85Y5T"
        }
      }
    }
  ]
}
```

### Required IAM Permissions

- S3 access for uploads and processing
- Google API credentials access
- CloudWatch Logs access

## API Endpoints

### Upload URL Generation

```
POST /api/photos/generate-upload-url
```

### Upload Status Check

```
GET /api/photos/status/{uploadId}
```

## Error Handling

1. **Upload Validation**

   - Maximum file size: 5MB
   - Allowed formats: JPG, PNG, GIF
   - Minimum dimensions: 250x250

2. **Processing Errors**

   - Invalid format
   - Corruption detection
   - Size constraints

3. **Google API Errors**
   - Rate limiting
   - Authentication failures
   - Invalid location IDs

## Monitoring

- CloudWatch Logs for all Lambda functions
- S3 event notifications
- Optional DynamoDB status tracking

## Maintenance

### Cleanup Tasks

- Archive processed photos after 30 days
- Remove failed uploads after 7 days
- Monitor S3 storage usage

### Monitoring

- Set up CloudWatch alarms for:
  - Upload failures
  - Processing errors
  - Google API rate limits
  - S3 storage thresholds

## Support

For technical support, contact:

- Development Team: dev@marketbrewer.com
- AWS Support: Reference account 752567131183

aws sqs set-queue-attributes \
 --queue-url https://sqs.us-east-1.amazonaws.com/752567131183/LocalSEOMediaQueue \
 --attributes '{
"RedrivePolicy": "{\"deadLetterTargetArn\":\"arn:aws:sqs:us-east-1:752567131183:LocalSEOMediaQueue-DLQ\",\"maxReceiveCount\":3}"
}'
