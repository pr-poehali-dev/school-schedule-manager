'''
Business: Manage students - create, read, update, delete
Args: event with httpMethod, body with student data
Returns: HTTP response with student data or list of students
'''
import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    if method == 'GET':
        cur.execute("""
            SELECT u.id, u.login, u.full_name, s.class_name, s.parent_contact, s.notes
            FROM users u
            LEFT JOIN students s ON u.id = s.user_id
            WHERE u.role = 'student'
            ORDER BY u.full_name
        """)
        students = cur.fetchall()
        
        result = []
        for student in students:
            result.append({
                'id': student[0],
                'login': student[1],
                'full_name': student[2],
                'class_name': student[3] or '',
                'parent_contact': student[4] or '',
                'notes': student[5] or ''
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result),
            'isBase64Encoded': False
        }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        login = body_data.get('login', '')
        password = body_data.get('password', '')
        full_name = body_data.get('full_name', '')
        class_name = body_data.get('class_name', '')
        parent_contact = body_data.get('parent_contact', '')
        notes = body_data.get('notes', '')
        
        cur.execute(
            "INSERT INTO users (login, password, role, full_name) VALUES (%s, %s, 'student', %s) RETURNING id",
            (login, password, full_name)
        )
        user_id = cur.fetchone()[0]
        
        cur.execute(
            "INSERT INTO students (user_id, class_name, parent_contact, notes) VALUES (%s, %s, %s, %s)",
            (user_id, class_name, parent_contact, notes)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'id': user_id, 'message': 'Student created'}),
            'isBase64Encoded': False
        }
    
    elif method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        user_id = body_data.get('id')
        password = body_data.get('password')
        full_name = body_data.get('full_name')
        class_name = body_data.get('class_name', '')
        parent_contact = body_data.get('parent_contact', '')
        notes = body_data.get('notes', '')
        
        if password:
            cur.execute(
                "UPDATE users SET full_name = %s, password = %s WHERE id = %s",
                (full_name, password, user_id)
            )
        else:
            cur.execute(
                "UPDATE users SET full_name = %s WHERE id = %s",
                (full_name, user_id)
            )
        
        cur.execute(
            "UPDATE students SET class_name = %s, parent_contact = %s, notes = %s WHERE user_id = %s",
            (class_name, parent_contact, notes, user_id)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'Student updated'}),
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
