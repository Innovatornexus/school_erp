import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "@/hooks/use-auth";
import { School, Class, Subject, Student, Teacher, SchoolDataContextType } from "@/types";

// Using shared types from types.ts instead of duplicating

// Create the context
const SchoolDataContext = createContext<SchoolDataContextType | undefined>(
  undefined
);

// Create the provider component
export const SchoolDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth() as { user: any };
  const [schoolData, setSchoolData] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return Promise.resolve();

    setLoading(true);
    console.log(
      "SchoolDataProvider: Starting data fetch for user:",
      user.email,
      "with role:",
      user.role,
      "and schoolId:",
      user.schoolId
    );

    try {
      // Fetch school data first
      let schoolDataResponse: {
        school: any;
        classes: any;
        subjects: any;
        students: any;
        assignedClasses?: any;
        subjectsTaught?: any;
        studentsInAssignedClasses?: any;
        teachers: any;
      };
      if (user.role === "super_admin") {
        // Super admin can access all schools
        const schoolsRes = await fetch("/api/schools");
        if (!schoolsRes.ok)
          throw new Error("Failed to fetch schools for super admin");
        const schools = await schoolsRes.json();
        console.log("SchoolDataProvider: Fetched all schools:", schools);
        
        // For super admin, we'll use the first school or empty data if no schools
        const firstSchool = schools.length > 0 ? schools[0] : null;
        
        schoolDataResponse = {
          school: firstSchool,
          classes: [],
          subjects: [],
          students: [],
          teachers: [],
        };
        
        // If there's a school, fetch its data
        if (firstSchool) {
          const [classesRes, subjectsRes, studentsRes, teachersRes] =
            await Promise.all([
              fetch(`/api/classes/school/${firstSchool.id}`),
              fetch(`/api/subjects/school/${firstSchool.id}`),
              fetch(`/api/students/school/${firstSchool.id}`),
              fetch(`/api/teachers/school/${firstSchool.id}`),
            ]);

          if (classesRes.ok) {
            const classesData = await classesRes.json();
            schoolDataResponse.classes = classesData;
          }
          if (subjectsRes.ok) {
            const subjectsData = await subjectsRes.json();
            schoolDataResponse.subjects = subjectsData;
          }
          if (studentsRes.ok) {
            const studentsData = await studentsRes.json();
            schoolDataResponse.students = studentsData;
          }
          if (teachersRes.ok) {
            const teachersData = await teachersRes.json();
            schoolDataResponse.teachers = teachersData;
          }
        }
      } else if (user.role === "school_admin") {
        const schoolRes = await fetch(`/api/schools/${user.schoolId}`);
        if (!schoolRes.ok)
          throw new Error("Failed to fetch school data for admin");
        const school = await schoolRes.json();
        console.log("SchoolDataProvider: Fetched school data:", school);

        const [classesRes, subjectsRes, studentsRes, teachersRes] =
          await Promise.all([
            fetch(`/api/classes/school/${school.id}`),
            fetch(`/api/subjects/school/${school.id}`),
            fetch(`/api/students/school/${school.id}`),
            fetch(`/api/teachers/school/${school.id}`),
          ]);

        if (!classesRes.ok)
          throw new Error("Failed to fetch classes for admin");
        if (!subjectsRes.ok)
          throw new Error("Failed to fetch subjects for admin");
        if (!studentsRes.ok)
          throw new Error("Failed to fetch students for admin");
        if (!teachersRes.ok)
          throw new Error("Failed to fetch teachers for admin");

        const classesData = await classesRes.json();
        console.log("SchoolDataProvider: Fetched classes data:", classesData);
        const subjectsData = await subjectsRes.json();
        console.log("SchoolDataProvider: Fetched subjects data:", subjectsData);
        const studentsData = await studentsRes.json();
        console.log("SchoolDataProvider: Fetched students data:", studentsData);
        const teachersData = await teachersRes.json();
        console.log("SchoolDataProvider: Fetched teachers data:", teachersData);

        // Fetch class-subject mappings for all classes
        const classSubjectPromises = classesData.map(async (cls: any) => {
          try {
            const res = await fetch(`/api/classes/${cls.id}/subjects`);
            if (res.ok) {
              const subjects = await res.json();
              return { classId: cls.id, subjects };
            }
            return { classId: cls.id, subjects: [] };
          } catch (error) {
            console.error(
              `Error fetching subjects for class ${cls.id}:`,
              error
            );
            return { classId: cls.id, subjects: [] };
          }
        });

        const classSubjectResults = await Promise.all(classSubjectPromises);
        const classSubjectMap = new Map(
          classSubjectResults.map((result) => [result.classId, result.subjects])
        );

        // Add subjects to each class
        const classesWithData = classesData.map((cls: any) => ({
          ...cls,
          subjects: classSubjectMap.get(cls.id) || [],
        }));

        schoolDataResponse = {
          school,
          classes: classesWithData,
          subjects: subjectsData,
          students: studentsData,
          teachers: teachersData,
        };
        setSchoolData(schoolDataResponse.school);
        setClasses(schoolDataResponse.classes || []);
        setSubjects(schoolDataResponse.subjects || []);
        setStudents(schoolDataResponse.students || []);
        // Parse subjectSpecialization field for each teacher
        const parsedTeachers = (teachersData || []).map((teacher: any) => {
          if (typeof teacher.subjectSpecialization === "string") {
            // Remove outer braces, quotes and split by comma
            const cleaned = teacher.subjectSpecialization
              .replace(/^\{/, "")
              .replace(/\}$/, "")
              .replace(/"/g, "");
            const arr =
              cleaned.length > 0
                ? cleaned.split(",").map((s: any) => s.trim())
                : [];
            return { ...teacher, subjectSpecialization: arr };
          }
          return teacher;
        });
        setTeachers(parsedTeachers);
        console.log(
          "SchoolDataProvider: Fetched admin data:",
          schoolDataResponse
        );
      } else if (user.role === "teacher") {
        // First fetch staff data to get school_id
        const staffRes = await fetch(`/api/Teachers/${user.email}/staff`);
        if (!staffRes.ok) throw new Error("Failed to fetch staff data");
        const staffData = await staffRes.json();
        console.log("SchoolDataProvider: Fetched staff data:", staffData);

        // Extract schoolId from staff data
        const schoolId =
          staffData.schoolId || (staffData[0] && staffData[0].schoolId);
        if (!schoolId) {
          throw new Error("School ID not found in staff data");
        }

        // For staff users, we need to fetch the same data structure as admin
        // but filtered for what the staff member is allowed to see
        const schoolRes = await fetch(`/api/schools/${schoolId}`);
        if (!schoolRes.ok)
          throw new Error("Failed to fetch school data for staff");

        const school = await schoolRes.json();
        console.log("SchoolDataProvider: Fetched school data:", school);

        // Fetch data that staff members are allowed to see
        const [classesRes, subjectsRes, studentsRes, teachersRes] =
          await Promise.all([
            fetch(`/api/classes/school/${schoolId}`),
            fetch(`/api/subjects/school/${schoolId}`),
            fetch(`/api/students/school/${schoolId}`),
            fetch(`/api/teachers/school/${schoolId}`),
          ]);

        if (!classesRes.ok)
          throw new Error("Failed to fetch classes for staff");
        if (!subjectsRes.ok)
          throw new Error("Failed to fetch subjects for staff");
        if (!studentsRes.ok)
          throw new Error("Failed to fetch students for staff");
        if (!teachersRes.ok)
          throw new Error("Failed to fetch teachers for staff");

        const classesData = await classesRes.json();
        console.log("SchoolDataProvider: Fetched classes data:", classesData);
        const subjectsData = await subjectsRes.json();
        console.log("SchoolDataProvider: Fetched subjects data:", subjectsData);
        const studentsData = await studentsRes.json();
        console.log("SchoolDataProvider: Fetched students data:", studentsData);
        const teachersData = await teachersRes.json();
        console.log("SchoolDataProvider: Fetched teachers data:", teachersData);

        // Fetch class-subject mappings for all classes for staff as well
        const classSubjectPromises = classesData.map(async (cls: any) => {
          try {
            const res = await fetch(`/api/classes/${cls.id}/subjects`);
            if (res.ok) {
              const subjects = await res.json();
              return { classId: cls.id, subjects };
            }
            return { classId: cls.id, subjects: [] };
          } catch (error) {
            console.error(
              `Error fetching subjects for class ${cls.id}:`,
              error
            );
            return { classId: cls.id, subjects: [] };
          }
        });

        const classSubjectResults = await Promise.all(classSubjectPromises);
        const classSubjectMap = new Map(
          classSubjectResults.map((result) => [result.classId, result.subjects])
        );

        // Add subjects to each class
        const classesWithData = classesData.map((cls: any) => ({
          ...cls,
          subjects: classSubjectMap.get(cls.id) || [],
        }));

        schoolDataResponse = {
          school,
          classes: classesWithData,
          subjects: subjectsData,
          students: studentsData,
          teachers: teachersData,
        };

        setSchoolData(schoolDataResponse.school);
        setClasses(schoolDataResponse.classes || []);
        setSubjects(schoolDataResponse.subjects || []);
        setStudents(schoolDataResponse.students || []);
        // Parse subjectSpecialization field for each teacher
        const parsedTeachers = (teachersData || []).map((teacher: any) => {
          if (typeof teacher.subjectSpecialization === "string") {
            // Remove outer braces, quotes and split by comma
            const cleaned = teacher.subjectSpecialization
              .replace(/^\{/, "")
              .replace(/\}$/, "")
              .replace(/"/g, "");
            const arr =
              cleaned.length > 0
                ? cleaned.split(",").map((s: any) => s.trim())
                : [];
            return { ...teacher, subjectSpecialization: arr };
          }
          return teacher;
        });
        setTeachers(parsedTeachers);
        console.log(
          "SchoolDataProvider: Fetched staff data:",
          schoolDataResponse
        );
      }
    } catch (error) {
      console.error("SchoolDataProvider: Error fetching data:", error);
    } finally {
      setLoading(false);
      console.log("SchoolDataProvider: Data fetching complete.");
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <SchoolDataContext.Provider
      value={{
        schoolData,
        classes,
        subjects,
        students,
        teachers,
        loading,
        refetchData: fetchData,
      }}
    >
      {children}
    </SchoolDataContext.Provider>
  );
};

export const useSchoolData = (): SchoolDataContextType => {
  const context = useContext(SchoolDataContext);
  if (context === undefined) {
    throw new Error("useSchoolData must be used within a SchoolDataProvider");
  }
  return context;
};
