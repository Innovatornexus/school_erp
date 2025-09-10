import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input"; // Import the Input component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, Edit, Trash } from "lucide-react"; // Changed Eye to Trash for Reset
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useSchoolData } from "@/context/SchoolDataContext";
import { useAuth } from "@/hooks/use-auth";

interface ExamResult {
  id: string;
  title: string;
  term: string;
  className: string;
  startDate: string;
  endDate: string;
  subjects: ExamSubjectResult[];
}

interface ExamSubjectResult {
  id: string;
  subjectName: string;
  examDate: string;
  maxMarks: number;
  marks: StudentMark[];
}

interface StudentMark {
  studentId: string;
  studentName: string;
  rollNo: string;
  marksObtained: number;
  percentage: number;
}

export default function ExamResultsPage() {
  const { user } = useAuth();
  const { examId } = useParams();
  const [, setLocation] = useLocation();

  const {
    classes,
    subjects,
    students,
    loading: schoolDataLoading,
  } = useSchoolData();

  const {
    data: rawExamResult,
    isLoading: examLoading,
    error: examError,
  } = useQuery({
    queryKey: [`/api/exams/${examId}/results`],
    queryFn: async () => {
      console.log(`[DEBUG] Fetching exam results for examId: ${examId}`);
      try {
        const res = await apiRequest("GET", `/api/exams/${examId}/results`);
        const data = await res.json();
        console.log(`[DEBUG] Exam results fetched successfully:`, data);
        return data;
      } catch (error) {
        console.error(
          `[DEBUG] Error fetching exam results for examId ${examId}:`,
          error
        );
        throw error;
      }
    },
  });

  const examResult = useMemo(() => {
    if (!rawExamResult) {
      return null;
    }
    if (rawExamResult.subjects && rawExamResult.subjects.length > 0) {
      console.log(`[DEBUG] Using existing exam results data`);
      return rawExamResult;
    }
    console.log(`[DEBUG] Creating default exam structure with students`);
    const examClassId = rawExamResult.classId;
    if (!students) {
      return null;
    }
    const examClassStudents = students.filter(
      (student) => student.classId === examClassId
    );
    return {
      ...rawExamResult,
      subjects:
        rawExamResult.subjectIds?.map((id: string, index: number) => ({
          id,
          subjectName: rawExamResult.subjectNames?.[index] || "",
          examDate: rawExamResult.subjectExamDates?.[index] || "",
          startTime: rawExamResult.subjectExamStartTimes?.[index] || "",
          endTime: rawExamResult.subjectExamEndTimes?.[index] || "",
          maxMarks: 100,
          marks: examClassStudents.map((student, studentIndex) => ({
            studentId: student.id,
            studentName: student.fullName || student.name,
            rollNo: student.rollNo || `${studentIndex + 1}`.padStart(2, '0'),
            marksObtained: 0,
            percentage: 0,
          })),
        })) || [],
    };
  }, [rawExamResult, students]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedMarks, setEditedMarks] = useState<Record<string, number>>({});

  useEffect(() => {
    if (examResult?.subjects && examResult.subjects.length > 0) {
      setSelectedSubjectId(examResult.subjects[0].id);
    }
  }, [examResult]);

  const handleEditClick = async () => {
    if (isEditMode) {
      console.log("Updating marks:", editedMarks);
      try {
        // Convert editedMarks to the format expected by the API
        const marksData = Object.entries(editedMarks).map(
          ([studentId, marks]) => ({
            student_id: parseInt(studentId),
            marks_obtained: marks,
          })
        );

        // Call the API to update marks
        const response = await fetch(
          `/api/exam-subjects/${selectedSubjectId}/marks`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ marks: marksData }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update marks");
        }

        const result = await response.json();
        console.log("Marks updated successfully:", result);

        // Update the local state to reflect the changes
        if (examResult) {
          const updatedSubjects = examResult.subjects.map(
            (subject: ExamSubjectResult) => {
              if (subject.id === selectedSubjectId) {
                return {
                  ...subject,
                  marks: subject.marks.map((mark: StudentMark) => ({
                    ...mark,
                    marks_obtained:
                      editedMarks[mark.student_id] ?? mark.marks_obtained,
                  })),
                };
              }
              return subject;
            }
          );
          // Note: You might need to update the query cache here if using React Query
        }

        setIsEditMode(false);
        setEditedMarks({});
      } catch (error) {
        console.error("Error updating marks:", error);
        // You might want to show an error message to the user here
      }
    } else {
      setIsEditMode(true);
      if (selectedSubjectId && examResult) {
        const subject = examResult.subjects.find(
          (s) => s.id === selectedSubjectId
        );
        if (subject) {
          const initialMarks: Record<string, number> = {};
          subject.marks.forEach((mark) => {
            initialMarks[mark.student_id] = mark.marks_obtained;
          });
          setEditedMarks(initialMarks);
        }
      }
    }
  };

  const handleResetClick = () => {
    if (selectedSubjectId && examResult) {
      const subject = examResult.subjects.find(
        (s) => s.id === selectedSubjectId
      );
      if (subject) {
        const resetMarks: Record<string, number> = {};
        subject.marks.forEach((mark) => {
          resetMarks[mark.student_id] = 0;
        });
        setEditedMarks(resetMarks);
        console.log("Resetting marks to 0");
        // TODO: Implement API call to reset marks
      }
    }
  };

  const handleMarkChange = (studentId: number, value: string) => {
    // Allow empty values and only convert to number when there's actual input
    if (value === "" || value === undefined) {
      setEditedMarks((prev) => ({
        ...prev,
        [studentId]: undefined, // Keep as undefined for empty input
      }));
    } else {
      const numValue = parseFloat(value);
      setEditedMarks((prev) => ({
        ...prev,
        [studentId]: isNaN(numValue) ? undefined : numValue, // Keep as undefined for invalid input
      }));
    }
  };

  if (examLoading || schoolDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading exam results...</div>
      </div>
    );
  }

  if (examError || !rawExamResult) {
    console.error(`[DEBUG] Exam error or no data:`, examError);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">
          Exam not found. Please check the exam ID or create the exam from the
          exams page.
        </div>
      </div>
    );
  }

  if (!examResult) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Processing exam data...</div>
      </div>
    );
  }

  const hasSubjects = examResult.subjects && examResult.subjects.length > 0;
  console.log(
    `[DEBUG] Exam has subjects: ${hasSubjects}, subjects count: ${
      examResult.subjects?.length || 0
    }`
  );

  const calculateOverallStats = () => {
    if (!examResult.subjects) {
      return { average: 0, highest: 0, lowest: 0 };
    }
    let filteredSubjects = examResult.subjects;
    if (user?.role !== "school_admin" && user?.role !== "class_teacher") {
      filteredSubjects = [];
    }
    const allMarks = filteredSubjects.flatMap((subject: ExamSubjectResult) =>
      subject.marks.map((mark: StudentMark) => mark.marks_obtained)
    );
    if (allMarks.length === 0) return { average: 0, highest: 0, lowest: 0 };
    const average =
      allMarks.reduce((sum: number, mark: number) => sum + mark, 0) /
      allMarks.length;
    const highest = Math.max(...allMarks);
    const lowest = Math.min(...allMarks);
    return { average, highest, lowest };
  };

  const stats = calculateOverallStats();

  const selectedSubjectStats = selectedSubjectId
    ? (() => {
        const subject = examResult.subjects.find(
          (s: ExamSubjectResult) => s.id === selectedSubjectId
        );
        if (!subject) return { average: 0, highest: 0, lowest: 0 };
        const marks = subject.marks.map(
          (mark: StudentMark) => mark.marks_obtained
        );
        if (marks.length === 0) return { average: 0, highest: 0, lowest: 0 };
        const average =
          marks.reduce((sum: number, mark: number) => sum + mark, 0) /
          marks.length;
        const highest = Math.max(...marks);
        const lowest = Math.min(...marks);
        return { average, highest, lowest };
      })()
    : { average: 0, highest: 0, lowest: 0 };

  return (
    <DashboardLayout title="Exam Results">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/exams")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exams
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold">{examResult.title}</h1>
          <p className="text-muted-foreground">
            {examResult.class_name} • {examResult.term} •{" "}
            {examResult.start_date} - {examResult.end_date}
          </p>
        </div>
        {(user?.role === "school_admin" || user?.role === "class_teacher") && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall Average Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.average.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall Highest Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.highest}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall Lowest Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.lowest}%</div>
              </CardContent>
            </Card>
          </div>
        )}
        <div className="space-y-4">
          {hasSubjects ? (
            <>
              <ToggleGroup
                type="single"
                className="justify-start flex-wrap"
                value={selectedSubjectId?.toString() || ""}
                onValueChange={(value) => {
                  setSelectedSubjectId(value ? parseInt(value) : null);
                  setIsEditMode(false); // Exit edit mode when changing subject
                }}
                aria-label="Select Subject"
              >
                {examResult.subjects.map((subject: ExamSubjectResult) => (
                  <ToggleGroupItem
                    key={subject.id}
                    value={subject.id.toString()}
                  >
                    {subject.subject_name}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              {selectedSubjectId
                ? (() => {
                    const subject = examResult.subjects.find(
                      (s: ExamSubjectResult) => s.id === selectedSubjectId
                    );
                    if (!subject) return null;

                    const subjectAverage =
                      subject.marks.length > 0
                        ? subject.marks.reduce(
                            (sum: number, mark: StudentMark) =>
                              sum + mark.marks_obtained,
                            0
                          ) / subject.marks.length
                        : 0;

                    return (
                      <>
                        <Card key={subject.id}>
                          <CardHeader>
                            <div className="flex justify-between items-center mb-3">
                              <CardTitle>{subject.subject_name}</CardTitle>
                              {(user?.role === "school_admin" ||
                                user?.role === "class_teacher") && (
                                <div className="flex gap-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                                    onClick={handleEditClick}
                                  >
                                    {isEditMode ? "Update" : "Edit"}
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={handleResetClick}
                                    disabled={!isEditMode} // Disable when not in edit mode
                                  >
                                    <Trash className="h-4 w-4" /> Reset
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardHeader>

                          <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                              <Badge variant="secondary">
                                {subject.exam_date}
                              </Badge>
                              <p className="text-sm text-muted-foreground">
                                Max Marks:{" "}
                                <span className="font-semibold text-primary">
                                  {subject.max_marks}
                                </span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Students:{" "}
                                <span className="font-semibold text-primary">
                                  {subject.marks.length}
                                </span>
                              </p>
                            </div>

                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-2/5">
                                    Student Name
                                  </TableHead>
                                  <TableHead>Roll No</TableHead>
                                  <TableHead>Marks Obtained</TableHead>
                                  <TableHead>Total Marks</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {subject.marks.map((mark: StudentMark) => (
                                  <TableRow key={mark.student_id}>
                                    <TableCell>{mark.student_name}</TableCell>
                                    <TableCell>{mark.roll_no}</TableCell>

                                    {/* START: MODIFIED SECTION */}
                                    <TableCell>
                                      {isEditMode ? (
                                        <Input
                                          type="number"
                                          className="h-8 w-24"
                                          value={
                                            editedMarks[mark.student_id] !==
                                            undefined
                                              ? editedMarks[mark.student_id]
                                              : ""
                                          }
                                          onChange={(e) =>
                                            handleMarkChange(
                                              mark.student_id,
                                              e.target.value
                                            )
                                          }
                                          max={subject.max_marks}
                                          min={0}
                                        />
                                      ) : (
                                        mark.marks_obtained
                                      )}
                                    </TableCell>
                                    {/* END: MODIFIED SECTION */}

                                    <TableCell>{subject.max_marks}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()
                : null}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Average Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.average.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Highest Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.highest}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Lowest Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.lowest}%</div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-amber-600">
                  <p className="text-lg font-semibold mb-2">
                    No subjects configured for this exam
                  </p>
                  <p className="text-sm">
                    Please add subjects to this exam from the exams page to
                    start entering results.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
