'''
arn:aws:lambda:us-east-1:752567131183:function:local-seo-save-photos-to-s3
API Gateway: street-lawyer-services
arn:aws:execute-api:us-east-1:752567131183:x4iemzhvq5/*/POST/local-seo-save-photos-to-s3
API endpoint: https://x4iemzhvq5.execute-api.us-east-1.amazonaws.com/PROD/local-seo-save-photos-to-s3
'''

import json
import boto3
import base64
import uuid
from datetime import datetime
from botocore.exceptions import ClientError
import time

# Initialize AWS clients
s3 = boto3.client('s3')
sqs = boto3.client('sqs')
dynamodb = boto3.client('dynamodb')

# Constants
BUCKET_NAME = "street-lawyer-services"
BASE_PATH = "local-seo-photos/uploads"
QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/752567131183/LocalSEOMediaQueue"
DYNAMODB_TABLE = "localseo-photos"
MAX_RETRIES = 3
RETRY_DELAY = 2  # Initial retry delay in seconds

def log_error(message, error):
    print(f"{message}: {str(error)}")

def retry(func):
    def wrapper(*args, **kwargs):
        retries = 0
        while retries < MAX_RETRIES:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                retries += 1
                log_error(f"Error in {func.__name__}, retrying {retries}/{MAX_RETRIES}", e)
                if retries == MAX_RETRIES:
                    raise e
                time.sleep(RETRY_DELAY * retries)
    return wrapper

def generate_file_key(store_id, file_name):
    return f"{BASE_PATH}/{store_id}/{uuid.uuid4()}-{file_name}"

def decode_file_content(file_content):
    return base64.b64decode(file_content)

@retry
def upload_to_s3(file_key, decoded_file, content_type):
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=file_key,
        Body=decoded_file,
        ContentType=content_type
    )
    print(f"File saved successfully to S3 bucket: {BUCKET_NAME}, key: {file_key}")

@retry
def create_dynamodb_record(store_id, file_name, file_key):
    timestamp = datetime.now().isoformat()
    
    # Check if the record already exists
    response = dynamodb.query(
        TableName=DYNAMODB_TABLE,
        KeyConditionExpression='PK = :pk AND begins_with(SK, :sk_prefix)',
        ExpressionAttributeValues={
            ':pk': {'S': f"{store_id}#PHOTO"},
            ':sk_prefix': {'S': f"PENDING#"},
            ':fileName': {'S': file_name}
        },
        FilterExpression='fileName = :fileName'
    )
    
    if response.get('Items'):
        print(f"Record already exists for {file_name}")
        return timestamp

    # Create a new record if it doesn't exist
    dynamodb.put_item(
        TableName=DYNAMODB_TABLE,
        Item={
            'PK': {'S': f"{store_id}#PHOTO"},
            'SK': {'S': f"PENDING#{timestamp}#{file_name}"},
            'fileName': {'S': file_name},
            'fileKey': {'S': file_key},
            'uploadTimestamp': {'S': timestamp},
            'status': {'S': 'PENDING'}
        }
    )
    print(f"DynamoDB record created for {file_name}")
    return timestamp

@retry
def send_message_to_sqs(file_key, file_name, store_id, content_type, timestamp):
    message_body = {
        "fileKey": file_key,
        "fileName": file_name,
        "storeId": store_id,
        "contentType": content_type,
        "uploadedAt": timestamp
    }
    
    sqs_response = sqs.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=json.dumps(message_body),
        MessageAttributes={
            'storeId': {
                'DataType': 'String',
                'StringValue': store_id
            }
        }
    )
    print(f"Message sent to SQS successfully: {sqs_response['MessageId']}")

def save_photo_to_s3(file_name, file_content, content_type, store_id):
    """Save the photo to the correct folder in S3 and create a DynamoDB record."""
    try:
        print(f"Starting save_photo_to_s3: fileName={file_name}, storeId={store_id}, contentType={content_type}")
        
        file_key = generate_file_key(store_id, file_name)
        print(f"Generated fileKey: {file_key}")

        if not file_key:
            raise ValueError("Generated fileKey is empty or invalid.")
        
        decoded_file = decode_file_content(file_content)
        print(f"Decoded file content successfully for {file_name}")

        upload_to_s3(file_key, decoded_file, content_type)
        timestamp = create_dynamodb_record(store_id, file_name, file_key)
        send_message_to_sqs(file_key, file_name, store_id, content_type, timestamp)

        return file_key
        
    except Exception as e:
        log_error("Error in save_photo_to_s3", e)
        raise e

def lambda_handler(event, context):
    """Lambda handler for saving photos to S3."""
    try:
        print(f"Lambda invoked with event: {json.dumps(event)}")

        # Parse the request body
        file_name = event.get("fileName")
        file_content = event.get("fileContent")  # Expecting base64-encoded content
        content_type = event.get("contentType")
        store_id = event.get("storeId")

        print(f"file_name: {file_name}")

        # Validate inputs
        if not all([file_name, file_content, content_type, store_id]):
            print(f"Missing parameters: fileName={file_name}, fileContent={'present' if file_content else 'missing'}, contentType={content_type}, storeId={store_id}")
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing required parameters"})
            }

        print("All required parameters present. Proceeding with S3 save.")

        # Save the photo to S3 and queue the media upload
        file_key = save_photo_to_s3(file_name, file_content, content_type, store_id)

        # Return success response
        print(f"File successfully uploaded to S3 with key: {file_key}")
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "File uploaded successfully",
                "fileKey": file_key
            }),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }

    except Exception as e:
        log_error("Error in lambda_handler", e)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }