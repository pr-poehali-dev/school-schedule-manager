import json
import os
from typing import Dict, Any
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Content

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Send schedule to email
    Args: event with httpMethod, body containing email, schedule data
          context with request_id
    Returns: HTTP response with status
    '''
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
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    recipient_email: str = body_data.get('email', '')
    from_email: str = body_data.get('fromEmail', '')
    schedule_data: list = body_data.get('schedule', [])
    week_number: int = body_data.get('week', 1)
    week_dates: str = body_data.get('weekDates', '')
    
    if not recipient_email or not schedule_data or not from_email:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Email, fromEmail and schedule are required'})
        }
    
    days_order = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    grouped_schedule: Dict[str, list] = {}
    
    for lesson in schedule_data:
        day = lesson.get('day_name', '')
        if day not in grouped_schedule:
            grouped_schedule[day] = []
        grouped_schedule[day].append(lesson)
    
    for day in grouped_schedule:
        grouped_schedule[day].sort(key=lambda x: x.get('lesson_number', 0))
    
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }}
            .container {{ max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }}
            h1 {{ color: #2563eb; text-align: center; }}
            h2 {{ color: #1e40af; border-bottom: 2px solid #2563eb; padding-bottom: 5px; margin-top: 30px; }}
            .lesson {{ background: #f8fafc; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; border-radius: 5px; }}
            .lesson-header {{ font-weight: bold; font-size: 1.1em; color: #1e40af; }}
            .lesson-time {{ color: #64748b; font-size: 0.9em; }}
            .homework {{ background: #fef3c7; padding: 10px; margin-top: 10px; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📚 Расписание уроков</h1>
            <p style="text-align: center; color: #64748b;">Неделя {week_number} ({week_dates})</p>
    """
    
    for day in days_order:
        if day in grouped_schedule:
            html_content += f"<h2>{day}</h2>"
            for lesson in grouped_schedule[day]:
                html_content += f"""
                <div class="lesson">
                    <div class="lesson-header">{lesson.get('lesson_number', '')}. {lesson.get('subject', '')}</div>
                    <div class="lesson-time">🕐 {lesson.get('time_start', '')} - {lesson.get('time_end', '')}</div>
                    <div style="margin-top: 5px;">👨‍🏫 {lesson.get('teacher', '')}</div>
                """
                
                if lesson.get('homework'):
                    html_content += f"""
                    <div class="homework">
                        <strong>📝 Домашнее задание:</strong><br>
                        {lesson.get('homework', '')}
                    </div>
                    """
                
                html_content += "</div>"
    
    html_content += """
        </div>
    </body>
    </html>
    """
    
    try:
        api_key = os.environ.get('SENDGRID_API_KEY')
        
        if not api_key:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'SendGrid API key not configured'})
            }
        
        message = Mail(
            from_email=from_email,
            to_emails=recipient_email,
            subject=f'Расписание уроков - Неделя {week_number}',
            html_content=html_content
        )
        
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'success': True, 'message': 'Email sent successfully'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }