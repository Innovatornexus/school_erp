import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface ExamSubject {
  id: number;
  subject_id: number;
  subject_name: string;
  exam_date: string;
  start_time?: string;
  end_time?: string;
  max_marks: number;
}

interface ExamDetails {
  id: number;
  title: string;
  term: string;
  class_name: string;
  start_date: string;
  end_date: string;
}

function formatTime(timeString: string | undefined): string {
  if (!timeString) return "Not set";
  
  try {
    // Handle both HH:mm and HH:mm:ss formats
    const timeParts = timeString.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    
    if (isNaN(hours) || isNaN(minutes)) return timeString;
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return timeString;
  }
}

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
  } catch (error) {
    return new Date(dateString).toLocaleDateString();
  }
}

export default function ExamSchedulePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const examId = parseInt(params.id as string);

  const { data: examDetails, isLoading: examLoading } = useQuery<ExamDetails>({
    queryKey: ["exam", examId],
    queryFn: async () => {
      const response = await fetch(`/api/exams/${examId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch exam details");
      }
      return response.json();
    },
    enabled: !!examId,
  });

  const { data: examSubjects = [], isLoading: subjectsLoading } = useQuery<ExamSubject[]>({
    queryKey: ["exam-subjects", examId],
    queryFn: async () => {
      const response = await fetch(`/api/exams/${examId}/subjects`);
      if (!response.ok) {
        throw new Error("Failed to fetch exam subjects");
      }
      return response.json();
    },
    enabled: !!examId,
  });

  const isLoading = examLoading || subjectsLoading;

  // Group subjects by date for better organization
  const subjectsByDate = examSubjects.reduce((acc, subject) => {
    const dateKey = subject.exam_date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(subject);
    return acc;
  }, {} as Record<string, ExamSubject[]>);

  // Sort dates
  const sortedDates = Object.keys(subjectsByDate).sort();

  if (isLoading) {
    return (
      <DashboardLayout title="Exam Schedule">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/exams")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!examDetails) {
    return (
      <DashboardLayout title="Exam Schedule">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/exams")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
            </Button>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Exam not found</h3>
              <p className="text-muted-foreground text-center">
                The exam you're looking for doesn't exist or has been removed.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Exam Schedule">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/exams")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exams
          </Button>
        </div>

        {/* Exam Overview */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{examDetails.title}</CardTitle>
                <p className="text-muted-foreground mt-1">
                  {examDetails.class_name} • {examDetails.term}
                </p>
              </div>
              <Badge variant="secondary">
                {examSubjects.length} Subject{examSubjects.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Calendar className="mr-3 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Exam Period</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(examDetails.start_date)} - {formatDate(examDetails.end_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <BookOpen className="mr-3 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Total Subjects</p>
                  <p className="text-sm text-muted-foreground">
                    {examSubjects.length} subject{examSubjects.length !== 1 ? 's' : ''} scheduled
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Table */}
        <Card>
          <CardHeader>
            <CardTitle>Exam Schedule</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="exam-schedule-table">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Subject</th>
                    <th className="text-left p-4 font-medium">Time</th>
                    <th className="text-left p-4 font-medium">Duration</th>
                    <th className="text-left p-4 font-medium">Max Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDates.map((dateKey) => (
                    subjectsByDate[dateKey]
                      .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""))
                      .map((subject, index) => (
                        <tr
                          key={subject.id}
                          className="border-b hover:bg-muted/25 transition-colors"
                          data-testid={`exam-subject-row-${subject.id}`}
                        >
                          <td className="p-4">
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  {formatDate(subject.exam_date)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(subject.exam_date), 'EEEE')}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center">
                              <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span className="font-medium" data-testid={`subject-name-${subject.id}`}>
                                {subject.subject_name}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium" data-testid={`start-time-${subject.id}`}>
                                  {formatTime(subject.start_time)}
                                </p>
                                {subject.end_time && (
                                  <p className="text-xs text-muted-foreground" data-testid={`end-time-${subject.id}`}>
                                    to {formatTime(subject.end_time)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {subject.start_time && subject.end_time ? (
                              <span className="text-sm text-muted-foreground" data-testid={`duration-${subject.id}`}>
                                {(() => {
                                  try {
                                    const start = new Date(`1970-01-01T${subject.start_time}`);
                                    const end = new Date(`1970-01-01T${subject.end_time}`);
                                    const diffMs = end.getTime() - start.getTime();
                                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                                    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                    
                                    if (hours > 0 && minutes > 0) {
                                      return `${hours}h ${minutes}m`;
                                    } else if (hours > 0) {
                                      return `${hours}h`;
                                    } else if (minutes > 0) {
                                      return `${minutes}m`;
                                    } else {
                                      return "-";
                                    }
                                  } catch (error) {
                                    return "-";
                                  }
                                })()}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" data-testid={`max-marks-${subject.id}`}>
                              {subject.max_marks} marks
                            </Badge>
                          </td>
                        </tr>
                      ))
                  ))}
                </tbody>
              </table>
            </div>
            
            {examSubjects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No subjects scheduled</h3>
                <p className="text-muted-foreground text-center">
                  This exam doesn't have any subjects scheduled yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}