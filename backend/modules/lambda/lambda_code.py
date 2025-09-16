import json
import boto3
import datetime
import uuid
import logging
import os

# ------------------- SETUP -------------------
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# S3 client
try:
    s3_client = boto3.client('s3')
except Exception as e:
    logger.error(f"Failed to initialize S3 client: {str(e)}")
    raise

S3_BUCKET = os.environ.get('S3_BUCKET')
PROJECT_NAME = os.environ.get('PROJECT_NAME')
ENVIRONMENT = os.environ.get('ENVIRONMENT')

if not S3_BUCKET or not PROJECT_NAME or not ENVIRONMENT:
    raise ValueError("S3_BUCKET, PROJECT_NAME, and ENVIRONMENT environment variables are required")

# Cognito client
try:
    cognito_client = boto3.client('cognito-idp')
except Exception as e:
    logger.error(f"Failed to initialize Cognito client: {str(e)}")
    raise

# Cached Cognito resources
_cognito_cache = {}
POOL_NAME = f"{PROJECT_NAME}-{ENVIRONMENT}-userpool"

# Timezone and date cache for S3
UTC = datetime.timezone.utc
_today_cache = {'date': None, 'str': None}

# High-risk merchants
HIGH_RISK_MERCHANTS = ['casino', 'crypto', 'gambling']

# Common CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
}

# ------------------- COGNITO HELPERS -------------------
def get_cognito_resources():
    if 'user_pool_id' in _cognito_cache and 'app_client_id' in _cognito_cache:
        return _cognito_cache['user_pool_id'], _cognito_cache['app_client_id']
    
    try:
        pools = cognito_client.list_user_pools(MaxResults=50)['UserPools']
        user_pool_id = next((pool['Id'] for pool in pools if pool['Name'] == POOL_NAME), None)
        if not user_pool_id:
            raise ValueError(f"User pool {POOL_NAME} not found")

        clients = cognito_client.list_user_pool_clients(UserPoolId=user_pool_id, MaxResults=1)['UserPoolClients']
        if not clients:
            raise ValueError(f"No clients found for pool {user_pool_id}")
        app_client_id = clients[0]['ClientId']

        _cognito_cache['user_pool_id'] = user_pool_id
        _cognito_cache['app_client_id'] = app_client_id
        return user_pool_id, app_client_id
    except Exception as e:
        logger.error(f"Failed to get Cognito resources: {str(e)}")
        raise

# ------------------- S3 LOGGING -------------------
def log_to_s3(transaction_record):
    transaction_id = transaction_record.get('transaction_id', 'unknown')
    try:
        today = datetime.datetime.now(UTC).date()
        if _today_cache['date'] != today:
            _today_cache['date'] = today
            _today_cache['str'] = str(today)
        key = f"transactions/{_today_cache['str']}/{transaction_id}.json"

        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=json.dumps(transaction_record),
            ContentType='application/json'
        )
        logger.info(f"Transaction {transaction_id} logged to S3: {key}")
    except Exception as e:
        logger.error(f"Failed to log transaction {transaction_id} to S3: {str(e)}")

# ------------------- RISK CALCULATION -------------------
def calculate_risk_score(transaction, amount=None):
    risk_score = 0
    if amount is None:
        try:
            amount = float(transaction.get('amount', 0))
        except (ValueError, TypeError):
            amount = 0

    if amount > 10000:
        risk_score += 50
    elif amount > 5000:
        risk_score += 30
    elif amount > 1000:
        risk_score += 10

    merchant = str(transaction.get('merchant', '')).lower()
    if any(risk_word in merchant for risk_word in HIGH_RISK_MERCHANTS):
        risk_score += 40
        logger.debug(f"High-risk merchant detected: {merchant}")

    return min(risk_score, 100)

# ------------------- MAIN LAMBDA HANDLER -------------------
def lambda_handler(event, context):
    path = event.get('path', '')
    method = event.get('httpMethod', '')

    logger.debug(f"Lambda triggered. Path: {path}, Method: {method}")

    # CORS preflight
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'message': 'CORS preflight'})}

    try:
        if path == '/transaction':
            return transaction_handler(event)
        elif path == '/signup':
            return signup_handler(event)
        elif path == '/login':
            return login_handler(event)
    except Exception as e:
        logger.error(f"Handler error: {str(e)}")
        return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Internal server error'})}
    else:
        return {
            'statusCode': 404,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Path not found'})
        }

# ------------------- TRANSACTION HANDLER -------------------
def transaction_handler(event):
    cors_headers = CORS_HEADERS
    try:
        body = json.loads(event.get('body', '{}'))
        amount = body.get('amount')
        merchant = body.get('merchant')
        currency = body.get('currency', 'USD')

        if amount is None or merchant is None:
            return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'Missing required fields'})}

        try:
            amount_float = float(amount)
        except (ValueError, TypeError):
            return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'Invalid amount format'})}

        risk_score = calculate_risk_score(body, amount_float)

        transaction_record = {
            'transaction_id': str(uuid.uuid4()),
            'timestamp': datetime.datetime.now(UTC).isoformat(),
            'amount': amount_float,
            'merchant': merchant,
            'currency': currency,
            'risk_score': risk_score,
            'status': 'flagged' if risk_score > 70 else 'approved'
        }

        log_to_s3(transaction_record)

        return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({
            'transaction_id': transaction_record['transaction_id'],
            'risk_score': risk_score,
            'status': transaction_record['status']
        })}

    except json.JSONDecodeError:
        return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'Invalid JSON'})}
    except Exception as e:
        logger.error(f"Transaction handler error: {str(e)}")
        return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': 'Internal server error'})}

# ------------------- SIGNUP HANDLER -------------------
def signup_handler(event):
    cors_headers = CORS_HEADERS
    try:
        body = json.loads(event.get('body', '{}'))
        username = body.get('username')
        password = body.get('password')
        email = body.get('email')

        if not username or not password or not email:
            return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'Missing required fields'})}

        _, app_client_id = get_cognito_resources()

        response = cognito_client.sign_up(
            ClientId=app_client_id,
            Username=username,
            Password=password,
            UserAttributes=[{'Name': 'email', 'Value': email}]
        )

        logger.info(f"User {username} signed up successfully. UserSub: {response['UserSub']}")
        return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'message': 'User signed up', 'user_sub': response['UserSub']})}

    except json.JSONDecodeError:
        return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'Invalid JSON'})}
    except cognito_client.exceptions.UsernameExistsException:
        return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'Username already exists'})}
    except Exception as e:
        logger.error(f"Signup handler error: {str(e)}")
        return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': 'Internal server error'})}

# ------------------- LOGIN HANDLER -------------------
def login_handler(event):
    cors_headers = CORS_HEADERS
    try:
        body = json.loads(event.get('body', '{}'))
        username = body.get('username')
        password = body.get('password')

        if not username or not password:
            return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'Missing required fields'})}

        _, app_client_id = get_cognito_resources()

        response = cognito_client.initiate_auth(
            ClientId=app_client_id,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={'USERNAME': username, 'PASSWORD': password}
        )

        auth_result = response['AuthenticationResult']
        logger.info(f"User {username} logged in successfully")
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'message': 'Login successful',
                'access_token': auth_result['AccessToken'],
                'id_token': auth_result['IdToken'],
                'token_type': 'Bearer'
            })
        }

    except json.JSONDecodeError:
        return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'Invalid JSON'})}
    except cognito_client.exceptions.NotAuthorizedException:
        return {'statusCode': 401, 'headers': cors_headers, 'body': json.dumps({'error': 'Incorrect username or password'})}
    except cognito_client.exceptions.UserNotFoundException:
        return {'statusCode': 404, 'headers': cors_headers, 'body': json.dumps({'error': 'User not found'})}
    except Exception as e:
        logger.error(f"Login handler error: {str(e)}")
        return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': 'Internal server error'})}
