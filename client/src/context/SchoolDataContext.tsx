import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "@/hooks/use-auth";

// Define the shape of the context data
interface SchoolDataContextType {
  schoolData: any;
  classes: any[];
  subjects: any[];
  students: any[];
  teachers: any[];
  loading: boolean;
  ispending?: boolean;
  refetchData: () => Promise<void>;
}

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
      "and school_id:",
      user.school_id
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
              fetch(`/api/schools/${firstSchool.id}/classes`),
              fetch(`/api/schools/${firstSchool.id}/subjects`),
              fetch(`/api/schools/all-students/${firstSchool.id}`),
              fetch(`/api/schools/${firstSchool.id}/teachers`),
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
        const schoolRes = await fetch(`/api/schools/${user.school_id}`);
        if (!schoolRes.ok)
          throw new Error("Failed to fetch school data for admin");
        const school = await schoolRes.json();
        console.log("SchoolDataProvider: Fetched school data:", school);

        const [classesRes, subjectsRes, studentsRes, teachersRes] =
          await Promise.all([
            fetch(`/api/schools/${school.id}/classes`),
            fetch(`/api/schools/${school.id}/subjects`),
            fetch(`/api/schools/all-students/${school.id}`),
            fetch(`/api/schools/${school.id}/teachers`),
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
        // Parse subject_specialization field for each teacher
        const parsedTeachers = (teachersData || []).map((teacher: any) => {
          if (typeof teacher.subject_specialization === "string") {
            // Remove outer braces, quotes and split by comma
            const cleaned = teacher.subject_specialization
              .replace(/^\{/, "")
              .replace(/\}$/, "")
              .replace(/"/g, "");
            const arr =
              cleaned.length > 0
                ? cleaned.split(",").map((s: any) => s.trim())
                : [];
            return { ...teacher, subject_specialization: arr };
          }
          return teacher;
        });
        setTeachers(parsedTeachers);
        console.log(
          "SchoolDataProvider: Fetched admin data:",
          schoolDataResponse
        );
      } else if (user.role === "staff") {
        // First fetch staff data to get school_id
        const staffRes = await fetch(`/api/Teachers/${user.email}/staff`);
        if (!staffRes.ok) throw new Error("Failed to fetch staff data");
        const staffData = await staffRes.json();
        console.log("SchoolDataProvider: Fetched staff data:", staffData);

        // Extract school_id from staff data
        const schoolId =
          staffData.school_id || (staffData[0] && staffData[0].school_id);
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
            fetch(`/api/schools/${schoolId}/classes`),
            fetch(`/api/schools/${schoolId}/subjects`),
            fetch(`/api/schools/all-students/${schoolId}`),
            fetch(`/api/schools/${schoolId}/teachers`),
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
        // Parse subject_specialization field for each teacher
        const parsedTeachers = (teachersData || []).map((teacher: any) => {
          if (typeof teacher.subject_specialization === "string") {
            // Remove outer braces, quotes and split by comma
            const cleaned = teacher.subject_specialization
              .replace(/^\{/, "")
              .replace(/\}$/, "")
              .replace(/"/g, "");
            const arr =
              cleaned.length > 0
                ? cleaned.split(",").map((s: any) => s.trim())
                : [];
            return { ...teacher, subject_specialization: arr };
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
