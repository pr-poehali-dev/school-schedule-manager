import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const API_URLS = {
  auth: 'https://functions.poehali.dev/8f8356cb-77bd-4e53-9217-92e528e4af8c',
  students: 'https://functions.poehali.dev/8ed4b769-d4cc-4ecb-8609-3af298dbbb7e',
  schedule: 'https://functions.poehali.dev/9f4b5d91-bb88-45d1-80b6-6344d8a2cff3',
  teachers: 'https://functions.poehali.dev/55920796-7fb0-4b1b-bed5-7affcd3d6fd9',
  sendSchedule: 'https://functions.poehali.dev/aa3e0fe6-0f4e-4ea7-b17a-91bbcfe499e0',
};

type User = {
  id: number;
  login: string;
  role: 'admin' | 'student';
  full_name: string;
};

type Student = {
  id: number;
  login: string;
  full_name: string;
  class_name: string;
  parent_contact: string;
  notes: string;
  password?: string;
};

type Teacher = {
  id: number;
  full_name: string;
  subject?: string;
  phone?: string;
  email?: string;
  notes?: string;
};

type Lesson = {
  id: number;
  day_name: string;
  lesson_number: number;
  subject: string;
  time_start: string;
  time_end: string;
  teacher: string;
  homework?: string;
  notes?: string;
  week_number: number;
  homework_files?: string;
};

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [newTeacher, setNewTeacher] = useState<Partial<Teacher>>({});
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [schedule, setSchedule] = useState<Lesson[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({});
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({});
  const [weekStartDate, setWeekStartDate] = useState(new Date());
  const [duplicatingLesson, setDuplicatingLesson] = useState<Lesson | null>(null);
  const [targetDay, setTargetDay] = useState<string>('');
  const [targetWeek, setTargetWeek] = useState<string>('');
  const [showDuplicateWeekDialog, setShowDuplicateWeekDialog] = useState(false);
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const { toast } = useToast();

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const month = months[date.getMonth()];
    return `${day} ${month}.`;
  };

  const getWeekDateRange = (weekNum: number) => {
    const startDate = new Date(weekStartDate);
    const weekDiff = weekNum - currentWeek;
    startDate.setDate(startDate.getDate() + (weekDiff * 7));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const getDayOfWeek = (dayOffset: number) => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + dayOffset);
    return { name: days[date.getDay()], date: formatDate(date), fullDate: date };
  };

  const daysOfWeek = [
    getDayOfWeek(0),
    getDayOfWeek(1),
    getDayOfWeek(2),
    getDayOfWeek(3),
    getDayOfWeek(4),
    getDayOfWeek(5),
    getDayOfWeek(6),
  ];

  const fetchTeachers = async () => {
    const res = await fetch(API_URLS.teachers);
    const data = await res.json();
    setTeachers(data.teachers || []);
  };

  useEffect(() => {
    if (user) {
      fetchTeachers();
      loadSchedule();
      if (user.role === 'admin') {
        loadStudents();
      }
    }
  }, [user, currentWeek]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        toast({ title: 'Добро пожаловать!', description: `Вы вошли как ${userData.full_name}` });
      } else {
        toast({ title: 'Ошибка', description: 'Неверный логин или пароль', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось подключиться к серверу', variant: 'destructive' });
    }
    setLoading(false);
  };

  const loadStudents = async () => {
    try {
      const response = await fetch(API_URLS.students);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students', error);
    }
  };

  const loadSchedule = async () => {
    try {
      const response = await fetch(`${API_URLS.schedule}?week=${currentWeek}`);
      const data = await response.json();
      setSchedule(data);
    } catch (error) {
      console.error('Failed to load schedule', error);
    }
  };

  const handleCreateStudent = async () => {
    try {
      const response = await fetch(API_URLS.students, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });
      
      if (response.ok) {
        toast({ title: 'Успех', description: 'Ученик создан' });
        setNewStudent({});
        loadStudents();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать ученика', variant: 'destructive' });
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;
    
    try {
      const response = await fetch(API_URLS.students, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStudent),
      });
      
      if (response.ok) {
        toast({ title: 'Успех', description: 'Данные обновлены' });
        setEditingStudent(null);
        loadStudents();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить данные', variant: 'destructive' });
    }
  };

  const handleAddTeacher = async () => {
    const res = await fetch(API_URLS.teachers, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTeacher),
    });
    if (res.ok) {
      setNewTeacher({});
      fetchTeachers();
      toast({ title: 'Учитель добавлен' });
    }
  };

  const handleUpdateTeacher = async () => {
    if (!editingTeacher) return;
    const res = await fetch(API_URLS.teachers, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingTeacher),
    });
    if (res.ok) {
      setEditingTeacher(null);
      fetchTeachers();
      toast({ title: 'Учитель обновлён' });
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    const res = await fetch(`${API_URLS.teachers}?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchTeachers();
      toast({ title: 'Учитель удалён' });
    }
  };

  const handleAddLesson = async () => {
    if (!newLesson.day_name || !newLesson.subject) return;
    
    try {
      const response = await fetch(API_URLS.schedule, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newLesson, week_number: currentWeek }),
      });
      
      if (response.ok) {
        toast({ title: 'Успех', description: 'Урок добавлен' });
        setNewLesson({});
        loadSchedule();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось добавить урок', variant: 'destructive' });
    }
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson) return;
    
    try {
      const response = await fetch(API_URLS.schedule, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingLesson),
      });
      
      if (response.ok) {
        toast({ title: 'Успех', description: 'Урок обновлён' });
        setEditingLesson(null);
        loadSchedule();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить урок', variant: 'destructive' });
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    try {
      const response = await fetch(API_URLS.schedule, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lessonId }),
      });
      
      if (response.ok) {
        toast({ title: 'Успех', description: 'Урок удалён' });
        loadSchedule();
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить урок', variant: 'destructive' });
    }
  };

  const handleDuplicateWeek = async () => {
    if (!targetWeek) return;

    const targetWeekNum = parseInt(targetWeek);
    if (isNaN(targetWeekNum) || targetWeekNum < 1 || targetWeekNum > 52) {
      toast({ title: 'Ошибка', description: 'Укажите номер недели от 1 до 52', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch(API_URLS.schedule, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'duplicate_week',
          source_week: currentWeek,
          target_week: targetWeekNum,
        }),
      });
      
      if (response.ok) {
        toast({ title: 'Успех', description: `Неделя ${currentWeek} скопирована в неделю ${targetWeekNum}` });
        setShowDuplicateWeekDialog(false);
        setTargetWeek('');
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось скопировать неделю', variant: 'destructive' });
    }
  };

  const handleDuplicateLesson = async () => {
    if (!duplicatingLesson || !targetDay) return;

    try {
      const lessonData = {
        day_name: targetDay,
        lesson_number: duplicatingLesson.lesson_number,
        subject: duplicatingLesson.subject,
        time_start: duplicatingLesson.time_start,
        time_end: duplicatingLesson.time_end,
        teacher: duplicatingLesson.teacher,
        homework: duplicatingLesson.homework,
        notes: duplicatingLesson.notes,
        week_number: currentWeek,
        homework_files: duplicatingLesson.homework_files,
      };

      const response = await fetch(API_URLS.schedule, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...lessonData }),
      });

      if (response.ok) {
        toast({ title: 'Успех', description: 'Урок продублирован' });
        loadSchedule();
        setDuplicatingLesson(null);
        setTargetDay('');
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось продублировать урок', variant: 'destructive' });
    }
  };

  const getScheduleByDay = (dayName: string) => {
    return schedule.filter(lesson => lesson.day_name === dayName).sort((a, b) => a.lesson_number - b.lesson_number);
  };

  const handleSendEmail = async () => {
    if (!recipientEmail || !fromEmail) {
      toast({ title: 'Ошибка', description: 'Заполните все поля', variant: 'destructive' });
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch(API_URLS.sendSchedule, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recipientEmail,
          fromEmail: fromEmail,
          schedule: schedule,
          week: currentWeek,
          weekDates: getWeekDateRange(currentWeek),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({ title: 'Готово!', description: `Расписание отправлено на ${recipientEmail}` });
        setShowEmailDialog(false);
        setRecipientEmail('');
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось отправить email', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось отправить email', variant: 'destructive' });
    }
    setSendingEmail(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="GraduationCap" className="text-primary-foreground" size={32} />
            </div>
            <CardTitle className="text-2xl">Школьное расписание: "МБОУ Лицей №22"</CardTitle>
            <p className="text-muted-foreground">Войдите в систему</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="login">Логин</Label>
              <Input
                id="login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Введите логин"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} disabled={loading} className="w-full">
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="Calendar" className="text-primary-foreground" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Школьное расписание: "МБОУ Лицей №22"</h1>
              <p className="text-sm text-muted-foreground">{user.full_name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={user.role === 'admin' ? "default" : "secondary"} className="px-4 py-2">
              <Icon name={user.role === 'admin' ? "ShieldCheck" : "User"} size={16} className="mr-2" />
              {user.role === 'admin' ? 'Администратор' : 'Ученик'}
            </Badge>
            <Button onClick={() => setUser(null)} variant="outline" size="sm">
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className={`mb-6 grid w-full max-w-2xl mx-auto ${user.role === 'admin' ? 'grid-cols-3' : 'grid-cols-1'}`}>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Icon name="CalendarDays" size={18} />
              Расписание
            </TabsTrigger>
            {user.role === 'admin' && (
              <>
                <TabsTrigger value="teachers" className="flex items-center gap-2">
                  <Icon name="GraduationCap" size={18} />
                  Учителя
                </TabsTrigger>
                <TabsTrigger value="students" className="flex items-center gap-2">
                  <Icon name="Users" size={18} />
                  Ученики
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="schedule" className="space-y-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(weekStartDate);
                    newDate.setDate(newDate.getDate() - 7);
                    setWeekStartDate(newDate);
                  }}
                >
                  <Icon name="ChevronLeft" size={18} />
                </Button>
                <div className="flex items-center gap-2">
                  <Icon name="Calendar" size={18} className="text-muted-foreground" />
                  <Input
                    type="date"
                    value={weekStartDate.toISOString().split('T')[0]}
                    onChange={(e) => setWeekStartDate(new Date(e.target.value))}
                    className="w-auto"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(weekStartDate);
                    newDate.setDate(newDate.getDate() + 7);
                    setWeekStartDate(newDate);
                  }}
                >
                  <Icon name="ChevronRight" size={18} />
                </Button>
              </div>
              
              <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Icon name="Mail" size={18} className="mr-2" />
                    Отправить на email
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Отправить расписание на email</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Email получателя</Label>
                      <Input
                        type="email"
                        placeholder="student@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Ваш email (проверенный в SendGrid)</Label>
                      <Input
                        type="email"
                        placeholder="your-email@gmail.com"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Должен быть подтвержден в SendGrid
                      </p>
                    </div>
                    <Button 
                      onClick={handleSendEmail} 
                      disabled={sendingEmail}
                      className="w-full"
                    >
                      {sendingEmail ? 'Отправка...' : 'Отправить'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {user.role === 'admin' && (
              <Card className="mb-6 animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Plus" size={20} />
                    Добавить урок
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <Label>День недели</Label>
                      <Select value={newLesson.day_name} onValueChange={(val) => setNewLesson({ ...newLesson, day_name: val })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите день" />
                        </SelectTrigger>
                        <SelectContent>
                          {daysOfWeek.map(day => (
                            <SelectItem key={day.name + day.date} value={`${day.name}, ${day.date}`}>
                              {day.name}, {day.date}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Номер урока</Label>
                      <Input
                        type="number"
                        value={newLesson.lesson_number || ''}
                        onChange={(e) => setNewLesson({ ...newLesson, lesson_number: parseInt(e.target.value) })}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label>Предмет</Label>
                      <Input
                        value={newLesson.subject || ''}
                        onChange={(e) => setNewLesson({ ...newLesson, subject: e.target.value })}
                        placeholder="Математика"
                      />
                    </div>
                    <div>
                      <Label>Начало</Label>
                      <Input
                        value={newLesson.time_start || ''}
                        onChange={(e) => setNewLesson({ ...newLesson, time_start: e.target.value })}
                        placeholder="8:00"
                      />
                    </div>
                    <div>
                      <Label>Конец</Label>
                      <Input
                        value={newLesson.time_end || ''}
                        onChange={(e) => setNewLesson({ ...newLesson, time_end: e.target.value })}
                        placeholder="8:40"
                      />
                    </div>
                    <div>
                      <Label>Учитель</Label>
                      <Select 
                        value={newLesson.teacher || ''} 
                        onValueChange={(val) => setNewLesson({ ...newLesson, teacher: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите учителя" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.full_name}>
                              {teacher.full_name} {teacher.subject ? `(${teacher.subject})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-3">
                      <Label>Домашнее задание</Label>
                      <Input
                        value={newLesson.homework || ''}
                        onChange={(e) => setNewLesson({ ...newLesson, homework: e.target.value })}
                        placeholder="Упражнение 45, стр. 120"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label>Файлы к домашнему заданию (ссылки через запятую)</Label>
                      <Textarea
                        value={newLesson.homework_files || ''}
                        onChange={(e) => setNewLesson({ ...newLesson, homework_files: e.target.value })}
                        placeholder="https://example.com/file1.pdf, https://example.com/file2.docx"
                        rows={2}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddLesson} className="mt-4">
                    <Icon name="Plus" size={18} className="mr-2" />
                    Добавить урок
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedDayIndex === null ? (
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max">
                  {daysOfWeek.map((day, dayIndex) => {
                    const dayString = `${day.name}, ${day.date}`;
                    const dayLessons = getScheduleByDay(dayString);
                    const isWeekend = day.name === 'Суббота' || day.name === 'Воскресенье';
                    
                    return (
                      <Card
                        key={day.name + day.date}
                        ref={(el) => (dayRefs.current[dayIndex] = el)}
                        className={`w-72 flex-shrink-0 animate-slide-in ${isWeekend ? 'bg-muted/30' : ''}`}
                        style={{ animationDelay: `${dayIndex * 50}ms` }}
                      >
                        <CardHeader 
                          className={`pb-3 cursor-pointer ${isWeekend ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}
                          onClick={() => setSelectedDayIndex(dayIndex)}
                        >
                          <CardTitle className="text-base font-semibold flex items-center justify-between">
                            <span>{day.name}, {day.date}</span>
                            <Icon name="Maximize2" size={16} />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3 max-h-[600px] overflow-y-auto">
                        {dayLessons.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Icon name="Calendar" size={32} className="mx-auto mb-2 opacity-50" />
                            <p>{isWeekend ? 'Выходной день' : 'Нет уроков'}</p>
                          </div>
                        ) : (
                          dayLessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="p-3 rounded-lg border bg-card hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-start gap-2 flex-1">
                                  <Badge variant="outline" className="text-xs">{lesson.lesson_number}</Badge>
                                  <div className="flex-1">
                                    <p className="font-semibold text-foreground">{lesson.subject}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                      <Icon name="Clock" size={12} />
                                      {lesson.time_start} - {lesson.time_end}
                                    </p>
                                  </div>
                                </div>
                                {user.role === 'admin' && (
                                  <div className="flex gap-1">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() => setEditingLesson(lesson)}
                                        >
                                          <Icon name="Edit" size={14} />
                                        </Button>
                                      </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Редактировать урок</DialogTitle>
                                      </DialogHeader>
                                      {editingLesson && (
                                        <div className="space-y-4">
                                          <div>
                                            <Label>Предмет</Label>
                                            <Input
                                              value={editingLesson.subject}
                                              onChange={(e) => setEditingLesson({ ...editingLesson, subject: e.target.value })}
                                            />
                                          </div>
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <Label>Начало</Label>
                                              <Input
                                                value={editingLesson.time_start}
                                                onChange={(e) => setEditingLesson({ ...editingLesson, time_start: e.target.value })}
                                              />
                                            </div>
                                            <div>
                                              <Label>Конец</Label>
                                              <Input
                                                value={editingLesson.time_end}
                                                onChange={(e) => setEditingLesson({ ...editingLesson, time_end: e.target.value })}
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <Label>Учитель</Label>
                                            <Input
                                              value={editingLesson.teacher}
                                              onChange={(e) => setEditingLesson({ ...editingLesson, teacher: e.target.value })}
                                            />
                                          </div>
                                          <div>
                                            <Label>Домашнее задание</Label>
                                            <Textarea
                                              value={editingLesson.homework || ''}
                                              onChange={(e) => setEditingLesson({ ...editingLesson, homework: e.target.value })}
                                            />
                                          </div>
                                          <div>
                                            <Label>Файлы к домашнему заданию (ссылки через запятую)</Label>
                                            <Textarea
                                              value={editingLesson.homework_files || ''}
                                              onChange={(e) => setEditingLesson({ ...editingLesson, homework_files: e.target.value })}
                                              placeholder="https://example.com/file1.pdf, https://example.com/file2.docx"
                                              rows={2}
                                            />
                                          </div>
                                          <div className="flex gap-2">
                                            <Button onClick={handleUpdateLesson} className="flex-1">
                                              <Icon name="Save" size={16} className="mr-2" />
                                              Сохранить
                                            </Button>
                                            <Button 
                                              onClick={() => {
                                                if (confirm('Удалить этот урок?')) {
                                                  handleDeleteLesson(editingLesson.id);
                                                  setEditingLesson(null);
                                                }
                                              }} 
                                              variant="destructive"
                                              className="flex-1"
                                            >
                                              <Icon name="Trash2" size={16} className="mr-2" />
                                              Удалить
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </DialogContent>
                                  </Dialog>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                                <Icon name="User" size={12} />
                                {lesson.teacher}
                              </div>
                              {lesson.homework && (
                                <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                  <p className="font-medium text-foreground mb-1 flex items-center gap-1">
                                    <Icon name="BookOpen" size={12} />
                                    Домашнее задание:
                                  </p>
                                  <p className="text-muted-foreground">{lesson.homework}</p>
                                  {lesson.homework_files && (
                                    <div className="mt-2 space-y-1">
                                      {lesson.homework_files.split(',').map((fileUrl, idx) => {
                                        const url = fileUrl.trim();
                                        if (!url) return null;
                                        const fileName = url.split('/').pop() || 'Файл';
                                        return (
                                          <a
                                            key={idx}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-primary hover:underline"
                                          >
                                            <Icon name="Paperclip" size={12} />
                                            {fileName}
                                          </a>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
            ) : (
              <div className="animate-fade-in">
                {(() => {
                  const day = daysOfWeek[selectedDayIndex];
                  const dayString = `${day.name}, ${day.date}`;
                  const dayLessons = getScheduleByDay(dayString);
                  const isWeekend = day.name === 'Суббота' || day.name === 'Воскресенье';
                  
                  return (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDayIndex(null)}
                        >
                          <Icon name="ArrowLeft" size={16} className="mr-2" />
                          Вся неделя
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDayIndex(Math.max(0, selectedDayIndex - 1))}
                            disabled={selectedDayIndex === 0}
                          >
                            <Icon name="ChevronLeft" size={18} />
                          </Button>
                          <h2 className={`text-xl font-semibold px-4 py-2 rounded-lg ${isWeekend ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                            {day.name}, {day.date}
                          </h2>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDayIndex(Math.min(6, selectedDayIndex + 1))}
                            disabled={selectedDayIndex === 6}
                          >
                            <Icon name="ChevronRight" size={18} />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {dayLessons.length === 0 ? (
                          <Card>
                            <CardContent className="text-center py-16 text-muted-foreground">
                              <Icon name="Calendar" size={48} className="mx-auto mb-4 opacity-50" />
                              <p className="text-lg">{isWeekend ? 'Выходной день' : 'Нет уроков'}</p>
                            </CardContent>
                          </Card>
                        ) : (
                          dayLessons.map((lesson) => (
                            <Card key={lesson.id} className="hover:shadow-lg transition-all">
                              <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-start gap-4 flex-1">
                                    <Badge variant="outline" className="text-lg px-3 py-1">{lesson.lesson_number}</Badge>
                                    <div className="flex-1">
                                      <h3 className="text-2xl font-bold text-foreground mb-2">{lesson.subject}</h3>
                                      <p className="text-muted-foreground flex items-center gap-2 mb-2">
                                        <Icon name="Clock" size={16} />
                                        {lesson.time_start} - {lesson.time_end}
                                      </p>
                                      <p className="text-muted-foreground flex items-center gap-2">
                                        <Icon name="User" size={16} />
                                        {lesson.teacher}
                                      </p>
                                    </div>
                                  </div>
                                  {user.role === 'admin' && (
                                    <div className="flex gap-2">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setDuplicatingLesson(lesson);
                                              setTargetDay('');
                                            }}
                                          >
                                            <Icon name="Copy" size={16} className="mr-2" />
                                            Дублировать
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Дублировать урок</DialogTitle>
                                          </DialogHeader>
                                          {duplicatingLesson && (
                                            <div className="space-y-4">
                                              <div className="p-3 bg-muted/50 rounded-lg">
                                                <p className="font-medium text-sm">{duplicatingLesson.subject}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                  {duplicatingLesson.time_start} - {duplicatingLesson.time_end} • {duplicatingLesson.teacher}
                                                </p>
                                              </div>
                                              <div>
                                                <Label>Выберите день недели</Label>
                                                <Select value={targetDay} onValueChange={setTargetDay}>
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Выберите день" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    {daysOfWeek.map((day) => (
                                                      <SelectItem key={day.name} value={day.name}>
                                                        {day.name} ({day.date})
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <Button onClick={handleDuplicateLesson} disabled={!targetDay} className="w-full">
                                                <Icon name="Copy" size={16} className="mr-2" />
                                                Дублировать в {targetDay || '...'}
                                              </Button>
                                            </div>
                                          )}
                                        </DialogContent>
                                      </Dialog>
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingLesson(lesson)}
                                          >
                                            <Icon name="Edit" size={16} className="mr-2" />
                                            Изменить
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Редактировать урок</DialogTitle>
                                          </DialogHeader>
                                          {editingLesson && (
                                            <div className="space-y-4">
                                              <div>
                                                <Label>Предмет</Label>
                                                <Input
                                                  value={editingLesson.subject}
                                                  onChange={(e) => setEditingLesson({ ...editingLesson, subject: e.target.value })}
                                                />
                                              </div>
                                              <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                  <Label>Начало</Label>
                                                  <Input
                                                    value={editingLesson.time_start}
                                                    onChange={(e) => setEditingLesson({ ...editingLesson, time_start: e.target.value })}
                                                  />
                                                </div>
                                                <div>
                                                  <Label>Конец</Label>
                                                  <Input
                                                    value={editingLesson.time_end}
                                                    onChange={(e) => setEditingLesson({ ...editingLesson, time_end: e.target.value })}
                                                  />
                                                </div>
                                              </div>
                                              <div>
                                                <Label>Учитель</Label>
                                                <Select 
                                                  value={editingLesson.teacher} 
                                                  onValueChange={(val) => setEditingLesson({ ...editingLesson, teacher: val })}
                                                >
                                                  <SelectTrigger>
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    {teachers.map(teacher => (
                                                      <SelectItem key={teacher.id} value={teacher.full_name}>
                                                        {teacher.full_name} {teacher.subject ? `(${teacher.subject})` : ''}
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div>
                                                <Label>Домашнее задание</Label>
                                                <Textarea
                                                  value={editingLesson.homework || ''}
                                                  onChange={(e) => setEditingLesson({ ...editingLesson, homework: e.target.value })}
                                                  rows={3}
                                                />
                                              </div>
                                              <div>
                                                <Label>Заметки</Label>
                                                <Textarea
                                                  value={editingLesson.notes || ''}
                                                  onChange={(e) => setEditingLesson({ ...editingLesson, notes: e.target.value })}
                                                  rows={2}
                                                />
                                              </div>
                                              <Button onClick={handleUpdateLesson} className="w-full">
                                                <Icon name="Save" size={16} className="mr-2" />
                                                Сохранить изменения
                                              </Button>
                                            </div>
                                          )}
                                        </DialogContent>
                                      </Dialog>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteLesson(lesson.id)}
                                      >
                                        <Icon name="Trash2" size={16} />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                {lesson.homework && (
                                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                                    <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                      <Icon name="BookOpen" size={16} />
                                      Домашнее задание:
                                    </p>
                                    <p className="text-foreground whitespace-pre-wrap">{lesson.homework}</p>
                                    {lesson.homework_files && (
                                      <div className="mt-3 space-y-2">
                                        {lesson.homework_files.split(',').map((fileUrl, idx) => {
                                          const url = fileUrl.trim();
                                          if (!url) return null;
                                          const fileName = url.split('/').pop() || 'Файл';
                                          return (
                                            <a
                                              key={idx}
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-2 text-primary hover:underline"
                                            >
                                              <Icon name="Paperclip" size={14} />
                                              {fileName}
                                            </a>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {lesson.notes && (
                                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                    <p className="text-sm text-muted-foreground">{lesson.notes}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </TabsContent>

          {user.role === 'admin' && (
            <>
              <TabsContent value="teachers">
                <Card className="animate-fade-in">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="GraduationCap" size={20} />
                      Управление учителями
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <h3 className="font-semibold mb-3">Добавить учителя</h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <Label>ФИО</Label>
                          <Input
                            value={newTeacher.full_name || ''}
                            onChange={(e) => setNewTeacher({ ...newTeacher, full_name: e.target.value })}
                            placeholder="Иванова Мария Петровна"
                          />
                        </div>
                        <div>
                          <Label>Предмет</Label>
                          <Input
                            value={newTeacher.subject || ''}
                            onChange={(e) => setNewTeacher({ ...newTeacher, subject: e.target.value })}
                            placeholder="Математика"
                          />
                        </div>
                        <div>
                          <Label>Телефон</Label>
                          <Input
                            value={newTeacher.phone || ''}
                            onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                            placeholder="+7 (999) 123-45-67"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={newTeacher.email || ''}
                            onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                            placeholder="teacher@school.ru"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Заметки</Label>
                          <Textarea
                            value={newTeacher.notes || ''}
                            onChange={(e) => setNewTeacher({ ...newTeacher, notes: e.target.value })}
                            placeholder="Дополнительная информация"
                            rows={2}
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddTeacher} className="mt-3">
                        <Icon name="Plus" size={16} className="mr-2" />
                        Добавить учителя
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Список учителей ({teachers.length})</h3>
                      {teachers.map((teacher) => (
                        <div key={teacher.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold">{teacher.full_name}</p>
                              {teacher.subject && (
                                <p className="text-sm text-muted-foreground mt-1">Предмет: {teacher.subject}</p>
                              )}
                              <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                {teacher.phone && <span>{teacher.phone}</span>}
                                {teacher.email && <span>{teacher.email}</span>}
                              </div>
                              {teacher.notes && (
                                <p className="text-xs text-muted-foreground mt-2">{teacher.notes}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingTeacher(teacher)}
                                  >
                                    <Icon name="Edit" size={16} />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Редактировать учителя</DialogTitle>
                                  </DialogHeader>
                                  {editingTeacher && (
                                    <div className="space-y-4">
                                      <div>
                                        <Label>ФИО</Label>
                                        <Input
                                          value={editingTeacher.full_name}
                                          onChange={(e) => setEditingTeacher({ ...editingTeacher, full_name: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <Label>Предмет</Label>
                                        <Input
                                          value={editingTeacher.subject || ''}
                                          onChange={(e) => setEditingTeacher({ ...editingTeacher, subject: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <Label>Телефон</Label>
                                        <Input
                                          value={editingTeacher.phone || ''}
                                          onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <Label>Email</Label>
                                        <Input
                                          value={editingTeacher.email || ''}
                                          onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <Label>Заметки</Label>
                                        <Textarea
                                          value={editingTeacher.notes || ''}
                                          onChange={(e) => setEditingTeacher({ ...editingTeacher, notes: e.target.value })}
                                          rows={2}
                                        />
                                      </div>
                                      <Button onClick={handleUpdateTeacher} className="w-full">
                                        <Icon name="Save" size={16} className="mr-2" />
                                        Сохранить
                                      </Button>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTeacher(teacher.id)}
                              >
                                <Icon name="Trash2" size={16} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {teachers.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Icon name="GraduationCap" size={32} className="mx-auto mb-2 opacity-50" />
                          <p>Нет учителей</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="students">
                <Card className="animate-fade-in">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Users" size={20} />
                      Управление учениками
                    </CardTitle>
                  </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <h3 className="font-semibold mb-3">Добавить ученика</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>ФИО</Label>
                        <Input
                          value={newStudent.full_name || ''}
                          onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                          placeholder="Иванов Иван Иванович"
                        />
                      </div>
                      <div>
                        <Label>Класс</Label>
                        <Input
                          value={newStudent.class_name || ''}
                          onChange={(e) => setNewStudent({ ...newStudent, class_name: e.target.value })}
                          placeholder="9А"
                        />
                      </div>
                      <div>
                        <Label>Логин</Label>
                        <Input
                          value={newStudent.login || ''}
                          onChange={(e) => setNewStudent({ ...newStudent, login: e.target.value })}
                          placeholder="ivanov"
                        />
                      </div>
                      <div>
                        <Label>Пароль</Label>
                        <Input
                          type="password"
                          value={newStudent.password || ''}
                          onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                          placeholder="••••••"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Контакт родителей</Label>
                        <Input
                          value={newStudent.parent_contact || ''}
                          onChange={(e) => setNewStudent({ ...newStudent, parent_contact: e.target.value })}
                          placeholder="+7 (999) 123-45-67"
                        />
                      </div>
                    </div>
                    <Button onClick={handleCreateStudent} className="mt-3">
                      <Icon name="Plus" size={16} className="mr-2" />
                      Создать ученика
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">Список учеников ({students.length})</h3>
                    {students.map((student) => (
                      <div key={student.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold">{student.full_name}</p>
                            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                              <span>Класс: {student.class_name || '—'}</span>
                              <span>Логин: {student.login}</span>
                            </div>
                            {student.parent_contact && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Родители: {student.parent_contact}
                              </p>
                            )}
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingStudent(student)}
                              >
                                <Icon name="Edit" size={16} />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Редактировать ученика</DialogTitle>
                              </DialogHeader>
                              {editingStudent && (
                                <div className="space-y-4">
                                  <div>
                                    <Label>ФИО</Label>
                                    <Input
                                      value={editingStudent.full_name}
                                      onChange={(e) => setEditingStudent({ ...editingStudent, full_name: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Класс</Label>
                                    <Input
                                      value={editingStudent.class_name}
                                      onChange={(e) => setEditingStudent({ ...editingStudent, class_name: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Контакт родителей</Label>
                                    <Input
                                      value={editingStudent.parent_contact}
                                      onChange={(e) => setEditingStudent({ ...editingStudent, parent_contact: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Новый пароль (оставьте пустым, чтобы не менять)</Label>
                                    <Input
                                      type="password"
                                      value={editingStudent.password || ''}
                                      onChange={(e) => setEditingStudent({ ...editingStudent, password: e.target.value })}
                                      placeholder="Новый пароль"
                                    />
                                  </div>
                                  <Button onClick={handleUpdateStudent} className="w-full">
                                    Сохранить
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                    {students.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Icon name="Users" size={32} className="mx-auto mb-2 opacity-50" />
                        <p>Нет учеников</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}