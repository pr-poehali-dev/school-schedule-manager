'''
Business: Upload files to cloud storage and return URLs
Args: event with httpMethod POST and multipart/form-data body with file
Returns: HTTP response with file URL
'''
import json
import base64
import uuid
from typing import Dict, Any
from urllib.parse import quote

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        try:
            body = event.get('body', '')
            is_base64 = event.get('isBase64Encoded', False)
            
            if is_base64:
                body_bytes = base64.b64decode(body)
            else:
                body_bytes = body.encode('utf-8') if isinstance(body, str) else body
            
            content_type = event.get('headers', {}).get('content-type', '')
            
            if 'multipart/form-data' not in content_type.lower():
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Content-Type must be multipart/form-data'}),
                    'isBase64Encoded': False
                }
            
            boundary = content_type.split('boundary=')[-1].strip()
            parts = body_bytes.split(f'--{boundary}'.encode())
            
            file_data = None
            file_name = 'file'
            
            for part in parts:
                if b'Content-Disposition' in part:
                    headers_end = part.find(b'\r\n\r\n')
                    if headers_end == -1:
                        headers_end = part.find(b'\n\n')
                    
                    if headers_end != -1:
                        headers = part[:headers_end].decode('utf-8', errors='ignore')
                        content = part[headers_end + 4:]
                        
                        if b'--' in content[-10:]:
                            content = content.rsplit(b'\r\n', 1)[0]
                        
                        if 'filename=' in headers:
                            filename_start = headers.find('filename="') + 10
                            filename_end = headers.find('"', filename_start)
                            if filename_end > filename_start:
                                file_name = headers[filename_start:filename_end]
                            
                            file_data = content
                            break
            
            if not file_data:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'No file found in request'}),
                    'isBase64Encoded': False
                }
            
            file_id = str(uuid.uuid4())
            file_extension = file_name.split('.')[-1] if '.' in file_name else 'bin'
            stored_name = f"{file_id}.{file_extension}"
            
            file_url = f"https://storage.poehali.dev/files/{quote(stored_name)}"
            
            import boto3
            import os
            
            s3_endpoint = os.environ.get('S3_ENDPOINT', 'https://storage.yandexcloud.net')
            s3_bucket = os.environ.get('S3_BUCKET', 'poehali-files')
            s3_access_key = os.environ.get('S3_ACCESS_KEY')
            s3_secret_key = os.environ.get('S3_SECRET_KEY')
            
            if not s3_access_key or not s3_secret_key:
                file_url = f"data:application/octet-stream;base64,{base64.b64encode(file_data).decode()}"
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'url': file_url,
                        'filename': file_name,
                        'size': len(file_data)
                    }),
                    'isBase64Encoded': False
                }
            
            s3 = boto3.client(
                's3',
                endpoint_url=s3_endpoint,
                aws_access_key_id=s3_access_key,
                aws_secret_access_key=s3_secret_key
            )
            
            s3.put_object(
                Bucket=s3_bucket,
                Key=f'homework-files/{stored_name}',
                Body=file_data,
                ContentType='application/octet-stream'
            )
            
            file_url = f"{s3_endpoint}/{s3_bucket}/homework-files/{quote(stored_name)}"
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'url': file_url,
                    'filename': file_name,
                    'size': len(file_data)
                }),
                'isBase64Encoded': False
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': str(e)}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
