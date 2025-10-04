import json
import boto3
import datetime
import uuid
import logging
import os
import secrets
from decimal import Decimal

# Force redeployment - updated permissions

# ------------------- SETUP -------------------
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# S3 client
try:
    s3_client = boto3.client('s3')
except Exception as e:
    logger.error(f"Failed to initialize S3 client: {str(e)}")
    raise

# DynamoDB clients
try:
    dynamodb = boto3.resource('dynamodb')
    csrf_table = dynamodb.Table('csrf-tokens')
    transactions_table_name = os.environ.get('DYNAMODB_TABLE_NAME')
    if transactions_table_name:
        transactions_table = dynamodb.Table(transactions_table_name)
    else:
        transactions_table = None
    
    # User profiles table
    user_profiles_table = dynamodb.Table('transaction-monitor-dev-user-profiles')
except Exception as e:
    logger.error(f"Failed to initialize DynamoDB client: {str(e)}")
    csrf_table = None
    transactions_table = None
    user_profiles_table = None

# Cognito client
try:
    cognito_client = boto3.client('cognito-idp')
except Exception as e:
    logger.error(f"Failed to initialize Cognito client: {str(e)}")
    raise

S3_BUCKET = os.environ.get('S3_BUCKET')
PROJECT_NAME = os.environ.get('PROJECT_NAME')
ENVIRONMENT = os.environ.get('ENVIRONMENT')

if not S3_BUCKET or not PROJECT_NAME or not ENVIRONMENT:
    raise ValueError("S3_BUCKET, PROJECT_NAME, and ENVIRONMENT env vars are required")

_cognito_cache = {}
POOL_NAME = f"{PROJECT_NAME}-{ENVIRONMENT}-userpool"

UTC = datetime.timezone.utc
_today_cache = {'date': None, 'str': None}
HIGH_RISK_MERCHANTS = ['casino', 'crypto', 'gambling']

CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://d1n1njxujlyqzf.cloudfront.net',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-CSRF-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
}

# ------------------- HELPERS -------------------
def get_cognito_resources():
    if 'user_pool_id' in _cognito_cache and 'app_client_id' in _cognito_cache:
        return _cognito_cache['user_pool_id'], _cognito_cache['app_client_id']
    user_pool_id = "us-east-1_A0uNY4Q07"
    app_client_id = "6h56ikffem49ph32j830bvj7h"
    _cognito_cache['user_pool_id'] = user_pool_id
    _cognito_cache['app_client_id'] = app_client_id
    return user_pool_id, app_client_id

def log_to_s3(transaction_record):
    transaction_id = transaction_record.get('transaction_id', 'unknown')
    try:
        today = datetime.datetime.now(UTC).date()
        if _today_cache['date'] != today:
            _today_cache['date'] = today
            _today_cache['str'] = str(today)
        key = f"transactions/{_today_cache['str']}/{transaction_id}.json"

        # Convert Decimal to float for JSON serialization
        json_record = {}
        for k, v in transaction_record.items():
            if isinstance(v, Decimal):
                json_record[k] = float(v)
            else:
                json_record[k] = v

        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=json.dumps(json_record),
            ContentType='application/json'
        )
        logger.info(f"Transaction {transaction_id} logged to S3: {key}")
    except Exception as e:
        logger.error(f"Failed to log transaction {transaction_id} to S3: {str(e)}")

def validate_csrf_token(token):
    if not csrf_table or not token:
        return False
    try:
        response = csrf_table.get_item(Key={'token': token})
        if 'Item' not in response:
            return False
        item = response['Item']
        if int(datetime.datetime.utcnow().timestamp()) > item['expires']:
            csrf_table.delete_item(Key={'token': token})
            return False
        return True
    except Exception as e:
        logger.error(f"CSRF validation error: {str(e)}")
        return False

def calculate_risk_score(transaction, amount=None):
    risk_score = 0
    if amount is None:
        try:
            amount = float(transaction.get('amount', 0))
        except (ValueError, TypeError):
            amount = 0
    
    # Convert to USD for consistent risk assessment
    currency = transaction.get('currency', 'USD')
    exchange_rates = {
        'USD': 1.0, 'EUR': 0.92, 'GBP': 0.79, 'GHS': 12.05,
        'JPY': 149.50, 'INR': 83.25, 'NGN': 775.00, 'ZAR': 18.75,
        'KES': 129.50, 'CAD': 1.36
    }
    
    rate = exchange_rates.get(currency, 1.0)
    usd_amount = amount / rate
    
    if usd_amount > 10000:
        risk_score += 50
    elif usd_amount > 5000:
        risk_score += 30
    elif usd_amount > 1000:
        risk_score += 10
    
    merchant = str(transaction.get('merchant', '')).lower()
    if any(risk_word in merchant for risk_word in HIGH_RISK_MERCHANTS):
        risk_score += 40
        logger.debug(f"High-risk merchant detected: {merchant}")
    return min(risk_score, 100)

# ------------------- MAIN HANDLER -------------------
def lambda_handler(event, context):
    path = event.get('path', '')
    method = event.get('httpMethod', '')
    logger.info(f"Lambda triggered. Path: {path}, Method: {method}")

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'message': 'CORS preflight'})}

    try:
        if path.endswith('/transaction'):
            return transaction_handler(event)
        elif path.endswith('/transactions'):
            return get_transactions_handler(event)
        elif path.endswith('/user-profile'):
            if method == 'GET':
                return get_user_profile_handler(event)
            elif method == 'PUT':
                return update_user_profile_handler(event)
        elif path.endswith('/signup'):
            return signup_handler(event)
        elif path.endswith('/login'):
            return login_handler(event)
        elif path.endswith('/csrf-token'):
            return csrf_token_handler(event)
        elif path.endswith('/test'):
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'message': 'API is working!'})}
        else:
            logger.warning(f"No route for path: {path}")
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': f'Path not found: {path}'})}
    except Exception as e:
        logger.error(f"Handler error: {str(e)}", exc_info=True)
        return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Internal server error'})}

# ------------------- ROUTES -------------------
def csrf_token_handler(event):
    try:
        token = secrets.token_urlsafe(32)
        expiration = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        
        if csrf_table:
            csrf_table.put_item(
                Item={
                    'token': token,
                    'expires': int(expiration.timestamp()),
                    'created': int(datetime.datetime.utcnow().timestamp())
                }
            )
        
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'token': token})
        }
    except Exception as e:
        logger.error(f"CSRF token handler error: {str(e)}")
        return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Failed to generate CSRF token'})}

def transaction_handler(event):
    try:
        # CSRF validation temporarily disabled for frontend rebuild
        # csrf_token = event.get('headers', {}).get('X-CSRF-Token') or event.get('headers', {}).get('x-csrf-token')
        # if not validate_csrf_token(csrf_token):
        #     return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Invalid or missing CSRF token'})}
        
        # Validate request body
        if not event.get('body'):
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Request body is required'})}
        
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Invalid JSON format'})}
        
        amount = body.get('amount')
        merchant = body.get('merchant')
        currency = body.get('currency', 'USD')
        
        if amount is None or merchant is None:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Missing required fields: amount and merchant'})}
        
        try:
            amount_float = float(amount)
        except (ValueError, TypeError):
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Amount must be a valid number'})}
        
        if amount_float < 0:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Amount cannot be negative'})}
        
        if amount_float > 10000000:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Amount exceeds maximum limit of 10M'})}
        
        if not merchant or len(str(merchant).strip()) == 0:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Merchant name cannot be empty'})}
        # Extract user_id from JWT token
        auth_header = event.get('headers', {}).get('Authorization', '')
        user_id = 'anonymous'  # Default fallback
        if auth_header.startswith('Bearer '):
            try:
                import base64
                token = auth_header.split(' ')[1]
                # Decode JWT payload (middle part)
                payload = token.split('.')[1]
                # Add padding if needed
                payload += '=' * (4 - len(payload) % 4)
                decoded = json.loads(base64.b64decode(payload))
                user_id = decoded.get('cognito:username', decoded.get('username', 'anonymous'))
            except Exception as e:
                logger.error(f"Failed to decode JWT: {str(e)}")
                user_id = 'anonymous'
        
        risk_score = calculate_risk_score(body, amount_float)
        transaction_record = {
            'transaction_id': str(uuid.uuid4()),
            'user_id': user_id,
            'timestamp': datetime.datetime.now(UTC).isoformat(),
            'amount': Decimal(str(amount_float)),
            'merchant': merchant,
            'currency': currency,
            'risk_score': Decimal(str(risk_score)),
            'status': 'flagged' if risk_score > 70 else 'approved'
        }
        
        # Save to DynamoDB
        if transactions_table:
            try:
                transactions_table.put_item(Item=transaction_record)
                logger.info(f"Transaction {transaction_record['transaction_id']} saved to DynamoDB")
            except Exception as e:
                logger.error(f"Failed to save transaction to DynamoDB: {str(e)}")
        
        # Also log to S3 for backup
        log_to_s3(transaction_record)
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({
            'transaction_id': transaction_record['transaction_id'],
            'risk_score': risk_score,
            'status': transaction_record['status']
        })}
    except json.JSONDecodeError:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Invalid JSON format'})}
    except Exception as e:
        logger.error(f"Transaction handler error: {str(e)}", exc_info=True)
        return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Internal server error'})}

def signup_handler(event):
    try:
        # CSRF validation temporarily disabled for frontend rebuild
        # csrf_token = event.get('headers', {}).get('X-CSRF-Token') or event.get('headers', {}).get('x-csrf-token')
        # if not validate_csrf_token(csrf_token):
        #     return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Invalid or missing CSRF token'})}
        
        # Validate request body
        if not event.get('body'):
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Request body is required'})}
        
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Invalid JSON format'})}
        
        logger.info("Signup request received")
        username = body.get('username')
        password = body.get('password')
        email = body.get('email')
        
        if not username or not password or not email:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Missing required fields: username, password, and email'})}
        
        # Enhanced validation
        if len(str(username).strip()) < 3:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Username must be at least 3 characters'})}
        
        if len(str(password)) < 8:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Password must be at least 8 characters'})}
        
        if '@' not in str(email) or '.' not in str(email):
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Invalid email format'})}
        _, app_client_id = get_cognito_resources()
        response = cognito_client.sign_up(
            ClientId=app_client_id,
            Username=username,
            Password=password,
            UserAttributes=[{'Name': 'email', 'Value': email}]
        )
        user_pool_id, _ = get_cognito_resources()
        cognito_client.admin_confirm_sign_up(UserPoolId=user_pool_id, Username=username)
        logger.info(f"User {username} signed up + confirmed successfully")
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'message': 'User signed up successfully'})}
    except cognito_client.exceptions.UsernameExistsException:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Username already exists'})}
    except cognito_client.exceptions.InvalidPasswordException as e:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Password does not meet requirements'})}
    except json.JSONDecodeError:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Invalid JSON format'})}
    except Exception as e:
        logger.error(f"Signup handler error: {str(e)}", exc_info=True)
        return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Internal server error'})}

def get_transactions_handler(event):
    try:
        # Extract user_id from JWT token
        auth_header = event.get('headers', {}).get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Authorization token required'})}
        
        try:
            import base64
            token = auth_header.split(' ')[1]
            payload = token.split('.')[1]
            payload += '=' * (4 - len(payload) % 4)
            decoded = json.loads(base64.b64decode(payload))
            user_id = decoded.get('cognito:username', decoded.get('username', 'anonymous'))
        except Exception as e:
            logger.error(f"Failed to decode JWT: {str(e)}")
            user_id = 'anonymous'
        
        logger.info(f"Fetching transactions for user_id: {user_id}")
        
        if not transactions_table:
            return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Database not available'})}
        
        # First try to query by user_id using GSI
        try:
            from boto3.dynamodb.conditions import Key
            response = transactions_table.query(
                IndexName='UserTimestampIndex',
                KeyConditionExpression=Key('user_id').eq(user_id),
                ScanIndexForward=False  # Most recent first
            )
            transactions = response.get('Items', [])
            logger.info(f"Found {len(transactions)} transactions for user {user_id}")
        except Exception as query_error:
            logger.error(f"Query failed, falling back to scan: {str(query_error)}")
            # Fallback to scan if query fails
            from boto3.dynamodb.conditions import Attr
            response = transactions_table.scan(
                FilterExpression=Attr('user_id').eq(user_id)
            )
            transactions = response.get('Items', [])
        
        # Convert Decimal to float for JSON serialization
        for transaction in transactions:
            if 'amount' in transaction:
                transaction['amount'] = float(transaction['amount'])
            if 'risk_score' in transaction:
                transaction['risk_score'] = float(transaction['risk_score'])
        
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'transactions': transactions})
        }
    except Exception as e:
        logger.error(f"Get transactions handler error: {str(e)}", exc_info=True)
        return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Internal server error'})}

def get_user_profile_handler(event):
    try:
        auth_header = event.get('headers', {}).get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Authorization token required'})}
        
        try:
            import base64
            token = auth_header.split(' ')[1]
            payload = token.split('.')[1]
            payload += '=' * (4 - len(payload) % 4)
            decoded = json.loads(base64.b64decode(payload))
            user_id = decoded.get('cognito:username', decoded.get('username', 'anonymous'))
        except Exception as e:
            logger.error(f"Failed to decode JWT: {str(e)}")
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Invalid token'})}
        
        if not user_profiles_table:
            return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Database not available'})}
        
        try:
            response = user_profiles_table.get_item(Key={'user_id': user_id})
            if 'Item' in response:
                profile = response['Item']
                # Convert Decimal to float for JSON serialization
                for key, value in profile.items():
                    if isinstance(value, Decimal):
                        profile[key] = float(value)
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'profile': profile})}
            else:
                # Return default profile
                default_profile = {
                    'user_id': user_id,
                    'monthlyBudget': 5000.0,
                    'dailyLimit': 1000.0,
                    'riskTolerance': 'medium',
                    'trustedMerchants': [],
                    'blockedMerchants': [],
                    'customRiskThreshold': 70,
                    'budgetAlerts': True
                }
                return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'profile': default_profile})}
        except Exception as e:
            logger.error(f"Failed to get user profile: {str(e)}")
            return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Failed to retrieve profile'})}
    except Exception as e:
        logger.error(f"Get user profile handler error: {str(e)}", exc_info=True)
        return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Internal server error'})}

def update_user_profile_handler(event):
    try:
        auth_header = event.get('headers', {}).get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Authorization token required'})}
        
        try:
            import base64
            token = auth_header.split(' ')[1]
            payload = token.split('.')[1]
            payload += '=' * (4 - len(payload) % 4)
            decoded = json.loads(base64.b64decode(payload))
            user_id = decoded.get('cognito:username', decoded.get('username', 'anonymous'))
        except Exception as e:
            logger.error(f"Failed to decode JWT: {str(e)}")
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Invalid token'})}
        
        if not event.get('body'):
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Request body is required'})}
        
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Invalid JSON format'})}
        
        profile = body.get('profile', {})
        if not profile:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Profile data is required'})}
        
        # Convert float values to Decimal for DynamoDB
        profile['user_id'] = user_id
        profile['updated_at'] = datetime.datetime.now(UTC).isoformat()
        
        for key, value in profile.items():
            if isinstance(value, float):
                profile[key] = Decimal(str(value))
        
        if not user_profiles_table:
            return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Database not available'})}
        
        try:
            user_profiles_table.put_item(Item=profile)
            logger.info(f"User profile updated for user {user_id}")
            return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'message': 'Profile updated successfully'})}
        except Exception as e:
            logger.error(f"Failed to update user profile: {str(e)}")
            return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Failed to update profile'})}
    except Exception as e:
        logger.error(f"Update user profile handler error: {str(e)}", exc_info=True)
        return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Internal server error'})}

def login_handler(event):
    try:
        # CSRF validation temporarily disabled for frontend rebuild
        # csrf_token = event.get('headers', {}).get('X-CSRF-Token') or event.get('headers', {}).get('x-csrf-token')
        # if not validate_csrf_token(csrf_token):
        #     return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Invalid or missing CSRF token'})}
        
        # Validate request body
        if not event.get('body'):
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Request body is required'})}
        
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Invalid JSON format'})}
        
        username = body.get('username')
        password = body.get('password')
        
        if not username or not password:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Missing required fields: username and password'})}
        
        if len(str(username).strip()) == 0 or len(str(password)) == 0:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Username and password cannot be empty'})}
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
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'message': 'Login successful',
                'access_token': auth_result['AccessToken'],
                'id_token': auth_result['IdToken'],
                'token_type': 'Bearer'
            })
        }
    except cognito_client.exceptions.NotAuthorizedException:
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Incorrect username or password'})}
    except cognito_client.exceptions.UserNotFoundException:
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Incorrect username or password'})}
    except cognito_client.exceptions.UserNotConfirmedException:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'User account not confirmed'})}
    except json.JSONDecodeError:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Invalid JSON format'})}
    except Exception as e:
        logger.error(f"Login handler error: {str(e)}", exc_info=True)
        return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Internal server error'})}