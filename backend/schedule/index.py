'''
Business: Manage schedule - CRUD operations and week duplication
Args: event with httpMethod, body with schedule data
Returns: HTTP response with schedule data
'''
import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters') or {}
    
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
        week_number = query_params.get('week', '1')
        
        cur.execute("""
            SELECT s.id, s.day_name, s.lesson_number, s.subject, s.time_start, s.time_end,
                   s.teacher, s.homework, s.notes, s.week_number, s.homework_files
            FROM schedule s
            WHERE s.week_number = %s
            ORDER BY s.lesson_number
        """, (week_number,))
        
        lessons = cur.fetchall()
        
        result = []
        for lesson in lessons:
            result.append({
                'id': lesson[0],
                'day_name': lesson[1],
                'lesson_number': lesson[2],
                'subject': lesson[3],
                'time_start': lesson[4],
                'time_end': lesson[5],
                'teacher': lesson[6],
                'homework': lesson[7] or '',
                'notes': lesson[8] or '',
                'week_number': lesson[9],
                'homework_files': lesson[10] or ''
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
        
        action = body_data.get('action')
        
        if action == 'duplicate_week':
            source_week = body_data.get('source_week', 1)
            target_week = body_data.get('target_week', 2)
            
            cur.execute("""
                INSERT INTO schedule (day_name, lesson_number, subject, time_start, time_end, teacher, homework, notes, week_number)
                SELECT day_name, lesson_number, subject, time_start, time_end, teacher, homework, notes, %s
                FROM schedule
                WHERE week_number = %s
            """, (target_week, source_week))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Week duplicated successfully'}),
                'isBase64Encoded': False
            }
        else:
            day_name = body_data.get('day_name')
            lesson_number = body_data.get('lesson_number')
            subject = body_data.get('subject')
            time_start = body_data.get('time_start')
            time_end = body_data.get('time_end')
            teacher = body_data.get('teacher')
            homework = body_data.get('homework', '')
            notes = body_data.get('notes', '')
            week_number = body_data.get('week_number', 1)
            homework_files = body_data.get('homework_files', '')
            
            cur.execute("""
                INSERT INTO schedule (day_name, lesson_number, subject, time_start, time_end, teacher, homework, notes, week_number, homework_files)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (day_name, lesson_number, subject, time_start, time_end, teacher, homework, notes, week_number, homework_files))
            
            lesson_id = cur.fetchone()[0]
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'id': lesson_id, 'message': 'Lesson created'}),
                'isBase64Encoded': False
            }
    
    elif method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        lesson_id = body_data.get('id')
        subject = body_data.get('subject')
        time_start = body_data.get('time_start')
        time_end = body_data.get('time_end')
        teacher = body_data.get('teacher')
        homework = body_data.get('homework', '')
        notes = body_data.get('notes', '')
        homework_files = body_data.get('homework_files', '')
        
        cur.execute("""
            UPDATE schedule
            SET subject = %s, time_start = %s, time_end = %s, teacher = %s, homework = %s, notes = %s, homework_files = %s
            WHERE id = %s
        """, (subject, time_start, time_end, teacher, homework, notes, homework_files, lesson_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'Lesson updated'}),
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