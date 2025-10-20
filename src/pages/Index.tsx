import { useState } from 'react';
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

type Lesson = {
  id: string;
  subject: string;
  time: string;
  teacher: string;
  homework?: string;
  notes?: string;
};

type Schedule = {
  [key: string]: Lesson[];
};

const initialSchedule: Schedule = {
  'Понедельник, 20 окт.': [
    { id: '1', subject: 'РОВ', time: '8:00 - 8:40', teacher: 'Иванова А.В.' },
    { id: '2', subject: 'Рус. язык', time: '8:50 - 9:30', teacher: 'Петрова М.С.', homework: 'Упражнение 162' },
    { id: '3', subject: 'Рус. язык', time: '9:45 - 10:25', teacher: 'Петрова М.С.' },
    { id: '4', subject: 'Математика', time: '10:35 - 11:15', teacher: 'Сидоров П.И.', homework: 'Задание на карточке' },
    { id: '5', subject: 'Англ. язык', time: '11:35 - 12:15', teacher: 'Смирнова Е.А.' },
    { id: '6', subject: 'ИЗО', time: '12:25 - 13:05', teacher: 'Кузнецова Л.В.', homework: 'Рисунок в цвете' },
    { id: '7', subject: 'Музыка', time: '13:15 - 13:55', teacher: 'Морозова Н.Г.' },
  ],
  'Вторник, 21 окт.': [
    { id: '8', subject: 'Биология', time: '8:00 - 8:40', teacher: 'Новикова О.С.', homework: 'Лабораторная работа' },
    { id: '9', subject: 'История', time: '8:50 - 9:30', teacher: 'Волков Д.А.' },
    { id: '10', subject: 'Рус. язык', time: '9:45 - 10:25', teacher: 'Петрова М.С.', homework: 'Параграф 17' },
    { id: '11', subject: 'Математика', time: '10:35 - 11:15', teacher: 'Сидоров П.И.' },
    { id: '12', subject: 'Нет урока', time: '11:35 - 12:15', teacher: '-' },
    { id: '13', subject: 'Физкультура', time: '12:25 - 13:05', teacher: 'Соколов В.П.' },
    { id: '14', subject: 'Математика', time: '13:15 - 13:55', teacher: 'Сидоров П.И.' },
  ],
  'Среда, 22 окт.': [
    { id: '15', subject: 'История', time: '8:00 - 8:40', teacher: 'Волков Д.А.' },
    { id: '16', subject: 'Математика', time: '8:50 - 9:30', teacher: 'Сидоров П.И.', homework: 'Задание на карточке' },
    { id: '17', subject: 'География', time: '9:45 - 10:25', teacher: 'Белова Т.С.' },
    { id: '18', subject: 'Физика', time: '10:35 - 11:15', teacher: 'Орлов К.В.', homework: 'Параграф 17' },
    { id: '19', subject: 'Математика', time: '11:35 - 12:15', teacher: 'Сидоров П.И.' },
    { id: '20', subject: 'География', time: '12:25 - 13:05', teacher: 'Белова Т.С.' },
  ],
  'Четверг, 23 окт.': [
    { id: '21', subject: 'Англ. язык', time: '7:00 - 8:40', teacher: 'Смирнова Е.А.' },
    { id: '22', subject: 'Физкультура', time: '8:50 - 9:30', teacher: 'Соколов В.П.' },
    { id: '23', subject: 'Математика', time: '9:45 - 10:25', teacher: 'Сидоров П.И.', homework: 'Задание на карточке' },
    { id: '24', subject: 'Информатика', time: '10:35 - 11:15', teacher: 'Павлов А.Н.', homework: 'Письменно вопросы после параграфа 4' },
    { id: '25', subject: 'Рус. язык', time: '11:35 - 12:15', teacher: 'Петрова М.С.' },
    { id: '26', subject: 'Труд', time: '12:25 - 13:05', teacher: 'Григорьева И.П.', homework: 'П.7, п.7' },
    { id: '27', subject: 'Труд', time: '13:15 - 13:55', teacher: 'Григорьева И.П.' },
  ],
  'Пятница, 24 окт.': [
    { id: '28', subject: 'Англ. язык', time: '8:00 - 8:40', teacher: 'Смирнова Е.А.' },
    { id: '29', subject: 'Литература', time: '8:50 - 9:30', teacher: 'Петрова М.С.', homework: 'Анализ Калашникова' },
    { id: '30', subject: 'Литература', time: '9:45 - 10:25', teacher: 'Петрова М.С.' },
    { id: '31', subject: 'Физика', time: '10:35 - 11:15', teacher: 'Орлов К.В.', homework: 'Параграф 18' },
    { id: '32', subject: 'История', time: '11:35 - 12:15', teacher: 'Волков Д.А.' },
    { id: '33', subject: 'Математика', time: '12:25 - 13:05', teacher: 'Сидоров П.И.', homework: 'Задание на карточке' },
    { id: '34', subject: 'Математика', time: '13:15 - 13:55', teacher: 'Сидоров П.И.' },
  ],
  'Суббота, 25 окт.': [],
  'Воскресенье, 26 окт.': [],
};

export default function Index() {
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({});

  const days = Object.keys(schedule);

  const handleAddLesson = () => {
    if (!selectedDay || !newLesson.subject || !newLesson.time || !newLesson.teacher) return;
    
    const lesson: Lesson = {
      id: Date.now().toString(),
      subject: newLesson.subject,
      time: newLesson.time,
      teacher: newLesson.teacher,
      homework: newLesson.homework || '',
      notes: newLesson.notes || '',
    };

    setSchedule({
      ...schedule,
      [selectedDay]: [...schedule[selectedDay], lesson],
    });
    
    setNewLesson({});
  };

  const handleDeleteLesson = (day: string, lessonId: string) => {
    setSchedule({
      ...schedule,
      [day]: schedule[day].filter(l => l.id !== lessonId),
    });
  };

  const handleEditLesson = (day: string, lesson: Lesson) => {
    setEditingLesson({ ...lesson });
    setSelectedDay(day);
  };

  const handleSaveEdit = () => {
    if (!editingLesson || !selectedDay) return;
    
    setSchedule({
      ...schedule,
      [selectedDay]: schedule[selectedDay].map(l => 
        l.id === editingLesson.id ? editingLesson : l
      ),
    });
    
    setEditingLesson(null);
  };

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
              <p className="text-sm text-muted-foreground">Образовательная платформа</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={isAdmin ? "default" : "secondary"} className="px-4 py-2">
              <Icon name={isAdmin ? "ShieldCheck" : "User"} size={16} className="mr-2" />
              {isAdmin ? 'Администратор' : 'Ученик'}
            </Badge>
            <Button
              onClick={() => setIsAdmin(!isAdmin)}
              variant="outline"
              size="sm"
            >
              <Icon name="RefreshCw" size={16} className="mr-2" />
              Переключить
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="mb-6 grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Icon name="CalendarDays" size={18} />
              Расписание
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Icon name="Bell" size={18} />
              Уведомления
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4">
            {isAdmin && (
              <Card className="mb-6 animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Plus" size={20} />
                    Управление расписанием
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <Label htmlFor="day-select">День недели</Label>
                      <Select value={selectedDay} onValueChange={setSelectedDay}>
                        <SelectTrigger id="day-select">
                          <SelectValue placeholder="Выберите день" />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map(day => (
                            <SelectItem key={day} value={day}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="subject">Предмет</Label>
                      <Input
                        id="subject"
                        value={newLesson.subject || ''}
                        onChange={(e) => setNewLesson({ ...newLesson, subject: e.target.value })}
                        placeholder="Математика"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="time">Время</Label>
                      <Input
                        id="time"
                        value={newLesson.time || ''}
                        onChange={(e) => setNewLesson({ ...newLesson, time: e.target.value })}
                        placeholder="8:00 - 8:40"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="teacher">Учитель</Label>
                      <Input
                        id="teacher"
                        value={newLesson.teacher || ''}
                        onChange={(e) => setNewLesson({ ...newLesson, teacher: e.target.value })}
                        placeholder="Иванов И.И."
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="homework">Домашнее задание</Label>
                      <Input
                        id="homework"
                        value={newLesson.homework || ''}
                        onChange={(e) => setNewLesson({ ...newLesson, homework: e.target.value })}
                        placeholder="Упражнение 45, стр. 120"
                      />
                    </div>
                  </div>
                  
                  <Button onClick={handleAddLesson} className="mt-4 w-full md:w-auto">
                    <Icon name="Plus" size={18} className="mr-2" />
                    Добавить урок
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {days.map((day, dayIndex) => (
                  <Card
                    key={day}
                    className={`w-72 flex-shrink-0 animate-slide-in ${
                      schedule[day].length === 0 ? 'bg-muted/30' : ''
                    }`}
                    style={{ animationDelay: `${dayIndex * 50}ms` }}
                  >
                    <CardHeader className={`pb-3 ${day.includes('25') || day.includes('26') ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                      <CardTitle className="text-base font-semibold">
                        {day}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3 max-h-[600px] overflow-y-auto">
                      {schedule[day].length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Icon name="Calendar" size={32} className="mx-auto mb-2 opacity-50" />
                          <p>Выходной день</p>
                        </div>
                      ) : (
                        schedule[day].map((lesson, index) => (
                          <div
                            key={lesson.id}
                            className="p-3 rounded-lg border bg-card hover:shadow-md transition-all duration-200 animate-fade-in"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-start gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {index + 1}
                                </Badge>
                                <div>
                                  <p className="font-semibold text-foreground">{lesson.subject}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Icon name="Clock" size={12} />
                                    {lesson.time}
                                  </p>
                                </div>
                              </div>
                              
                              {isAdmin && (
                                <div className="flex gap-1">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => handleEditLesson(day, lesson)}
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
                                            <Label htmlFor="edit-subject">Предмет</Label>
                                            <Input
                                              id="edit-subject"
                                              value={editingLesson.subject}
                                              onChange={(e) => setEditingLesson({ ...editingLesson, subject: e.target.value })}
                                            />
                                          </div>
                                          <div>
                                            <Label htmlFor="edit-time">Время</Label>
                                            <Input
                                              id="edit-time"
                                              value={editingLesson.time}
                                              onChange={(e) => setEditingLesson({ ...editingLesson, time: e.target.value })}
                                            />
                                          </div>
                                          <div>
                                            <Label htmlFor="edit-teacher">Учитель</Label>
                                            <Input
                                              id="edit-teacher"
                                              value={editingLesson.teacher}
                                              onChange={(e) => setEditingLesson({ ...editingLesson, teacher: e.target.value })}
                                            />
                                          </div>
                                          <div>
                                            <Label htmlFor="edit-homework">Домашнее задание</Label>
                                            <Textarea
                                              id="edit-homework"
                                              value={editingLesson.homework || ''}
                                              onChange={(e) => setEditingLesson({ ...editingLesson, homework: e.target.value })}
                                            />
                                          </div>
                                          <Button onClick={handleSaveEdit} className="w-full">
                                            Сохранить
                                          </Button>
                                        </div>
                                      )}
                                    </DialogContent>
                                  </Dialog>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteLesson(day, lesson.id)}
                                  >
                                    <Icon name="Trash2" size={14} />
                                  </Button>
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
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

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
                
                <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer opacity-60">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon name="CheckCircle2" size={18} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Расписание утверждено</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Расписание на следующую неделю готово
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">1 день назад</p>
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
