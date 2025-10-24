import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Student } from "@/components/AddEditStudentModal";
import { useRouter } from "next/router";

const api = process.env.NEXT_PUBLIC_API_URL;

export const useEnokiMutator = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const editTeacher = useMutation({
    mutationFn: ({
      id,
      name,
      email,
      departmentId,
      employeeRfidHash,
      scheduleJSON,
    }: any) => {
      return axios.post(`${api}/edit-teacher`, {
        id: id,
        name: name,
        email: email,
        departmentId: departmentId,
        employeeRfidHash: employeeRfidHash,
        schedule: scheduleJSON,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["faculty"],
      });
      queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });

  const addTeacher = useMutation({
    mutationFn: ({
      name,
      email,
      departmentId,
      employeeRfidHash,
      institutionId,
      scheduleJSON,
    }: any) => {
      return axios.post(`${api}/add-teacher`, {
        name: name,
        email: email,
        departmentId: departmentId,
        employeeRfidHash: employeeRfidHash,
        institutionId: institutionId,
        schedule: scheduleJSON,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["faculty"],
      });
      queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });

  const deleteStudent = useMutation({
    mutationFn: ({ id }: Partial<Student>) => {
      return axios.post(`${api}/delete-student`, {
        id: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["students"],
      });
      queryClient.invalidateQueries({
        queryKey: ["courses"],
      });
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });

  const addStudent = useMutation({
    mutationFn: ({
      name,
      email,
      studentId,
      studentRfidHash,
      courseId,
      institutionId,
    }: any) => {
      return axios.post(`${api}/add-student`, {
        name: name,
        email: email,
        studentId: studentId,
        studentRfidHash: studentRfidHash,
        courseId: courseId,
        institutionId: institutionId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["students"],
      });
      queryClient.invalidateQueries({
        queryKey: ["courses"],
      });
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });

  const editStudent = useMutation({
    mutationFn: ({
      id,
      name,
      email,
      studentId,
      studentRfidHash,
      courseId,
    }: any) => {
      return axios.post(`${api}/edit-student`, {
        id: id,
        name: name,
        email: email,
        studentId: studentId,
        studentRfidHash: studentRfidHash,
        courseId: courseId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["students"],
      });
      queryClient.invalidateQueries({
        queryKey: ["courses"],
      });
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });

  const deleteAccount = useMutation({
    mutationFn: ({ id }: { id: string }) => {
      return axios.post(`${api}/delete-account`, {
        id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
      queryClient.invalidateQueries({
        queryKey: ["students"],
      });
      queryClient.invalidateQueries({
        queryKey: ["courses"],
      });
      queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["faculty"],
      });
    },
  });

  const changeAccount = useMutation({
    mutationFn: ({ id, name, email, actType, password }: any) => {
      return axios.post(`${api}/change-acct`, {
        id: id,
        name: name,
        email: email,
        actType: actType,
        password: password,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
      queryClient.invalidateQueries({
        queryKey: ["students"],
      });
      queryClient.invalidateQueries({
        queryKey: ["courses"],
      });
      queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["faculty"],
      });
    },
  });

  const logout = useMutation({
    mutationFn: () => {
      return axios.post(
        `${api}/logout`,
        {},
        {
          withCredentials: true,
        }
      );
    },
    onSuccess: () => {
      router.replace("/login");
    },
  });

  return {
    editTeacher,
    addTeacher,
    deleteStudent,
    addStudent,
    editStudent,
    deleteAccount,
    changeAccount,
    logout,
  };
};
