import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage teachers list for schedule
    Args: event with httpMethod (GET/POST/PUT/DELETE), body, queryStringParameters
          context with request_id
    Returns: HTTP response with teachers data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        if method == 'GET':
            cur.execute("SELECT id, full_name, subject, phone, email, notes FROM t_p1843782_school_schedule_mana.teachers ORDER BY full_name")
            rows = cur.fetchall()
            teachers = []
            for row in rows:
                teachers.append({
                    'id': row[0],
                    'full_name': row[1],
                    'subject': row[2],
                    'phone': row[3],
                    'email': row[4],
                    'notes': row[5]
                })
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'teachers': teachers}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            full_name = body_data.get('full_name', '')
            subject = body_data.get('subject', '')
            phone = body_data.get('phone', '')
            email = body_data.get('email', '')
            notes = body_data.get('notes', '')
            
            cur.execute(
                "INSERT INTO t_p1843782_school_schedule_mana.teachers (full_name, subject, phone, email, notes) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (full_name, subject, phone, email, notes)
            )
            teacher_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'id': teacher_id, 'message': 'Teacher added'}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            teacher_id = body_data.get('id')
            full_name = body_data.get('full_name')
            subject = body_data.get('subject')
            phone = body_data.get('phone')
            email = body_data.get('email')
            notes = body_data.get('notes')
            
            cur.execute(
                "UPDATE t_p1843782_school_schedule_mana.teachers SET full_name=%s, subject=%s, phone=%s, email=%s, notes=%s WHERE id=%s",
                (full_name, subject, phone, email, notes, teacher_id)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Teacher updated'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            teacher_id = params.get('id')
            
            cur.execute("DELETE FROM t_p1843782_school_schedule_mana.teachers WHERE id=%s", (teacher_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Teacher deleted'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
