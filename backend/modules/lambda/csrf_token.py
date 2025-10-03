import json
import secrets
import boto3
from datetime import datetime, timedelta

# DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('csrf-tokens')

def lambda_handler(event, context):
    try:
        # Generate CSRF token
        token = secrets.token_urlsafe(32)
        
        # Store token with expiration (1 hour)
        expiration = datetime.utcnow() + timedelta(hours=1)
        
        table.put_item(
            Item={
                'token': token,
                'expires': int(expiration.timestamp()),
                'created': int(datetime.utcnow().timestamp())
            }
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-CSRF-Token',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'token': token
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }