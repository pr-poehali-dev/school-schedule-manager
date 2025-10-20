import { useState, useEffect } from 'react';
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
  upload: 'https://functions.poehali.dev/954bb42b-6cb1-4502-8f7b-e5da54c030d4',
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
  const [students, setStudents] = useState<Student[]>([]);
  const [schedule, setSchedule] = useState<Lesson[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({});
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({});
  const [weekStartDate, setWeekStartDate] = useState(new Date());
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const { toast } = useToast();

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const month = months[date.getMonth()];
    return `${day} ${month}.`;
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

  useEffect(() => {
    if (user) {
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

  const handleFileUpload = async (files: FileList | null, forEdit = false) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    setUploadingFiles(fileArray);
    
    try {
      const urls: string[] = [];
      
      for (const file of fileArray) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(API_URLS.upload, {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          urls.push(data.url);
        }
      }
      
      setUploadedFileUrls(prev => [...prev, ...urls]);
      
      if (forEdit && editingLesson) {
        const currentFiles = editingLesson.homework_files || '';
        const newFiles = [...(currentFiles ? currentFiles.split(',').map(s => s.trim()) : []), ...urls].join(', ');
        setEditingLesson({ ...editingLesson, homework_files: newFiles });
      } else {
        const currentFiles = newLesson.homework_files || '';
        const newFiles = [...(currentFiles ? currentFiles.split(',').map(s => s.trim()) : []), ...urls].join(', ');
        setNewLesson({ ...newLesson, homework_files: newFiles });
      }
      
      toast({ title: 'Успех', description: `Загружено файлов: ${urls.length}` });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить файлы', variant: 'destructive' });
    } finally {
      setUploadingFiles([]);
    }
  };

  const handleDuplicateWeek = async () => {
    try {
      const response = await fetch(API_URLS.schedule, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'duplicate_week',
          source_week: currentWeek,
          target_week: currentWeek + 1,
        }),
      });
      
      if (response.ok) {
        toast({ title: 'Успех', description: `Неделя ${currentWeek} скопирована в неделю ${currentWeek + 1}` });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось скопировать неделю', variant: 'destructive' });
    }
  };

  const getScheduleByDay = (dayName: string) => {
    return schedule.filter(lesson => lesson.day_name === dayName).sort((a, b) => a.lesson_number - b.lesson_number);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="GraduationCap" className="text-primary-foreground" size={32} />
            </div>
            <CardTitle className="text-2xl">Школьное расписание</CardTitle>
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
              <h1 className="text-xl font-bold text-foreground">Школьное расписание</h1>
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
          <TabsList className={`mb-6 grid w-full max-w-2xl mx-auto ${user.role === 'admin' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Icon name="CalendarDays" size={18} />
              Расписание
            </TabsTrigger>
            {user.role === 'admin' && (
              <TabsTrigger value="students" className="flex items-center gap-2">
                <Icon name="Users" size={18} />
                Ученики
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Icon name="Bell" size={18} />
              Уведомления
            </TabsTrigger>
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
              
              {user.role === 'admin' && (
                <Button onClick={handleDuplicateWeek} variant="outline" size="sm">
                  <Icon name="Copy" size={16} className="mr-2" />
                  Дублировать неделю
                </Button>
              )}
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
                      <Input
                        value={newLesson.teacher || ''}
                        onChange={(e) => setNewLesson({ ...newLesson, teacher: e.target.value })}
                        placeholder="Иванов И.И."
                      />
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
                      <Label>Файлы к домашнему заданию</Label>
                      <div className="flex gap-2 items-start">
                        <Input
                          type="file"
                          multiple
                          onChange={(e) => handleFileUpload(e.target.files)}
                          className="flex-1"
                          disabled={uploadingFiles.length > 0}
                        />
                        {uploadingFiles.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Загрузка {uploadingFiles.length} файлов...
                          </div>
                        )}
                      </div>
                      {newLesson.homework_files && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <p className="font-medium mb-1">Прикрепленные файлы:</p>
                          {newLesson.homework_files.split(',').map((url, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Icon name="Paperclip" size={12} />
                              <span className="truncate">{url.trim().split('/').pop()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button onClick={handleAddLesson} className="mt-4">
                    <Icon name="Plus" size={18} className="mr-2" />
                    Добавить урок
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {daysOfWeek.map((day, dayIndex) => {
                  const dayString = `${day.name}, ${day.date}`;
                  const dayLessons = getScheduleByDay(dayString);
                  const isWeekend = day.name === 'Суббота' || day.name === 'Воскресенье';
                  
                  return (
                    <Card
                      key={day.name + day.date}
                      className={`w-72 flex-shrink-0 animate-slide-in ${isWeekend ? 'bg-muted/30' : ''}`}
                      style={{ animationDelay: `${dayIndex * 50}ms` }}
                    >
                      <CardHeader className={`pb-3 ${isWeekend ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                        <CardTitle className="text-base font-semibold">{day.name}, {day.date}</CardTitle>
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
                                            <Label>Файлы к домашнему заданию</Label>
                                            <div className="flex gap-2 items-start">
                                              <Input
                                                type="file"
                                                multiple
                                                onChange={(e) => handleFileUpload(e.target.files, true)}
                                                className="flex-1"
                                                disabled={uploadingFiles.length > 0}
                                              />
                                              {uploadingFiles.length > 0 && (
                                                <div className="text-sm text-muted-foreground">
                                                  Загрузка...
                                                </div>
                                              )}
                                            </div>
                                            {editingLesson.homework_files && (
                                              <div className="mt-2 text-xs text-muted-foreground">
                                                <p className="font-medium mb-1">Прикрепленные файлы:</p>
                                                {editingLesson.homework_files.split(',').map((url, idx) => (
                                                  <div key={idx} className="flex items-center gap-2">
                                                    <Icon name="Paperclip" size={12} />
                                                    <span className="truncate">{url.trim().split('/').pop()}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          <Button onClick={handleUpdateLesson} className="w-full">
                                            Сохранить
                                          </Button>
                                        </div>
                                      )}
                                    </DialogContent>
                                  </Dialog>
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
          </TabsContent>

          {user.role === 'admin' && (
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
          )}

          <TabsContent value="notifications">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Bell" size={20} />
                  Уведомления
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="BookOpen" size={18} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Новое домашнее задание</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        По математике добавлено задание: Упражнение 162
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">2 часа назад</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="AlertCircle" size={18} className="text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Изменение в расписании</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Урок физкультуры в среду перенесён на 9:45
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">5 часов назад</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}