# arn:aws:lambda:us-east-1:752567131183:function:local-seo-google-business-upload-corrected
# SQS Trigger Lambda
# SQS: LocalSEOMediaQueue
# arn:aws:sqs:us-east-1:752567131183:LocalSEOMediaQueue
import json
import boto3
import os
import time
import logging
from google.oauth2 import service_account
import google.auth.transport.requests
from botocore.exceptions import ClientError
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Constants
BUCKET_NAME = "street-lawyer-services"
PROCESSED_FOLDER = "local-seo-photos/processed"
ERRORS_FOLDER = "local-seo-photos/errors"
QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/752567131183/LocalSEOMediaQueue"
GBP_API_BASE = "https://mybusiness.googleapis.com/v4"
GBP_SERVICE_ACCOUNT_KEY = 'sls_gbp_key.json'
MAX_RETRIES = 3
RETRY_DELAY = 2  # Initial retry delay in seconds
UPLOAD_TIMEOUT = 30  # Timeout for upload requests in seconds

# Image validation constants
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MIN_IMAGE_SIZE = 10 * 1024  # 10KB
VALID_CONTENT_TYPES = ['image/jpeg', 'image/png']

# Location Configurations
LOCATION_CONFIG = {
    "dc": os.environ['DC_GOOGLE_ID'],
    "towson": os.environ['TOWSON_GOOGLE_ID']
}

aws_clients = {
    "s3": boto3.client("s3"),
    "sqs": boto3.client("sqs"),
    "dynamodb": boto3.client("dynamodb")
}

class MediaCategory:
    """Valid Google Business Profile media categories"""
    UNSPECIFIED = "CATEGORY_UNSPECIFIED"
    COVER = "COVER"
    PROFILE = "PROFILE"
    LOGO = "LOGO"
    EXTERIOR = "EXTERIOR"
    INTERIOR = "INTERIOR"
    PRODUCT = "PRODUCT"
    AT_WORK = "AT_WORK"
    FOOD_AND_DRINK = "FOOD_AND_DRINK"
    MENU = "MENU"
    COMMON_AREA = "COMMON_AREA"
    ROOMS = "ROOMS"
    TEAMS = "TEAMS"
    ADDITIONAL = "ADDITIONAL"

def log_with_context(message, context=None, level="info", error=None, request_id=None):
    """Enhanced structured logging with context and error details"""
    log_data = {
        "message": message,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "context": context or {},
        "error": {
            "message": str(error) if error else None,
            "type": error.__class__.__name__ if error else None
        },
        "request_id": request_id
    }
    
    if level == "error":
        logger.error(json.dumps(log_data))
    else:
        logger.info(json.dumps(log_data))

def validate_image(file_content, content_type):
    """Validate image size and content type"""
    if content_type not in VALID_CONTENT_TYPES:
        raise ValueError(f"Invalid content type: {content_type}")
    
    file_size = len(file_content)
    if file_size > MAX_IMAGE_SIZE:
        raise ValueError(f"File too large: {file_size} bytes (max {MAX_IMAGE_SIZE} bytes)")
    if file_size < MIN_IMAGE_SIZE:
        raise ValueError(f"File too small: {file_size} bytes (min {MIN_IMAGE_SIZE} bytes)")

def get_authenticated_session():
    """Get authenticated session with retry logic"""
    retry_count = 0
    retry_delay = RETRY_DELAY
    
    while retry_count < MAX_RETRIES:
        try:
            log_with_context(f"Authentication attempt {retry_count + 1}/{MAX_RETRIES}")
            credentials = service_account.Credentials.from_service_account_file(
                GBP_SERVICE_ACCOUNT_KEY,
                scopes=['https://www.googleapis.com/auth/business.manage']
            )
            session = google.auth.transport.requests.AuthorizedSession(credentials)
            log_with_context("Authentication successful")
            return session
            
        except Exception as e:
            retry_count += 1
            if retry_count == MAX_RETRIES:
                log_with_context(
                    "Authentication failed after max retries",
                    level="error",
                    error=e
                )
                raise
            time.sleep(retry_delay)
            retry_delay *= 2

def retry_with_backoff(func, *args, **kwargs):
    """Retry function with exponential backoff"""
    retry_count = 0
    retry_delay = RETRY_DELAY
    
    while retry_count < MAX_RETRIES:
        try:
            return func(*args, **kwargs)
        except ClientError as e:
            retry_count += 1
            if retry_count == MAX_RETRIES:
                raise
            time.sleep(retry_delay)
            retry_delay *= 2

def update_dynamodb_record(store_id, file_name, status, result=None, error=None):
    """Update existing DynamoDB record with the upload status and results"""
    timestamp = datetime.now().isoformat()
    
    # First, query to find the existing record
    response = aws_clients["dynamodb"].query(
        TableName='localseo-photos',
        KeyConditionExpression='PK = :pk AND begins_with(SK, :sk_prefix)',
        ExpressionAttributeValues={
            ':pk': {'S': f"{store_id}#PHOTO"},
            ':sk_prefix': {'S': f"PENDING#"},
            ':fileName': {'S': file_name}
        },
        FilterExpression='fileName = :fileName'
    )

    # Debug print statement for DynamoDB query response
    print(f"DynamoDB query response: {response}")
    log_with_context("DynamoDB query response", {"response": response})

    if not response.get('Items'):
        log_with_context(f"No existing record found for {file_name}")
        return

    existing_record = response['Items'][0]
    original_sk = existing_record['SK']['S']

    # Update the SK to reflect the new status
    new_sk = original_sk.replace("PENDING", status)
    print(f"New SK: {new_sk}")

    # Delete the existing record
    delete_response = retry_with_backoff(
        aws_clients["dynamodb"].delete_item,
        TableName='localseo-photos',
        Key={
            'PK': {'S': f"{store_id}#PHOTO"},
            'SK': {'S': original_sk}
        }
    )
    print(f"DynamoDB delete response: {delete_response}")
    log_with_context("DynamoDB delete response", {"response": delete_response})

    # Prepare the new item with the updated SK
    new_item = {
        'PK': {'S': f"{store_id}#PHOTO"},
        'SK': {'S': new_sk},
        'fileName': {'S': file_name},
        'status': {'S': status},
        'completedAt': {'S': timestamp}
    }

    if result:
        new_item['result'] = {'S': json.dumps(result)}

    if error:
        new_item['error'] = {'S': str(error)}

    # Put the new item
    put_response = retry_with_backoff(
        aws_clients["dynamodb"].put_item,
        TableName='localseo-photos',
        Item=new_item
    )
    print(f"DynamoDB put response: {put_response}")
    log_with_context("DynamoDB put response", {"response": put_response})

    log_with_context(f"DynamoDB record updated for {file_name}", {
        "store_id": store_id,
        "file_name": file_name,
        "status": status,
        "new_sk": new_sk
    })

def upload_photo_to_gbp(file_key, file_name, store_id, content_type):
    """Upload photo to Google Business Profile with enhanced error handling"""
    try:
        log_context = {
            "file_key": file_key,
            "file_name": file_name,
            "store_id": store_id,
            "content_type": content_type
        }
        log_with_context("Starting photo upload to GBP", log_context)
        
        session = get_authenticated_session()
        location_id = LOCATION_CONFIG.get(store_id)
        
        if not location_id:
            raise ValueError(f"Invalid store ID: {store_id}")
        
        # Generate the public URL for the S3 object
        public_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{file_key}"
        log_with_context("Generated public URL", {"url": public_url})

        # Create media item using the public URL
        create_url = f"{GBP_API_BASE}/accounts/106507314990610040138/locations/{location_id}/media"
        
        create_payload = {
            "mediaFormat": "PHOTO",
            "locationAssociation": {
                "category": MediaCategory.PRODUCT
            },
            "sourceUrl": public_url,
            "description": f"Store photo - {file_name}"
        }
        
        create_response = session.post(
            create_url,
            headers={'Content-Type': 'application/json'},
            json=create_payload
        )
        
        log_with_context("Received media creation response", {
            "status_code": create_response.status_code,
            "response_text": create_response.text
        })
        
        create_response.raise_for_status()
        
        return {
            'success': True,
            'file_name': file_name,
            'response': create_response.json()
        }

    except Exception as e:
        log_with_context(
            "Photo upload failed",
            context=log_context,
            level="error",
            error=e
        )
        raise

def process_message(message, request_id):
    """Process SQS message with enhanced error handling and update DynamoDB"""
    message_id = message.get('messageId')
    log_with_context("Processing message", {"message_id": message_id}, request_id=request_id)
    
    try:
        # Parse and validate message body
        body = json.loads(message['body']) if isinstance(message.get('body'), str) else message['body']
        
        required_fields = ['fileKey', 'fileName', 'storeId', 'contentType']
        missing_fields = [field for field in required_fields if field not in body]
        if missing_fields:
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

        # Upload photo and process result
        result = upload_photo_to_gbp(
            body['fileKey'],
            body['fileName'],
            body['storeId'],
            body['contentType']
        )

        # Debug print statement for result
        print(f"Upload result: {result}")
        log_with_context("Upload result", {"result": result}, request_id=request_id)

        # Move file to processed folder after successful upload
        new_key = body['fileKey'].replace("local-seo-photos/uploads", PROCESSED_FOLDER)
        retry_with_backoff(
            aws_clients["s3"].copy_object,
            Bucket=BUCKET_NAME,
            CopySource={'Bucket': BUCKET_NAME, 'Key': body['fileKey']},
            Key=new_key
        )
        retry_with_backoff(
            aws_clients["s3"].delete_object,
            Bucket=BUCKET_NAME,
            Key=body['fileKey']
        )
        # Log successful S3 photo movement
        log_with_context("File moved to processed folder", {"new_key": new_key}, request_id=request_id)

        # Update DynamoDB record with success status
        update_dynamodb_record(body['storeId'], body['fileName'], 'COMPLETED', result=result)
        # Debug print statement for DynamoDB update
        print(f"DynamoDB update result: {result}")
        log_with_context("DynamoDB update result", {"result": result}, request_id=request_id)

        # Delete message after successful processing
        receipt_handle = message.get('receiptHandle')
        if not receipt_handle:
            raise KeyError('receiptHandle')
        
        aws_clients["sqs"].delete_message(
            QueueUrl=QUEUE_URL,
            ReceiptHandle=receipt_handle
        )
        # Log successful SQS message deletion
        log_with_context("SQS message deleted", {"receipt_handle": receipt_handle}, request_id=request_id)
        
        log_with_context("Message processed successfully", {
            "message_id": message_id,
            "result": result
        }, request_id=request_id)
        
        return result

    except Exception as e:
        # Update DynamoDB record with error status
        update_dynamodb_record(body['storeId'], body['fileName'], 'FAILED', error=e)

        # Move file to errors folder
        error_key = body['fileKey'].replace("local-seo-photos/uploads", ERRORS_FOLDER)
        retry_with_backoff(
            aws_clients["s3"].copy_object,
            Bucket=BUCKET_NAME,
            CopySource={'Bucket': BUCKET_NAME, 'Key': body['fileKey']},
            Key=error_key
        )
        retry_with_backoff(
            aws_clients["s3"].delete_object,
            Bucket=BUCKET_NAME,
            Key=body['fileKey']
        )
        # Log file movement to errors folder
        log_with_context("File moved to errors folder", {"error_key": error_key}, request_id=request_id)

        log_with_context(
            "Message processing failed",
            context={"message_id": message_id},
            level="error",
            error=e,
            request_id=request_id
        )
        raise

def lambda_handler(event, context):
    """Main Lambda handler with comprehensive error handling"""
    print(event)
    
    start_time = time.time()
    request_id = context.aws_request_id
    
    log_with_context("Lambda invocation started", {
        "record_count": len(event.get('Records', [])),
        "request_id": request_id
    }, request_id=request_id)
    
    try:
        results = []
        failed_messages = []
        
        for record in event.get('Records', []):
            try:
                result = process_message(record, request_id)
                results.append(result)
            except Exception as e:
                failed_messages.append({
                    'messageId': record.get('messageId'),
                    'error': str(e),
                    'errorType': e.__class__.__name__
                })

        execution_time = time.time() - start_time
        log_with_context("Lambda execution completed", {
            "request_id": request_id,
            "execution_time": execution_time,
            "processed_count": len(results),
            "failed_count": len(failed_messages)
        }, request_id=request_id)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed': len(results),
                'failed': len(failed_messages),
                'results': results,
                'failures': failed_messages,
                'executionTime': execution_time
            })
        }

    except Exception as e:
        log_with_context(
            "Lambda execution failed",
            context={"request_id": request_id},
            level="error",
            error=e,
            request_id=request_id
        )
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'errorType': e.__class__.__name__
            })
        }