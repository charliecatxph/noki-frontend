import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export const isUserDataComplete = (user: any) => {
  return (
    user.userName &&
    user.institutionName &&
    user.userId &&
    user.email &&
    user.accessToken
  );
};

export const userSlice = createSlice({
  name: "user",
  initialState: {
    userName: null,
    institutionName: null,
    userId: null,
    email: null,
    accessToken: null,
  },
  reducers: {
    login: (state, action) => {
      state.userName = action.payload.userName;
      state.institutionName = action.payload.institutionName;
      state.userId = action.payload.userId;
      state.email = action.payload.email;
      state.accessToken = action.payload.accessToken;
    },
    logout: (state) => {
      state.userName = null;
      state.institutionName = null;
      state.userId = null;
      state.email = null;
      state.accessToken = null;
    },
  },
});

export const { login, logout } = userSlice.actions;
export const selectUserData = (state: RootState) => state.user;
export default userSlice.reducer;
