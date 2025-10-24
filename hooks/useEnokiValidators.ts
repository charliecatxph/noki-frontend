import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";

const api = process.env.NEXT_PUBLIC_API_URL;

export const useEnokiValidators = () => {
  const queryClient = useQueryClient();
  const checkEmail = (email: string, abort?: AbortController) => {
    return queryClient.fetchQuery({
      queryFn: () => {
        return axios.post(
          `${api}/check-email`,
          {
            email: email,
          },
          { signal: abort?.signal }
        );
      },
      queryKey: ["check-email", email],
    });
  };

  const checkRfid = (
    rfid: string,
    institutionId: string,
    abort?: AbortController
  ) => {
    return queryClient.fetchQuery({
      queryFn: () => {
        return axios.post(
          `${api}/check-rfid`,
          {
            rfid: rfid,
            institutionId: institutionId,
          },
          {
            signal: abort?.signal,
          }
        );
      },
      queryKey: ["check-rfid", rfid],
    });
  };

  const checkStudentId = (
    studentId: string,
    institutionId: string,
    abort?: AbortController
  ) => {
    return queryClient.fetchQuery({
      queryFn: () => {
        return axios.post(
          `${api}/check-studentId`,
          {
            studentId: studentId,
            institutionId: institutionId,
          },
          { signal: abort?.signal }
        );
      },
      queryKey: ["check-studentId", studentId],
    });
  };

  return {
    checkEmail,
    checkRfid,
    checkStudentId,
  };
};
