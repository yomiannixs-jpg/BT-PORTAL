import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface StudentContextValue {
  studentId: number | null;
  setStudentId: (id: number | null) => void;
}

const StudentContext = createContext<StudentContextValue>({
  studentId: null,
  setStudentId: () => {},
});

export function StudentProvider({ children }: { children: ReactNode }) {
  const [studentId, setStudentIdState] = useState<number | null>(() => {
    const stored = localStorage.getItem("studentId");
    return stored ? Number(stored) : null;
  });

  const setStudentId = (id: number | null) => {
    setStudentIdState(id);
    if (id !== null) {
      localStorage.setItem("studentId", String(id));
    } else {
      localStorage.removeItem("studentId");
    }
  };

  return (
    <StudentContext.Provider value={{ studentId, setStudentId }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  return useContext(StudentContext);
}
